import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import axios from "axios";
import '../Style/PastRecordModal.css';

const PastRecordModal = ({ patientName, pid, onClose }) => {
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
    const fetchPastRecords = async () => {
      console.log('전달받은 props:', { patientName, pid, pid });

      if (!pid || pid === '' || pid === null || pid === undefined) {
        console.error('pid가 유효하지 않습니다:', pid);
        setError(`환자 ID가 없습니다. (받은 값: ${pid})`);
        setLoading(false);
        return;
      }

      console.log(`과거 기록 요청 시작: PID=${pid}`);

      try {
        setLoading(true);
        setError(null);

        // 타임아웃 설정 (10초)
        const response = await axios.get(`http://localhost:8081/api/visits/${pid}`, {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          }
        });

        console.log("과거 기록 백엔드 응답:", response.data);
        console.log("응답 상태:", response.status);

        const rawData = response.data;

        // 데이터가 배열인지 확인
        if (!Array.isArray(rawData)) {
          console.error("응답 데이터가 배열이 아닙니다:", rawData);
          throw new Error('잘못된 데이터 형식입니다.');
        }

        const transformed = rawData.map((visit, index) => {
          console.log(`변환 중 ${index}:`, visit);
          return {
            date: visit.admissionTime ?
              new Date(visit.admissionTime).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
              }) : '날짜 없음',
            adm: `${visit.visitId || Math.random().toString(36).substring(2, 8)}`,
            bed: visit.bedNumber || visit.bedNusmber || 'N/A', // 오타 수정: bedNusmber -> bedNumber
            ktas: visit.acuity?.toString() || '3',
            pain: visit.pain?.toString() || 'N/A',
            chiefComplaint: visit.chiefComplaint || '정보 없음',
            arrivalTransport: visit.arrivalTransport || 'Unknown'
          };
        });

        console.log("변환된 데이터:", transformed);
        setPastRecords(transformed);

      } catch (error) {
        console.error('과거 기록 불러오기 실패:', error);
        console.error('에러 세부사항:', {
          message: error.message,
          code: error.code,
          response: error.response?.data,
          status: error.response?.status
        });

        let errorMessage = '과거 기록을 불러오는 중 오류가 발생했습니다.';

        if (error.code === 'ECONNABORTED') {
          errorMessage = '서버 응답 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.';
        } else if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
          errorMessage = '서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.';
        } else if (error.response?.status === 404) {
          errorMessage = '환자의 과거 기록을 찾을 수 없습니다.';
        } else if (error.response?.status === 500) {
          errorMessage = '서버 내부 오류가 발생했습니다.';
        } else if (error.response?.status === 400) {
          errorMessage = '잘못된 요청입니다. 환자 ID를 확인해주세요.';
        }

        setError(errorMessage);
        setPastRecords([]);
      } finally {
        setLoading(false);
        console.log("과거 기록 로딩 완료");
      }
    };

    fetchPastRecords();
  }, [pid]);

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
      ? Object.keys(complaintCounts).reduce((a, b) => complaintCounts[a] > complaintCounts[b] ? a : b)
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

  // 재시도 핸들러
  const handleRetry = () => {
    setLoading(true);
    setError(null);
    // useEffect가 다시 실행되도록 강제로 상태 변경
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  return (
    <div className="past-modal-overlay" onClick={handleOverlayClick}>
      <div className="past-records-modal">
        {/* 모달 헤더 */}
        <div className="past-modal-header">
          <h2 className="past-modal-title">{patientName} [{pid}] - 과거 기록</h2>
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
              <p style={{ fontSize: '0.9em', color: '#666', marginTop: '10px' }}>
                환자 ID: {pid}
              </p>
            </div>
          )}

          {/* 에러 상태 표시 */}
          {error && (
            <div className="past-error-container">
              <p className="past-error-message">{error}</p>
              <div style={{ marginTop: '10px', fontSize: '0.9em', color: '#666' }}>
                <p>디버깅 정보:</p>
                <p>• 환자명: {patientName || '없음'}</p>
                <p>• 환자 ID (pid): {pid || '없음'}</p>
                <p>• pid: {pid || '없음'}</p>
                <p>• ID 타입: {typeof pid}</p>
              </div>
              <button
                onClick={handleRetry}
                style={{
                  marginTop: '10px',
                  padding: '8px 16px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                다시 시도
              </button>
            </div>
          )}

          {/* 과거 기록 없을 경우 */}
          {!loading && !error && pastRecords.length === 0 && (
            <div className="past-no-records-container">
              <p>과거 방문 기록이 없습니다.</p>
              <p style={{ fontSize: '0.9em', color: '#666', marginTop: '5px' }}>
                환자 ID: {pid}
              </p>
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
      </div>
    </div>
  );
};

export default PastRecordModal;