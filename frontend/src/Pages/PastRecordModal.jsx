import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import axios from "axios";
import '../Style/PastRecordmodal.css';

const PastRecordModal = ({ patientName, patientPid, onClose }) => {
  const [pastRecords, setPastRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === 'Escape' && typeof onClose === 'function') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [onClose]);

  // 백엔드 연동 - 과거 데이터 불러오기
  useEffect(() => {
    if (patientPid) {
      setLoading(true);
      setError(null);

      axios.get(`http://localhost:8081/api/visits/${patientPid}`)
        .then(response => {
          console.log("과거 기록 백엔드 응답:", response.data);
          const rawData = response.data;

          const transformed = rawData.map(visit => ({
            date: visit.admissionTime ?
              new Date(visit.admissionTime).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
              }) : '날짜 없음',
            adm: `ADM${visit.visitId || Math.random().toString(36).substring(2, 8)}`,
            bed: visit.bedNumber || 'N/A',
            ktas: visit.acuity?.toString() || '3',
            pain: visit.pain?.toString() || 'N/A',
            chiefComplaint: visit.chiefComplaint || '정보 없음',
            arrivalTransport: visit.arrivalTransport || 'Unknown'
          }));

          setPastRecords(transformed);
          setLoading(false);
        })
        .catch(error => {
          console.error('과거 기록 불러오기 실패:', error);

          if (error.response?.status === 404) {
            setError('환자 정보를 찾을 수 없습니다.');
          } else if (error.response?.status === 500) {
            setError('서버 오류가 발생했습니다.');
          } else {
            setError('과거 기록을 불러오는 중 오류가 발생했습니다.');
          }
          setPastRecords([]);
          setLoading(false);
        });
    }
  }, [patientPid]);

  // 오버레이 클릭으로 모달 닫기
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && typeof onClose === 'function') {
      onClose();
    }
  };

  // 통계 계산
  const calculateStats = () => {
    if (pastRecords.length === 0) {
      return {
        totalVisits: 0,
        lastVisit: 'N/A',
        commonComplaint: 'N/A',
        averageKtas: 'N/A'
      };
    }

    const totalVisits = pastRecords.length;
    const lastVisit = pastRecords[0]?.date || 'N/A';
    
    const complaints = pastRecords
      .map(r => (r.chiefComplaint || '').split(' ')[0])
      .filter(c => c && c !== '정보');
    const complaintCounts = complaints.reduce((acc, complaint) => {
      acc[complaint] = (acc[complaint] || 0) + 1;
      return acc;
    }, {});

    const commonComplaint = Object.keys(complaintCounts).length > 0
      ? Object.keys(complaintCounts).reduce((a, b) =>
        complaintCounts[a] > complaintCounts[b] ? a : b
      )
      : 'N/A';

    const ktasValues = pastRecords
      .map(r => parseInt(r.ktas))
      .filter(k => !isNaN(k) && k >= 1 && k <= 5);

    const averageKtas = ktasValues.length > 0
      ? (ktasValues.reduce((a, b) => a + b, 0) / ktasValues.length).toFixed(1)
      : 'N/A';

    return {
      totalVisits,
      lastVisit,
      commonComplaint,
      averageKtas
    };
  };

  const stats = calculateStats();

  // 닫기 버튼 핸들러
  const handleCloseClick = () => {
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  return (
    <div className="past-modal-overlay" onClick={handleOverlayClick}>
      <div className="past-records-modal">
        {/* 모달 헤더 */}
        <div className="past-modal-header">
          <h2 className="past-modal-title">{patientName} [{patientPid}] - 과거 기록</h2>
          <button className="past-close-button" onClick={handleCloseClick}>
            <X className="past-close-icon" />
          </button>
        </div>

        {/* 모달 내용 */}
        <div className="past-modal-content">
          {/* 로딩 상태 */}
          {loading && (
            <div className="past-loading-container">
              <p>과거 기록을 불러오는 중...</p>
            </div>
          )}

          {/* 에러 상태 표시 */}
          {error && (
            <div className="past-error-container">
              <p className="past-error-message">{error}</p>
            </div>
          )}

          {/* 과거 기록 없을 경우 */}
          {!loading && !error && pastRecords.length === 0 && (
            <div className="past-no-records-container">
              <p>과거 방문 기록이 없습니다.</p>
            </div>
          )}

          {/* 과거 기록 존재 - 테이블 출력 */}
          {!loading && !error && pastRecords.length > 0 && (
            <>
              <div className="past-records-table">
                <div className="past-records-table-header">
                  <span>Date</span>
                  <span>ADM</span>
                  <span>Bed</span>
                  <span>KTAS</span>
                  <span>Pain</span>
                  <span>Chief Complaint</span>
                  <span>Arrival Transport</span>
                </div>

                {pastRecords.map((record, index) => (
                  <div key={index} className="past-records-table-row">
                    <span>{record.date}</span>
                    <span>{record.adm}</span>
                    <span>{record.bed}</span>
                    <span className={`past-ktas-text past-ktas-${record.ktas}`}>
                      {record.ktas}
                    </span>
                    <span>{record.pain}</span>
                    <span>{record.chiefComplaint}</span>
                    <span>{record.arrivalTransport}</span>
                  </div>
                ))}
              </div>

              {/* 통계 정보 */}
              <div className="past-statistics-section">
                <h3>방문 통계</h3>
                <div className="past-stats-grid">
                  <div className="past-stat-item">
                    <span className="past-stat-label">총 방문 횟수</span>
                    <span className="past-stat-value">{stats.totalVisits}회</span>
                  </div>
                  <div className="past-stat-item">
                    <span className="past-stat-label">최근 방문</span>
                    <span className="past-stat-value">{stats.lastVisit}</span>
                  </div>
                  <div className="past-stat-item">
                    <span className="past-stat-label">주요 증상</span>
                    <span className="past-stat-value">{stats.commonComplaint}</span>
                  </div>
                  <div className="past-stat-item">
                    <span className="past-stat-label">평균 KTAS</span>
                    <span className="past-stat-value">{stats.averageKtas}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* 모달 푸터 */}
        <div className="past-modal-footer">
          <button className="past-btn-secondary" onClick={handleCloseClick}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default PastRecordModal;