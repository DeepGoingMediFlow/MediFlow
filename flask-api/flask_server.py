#!/usr/bin/env python
# coding: utf-8

# In[ ]:


import chromadb
from sentence_transformers import SentenceTransformer

# --- 벡터DB 및 임베딩 모델 (최초 1회만 로딩) ---
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
client = chromadb.PersistentClient(path="./chroma_emergency_db")
collection = client.get_or_create_collection("medical_papers")


# In[3]:


from flask import Flask, request, jsonify
from dotenv import load_dotenv
from langchain.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
import os
import yaml
import re
import json
from collections import OrderedDict

# 환경 변수
load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")


# --- prompts.yaml에서 RAG 프롬프트 불러오기 ---
def load_prompts():
    with open("prompts.yaml", "r", encoding="utf-8") as f:
        return yaml.safe_load(f)

prompts = load_prompts()
prompt_text = prompts["version_1_cot_reasoning_rag"]["template"]  # prompts.yaml에 반드시 key 맞출 것!

# --- Flask 앱 선언 ---
app = Flask(__name__)

# --- PromptTemplate 세팅 (rag_docs 포함) ---
prompt_template = PromptTemplate(
    input_variables=[
        "gender", "age", "acuity", "pain", "chiefcomplaint", "arrival_transport",
        "HR", "RR", "SpO2", "SBP", "DBP", "BT",
        "hemoglobin", "wbc", "plateletCount", "redBloodCells", "sedimentationRate",
        "na", "k", "chloride", "ca", "mg", "ureaNitrogen", "creatinine",
        "ast", "alt", "bilirubin", "albumin", "ap", "ggt", "ld", "ammonia",
        "glucose", "lactate", "acetone", "bhb", "crp", "pt", "inrPt", "ptt",
        "dDimer", "troponinT", "ck", "ckmb", "ntprobnp", "amylase", "lipase",
        "ph", "pco2", "po2", "ctco2", "bcb",
        "rag_docs"
    ],
    template=prompt_text
)

# --- LLM 객체 (gpt-4.1-nano) ---
llm = ChatOpenAI(
    openai_api_key=api_key,
    model="gpt-4.1-nano",
    temperature=0.2
)

chain = prompt_template | llm

# --- 유틸: LLM 응답에서 코드블록/JSON 클린업 ---
def clean_json_codeblock(s):
    s = s.strip()
    if s.startswith("```"):
        s = re.sub(r"^```json\s*|```$", "", s, flags=re.MULTILINE).strip()
    return s

# --- RAG 벡터DB 검색 ---
def get_rag_docs(patient_data, k=7):
    query = f"{patient_data.get('chief_complaint', '')}, {patient_data.get('age', '')}, {patient_data.get('acuity', '')}"
    query_vec = embedding_model.encode(query)
    results = collection.query(query_embeddings=[query_vec], n_results=k)
    return results["documents"][0] if results and "documents" in results else []

# --- input variables 조립 ---
def build_input_vars(data, rag_docs):
    fields = [
        "gender", "age", "acuity", "pain", "chiefcomplaint", "arrival_transport",
        "HR", "RR", "SpO2", "SBP", "DBP", "BT", "hemoglobin", "wbc", "plateletCount",
        "redBloodCells", "sedimentationRate", "na", "k", "chloride", "ca", "mg",
        "ureaNitrogen", "creatinine", "ast", "alt", "bilirubin", "albumin", "ap",
        "ggt", "ld", "ammonia", "glucose", "lactate", "acetone", "bhb", "crp", "pt",
        "inrPt", "ptt", "dDimer", "troponinT", "ck", "ckmb", "ntprobnp", "amylase",
        "lipase", "ph", "pco2", "po2", "ctco2", "bcb"
    ]
    input_vars = {key: data.get(key) for key in fields}
    input_vars["rag_docs"] = rag_docs
    return input_vars

# --- API: 입원 예측 ---
@app.route('/predict/admission', methods=['POST'])
def predict_admission():
    try:
        data = request.get_json()
        rag_docs = get_rag_docs(data, k=7)
        input_vars = build_input_vars(data, rag_docs)
        result = chain.invoke(input_vars)
        result_str = result.content if hasattr(result, "content") else str(result)
        result_str = clean_json_codeblock(result_str)
        result_dict = json.loads(result_str)
        if not isinstance(result_dict.get("disposition"), int):
            return jsonify({"error": "disposition은 반드시 숫자(0,1,2)여야 합니다.", "result": result_dict}), 500
        ordered_result = OrderedDict([
            ("risk_score", result_dict.get("risk_score")),
            ("disposition", result_dict.get("disposition")),
            ("clinical_reason", result_dict.get("clinical_reason")),
        ])
        return jsonify({"result": ordered_result})
    except Exception as e:
        return jsonify({"error": "서버 내부 오류", "detail": str(e)}), 500

# --- API: 퇴원 예측 ---
@app.route('/predict/discharge', methods=['POST'])
def predict_discharge():
    try:
        data = request.get_json()
        rag_docs = get_rag_docs(data, k=7)
        input_vars = build_input_vars(data, rag_docs)
        result = chain.invoke(input_vars)
        result_str = result.content if hasattr(result, "content") else str(result)
        result_str = clean_json_codeblock(result_str)
        result_dict = json.loads(result_str)
        if not isinstance(result_dict.get("disposition"), int):
            return jsonify({"error": "disposition은 반드시 숫자(0,1,2)여야 합니다.", "result": result_dict}), 500
        ordered_result = OrderedDict([
            ("risk_score", result_dict.get("risk_score")),
            ("disposition", result_dict.get("disposition")),
            ("clinical_reason", result_dict.get("clinical_reason")),
        ])
        return jsonify({"result": ordered_result})
    except Exception as e:
        return jsonify({"error": "서버 내부 오류", "detail": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)


# In[ ]:





# In[ ]:




