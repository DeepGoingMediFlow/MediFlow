import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, ChevronLeft, ChevronRight, Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import axios from "axios";
import { useAuth } from '../Components/AuthContext';
import PastRecordModal from '../Modals/PastRecordModal';
import LabModal from '../Modals/LabModal';
import FinalizeModal from '../Modals/FinalizeModal';
import PredictionLoadingModal from '../Modals/PredictionLoadingModal';
import UserIcon from '../assets/images/user-icon.png';
import logoutIcon from '../assets/images/logout-icon.png';
import "../Style/DetailPage.css";

function DetailPage() {
  const { pid } = useParams();
  const location = useLocation();
  const { name, age, sex, visitId } = location.state || {};
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  // 환자 및 예측 관련 상태
  const [patientInfo, setPatientInfo] = useState(null);
  const [info, setInfo] = useState([]);
  const [prediction, setPrediction] = useState('');
  const [predictionReason, setPredictionReason] = useState('');
  const [predictionScore, setPredictionScore] = useState('');
  const [dischargePrediction, setDischargePrediction] = useState(null);
  const [dischargeScore, setDischargeScore] = useState('');
  const [dischargeReason, setDischargeReason] = useState('');
  const [firstPredictionLoading, setFirstPredictionLoading] = useState(true);

  // 병상 정보 상태
  const [wardBeds, setWardBeds] = useState({ available: 0, total: 0 });
  const [icuBeds, setIcuBeds] = useState({ available: 0, total: 0 });

  // 검사 결과 상태
  const [abnormalLabs, setAbnormalLabs] = useState([]);
  const [showLabModal, setShowLabModal] = useState(false);

  // 과거 기록 상태
  const [showPastRecordModal, setShowPastRecordModal] = useState(false);
  const [hasPastRecords, setHasPastRecords] = useState(false);
  const [checkingPastRecords, setCheckingPastRecords] = useState(true);

  // UI 상태
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [buttonState, setButtonState] = useState('predict');
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [currentPrediction, setCurrentPrediction] = useState('discharge');

  // 히스토리 관리 상태
  const [historyData, setHistoryData] = useState([]);
  const [newHistoryInput, setNewHistoryInput] = useState('');
  const [editingHistoryId, setEditingHistoryId] = useState(null);
  const [editingHistoryValue, setEditingHistoryValue] = useState('');
  const [expandedHistoryId, setExpandedHistoryId] = useState(null);
  const [showHistoryInput, setShowHistoryInput] = useState(false);

  // 로딩 상태
  const [showPredictionLoading, setShowPredictionLoading] = useState(false);
  const [loadingPredictionType, setLoadingPredictionType] = useState('1차');

  const handlePredictionLoadingClose = () => {
    setShowPredictionLoading(false);
  };

  // 인증 확인
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // 컴포넌트 마운트 시 데이터 초기화
  useEffect(() => {
    if (visitId) {
      loadPredictions();
      fetchHistory();
      loadAbnormalLabs();
    }
    if (pid) {
      loadPatientInfo();
    }
    loadBedInfo();
  }, [visitId, pid]);

  // 예측 결과 변경 시 차트 업데이트
  useEffect(() => {
    updatePredictionChart();
  }, [prediction, dischargePrediction]);

  // 데이터 로딩 함수들
  const loadPredictions = () => {
    setFirstPredictionLoading(true);

    // 1차 예측 조회
    axios.get(`http://localhost:8081/api/visits/${visitId}/predictions/admission`, {
      withCredentials: true
    })
      .then(res => {
        setPrediction(res.data.preDisposition);
        setPredictionReason(res.data.reason);
        setPredictionScore(res.data.preScore);
        setFirstPredictionLoading(false);
      })
      .catch(err => {
        console.error('1차 예측 조회 실패:', err);
        setPrediction(null);
        setFirstPredictionLoading(false);
      });

    // 2차 예측 조회 - 점수도 함께 저장
    axios.get(`http://localhost:8081/api/visits/${visitId}/predictions/discharge`, {
      withCredentials: true
    })
      .then(res => {
        if (res.data &&
          typeof res.data.preDisposition === 'number' &&
          [0, 1, 2].includes(res.data.preDisposition)) {
          setDischargePrediction(res.data.preDisposition);
          setDischargeReason(res.data.reason || '');
          setDischargeScore(res.data.preScore || ''); // 2차 예측 점수 저장
          setButtonState('final');
        } else {
          setDischargePrediction(null);
          setDischargeReason('');
          setDischargeScore(''); // 2차 예측 점수 초기화
          setButtonState('predict');
        }
      })
      .catch(err => {
        console.error('2차 예측 조회 실패:', err);
        setDischargePrediction(null);
        setDischargeReason('');
        setDischargeScore(''); // 2차 예측 점수 초기화
        setButtonState('predict');
      });
  };

  const loadPatientInfo = () => {
    axios.get(`http://localhost:8081/api/visits/${pid}`, {
      withCredentials: true
    })
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
  };

  const loadBedInfo = () => {
    axios.get(`http://localhost:8081/api/beds`, {
      withCredentials: true
    })
      .then(res => {
        const generalWard = res.data.find(bed => bed.wardType === 'WARD');
        const icu = res.data.find(bed => bed.wardType === 'ICU');

        setWardBeds({
          available: generalWard?.availableCount || 0,
          total: generalWard?.totalBeds || 0
        });
        setIcuBeds({
          available: icu?.availableCount || 0,
          total: icu?.totalBeds || 0
        });
      })
      .catch(err => {
        console.error("병상 정보 불러오기 실패", err);
        setWardBeds({ available: 0, total: 0 });
        setIcuBeds({ available: 0, total: 0 });
      });
  };

  const loadAbnormalLabs = () => {
    axios.get(`http://localhost:8081/api/visits/${visitId}/labs/abnormal`, {
      withCredentials: true
    })
      .then(res => setAbnormalLabs(res.data))
      .catch(err => console.error("이상수치 불러오기 실패", err));
  };

  const fetchHistory = () => {
    if (!visitId) return;

    axios.get(`http://localhost:8081/api/visits/${visitId}/history`, {
      withCredentials: true
    })
      .then(res => setHistoryData(res.data))
      .catch(err => console.error("히스토리 불러오기 실패", err));
  };

  // 예측 실행 함수
  const runSecondPrediction = () => {
    if (!visitId) return;

    setButtonState('loading');
    setShowPredictionLoading(true); // 로딩 모달 표시
    setLoadingPredictionType('2차'); // 2차 예측임을 표시

    axios.post(`http://localhost:8081/api/visits/${visitId}/predict/discharge`, {}, {
      withCredentials: true
    })
      .then(res => {
        if (res.data && typeof res.data.preDisposition === 'number' && [0, 1, 2].includes(res.data.preDisposition)) {
          setDischargePrediction(res.data.preDisposition);
          setDischargeReason(res.data.reason || '');
          setDischargeScore(res.data.preScore || '');
          setButtonState('final');
        } else {
          setDischargePrediction(null);
          setDischargeReason('데이터 오류');
          setDischargeScore('');
          setButtonState('predict');
        }
      })
      .catch(err => {
        console.error('2차 예측 실패:', err);
        setDischargePrediction(null);
        setDischargeReason('예측 실패');
        setDischargeScore('');
        setButtonState('predict');
      })
      .finally(() => {
        // 여기서 바로 닫지 않고, 모달이 자동으로 최소 시간 후에 닫히도록 함
        setTimeout(() => {
          setShowPredictionLoading(false);
        }, 500); // 추가 0.5초 대기
      });
  };

  // 최종 배치 함수들
  const sendFinal = (reason) => {
    if (dischargePrediction === null || dischargePrediction === undefined) {
      console.error('dischargePrediction이 유효하지 않습니다:', dischargePrediction);
      return;
    }

    const requestData = {
      disposition: Number(dischargePrediction),
      reason: reason || ''
    };

    console.log('전송할 데이터:', requestData);

    axios.post(`http://localhost:8081/api/visits/${visitId}/disposition`, requestData, {
      withCredentials: true
    })
      .then(res => {
        console.log("최종배치 확인", res);
        navigate('/');
      })
      .catch(err => {
        console.error("실패", err);
        if (err.response) {
          console.error("에러 응답:", err.response.data);
        }
      });
  };

  const updateFinal = (newDisposition, reason) => {
    const requestData = {
      disposition: Number(newDisposition),
      reason: reason || ''
    };

    console.log('수정 전송할 데이터:', requestData);

    axios.put(`http://localhost:8081/api/visits/${visitId}/disposition`, requestData, {
      withCredentials: true
    })
      .then(res => {
        console.log("수정 완료", res);
        navigate('/');
      })
      .catch(err => {
        console.error("수정 실패", err);
        if (err.response) {
          console.error("에러 응답:", err.response.data);
        }
      });
  };

  // 히스토리 관리 함수들
  const handleAddHistory = () => {
    if (!newHistoryInput.trim()) return;

    const newEntry = { content: newHistoryInput };

    axios.post(`http://localhost:8081/api/visits/${visitId}/history`, newEntry, {
      withCredentials: true
    })
      .then((res) => {
        setNewHistoryInput('');
        setShowHistoryInput(false);
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

  const handleEditHistory = (historyId) => {
    const entry = historyData.find(h => h.historyId === historyId);
    if (entry) {
      setEditingHistoryId(historyId);
      setEditingHistoryValue(entry.content);
    }
  };

  const handleSaveHistory = (historyId) => {
    if (!editingHistoryValue.trim()) return;

    axios.put(`http://localhost:8081/api/history/${historyId}`, {
      content: editingHistoryValue
    }, {
      withCredentials: true
    })
      .then(() => {
        setEditingHistoryId(null);
        setEditingHistoryValue('');
        setExpandedHistoryId(null);
        fetchHistory();
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          alert("로그인 세션이 만료되었습니다.");
        } else {
          console.error("수정 실패:", err);
        }
      });
  };

  const handleDeleteHistory = (historyId) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;

    axios.delete(`http://localhost:8081/api/history/${historyId}`, {
      withCredentials: true
    })
      .then(() => {
        setExpandedHistoryId(null);
        fetchHistory();
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          alert("로그인 세션이 만료되었습니다.");
        } else {
          console.error("삭제 실패:", err);
        }
      });
  };

  // 이벤트 핸들러들
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handlePastRecordClick = () => {
    if (hasPastRecords && !checkingPastRecords) {
      setShowPastRecordModal(true);
    }
  };

  const handleOpenLab = () => setShowLabModal(true);
  const handleCloseLab = () => setShowLabModal(false);

  const handleCancelEdit = () => {
    setEditingHistoryId(null);
    setEditingHistoryValue('');
  };

  const handleHistoryItemClick = (historyId) => {
    if (editingHistoryId === historyId) return;
    setExpandedHistoryId(expandedHistoryId === historyId ? null : historyId);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddHistory();
    }
  };

  // 유틸리티 함수들
  const formatAdmissionTime = (admissionTime) => {
    if (!admissionTime) return '-';
    const date = new Date(admissionTime);
    const year = String(date.getFullYear()).slice(2).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}/${month}/${day} ${hours}:${minutes}`;
  };

  const getPredictionClass = (predictionValue) => {
    const value = String(predictionValue);
    if (value === '0') return 'discharge';
    if (value === '1') return 'general';
    if (value === '2') return 'icu';
    return '';
  };

  const getPredictionColor = (predictionValue) => {
    const value = String(predictionValue);
    if (value === '0') return '#10b981';
    if (value === '1') return '#eab308';
    if (value === '2') return '#ef4444';
    return '#e5e7eb';
  };

  const getPredictionType = (predictionValue) => {
    const value = String(predictionValue);
    if (value === '0') return 'discharge';
    if (value === '1') return 'general';
    if (value === '2') return 'icu';
    return 'discharge';
  };

  const updatePredictionChart = () => {
    if (dischargePrediction !== '' && dischargePrediction !== null) {
      const predictionType = getPredictionType(dischargePrediction);
      setCurrentPrediction(predictionType);
    } else if (prediction !== '' && prediction !== null) {
      const predictionType = getPredictionType(prediction);
      setCurrentPrediction(predictionType);
    }
  };

  const updateChart = (predictionType) => {
    setCurrentPrediction(predictionType);
  };

  // 검사 수치 관련 함수들
  const calculateAbnormalPosition = (value, minNormal, maxNormal) => {
    const normalRange = maxNormal - minNormal;
    const minExtendedRange = Math.max(normalRange * 3, 10);
    const lowRange = minExtendedRange;
    const highRange = minExtendedRange;
    const totalMin = minNormal - lowRange;
    const totalMax = maxNormal + highRange;
    const totalRange = totalMax - totalMin;
    const clampedValue = Math.max(totalMin, Math.min(totalMax, value));

    if (clampedValue < minNormal) {
      const position = ((clampedValue - totalMin) / totalRange) * 33.33;
      return Math.max(0, Math.min(33.33, position));
    } else if (clampedValue > maxNormal) {
      const position = 66.67 + ((clampedValue - maxNormal) / (totalMax - maxNormal)) * 33.33;
      return Math.max(66.67, Math.min(100, position));
    } else {
      const position = 33.33 + ((clampedValue - minNormal) / normalRange) * 33.33;
      return Math.max(33.33, Math.min(66.67, position));
    }
  };

  const getIndicatorColor = (position) => {
    if (position < 16.67) return '#ff4444';
    if (position < 33.33) return '#ff8800';
    if (position > 83.33) return '#ff4444';
    if (position > 66.67) return '#ff8800';
    return '#44aa44';
  };

  // 렌더링 함수들
  const renderPrediction = () => {
    switch (prediction) {
      case 0: return '귀가';
      case 1: return '일반병동';
      case 2: return '중환자실';
      default: return '예측 대기중...';
    }
  };

  const renderDischargePrediction = () => {
    switch (dischargePrediction) {
      case 0: return '귀가';
      case 1: return '일반병동';
      case 2: return '중환자실';
      default: return '예측 없음';
    }
  };

  const hasDischargePrediction = () => {
    return dischargePrediction !== null &&
      dischargePrediction !== undefined &&
      [0, 1, 2].includes(dischargePrediction);
  };

  const getBedInfo = (predictionValue) => {
    const value = String(predictionValue);
    switch (value) {
      case '1':
        return `(실시간 가용 병상 수: ${wardBeds.available} / ${wardBeds.total})`;
      case '2':
        return `(실시간 가용 병상 수: ${icuBeds.available} / ${icuBeds.total})`;
      default:
        return '';
    }
  };

  // 검사 결과 그룹화
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
                    {items.map((item, i) => {
                      const value = parseFloat(item.result);
                      const minNormal = parseFloat(item.minNormal);
                      const maxNormal = parseFloat(item.maxNormal);
                      const abnormalPosition = calculateAbnormalPosition(value, minNormal, maxNormal);
                      const indicatorColor = getIndicatorColor(abnormalPosition);

                      return (
                        <div className="test-item" key={i}>
                          <div className="test-name">{item.testName}</div>
                          <div className="test-chart-container">
                            <div
                              className="abnormal-indicator"
                              style={{
                                left: `${abnormalPosition}%`,
                                color: indicatorColor
                              }}
                            >
                              <div className="abnormal-value">{item.result}</div>
                              <div
                                className="abnormal-line"
                                style={{ backgroundColor: indicatorColor }}
                              ></div>
                            </div>
                            <div className="test-bars">
                              <div className="bar-section low">낮음</div>
                              <div className="bar-section normal">정상</div>
                              <div className="bar-section high">높음</div>
                            </div>
                            <div className="range-values">
                              <span className="range-min">{minNormal}</span>
                              <span className="range-max">{maxNormal}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="test-footer">
                    <span className="view-all" onClick={handleOpenLab}>
                      전체 검사 보기 &gt;
                    </span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        <div className="toggle-button-container">
          <button
            className="panel-toggle-btn"
            onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
          >
            {isLeftPanelOpen ? <ChevronLeft /> : <ChevronRight />}
          </button>
        </div>

        <div className="right-container">
          <div className="detail-header">
            <div className="header-left">
              <button className="back-button" onClick={() => navigate('/')}>
                <ArrowLeft className="back-icon" />
              </button>
              <div className="patient-title">
                <span className="patient-name">{name}</span>
                <span className="patient-info"> {pid} | {age}세 | {sex} </span>
              </div>
            </div>
            <div className="header-right">
              <div className="user-info">
                <img src={UserIcon} alt="user" className="user-icon" />
                <span className="user-name">{user?.userName}</span>
                <div className="logout-button" onClick={handleLogout}>
                  <img src={logoutIcon} alt="logout" className="logout-icon" />
                  <span className="logout-text">Logout</span>
                </div>
              </div>
            </div>
          </div>

          {/* 우측 - 상세 정보 */}
          <div className="right-section">
            {/* Information 섹션 */}
            <div className="info-section">
              <div className="section-header">
                <h3>Information</h3>
                <button
                  className={`btn-primary ${(!hasPastRecords || checkingPastRecords) ? 'btn-disabled' : ''}`}
                  onClick={handlePastRecordClick}
                  disabled={!hasPastRecords || checkingPastRecords}
                  title={checkingPastRecords ? '과거 기록 확인 중...' :
                    !hasPastRecords ? '과거 기록이 없습니다' : '과거 기록 보기'}
                >
                  {checkingPastRecords ? '확인 중...' : '과거 기록'}
                </button>
              </div>
              <div className="info-table">
                <div className="table-container_detail">
                  <div className="info-table-header">
                    <span>Admission Time</span>
                    <span>ADM</span>
                    <span>Bed</span>
                    <span>KTAS</span>
                    <span>Pain</span>
                    <span>Chief Complaint</span>
                    <span>Arrival Transport</span>
                  </div>
                  <div className="info-table-row">
                    <span>{patientInfo?.admissionTime ? formatAdmissionTime(patientInfo.admissionTime) : '-'}</span>
                    <span>{patientInfo?.visitId}</span>
                    <span>{patientInfo?.bedNumber ? patientInfo.bedNumber : '-'}</span>
                    <span>{patientInfo?.acuity}</span>
                    <span>{patientInfo?.pain}</span>
                    <span>{patientInfo?.chiefComplaint}</span>
                    <span>{patientInfo?.arrivalTransport}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Disposition 섹션 */}
            <div className="disposition-section">
              <h3>Disposition</h3>
              <div className="disposition-content">
                <div className="figure-container">
                  <div className="chart-wrapper">
                    <div className="chart-legend">
                      <div
                        className={`legend-item ${currentPrediction === 'discharge' ? 'active' : ''}`}
                        data-type="discharge"
                        onClick={() => updateChart('discharge')}
                      >
                        <div className="legend-dot discharge"></div>
                        <span>귀가</span>
                      </div>
                      <div
                        className={`legend-item ${currentPrediction === 'general' ? 'active' : ''}`}
                        data-type="general"
                        onClick={() => updateChart('general')}
                      >
                        <div className="legend-dot general"></div>
                        <span>일반병동</span>
                      </div>
                      <div
                        className={`legend-item ${currentPrediction === 'icu' ? 'active' : ''}`}
                        data-type="icu"
                        onClick={() => updateChart('icu')}
                      >
                        <div className="legend-dot icu"></div>
                        <span>중환자실</span>
                      </div>
                    </div>

                    <div className="figure-chart-area">
                      <div className="figure-chart" id="dispositionChart">
                        <div
                          className={`chart-segment discharge ${currentPrediction === 'discharge' ? 'highlighted' : (currentPrediction ? 'dimmed' : '')}`}
                          data-type="discharge"
                        ></div>
                        <div
                          className={`chart-segment general ${currentPrediction === 'general' ? 'highlighted' : (currentPrediction ? 'dimmed' : '')}`}
                          data-type="general"
                        ></div>
                        <div
                          className={`chart-segment icu ${currentPrediction === 'icu' ? 'highlighted' : (currentPrediction ? 'dimmed' : '')}`}
                          data-type="icu"
                        ></div>
                        <div className="figure-center" id="scoreCenter">
                          {/* 2차 예측이 있으면 2차 예측 점수, 없으면 1차 예측 점수 표시 */}
                          {hasDischargePrediction() && dischargeScore !== '' ?
                            dischargeScore :
                            (predictionScore !== '' && predictionScore !== null ? predictionScore : '0')
                          }
                        </div>
                      </div>
                      {firstPredictionLoading ? (
                        <button className="disposition-btn-success loading" disabled>
                          1차 예측중...
                        </button>
                      ) : (
                        <button
                          className={`disposition-btn-success ${buttonState === 'final' ? 'final' : ''}`}
                          onClick={() => {
                            console.log('버튼 클릭, 현재 buttonState:', buttonState);
                            console.log('현재 dischargePrediction:', dischargePrediction);

                            if (buttonState === 'predict') {
                              runSecondPrediction();
                            } else if (buttonState === 'final') {
                              setShowFinalizeModal(true);
                            }
                          }}
                          disabled={buttonState === 'loading'} // 로딩 중 비활성화
                        >
                          {buttonState === 'predict' ? '2차 예측' :
                            buttonState === 'loading' ? '2차 예측중...' : '최종 배치'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="prediction-info">
                  {/* 첫 번째 행: 1차 예측과 2차 예측 */}
                  <div className="predictions-row">
                    <div className={`prediction-item ${getPredictionClass(prediction)} ${!hasDischargePrediction() ? 'active' : ''}`} data-prediction="1차">
                      <span className="dis-label">
                        <div className="label-icon first">1</div>
                        1차 예측
                      </span>
                      <div className="prediction-result">
                        <div className={`prediction-badge ${getPredictionClass(prediction)}`}>
                          <div className="status-indicator" style={{ backgroundColor: getPredictionColor(prediction) }}></div>
                          {renderPrediction()}
                          {getBedInfo(prediction) && (
                            <div className="bed-info-line">{getBedInfo(prediction)}</div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`prediction-item ${getPredictionClass(dischargePrediction)} ${hasDischargePrediction() ? 'active' : ''}`}
                      data-prediction="2차"
                      id="secondPrediction"
                      style={{ opacity: hasDischargePrediction() ? '1' : '0.5' }}
                    >
                      <span className="dis-label">
                        <div className="label-icon second">2</div>
                        2차 예측
                      </span>
                      <div className="prediction-result">
                        {hasDischargePrediction() ? (
                          <>
                            <div className={`prediction-badge ${getPredictionClass(dischargePrediction)}`}>
                              <div className="status-indicator" style={{ backgroundColor: getPredictionColor(dischargePrediction) }}></div>
                              {renderDischargePrediction()}
                              {getBedInfo(dischargePrediction) && (
                                <div className="bed-info-line">{getBedInfo(dischargePrediction)}</div>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="prediction-waiting">예측 대기중...</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 두 번째 행: 예측 근거 */}
                  <div className="reason-row">
                    <div className="prediction-item reason">
                      <span className="dis-label">
                        <div className="label-icon reason">!</div>
                        예측 근거
                      </span>
                      <span className="value">
                        {/* 2차 예측이 있으면 2차 예측 이유, 없으면 1차 예측 이유 표시 */}
                        {hasDischargePrediction() && dischargeReason ? dischargeReason : predictionReason}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* History 섹션 */}
            <div className="history-section">
              <div className="section-header">
                <h3>History</h3>
                <button
                  className="btn-primary"
                  onClick={() => setShowHistoryInput(!showHistoryInput)}
                >
                  추가
                </button>
              </div>

              {/* 히스토리 입력 영역 */}
              {showHistoryInput && (
                <div className="history-input-section">
                  <div className="input-group">
                    <textarea
                      className="history-input"
                      placeholder="새로운 히스토리를 입력하세요..."
                      value={newHistoryInput}
                      onChange={(e) => setNewHistoryInput(e.target.value)}
                      onKeyDown={handleKeyPress}
                      rows={3}
                    />
                    <div className="input-actions">
                      <button
                        className="history-submit-btn"
                        onClick={handleAddHistory}
                        disabled={!newHistoryInput.trim()}
                      >
                        등록
                      </button>
                      <button
                        className="history-cancel-btn"
                        onClick={() => {
                          setShowHistoryInput(false);
                          setNewHistoryInput('');
                        }}
                      >
                        취소
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 히스토리 목록 */}
              <div className="detail-history-list">
                {historyData.length > 0 ? (
                  historyData.map((item) => (
                    <div key={item.historyId} className="history-item-wrapper">
                      <div
                        className={`history-item ${expandedHistoryId === item.historyId ? 'expanded' : ''}`}
                        onClick={() => handleHistoryItemClick(item.historyId)}
                      >
                        <div className="history-main">
                          <div className="history-content">
                            <div className="history-date">{item.recordTime}</div>
                            <div className="history-text">
                              {item.content.length > 50 ?
                                `${item.content.substring(0, 50)}...` :
                                item.content
                              }
                            </div>
                          </div>
                          <ChevronRight
                            size={16}
                            className={`expand-icon ${expandedHistoryId === item.historyId ? 'rotated' : ''}`}
                          />
                        </div>
                      </div>

                      {/* 확장된 히스토리 상세 */}
                      {expandedHistoryId === item.historyId && (
                        <div className="history-detail">
                          {editingHistoryId === item.historyId ? (
                            // 수정 모드
                            <div className="detail-edit-mode">
                              <div className="edit-header">
                                <strong>내용 수정</strong>
                                <div className="edit-actions">
                                  <button
                                    className="save-btn"
                                    onClick={() => handleSaveHistory(item.historyId)}
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
                                value={editingHistoryValue}
                                onChange={(e) => setEditingHistoryValue(e.target.value)}
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
                                    onClick={() => handleEditHistory(item.historyId)}
                                  >
                                    수정
                                  </button>
                                  <button
                                    className="action-btn delete-btn"
                                    onClick={() => handleDeleteHistory(item.historyId)}
                                  >
                                    삭제
                                  </button>
                                </div>
                              </div>
                              <div className="detail-content-text">
                                {item.content}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <p>등록된 히스토리가 없습니다.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 모달들 */}
      {showPastRecordModal && (
        <PastRecordModal
          pid={pid}
          patientName={name}
          onClose={() => setShowPastRecordModal(false)}
        />
      )}

      {showLabModal && (
        <LabModal
          visitId={visitId}
          isOpen={showLabModal}
          onClose={handleCloseLab}
        />
      )}

      {showFinalizeModal && (
        <FinalizeModal
          prediction={dischargePrediction}
          predictionReason={dischargeReason}  // predictionReason prop 추가
          onClose={() => setShowFinalizeModal(false)}
          onConfirm={(selectedValue, reason) => {
            console.log('FinalizeModal에서 전달받은 값:', { selectedValue, reason });

            // 이제 reason이 제대로 전달됨
            if (selectedValue !== dischargePrediction) {
              updateFinal(selectedValue, reason);
            } else {
              sendFinal(reason);
            }
          }}
          getBedInfo={getBedInfo}
        />
      )}

      <PredictionLoadingModal
        isOpen={showPredictionLoading}
        predictionType={loadingPredictionType}
        onClose={handlePredictionLoadingClose}
        minDisplayTime={2700}
      />
    </div>
  );
}

export default DetailPage;