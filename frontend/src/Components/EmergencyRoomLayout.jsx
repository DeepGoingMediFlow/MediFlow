import React, { useState, useEffect } from 'react';
import { X, AlertCircle, AlertTriangle, Activity } from 'lucide-react';
import axios from 'axios';
import '../Style/EmergencyRoomLayout.css';

const EmergencyRoomLayout = ({
  patientData = [],
  onPatientClick,
  onBedAssign,
  hideHeader = false
}) => {
  const [selectedBed, setSelectedBed] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [unassignedPatients, setUnassignedPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showUnassignModal, setShowUnassignModal] = useState(false);
  const [unassignPatient, setUnassignPatient] = useState(null);
  const [needsDisposition, setNeedsDisposition] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [longPressTarget, setLongPressTarget] = useState(null);
  const [showLongPressConfirmModal, setShowLongPressConfirmModal] = useState(false);
  const [longPressConfirmPatient, setLongPressConfirmPatient] = useState(null);
  const [pressStartTime, setPressStartTime] = useState(null);

  // 병상 위치 정의
  const bedPositions = {
    // Row 1
    'A07': { gridColumn: '1', gridRow: '1' },
    'A06': { gridColumn: '2', gridRow: '1' },
    'A05': { gridColumn: '3', gridRow: '1' },
    'A04': { gridColumn: '4', gridRow: '1' },
    'B07': { gridColumn: '5', gridRow: '1' },
    'B06': { gridColumn: '6', gridRow: '1' },
    'B04': { gridColumn: '8', gridRow: '1' },

    // Row 2
    'A08': { gridColumn: '1', gridRow: '2' },
    'A03': { gridColumn: '4', gridRow: '2' },
    'B08': { gridColumn: '5', gridRow: '2' },
    'B03': { gridColumn: '8', gridRow: '2' },

    // Row 3
    'A09': { gridColumn: '1', gridRow: '3' },
    'A02': { gridColumn: '4', gridRow: '3' },
    'B09': { gridColumn: '5', gridRow: '3' },
    'B02': { gridColumn: '8', gridRow: '3' },

    // Row 4
    'A10': { gridColumn: '1', gridRow: '4' },
    'A01': { gridColumn: '4', gridRow: '4' },
    'B10': { gridColumn: '5', gridRow: '4' },
    'B01': { gridColumn: '8', gridRow: '4' },

    // Row 5
    'A11': { gridColumn: '1', gridRow: '5' },
    'B05': { gridColumn: '7', gridRow: '1' },

    // Bottom rows
    'A12': { gridColumn: '1', gridRow: '6' },
    'A13': { gridColumn: '1', gridRow: '7' },
    'A14': { gridColumn: '1', gridRow: '8' },
    'A15': { gridColumn: '2', gridRow: '8' },
    'A16': { gridColumn: '3', gridRow: '8' },
    'A17': { gridColumn: '4', gridRow: '8' },
    'A18': { gridColumn: '5', gridRow: '8' }
  };

  // 모든 병상 ID 목록
  const allBedIds = Object.keys(bedPositions);

  // 배정되지 않은 환자 목록 업데이트
  useEffect(() => {
    const unassigned = patientData.filter(patient => !patient.bed || patient.bed === 'N/A' || patient.bed === '');
    setUnassignedPatients(unassigned);
  }, [patientData]);

  // 병상별 환자 매핑
  const getBedPatient = (bedId) => {
    return patientData.find(patient => patient.bed === bedId);
  };

  // 라벨에 따른 CSS 클래스 반환
  const getBedClassName = (patient) => {
    if (!patient) return 'bed-base bed-empty';

    switch (patient.label) {
      case '위험': return 'bed-base bed-danger';
      case '주의': return 'bed-base bed-caution';
      case '경미': return 'bed-base bed-minor';
      default: return 'bed-base bed-default';
    }
  };

  // 환자 라벨 CSS 클래스 반환
  const getPatientLabelClassName = (label) => {
    switch (label) {
      case '위험': return 'patient-label patient-label-danger';
      case '주의': return 'patient-label patient-label-caution';
      case '경미': return 'patient-label patient-label-minor';
      default: return 'patient-label patient-label-minor';
    }
  };

  // 롱프레스 시작 핸들러
  const handlePointerDown = (bedId, event) => {
    const patient = getBedPatient(bedId);
    if (!patient) return;

    setPressStartTime(Date.now());
    setLongPressTarget(bedId);
    setIsLongPressing(true);

    const timer = setTimeout(() => {
      // 여기서 모달을 바로 열어야 함
      setLongPressConfirmPatient(patient);
      setShowLongPressConfirmModal(true);
      setLongPressTarget(null);
      setPressStartTime(null);
      setIsLongPressing(false);
    }, 1000);

    setLongPressTimer(timer);
  };

  // 롱프레스 취소 핸들러
  const handlePointerUp = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    setLongPressTarget(null);
    setPressStartTime(null);
    setIsLongPressing(false);
  };

  // 병상 클릭 핸들러 (수정됨)
  const handleBedClick = (bedId, event) => {
    if (pressStartTime && (Date.now() - pressStartTime) < 200) {
      return;
    }

    const patient = getBedPatient(bedId);
    if (patient && onPatientClick) {
      onPatientClick(patient);
    } else if (!patient && unassignedPatients.length > 0) {
      setSelectedBed(bedId);
      setShowAssignModal(true);
    }
  };

  // 롱프레스 확인 모달 핸들러
  const handleLongPressConfirm = () => {
    if (longPressConfirmPatient) {
      handleBedUnassign(longPressConfirmPatient);
    }
    closeLongPressConfirmModal();
  };

  const closeLongPressConfirmModal = () => {
    setShowLongPressConfirmModal(false);
    setLongPressConfirmPatient(null);
  };

  // 최종 배치 하러 가기 버튼 핸들러
  const handleGoToDisposition = () => {
    if (unassignPatient && onPatientClick) {
      // 모달을 먼저 닫고
      closeUnassignModal();
      // 환자 디테일 페이지로 이동
      onPatientClick(unassignPatient);
    }
  };

  // 환자 배정 처리 - 백엔드 API 호출
  const handlePatientAssign = async (patient) => {
    setLoading(true);

    try {
      const response = await axios.put('http://localhost:8081/api/beds/assign', {
        visitId: patient.visitId,
        bedNumber: selectedBed
      });

      if (response.data.success) {
        // 성공시 부모 컴포넌트에 업데이트 알림
        if (onBedAssign) {
          onBedAssign(patient, selectedBed);
        }

        // 모달 닫기
        setShowAssignModal(false);
        setSelectedBed(null);

        // 성공 메시지
        alert(`${patient.name} 환자가 ${selectedBed} 병상에 배정되었습니다.`);
      } else {
        alert(`병상 배정 실패: ${response.data.message}`);
      }
    } catch (error) {
      console.error('병상 배정 실패:', error);

      if (error.response) {
        // 서버 응답이 있는 경우
        const errorMessage = error.response.data.message || '서버 오류가 발생했습니다.';
        alert(`병상 배정 실패: ${errorMessage}`);
      } else if (error.request) {
        // 요청은 보냈지만 응답이 없는 경우
        alert('서버에 연결할 수 없습니다. 네트워크를 확인해주세요.');
      } else {
        // 요청 설정 중 오류가 발생한 경우
        alert('요청 처리 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 병상 배정 해제 처리
  const handleBedUnassign = async (patient) => {
    setLoading(true);

    try {
      const response = await axios.put('http://localhost:8081/api/beds/unassign', {
        visitId: patient.visitId
      });

      if (response.data.success) {
        // 성공시 부모 컴포넌트에 업데이트 알림
        if (onBedAssign) {
          onBedAssign(patient, null);
        }
        alert(`${patient.name} 환자의 병상 배정이 해제되었습니다.`);
      } else if (response.data.needsDisposition) {
        // 최종 배치가 필요한 경우
        setUnassignPatient(patient);
        setNeedsDisposition(true);
        setShowUnassignModal(true);
      } else {
        alert(`병상 배정 해제 실패: ${response.data.message}`);
      }
    } catch (error) {
      console.error('병상 배정 해제 실패:', error);
      alert('병상 배정 해제 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 강제 배정 해제 처리
  const handleForceUnassign = async () => {
    setLoading(true);

    try {
      const response = await axios.put('http://localhost:8081/api/beds/force-unassign', {
        visitId: unassignPatient.visitId
      });

      if (response.data.success) {
        if (onBedAssign) {
          onBedAssign(unassignPatient, null);
        }
        alert(`${unassignPatient.name} 환자의 병상 배정이 해제되었습니다.`);
        closeUnassignModal();
      } else {
        alert(`병상 배정 해제 실패: ${response.data.message}`);
      }
    } catch (error) {
      console.error('강제 병상 해제 실패:', error);
      alert('병상 해제 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 모달 닫기
  const closeAssignModal = () => {
    setShowAssignModal(false);
    setSelectedBed(null);
  };

  const closeUnassignModal = () => {
    setShowUnassignModal(false);
    setUnassignPatient(null);
    setNeedsDisposition(false);
  };

  return (
    <div className="emergency-room-container">
      {!hideHeader && (
        <div className="emergency-room-header">
          <h2 className="emergency-room-title">
            응급실 병상 배치도
          </h2>
          <div className="legend-container">
            <div className="legend-item">
              <div className="legend-color legend-empty"></div>
              <span>빈 병상</span>
            </div>
            <div className="legend-item">
              <div className="legend-color legend-minor"></div>
              <span>경미</span>
            </div>
            <div className="legend-item">
              <div className="legend-color legend-caution"></div>
              <span>주의</span>
            </div>
            <div className="legend-item">
              <div className="legend-color legend-danger"></div>
              <span>위험</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid-container">
        {/* 모든 병상 렌더링 */}
        {allBedIds.map((bedId) => {
          const position = bedPositions[bedId];
          const patient = getBedPatient(bedId);
          const bedClassName = getBedClassName(patient);

          const bedStyle = {
            gridColumn: position.gridColumn,
            gridRow: position.gridRow
          };

          return (
            <div
              key={bedId}
              className={`${bedClassName} ${isLongPressing && longPressTarget === bedId ? 'bed-longpress' : ''}`}
              style={bedStyle}
              onClick={(e) => handleBedClick(bedId, e)}
              onPointerDown={(e) => handlePointerDown(bedId, e)}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              onPointerCancel={handlePointerUp}
              title={
                patient
                  ? `${patient.name} (길게 누르면 배정해제)`
                  : '빈 병상 (클릭으로 환자 배정)'
              }
            >
              <div>{bedId}</div>
              {patient && (
                <>
                  <div className="bed-patient-name">{patient.name}</div>
                  <div className="bed-patient-info">
                    {patient.age}세/{patient.sex}
                  </div>
                </>
              )}
              {/* 롱프레스 진행 표시 */}
              {isLongPressing && longPressTarget === bedId && (
                <div className="longpress-indicator">
                  <div className="longpress-progress"></div>
                </div>
              )}
            </div>
          );
        })}

        {/* 간호사 스테이션 */}
        <div className="nurse-station">
          <Activity size={20} style={{ marginRight: '8px', transform: 'rotate(90deg)' }} />
          Nurse Station
        </div>

        {/* 구역 라벨 */}
        <div className="zone-label zone-a">A구역</div>
        <div className="zone-label zone-b">B구역</div>
      </div>

      {/* 환자 배정 모달 */}
      {showAssignModal && (
        <div className="modal-overlay">
          <div className="add-modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                병상 {selectedBed} 환자 배정
              </h3>
              <button
                onClick={closeAssignModal}
                className="modal-close-button"
                disabled={loading}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {loading && (
                <div className="loading-overlay">
                  <div>처리 중...</div>
                </div>
              )}

              <div className="patients-list">
                {unassignedPatients.length > 0 ? (
                  unassignedPatients.map((patient) => (
                    <div
                      key={patient.pid || patient.name}
                      className={`patient-card ${loading ? 'disabled' : ''}`}
                      onClick={() => !loading && handlePatientAssign(patient)}
                    >
                      <div className="patient-info">
                        <div className="patient-header">
                          <span className="patient-name">
                            {patient.name}
                          </span>
                          <span className={getPatientLabelClassName(patient.label)}>
                            {patient.label}
                          </span>
                        </div>
                        <div className="patient-meta">
                          {patient.age}세 | {patient.sex} | KTAS {patient.ktas}
                        </div>
                        <div className="patient-complaint">
                          {patient.complaint}
                        </div>
                      </div>
                      {patient.label === '위험' && (
                        <AlertCircle className="alert-icon-danger" />
                      )}
                      {patient.label === '주의' && (
                        <AlertTriangle className="alert-icon-caution" />
                      )}
                    </div>
                  ))
                ) : (
                  <div className="no-patients">
                    배정 대기 중인 환자가 없습니다.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 롱프레스 확인 모달 */}
      {showLongPressConfirmModal && longPressConfirmPatient && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                병상 배정 해제 확인
              </h3>
              <button
                onClick={closeLongPressConfirmModal}
                className="modal-close-button"
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="longpress-confirmation">
                <p>
                  <strong>{longPressConfirmPatient.name}</strong> 환자의
                  <strong> {longPressConfirmPatient.bed}</strong> 병상 배정을 해제하시겠습니까?
                </p>
                <div className="confirmation-buttons">
                  <button
                    className="btn-danger"
                    onClick={handleLongPressConfirm}
                  >
                    해제
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={closeLongPressConfirmModal}
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 배정 해제 확인 모달 */}
      {showUnassignModal && unassignPatient && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                병상 배정 해제 확인
              </h3>
              <button
                onClick={closeUnassignModal}
                className="modal-close-button"
                disabled={loading}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {needsDisposition ? (
                <div className="disposition-warning">
                  <AlertTriangle className="warning-icon" />
                  <p><strong>{unassignPatient.name}</strong> 환자의 최종 배치가 결정되지 않았습니다.</p>
                  <p>어떻게 하시겠습니까?</p>

                  <div className="disposition-buttons">
                    <button
                      className="btn-primary_final"
                      onClick={handleGoToDisposition}
                      disabled={loading}
                    >
                      최종 배치 하러 가기
                    </button>
                    <button
                      className="btn-warning"
                      onClick={handleForceUnassign}
                      disabled={loading}
                    >
                      배치 없이 해제
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={closeUnassignModal}
                      disabled={loading}
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <div className="unassign-confirmation">
                  <p><strong>{unassignPatient.name}</strong> 환자의 병상 배정을 해제하시겠습니까?</p>
                  <div className="confirmation-buttons">
                    <button
                      className="btn-danger"
                      onClick={handleForceUnassign}
                      disabled={loading}
                    >
                      해제
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={closeUnassignModal}
                      disabled={loading}
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmergencyRoomLayout;