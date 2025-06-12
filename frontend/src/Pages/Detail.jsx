import React, { useState, useEffect } from "react";
import "../Style/Detail.css";
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from "axios";
import PastRecordModal from './PastRecordModal'; 
import LabModal from '../Components/LabModal';
import FinalizeModal from '../Components/FinalizeModal';

function Detail() {
  const { pid } = useParams();
  const location = useLocation();
  const { name, age, sex, visitId } = location.state || {};
  const navigate = useNavigate();

  const [historyData, setHistoryData] = useState([]);
  const [info, setInfo] = useState([]);
  const [patientInfo, setPatientInfo] = useState(null);
  const [prediction, setPrediction] = useState('');
  const [predictionReason, setPredictionReason] = useState('');
  const [predictionScore, setPredictionScore] = useState('');
  const [dischargePrediction, setDischargePrediction] = useState('');
  const [dischargeReason, setDischargeReason] = useState('');
  const [bedInfo, setBedInfo] = useState('');
  const [showLabModal, setShowLabModal] = useState(false);
  const [abnormalLabs, setAbnormalLabs] = useState([]);
  const [showPastRecordModal, setShowPastRecordModal] = useState(false);
  const [hasPastRecords, setHasPastRecords] = useState(false);
  const [checkingPastRecords, setCheckingPastRecords] = useState(true);
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [buttonState, setButtonState] = useState('predict'); // 버튼 상황
  const [showFinalizeModal, setShowFinalizeModal] = useState(false); // 최종 배치 모달달





  const updateFinal = (newDisposition, reason) => {
  axios.put(`http://localhost:8081/api/visits/${visitId}/disposition`, {
    disposition: Number(newDisposition),
    reason: reason
  }, {
    withCredentials: true
  })
  .then(res => {
    console.log("수정 완료", res);
    navigate('/');  
  })
  .catch(err => console.error("수정 실패", err));
};



  useEffect(() => {
    if (visitId) {
      axios.get(`http://localhost:8081/api/visits/${visitId}/labs/abnormal`, {
      })
        .then(res => setAbnormalLabs(res.data))
        .catch(err => console.error("이상수치 불러오기 실패", err));
    }
  }, [visitId]);

  const handleOpenLab = () => setShowLabModal(true);
  const handleCloseLab = () => setShowLabModal(false);

  const sendFinal = (reason) => {
    console.log('최종배치 요청:', dischargePrediction, dischargeReason);
    axios.post(`http://localhost:8081/api/visits/${visitId}/disposition`, {
      disposition: Number(dischargePrediction),
      reason: dischargeReason
    },
    { 
      withCredentials: true 
    }
  )
    .then(res => console.log("최종배치 확인", res))
      .catch(err => console.error("실패", err));
  };


// 2차 예측 
const runSecondPrediction = () => {
  if (visitId) {
    axios.post(`http://localhost:8081/api/visits/${visitId}/predict/discharge`)
      .then(res => {
        setDischargePrediction(res.data.preDisposition);
        setDischargeReason(res.data.reason);
      })
      .catch(err => {
        setDischargePrediction('예측 실패');
        setDischargeReason('사유 없음');
      });
  }
};
  //끝끝

  useEffect(() => {
    if (visitId) {
      axios.post(`http://localhost:8081/api/visits/${visitId}/predict/admission`)
        .then(res => {
          setPrediction(res.data.preDisposition);
          setPredictionReason(res.data.reason);
          setPredictionScore(res.data.preScore);
        })
        .catch(err => setPrediction('예측 실패'));
    }
  }, [visitId]);

  useEffect(() => {
    axios.get(`http://localhost:8081/api/visits/${visitId}/available-beds`)
      .then(res => setBedInfo(res.data.availableCount));
  }, [visitId]);

  useEffect(() => {
    axios.get(`http://localhost:8081/api/visits/${pid}`)
      .then(res => {
        setInfo(res.data[0]);
        setPatientInfo(res.data[0]);
        setHasPastRecords(res.data && res.data.length > 0);
        setCheckingPastRecords(false);
      })
      .catch(() => {
        setHasPastRecords(false);
        setCheckingPastRecords(false);
      });
  }, [pid]);

  useEffect(() => {
    if (visitId) {
      axios.get(`http://localhost:8081/api/visits/${visitId}/history`)
        .then(res => setHistoryData(res.data))
        .catch(err => console.error("히스토리 불러오기 실패", err));
    }
  }, [visitId]);

  const handlePastRecordClick = () => {
    if (hasPastRecords && !checkingPastRecords) setShowPastRecordModal(true);
  };

  const renderPrediction = () => {
    if (prediction === '') return '예측 중...';
    switch (String(prediction)) {
      case '0': return '귀가';
      case '1': return '일반 병동';
      case '2': return '중환자실';
      default: return prediction;
    }
  };

  const renderDischargePrediction = () => {
    if (dischargePrediction === '') return '예측 중...';
    switch (String(dischargePrediction)) {
      case '0': return '귀가';
      case '1': return '일반 병동';
      case '2': return '중환자실';
      default: return dischargePrediction;
    }
  };

  const groupedLabs = abnormalLabs.reduce((acc, lab) => {
    const time = lab.labTime;
    if (!acc[time]) acc[time] = [];
    acc[time].push(lab);
    return acc;
  }, {});

  return (
    <div className="detail-page">
      <div className={`detail-content ${!isLeftPanelOpen ? 'left-panel-closed' : ''}`}>
        {/* 좌측 - 비정상 검사 결과 */}
        <div className={`left-section ${!isLeftPanelOpen ? 'collapsed' : ''}`}>
          {isLeftPanelOpen && (
            <>
              <h2 className="section-title">비정상 검사 결과</h2>
              {Object.entries(groupedLabs).map(([labTime, items], idx) => (
                <div key={idx} className="test-card">
                  <div className="test-header">
                    <span className="test-date">{labTime}</span>
                  </div>
                  <div className="test-items">
                    {items.map((item, i) => (
                      <div className="test-item" key={i}>
                        {/* 검사명 + 비정상 수치 강조 */}
                        <div className="test-name">
                          {item.testName}
                          <span className="current-value-inline">{item.result}</span>
                        </div>

                        {/* 수치 기준선 (낮음, 정상 상한, 높음 기준) */}
                        <div className="test-values">
                          <span className="range-low">{item.minNormal}</span>
                          <span className="range-high">{item.maxNormal}</span>
                        </div>

                        {/* 시각적 상태 바 */}
                        <div className="test-bars">
                          <div className={`bar-section low ${item.result < item.minNormal ? 'active' : ''}`}>낮음</div>
                          <div className="bar-section normal">정상</div>
                          <div className={`bar-section high ${item.result > item.maxNormal ? 'active' : ''}`}>높음</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="test-footer">
                    <span className="view-all" onClick={handleOpenLab}>전체 혈액 검사 보기 &gt;</span>
                  </div>
                </div>
              ))}

            </>
          )}
        </div>


        <div className="toggle-button-container">
          <button className="panel-toggle-btn" onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)}>
            {isLeftPanelOpen ? <ChevronLeft /> : <ChevronRight />}
          </button>
        </div>

        <div className="right-container">
          <div className="detail-header">
            <div className="header-left">
              <button className="back-button" onClick={() => navigate('/')}> <ArrowLeft className="back-icon" /> </button>

              <div className="patient-title">
                <span className="patient-name">{name}</span>
                <span className="patient-info">{age}세 | {sex}</span>
              </div>
            </div>
            <div className="header-right">
              <div className="doctor-info">
                <User className="doctor-icon" />
                <span className="doctor-name">의사이도은</span>
              </div>
              <button className="logout-btn">Logout</button>
            </div>
          </div>


          {/* 우측 - 상세 정보 */}
          <div className="right-section">
            {/* Information 섹션 */}
            <div className="info-section">
              <div className="section-header">
                <h3>Information</h3>
                {/* 과거 기록 여부에 따른 버튼 활성화&비활성화 */}
                <button 
                  className={`btn-primary ${(!hasPastRecords || checkingPastRecords) ? 'btn-disabled' : ''}`}
                  onClick={handlePastRecordClick}
                  disabled={!hasPastRecords || checkingPastRecords}
                  title={checkingPastRecords ? '과거 기록 확인 중...' : 
                         !hasPastRecords ? '과거 기록이 없습니다' : '과거 기록 보기'}
                >
                  {checkingPastRecords ? '확인 중...' : '과거기록'}
                </button>
              </div>
              <div className="info-table">
                <div className="info-table-header">
                  <span>Date</span>
                  <span>ADM</span>
                  <span>Bed</span>
                  <span>Pain</span>
                  <span>Chief Complaint</span>
                  <span>Arrival Transport</span>
                </div>
                <div className="info-table-row">
                  <span>{patientInfo?.admissionTime}</span>
                  <span>{patientInfo?.visitId}</span>
                  <span>{patientInfo?.bedNumber}</span>
                  <span>{patientInfo?.pain}</span>
                  <span>{patientInfo?.chiefComplaint}</span>
                  <span>{patientInfo?.arrivalTransport}</span>
                </div>
              </div>
            </div>

            {/* Disposition 섹션 */}
            <div className="disposition-section">
              <h3>Disposition</h3>
              <div className="disposition-content">
                <div className="figure-container">
                  <div className="figure-chart">
                    <div className="figure-needle"></div>
                    <div className="figure-center">{predictionScore}</div>
                  </div>
                  <button
                    className="disposition-btn-success"
                    onClick={() => {
                      //임시 주석처리리
                      if (buttonState === 'predict') {
                        runSecondPrediction(); // 2차 예측 실행
                        setButtonState('final'); // 버튼 상태 변경
                      } else if (buttonState === 'final') {
                        //sendFinal(); // 최종배치 실행
                        setShowFinalizeModal(true);
                      }
                    }}
                  >
                    {buttonState === 'predict' ? '2차 예측' : '최종배치'}
                  </button>
                </div>
                <div className="prediction-info">
                  <div className="prediction-item">
                    <span className="label">입실 시 예측:</span>
                    <span className="value">{renderPrediction()}</span>
                  </div>
                  <div className="prediction-item">
                    <span className="label">퇴실 시 예측:</span>
                    <span className="value">{renderDischargePrediction()}</span>
                    <span className="sub-value">(가용 병상 수: {bedInfo}/20)</span>
                  </div>
                  <div className="prediction-item">
                    <span className="label">예측 근거:</span>
                    <span className="value">{predictionReason}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* History 섹션 */}
            <div className="history-section">
              <h3>History</h3>
              <div className="history-table">
                <div className="history-table-header">

                  <span>Number</span>
                  <span>Created time</span>
                  <span>Content</span>
                </div>
            {/* 실험 시작 */}
                {historyData.length > 0 ? (
                  historyData.map((item, idx) => (
                    <div key={idx} className="history-table-row">
                      <span>{item.number || idx + 1}</span>
                      <span>{item.recordTime}</span>
                      <span>{item.content}</span>
                    </div>
                  ))
                ) : (
                  <div className="history-table-row">
                    <span colSpan="3">과거 기록이 없습니다.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {showPastRecordModal && (
            <PastRecordModal patientName={name} patientPid={pid} onClose={() => setShowPastRecordModal(false)} />
          )}
          {showLabModal && (
            <LabModal visitId={visitId} isOpen={showLabModal} onClose={handleCloseLab} />
          )}
          {showFinalizeModal && (
            <FinalizeModal
              prediction={dischargePrediction}
              reason={dischargeReason} // 이유
              onClose={() => setShowFinalizeModal(false)}
              onConfirm={(selectedDisposition, reason) => {
                if (String(selectedDisposition) === String(dischargePrediction)) {
                  sendFinal(dischargeReason);
                } else {
                  updateFinal(selectedDisposition, reason); // 수정된 값으로 PUT 요청
                }
                setShowFinalizeModal(false);
              }}
            />
          )}

        </div>
      </div>
    </div>
  );
}

export default Detail;

