import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import '../Style/History.css';
import axios from "axios";
import EditModal from '../Pages/EditModal'; 


export default function History({ patient, onClose }) {
  const [inputValue, setInputValue] = useState('');
  const [history, setHistory] = useState([]);
  //수정용 모달
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  // 수정모달끗


  const patientName = patient.name;
  const patientPid = patient.pid;

  // 수정보달 함수  
  const handleEditClick = (entry) => {
    setEditingId(entry.historyId);
    setEditingValue(entry.content);
    setEditModalOpen(true);
  };

  const handleEditSubmit = () => {
    if (!editingValue.trim()) return;

    axios.put(`http://localhost:8081/api/history/${editingId}`, {
      content: editingValue
    }, {
      withCredentials: true
    })
      .then(() => {
        console.log("수정 성공");
        setEditModalOpen(false);
        setEditingId(null);
        setEditingValue('');
        fetchHistory(); // 새로고침
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          alert("로그인 세션이 만료되었습니다.");
        } else {
          console.error("수정 실패:", err);
        }
      });
  };

  //끗

  //  히스토리 불러오기
  const fetchHistory = () => {
    axios.get(`http://localhost:8081/api/visits/${patient.visitId}/history`)
      .then((res) => {
        console.log("visitId 확인:", patient.visitId);
        console.log("📌 히스토리 불러옴:", res.data); // 👈 여기 콘솔 추가!
        setHistory(res.data);
      })
      .catch((err) => {
        console.error("히스토리 로딩 실패", err);
      });
  };

  useEffect(() => {
    fetchHistory();
  }, []);


  // 등록버튼
  const handleRegister = () => {
    if (!inputValue.trim()) return;

    const newEntry = {
      content: inputValue
    };

    axios.post(`http://localhost:8081/api/visits/${patient.visitId}/history`, newEntry, {
      withCredentials: true
    })
      .then((res) => {
        console.log("히스토리 등록 성공:", res.data);
        setInputValue('');
        fetchHistory();
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          alert("로그인 세션이 만료되었습니다.");
        } else {
          console.error("히스토리 등록 실패:", err);
        }
      });
  };
  // 등록끗
  // 삭제
  const handleDelete = (historyId) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;

    axios.delete(`http://localhost:8081/api/history/${historyId}`, {
      withCredentials: true,
    })
      .then(() => {
        console.log("삭제 성공");
        fetchHistory(); // 삭제 후 목록 다시 불러오기
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          alert("로그인 세션이 만료되었습니다.");
        } else {
          console.error("삭제 실패:", err);
        }
      });
  };

  // 삭제 끗

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleRegister();
    }
  };

  return (
    <div className="patient-modal">
      <div className="patient-modal-content">
        {/* 상단: 환자 정보 + 닫기 버튼 */}
        <div className="modal-header">
          <div className="modal-title-combined">
            <span className="patient-name">{patientName}</span>
            <span className="patient-id">[{patientPid}]</span>
          </div>

          <button className="close-button1" onClick={onClose}>

            <X className="close-icon1" />
          </button>
        </div>
        {/*  히스토리 목록 */}
        <div className="history-container">
          {history.map((entry) => (
            <div key={entry.historyId} className="history-entry">
              <div className="history-info">
                <span className="history-date">{entry.recordTime}</span>
                <span className="history-description">{entry.content}</span>
              </div>
              <div className="history-buttons">
                <button className="history-button" >
                  <span className="history-button-text" onClick={() => handleEditClick(entry)}>수정</span></button>
                <button className="history-button" onClick={() => handleDelete(entry.historyId)}>
                  <span className="history-button-text">삭제</span></button>
              </div>
            </div>
          ))}
        </div>

        {/* 등록 입력창 */}
        <div className="register-section">
          <div className="input-container">
            <input
              type="text"
              className="input-field"
              placeholder="메모를 입력하세요..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e)=>{
                if (e.key==='Enter'){
                  handleRegister();
                }
              }}
            />
            <button className="register-button" onClick={handleRegister}>
              <span className="register-button-text">등록</span>
            </button>
          </div>
        </div>
        {editModalOpen && (
          <EditModal
            value={editingValue}
            onChange={setEditingValue}
            onClose={() => setEditModalOpen(false)}
            onSubmit={handleEditSubmit}
          />
        )}
      </div>
    </div>
  );
}
