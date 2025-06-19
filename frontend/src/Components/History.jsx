import React, { useState, useEffect } from "react";
import { X, ChevronRight } from "lucide-react";
import '../Style/History.css';
import axios from "axios";
import EditModal from '../Modals/EditModal';

export default function History({ patient, onClose }) {
  const [inputValue, setInputValue] = useState('');
  const [history, setHistory] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  // 수정용 모달
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState('');

  const patientName = patient.name;
  const patientPid = patient.pid;

  // 인라인 수정 시작
  const handleInlineEdit = (entry) => {
    setEditingEntry(entry.historyId);
    setEditingValue(entry.content);
  };

  // 인라인 수정 취소
  const handleCancelEdit = () => {
    setEditingEntry(null);
    setEditingValue('');
  };

  // 인라인 수정 저장
  const handleInlineSave = (historyId) => {
    if (!editingValue.trim()) return;

    axios.put(`http://localhost:8081/api/history/${historyId}`, {
      content: editingValue
    }, {
      withCredentials: true
    })
      .then(() => {
        console.log("수정 성공");
        setEditingEntry(null);
        setEditingValue('');
        setSelectedEntry(null);
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

  // 히스토리 항목 클릭 핸들러
  const handleEntryClick = (entry) => {
    if (editingEntry === entry.historyId) return; // 수정 중이면 클릭 무시
    setSelectedEntry(selectedEntry?.historyId === entry.historyId ? null : entry);
  };

  // 수정 모달 함수  
  const handleEditClick = (entry, e) => {
    e.stopPropagation(); // 부모 클릭 이벤트 방지
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
        setSelectedEntry(null);
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

  //  히스토리 불러오기
  const fetchHistory = () => {
    axios.get(`http://localhost:8081/api/visits/${patient.visitId}/history`)
      .then((res) => {
        console.log("visitId 확인:", patient.visitId);
        console.log("히스토리 불러옴:", res.data);
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

  // 삭제
  const handleDelete = (historyId, e) => {
    e.stopPropagation(); // 부모 클릭 이벤트 방지
    if (!window.confirm("정말 삭제하시겠습니까?")) return;

    axios.delete(`http://localhost:8081/api/history/${historyId}`, {
      withCredentials: true,
    })
      .then(() => {
        console.log("삭제 성공");
        setSelectedEntry(null);
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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleRegister();
    }
  };

  return (
    <div className="history-modal-overlay">
      <div className="history-modal">
        {/* 헤더 */}
        <div className="history-header">
          <div className="patient-header">
            <div className="history-patient-info">
              <h2 className="history-patient-name">{patientName}</h2>
              <span className="history-patient-id">[{patientPid}]</span>
            </div>
            <button className="close-button2" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* 히스토리 목록 */}
        <div className="history-list">
          {history.length === 0 ? (
            <div className="empty-state">
              <p>등록된 히스토리가 없습니다.</p>
            </div>
          ) : (
            history.map((entry) => (
              <div key={entry.historyId} className="history-item-wrapper">
                <div
                  className={`history-item ${selectedEntry?.historyId === entry.historyId ? 'selected' : ''}`}
                  onClick={() => handleEntryClick(entry)}
                >
                  <div className="history-main">
                    <div className="history-content">
                      <div className="history-date">{entry.recordTime}</div>
                      <div className="history-text">{entry.content}</div>
                    </div>

                    <ChevronRight
                      size={16}
                      className={`expand-icon ${selectedEntry?.historyId === entry.historyId ? 'rotated' : ''}`}
                    />
                  </div>
                </div>

                {/* 선택된 항목의 전체 내용 표시 */}
                {selectedEntry?.historyId === entry.historyId && (
                  <div className="history-detail">
                    {editingEntry === entry.historyId ? (
                      // 수정 모드
                      <div className="detail-edit-mode">
                        <div className="edit-header">
                          <strong>내용 수정</strong>
                          <div className="edit-actions">
                            <button
                              className="save-btn"
                              onClick={() => handleInlineSave(entry.historyId)}
                            >
                              저장
                            </button>
                            <button className="history-cancel-btn" onClick={handleCancelEdit}>
                              취소
                            </button>
                          </div>
                        </div>
                        <textarea
                          className="edit-textarea"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          rows={4}
                          autoFocus
                        />
                      </div>
                    ) : (
                      // 읽기 모드
                      <div className="detail-view-mode">
                        <div className="detail-header">
                          <strong>전체 내용</strong>
                          <div className="history-actions">
                            <button
                              className="action-btn edit-btn"
                              onClick={() => handleInlineEdit(entry)}
                            >
                              수정
                            </button>
                            <button
                              className="action-btn delete-btn"
                              onClick={(e) => handleDelete(entry.historyId, e)}
                              title="삭제"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                        <div className="detail-content-text">
                          {entry.content}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* 입력 영역 */}
        < div className="history-input-section" >
          <div className="input-group">
            <input
              type="text"
              className="history-input"
              placeholder="새로운 히스토리를 입력하세요..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
            />
            <button
              className="submit-btn"
              onClick={handleRegister}
              disabled={!inputValue.trim()}
            >
              등록
            </button>
          </div>
        </div>

        {/* 수정 모달 */}
        {editModalOpen && (
          <EditModal
            value={editingValue}
            onChange={setEditingValue}
            onClose={() => setEditModalOpen(false)}
            onSubmit={handleEditSubmit}
          />
        )}
      </div>
    </div >
  );
}