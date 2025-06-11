
#!/usr/bin/env python
# coding: utf-8

# In[3]:



from flask import Flask, request, jsonify
from dotenv import load_dotenv
from langchain.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
import os
import time
import json
import re
from langchain.schema import AIMessage

from collections import OrderedDict  # 파일 상단 import!

load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")


app = Flask(__name__)

# 개선된 프롬프트 템플릿

prompt_template = PromptTemplate(
    input_variables=[
        "gender", "age", "acuity", "pain", "chief_complaint", "arrival_transport",
        "HR", "RR", "SpO2", "SBP", "DBP", "BT",
        "hemoglobin", "wbc", "plateletCount", "redBloodCells", "sedimentationRate",
        "na", "k", "chloride", "ca", "mg", "ureaNitrogen", "creatinine",
        "ast", "alt", "bilirubin", "albumin", "ap", "ggt", "ld", "ammonia",
        "glucose", "lactate", "acetone", "bhb", "crp", "pt", "inrPt", "ptt",
        "dDimer", "troponinT", "ck", "ckmb", "ntprobnp", "amylase", "lipase",
        "ph", "pco2", "po2", "ctco2", "bcb"
    ],
    template="""

너는 경력 15년 이상의 응급의학과 전문의이다.
아래 환자 정보에서 'acuity'는 미국 ESI(1~5) 등급이니, 이를 참고해 예상되는 KTAS 등급(1~5)로 임시 매핑하여 점수를 산정하라.
(참고: ESI와 KTAS는 환자 분류 세부기준은 다르지만, 숫자 방향성(1=중증, 5=경증)은 동일함)

[임시 매핑표]
- acuity 1 → KTAS 1등급
- acuity 2 → KTAS 2등급
- acuity 3 → KTAS 3등급
- acuity 4 → KTAS 4등급
- acuity 5 → KTAS 5등급

다음의 의학적 기준을 반드시 지켜서 점수를 매길 것:

① 나이: 65세 이상(+10점, 고령 환자 상태 악화 가능성 높음)  
② 주요 증상: 흉통, 의식저하, 호흡곤란(+20점, 중증 질환 신호)  
③ 활력징후 이상: 
  - 혈압저하(SBP<90, DBP<60), 
  - 빈맥(HR>100), 서맥(HR<60),
  - 호흡곤란(RR>24 또는 <12), 
  - SpO2<94%, 
  - 체온 이상(BT>38도 또는 <36도)
  각 항목 발견 시 +15점, 복수 해당 시 중복가산
④ 통증(NRS 기준): 중증(8~10점)+10점, 중등도(4~7점)+5점  
⑤ 도착 경로: 119 구급차 이송(+5점, 응급 환자는 중증 가능성 높음)  
⑥ KTAS 등급(=ESI 임시 매핑): 1등급(+30점), 2등급(+20점), 3등급(+10점), 4~5등급(0점)

점수 기준 disposition (반드시 이 중 하나만 선택, 다른 표현 절대 금지!)
- 1~33점: "귀가"
- 34~66점: "일반병동" (절대 과명, 관찰실 등의 표현 사용 금지!)
- 67~100점: "ICU"

반드시 다음 JSON 형식으로만 답변 (순서 및 키 변경 금지):
{{
  "risk_score": (1~100 정수),
  "disposition": (0, 1, 2 중 하나만, 0=귀가, 1=일반병동, 2=ICU),
  "clinical_reason": "(각 요소의 점수 근거를 포함해, ESI→KTAS 임시 매핑임을 설명하며 1~2문장)"
}}

clinical_reason 예시:
"acuity(ESI 2→KTAS 2등급, +20), 흉통(+20), 고령(+10) 등 중증 요소 반영. ESI와 KTAS의 기준 차이로 실제 등급은 다를 수 있음."

아래는 잘못된 예시 (절대 이렇게 답하지 마시오):
{{
  "risk_score": 45,
  "disposition": "정신과 병동", ← 오답!
  "clinical_reason": "고령으로 입원 필요성 높음."
}}

올바른 예시:
{{
  "risk_score": 45,
  "disposition": 1,
  "clinical_reason": "65세 고령(+10), 중등도 통증(+5), KTAS 3등급(+10), 입원 필요성 있음. 고령 환자는 상태 급변 가능, 중등도 증상은 추가 평가 필요."
}}



sample_outputs = [
    {{
        "input": {{
            "gender": 0,
            "age": 55,
            "acuity": None,
            "pain": None,
            "chief_complaint": "LEFT HAND PAINS",
            "arrival_transport": "WALK IN"
        }},
        "output": {{
            "risk_level": "중간",
            "disposition": 2,  
            "clinical_reason": "55세 남성으로, left hand pain을 주소로 내원. vital 안정적이나 진단 및 중증도 평가상 중환자실 집중관찰 필요."
        }}
    }},
    {{
        "input": {{
            "gender": 0,
            "age": 55,
            "acuity": 3,
            "pain": None,
            "chief_complaint": "LEFT HAND PAINS",
            "arrival_transport": "WALK IN"
        }},
        "output": {{
            "risk_level": "중간",
            "disposition": 2,
            "clinical_reason": "left hand pain 및 fever 증상. 증상 및 관찰 필요성으로 ICU 배정."
        }}
    }},
    {{
        "input": {{
            "gender": 0,
            "age": 55,
            "acuity": 3,
            "pain": None,
            "chief_complaint": "LEFT HAND PAINS",
            "arrival_transport": "WALK IN"
        }},
        "output": {{
            "risk_level": "심각",
            "disposition": 2,
            "clinical_reason": "관찰실에서 모니터링 후 중증 질환 가능성 있어 중환자실 집중관찰 필요."
        }}
    }},
    {{
        "input": {{
            "gender": 0,
            "age": 55,
            "acuity": 3,
            "pain": None,
            "chief_complaint": "LEFT HAND PAINS",
            "arrival_transport": "WALK IN"
        }},
        "output": {{
            "risk_level": "심각",
            "disposition": 2,
            "clinical_reason": "환자 상태 고려 시 급성 악화 가능성이 있어 ICU에서 추가 평가 권장."
        }}
    }},
    {{
        "input": {{
            "gender": 0,
            "age": 55,
            "acuity": 3,
            "pain": 3,
            "chief_complaint": "LEFT HAND PAINS",
            "arrival_transport": "WALK IN"
        }},
        "output": {{
            "risk_level": "중간",
            "disposition": 2,
            "clinical_reason": "중등도 손 통증 및 동반 증상 지속, 중환자실에서 모니터링 필요."
        }}
    }}
]



{{
  "risk_level": "낮음",
  "disposition": 1,
  "clinical_reason": "여성, 도보로 내원, 경미한 호흡곤란 외에 특이 증상이나 위험 요인 없어 귀가 조치 가능"
}}

아래 환자 정보를 참고해 반드시 동일 형식으로 답변해.  
조건을 단 하나라도 어기면 0점이니 주의해.

환자 정보:
- 성별: {gender}
- 나이: {age}
- acuity(ESI): {acuity}
- 통증(NRS): {pain}
- 주요 증상: {chief_complaint}
- 도착 경로: {arrival_transport}
- 맥박(HR): {HR}
- 호흡수(RR): {RR}
- 산소포화도(SpO2): {SpO2}
- 수축기혈압(SBP): {SBP}
- 이완기혈압(DBP): {DBP}
- 체온(BT): {BT}
"""
)

# LangChain은 LLM 객체로 OpenAI 연동
llm = ChatOpenAI(
    openai_api_key=os.getenv("OPENAI_API_KEY"),
    model="gpt-4o",
    temperature=0.0   # ← 여기에서 0.0~0.2 정도로 주면 됨!
)

#chain 구성
# 파이프(|) 연산자 사용!
chain = prompt_template | llm



def clean_json_codeblock(s):
    s = s.strip()
    if s.startswith("```"):
        s = re.sub(r"^```json\s*|```$", "", s, flags=re.MULTILINE).strip()
    return s


def validate_and_adjust_result(result_dict, input_data):
    """결과 검증 및 조정"""
    
    # 점수 범위 확인
    score = result_dict.get("risk_score", 0)
    if score < 0:
        score = 0
    elif score > 100:
        score = 100
    
    # Disposition 재검증
    disposition = result_dict.get("disposition")
    
    # 명백한 오판 교정
    chief_complaint = str(input_data.get('chief_complaint', '')).upper()
    age = input_data.get('age', 0)
    acuity = input_data.get('acuity')
    
    # 경미한 증상들
    minor_symptoms = ['HAND PAIN', 'FINGER PAIN', 'MINOR LACERATION', 'COMMON COLD', 
                     'HEADACHE', 'MINOR ABRASION', 'ANKLE SPRAIN']
    
    is_minor = any(symptom in chief_complaint for symptom in minor_symptoms)
    
    # 활력징후 확인
    hr = input_data.get('HR')
    sbp = input_data.get('SBP') 
    spo2 = input_data.get('SpO2')
    
    vital_stable = True
    if hr and (hr < 50 or hr > 120):
        vital_stable = False
    if sbp and (sbp < 90 or sbp > 180):
        vital_stable = False
    if spo2 and spo2 < 90:
        vital_stable = False
    
    # 오판 교정 로직
    if is_minor and vital_stable and age < 65 and acuity and acuity >= 4:
        if disposition == 2:  # ICU로 잘못 판정된 경우
            disposition = 0  # 귀가로 교정
            score = min(score, 35)
    
    # 위험 신호가 있는데 귀가로 판정된 경우
    if (not vital_stable or age >= 80 or (acuity and acuity <= 2)) and disposition == 0:
        disposition = max(disposition, 1)  # 최소 일반병동
    
    # 점수와 disposition 일치성 확인
    if score >= 85 and disposition < 2:
        disposition = 2
    elif score >= 45 and disposition == 0:
        disposition = 1
    elif score < 45 and disposition > 1:
        disposition = min(1, disposition)
    
    return {
        "risk_score": int(score),
        "disposition": int(disposition),
        "clinical_reason": result_dict.get("clinical_reason", "")
    }


@app.route('/predict/admission', methods=['POST'])
def predict():
    try:

        data = request.get_json()
        
        # 입력 데이터 전처리
        input_vars = {
            "gender": data.get('gender', 0),
            "age": data.get('age', 0),
            "acuity": data.get('acuity'),
            "pain": data.get('pain'),
            "chief_complaint": data.get('chief_complaint', ''),
            "arrival_transport": data.get('arrival_transport', ''),
            "HR": data.get('HR'),
            "RR": data.get('RR'),
            "SpO2": data.get('SpO2'),
            "SBP": data.get('SBP'),
            "DBP": data.get('DBP'),
            "BT": data.get('BT'),
            # 모든 검사 결과 포함
            "hemoglobin": data.get('hemoglobin'),
            "wbc": data.get('wbc'),
            "plateletCount": data.get('plateletCount'),
            "redBloodCells": data.get('redBloodCells'),
            "sedimentationRate": data.get('sedimentationRate'),
            "na": data.get('na'),
            "k": data.get('k'),
            "chloride": data.get('chloride'),
            "ca": data.get('ca'),
            "mg": data.get('mg'),
            "ureaNitrogen": data.get('ureaNitrogen'),
            "creatinine": data.get('creatinine'),
            "ast": data.get('ast'),
            "alt": data.get('alt'),
            "bilirubin": data.get('bilirubin'),
            "albumin": data.get('albumin'),
            "ap": data.get('ap'),
            "ggt": data.get('ggt'),
            "ld": data.get('ld'),
            "ammonia": data.get('ammonia'),
            "glucose": data.get('glucose'),
            "lactate": data.get('lactate'),
            "acetone": data.get('acetone'),
            "bhb": data.get('bhb'),
            "crp": data.get('crp'),
            "pt": data.get('pt'),
            "inrPt": data.get('inrPt'),
            "ptt": data.get('ptt'),
            "dDimer": data.get('dDimer'),
            "troponinT": data.get('troponinT'),
            "ck": data.get('ck'),
            "ckmb": data.get('ckmb'),
            "ntprobnp": data.get('ntprobnp'),
            "amylase": data.get('amylase'),
            "lipase": data.get('lipase'),
            "ph": data.get('ph'),
            "pco2": data.get('pco2'),
            "po2": data.get('po2'),
            "ctco2": data.get('ctco2'),
            "bcb": data.get('bcb'),
        }
        
        result = chain.invoke(input_vars)
        
        # AIMessage → content 문자열로 변환

        if isinstance(result, AIMessage):
            result_str = result.content
        else:
            result_str = str(result)

        print("LLM 결과:", result_str)

        result_str = clean_json_codeblock(result_str)
        result_dict = json.loads(result_str)


          # ** disposition이 문자열이면 에러! (여기서 바로 검증) **
        if not isinstance(result_dict.get("disposition"), int):
            return jsonify({"error": "disposition은 반드시 숫자(0,1,2)여야 합니다.", "result": result_dict}), 500

               

            # 여기에 순서 맞추는 부분 추가!
        ordered_result = OrderedDict([
            ("risk_score", result_dict.get("risk_score")),
            ("disposition", result_dict.get("disposition")),
            ("clinical_reason", result_dict.get("clinical_reason")),
        ])
        # 👇 JSON 문자열로 직접 리턴!
        return jsonify({"result": ordered_result})
                       
    except Exception as e:
        print("json.loads error:", e)

        # 결과 검증 및 조정
        validated_result = validate_and_adjust_result(result_dict, data)

        # disposition이 정수인지 확인
        if not isinstance(validated_result.get("disposition"), int):
            return jsonify({"error": "disposition은 반드시 숫자(0,1,2)여야 합니다.", "result": validated_result}), 500

        # 순서 맞추기
        ordered_result = OrderedDict([
            ("risk_score", validated_result.get("risk_score")),
            ("disposition", validated_result.get("disposition")),
            ("clinical_reason", validated_result.get("clinical_reason")),
            ("promptNum", validated_result.get("promptNum", 3)),
        ])
        
        return jsonify({"result": ordered_result})
                       
    except Exception as e:
        print("Error:", e)

        return jsonify({"error": "서버 내부 오류", "detail": str(e)}), 500

@app.route('/predict/discharge', methods=['POST'])
def predict_discharge():
    try:
        data = request.get_json()


        # PatientRequest에서 쓸 수 있는 모든 값을 받아서 prompt에 넣을 수 있음
        input_vars = {
            "gender": data['gender'],
            "age": data['age'],
            "acuity": data['acuity'],
            "pain": data['pain'],
            "chief_complaint": data['chief_complaint'],
            "arrival_transport": data['arrival_transport'],
            "HR": data.get('HR', None),
            "RR": data.get('RR', None),
            "SpO2": data.get('SpO2', None),
            "SBP": data.get('SBP', None),
            "DBP": data.get('DBP', None),
            "BT": data.get('BT', None),

            # 혈액 검사 결과 항목들도 다 포함해서 전달
            "hemoglobin": data.get('hemoglobin', None),
            "wbc": data.get('wbc', None),
            "plateletCount": data.get('plateletCount', None),
            "redBloodCells": data.get('redBloodCells', None),
            "sedimentationRate": data.get('sedimentationRate', None),
            "na": data.get('na', None),
            "k": data.get('k', None),
            "chloride": data.get('chloride', None),
            "ca": data.get('ca', None),
            "mg": data.get('mg', None),
            "ureaNitrogen": data.get('ureaNitrogen', None),
            "creatinine": data.get('creatinine', None),
            "ast": data.get('ast', None),
            "alt": data.get('alt', None),
            "bilirubin": data.get('bilirubin', None),
            "albumin": data.get('albumin', None),
            "ap": data.get('ap', None),
            "ggt": data.get('ggt', None),
            "ld": data.get('ld', None),
            "ammonia": data.get('ammonia', None),
            "glucose": data.get('glucose', None),
            "lactate": data.get('lactate', None),
            "acetone": data.get('acetone', None),
            "bhb": data.get('bhb', None),
            "crp": data.get('crp', None),
            "pt": data.get('pt', None),
            "inrPt": data.get('inrPt', None),
            "ptt": data.get('ptt', None),
            "dDimer": data.get('dDimer', None),
            "troponinT": data.get('troponinT', None),
            "ck": data.get('ck', None),
            "ckmb": data.get('ckmb', None),
            "ntprobnp": data.get('ntprobnp', None),
            "amylase": data.get('amylase', None),
            "lipase": data.get('lipase', None),
            "ph": data.get('ph', None),
            "pco2": data.get('pco2', None),
            "po2": data.get('po2', None),
            "ctco2": data.get('ctco2', None),
            "bcb": data.get('bcb', None),
        }

        result = chain.invoke(input_vars)
        # 아래는 동일!

        input_vars = {
            "gender": data.get('gender', 0),
            "age": data.get('age', 0),
            "acuity": data.get('acuity'),
            "pain": data.get('pain'),
            "chief_complaint": data.get('chief_complaint', ''),
            "arrival_transport": data.get('arrival_transport', ''),
            "HR": data.get('HR'),
            "RR": data.get('RR'),
            "SpO2": data.get('SpO2'),
            "SBP": data.get('SBP'),
            "DBP": data.get('DBP'),
            "BT": data.get('BT'),
            # 모든 검사 결과
            "hemoglobin": data.get('hemoglobin'),
            "wbc": data.get('wbc'),
            "plateletCount": data.get('plateletCount'),
            "redBloodCells": data.get('redBloodCells'),
            "sedimentationRate": data.get('sedimentationRate'),
            "na": data.get('na'),
            "k": data.get('k'),
            "chloride": data.get('chloride'),
            "ca": data.get('ca'),
            "mg": data.get('mg'),
            "ureaNitrogen": data.get('ureaNitrogen'),
            "creatinine": data.get('creatinine'),
            "ast": data.get('ast'),
            "alt": data.get('alt'),
            "bilirubin": data.get('bilirubin'),
            "albumin": data.get('albumin'),
            "ap": data.get('ap'),
            "ggt": data.get('ggt'),
            "ld": data.get('ld'),
            "ammonia": data.get('ammonia'),
            "glucose": data.get('glucose'),
            "lactate": data.get('lactate'),
            "acetone": data.get('acetone'),
            "bhb": data.get('bhb'),
            "crp": data.get('crp'),
            "pt": data.get('pt'),
            "inrPt": data.get('inrPt'),
            "ptt": data.get('ptt'),
            "dDimer": data.get('dDimer'),
            "troponinT": data.get('troponinT'),
            "ck": data.get('ck'),
            "ckmb": data.get('ckmb'),
            "ntprobnp": data.get('ntprobnp'),
            "amylase": data.get('amylase'),
            "lipase": data.get('lipase'),
            "ph": data.get('ph'),
            "pco2": data.get('pco2'),
            "po2": data.get('po2'),
            "ctco2": data.get('ctco2'),
            "bcb": data.get('bcb'),
        }

        result = chain.invoke(input_vars)
        

        if isinstance(result, AIMessage):
            result_str = result.content
        else:
            result_str = str(result)

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
        print("json.loads error:", e)
        return jsonify({"error": "서버 내부 오류", "detail": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)


# In[ ]:





# In[ ]:





