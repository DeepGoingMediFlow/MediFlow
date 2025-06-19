import React, { useEffect } from "react";
import { X, User, AlertTriangle, Calendar, Clock } from "lucide-react";
import '../Style/DischargeModal.css';

const DischargeModal = ({ bed, onDischarge, onClose }) => {

  // ESC 키로 모달 닫기 기능
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [onClose]);

  // 모달 오버레이 클릭 시 닫기
  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  // 퇴실 확인
  const handleDischargeConfirm = () => {
    onDischarge();
  };

  // KTAS 레벨에 따른 스타일 클래스
  const getKtasClass = (ktas) => {
    if (ktas <= 2) return 'ktas-critical';
    if (ktas === 3) return 'ktas-urgent';
    if (ktas === 4) return 'ktas-semi-urgent';
    return 'ktas-non-urgent';
  };

  // KTAS 레벨 텍스트
  const getKtasText = (ktas) => {
    switch(ktas) {
      case 1: return '소생';
      case 2: return '응급';
      case 3: return '긴급';
      case 4: return '준긴급';
      case 5: return '비응급';
      default: return '미분류';
    }
  };

  // 현재 시간 계산 (입실 시간 시뮬레이션)
  const getAdmissionTime = () => {
    const now = new Date();
    const admissionTime = new Date(now.getTime() - Math.random() * 4 * 60 * 60 * 1000); // 0-4시간 전
    return admissionTime.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 입원 시간 계산
  const getStayDuration = () => {
    const hours = Math.floor(Math.random() * 6) + 1; // 1-6시간
    const minutes = Math.floor(Math.random() * 60);
    return `${hours}시간 ${minutes}분`;
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="discharge-modal">
        {/* 모달 헤더 */}
        <div className="modal-header">
          <div className="modal-title">
            <h3>환자 정보 - 병상 {bed?.name}</h3>
            <p className="bed-info">환자 퇴실 처리 (ESC로 닫기)</p>
          </div>
          <button className="close-button" onClick={onClose}>
            <X className="close-icon" />
          </button>
        </div>

        {/* 환자 정보 섹션 */}
        <div className="patient-info-section">
          <div className="patient-header">
            <div className="patient-avatar">
              <User className="avatar-icon" />
            </div>
            <div className="patient-details">
              <div className="patient-name">{bed?.patient?.name || '환자명'}</div>
              <div className="patient-basic-info">
                <span className="patient-age">연령: 미상</span>
                <span className="patient-gender">성별: 미상</span>
              </div>
            </div>
            <div className={`ktas-badge ${getKtasClass(bed?.patient?.ktas || 3)}`}>
              KTAS {bed?.patient?.ktas || 3}
              <span className="ktas-text">{getKtasText(bed?.patient?.ktas || 3)}</span>
            </div>
          </div>

          {/* 입실 정보 */}
          <div className="admission-info">
            <div className="info-row">
              <div className="info-item">
                <Calendar className="info-icon" />
                <div className="info-content">
                  <span className="info-label">입실 시간</span>
                  <span className="info-value">{getAdmissionTime()}</span>
                </div>
              </div>
              <div className="info-item">
                <Clock className="info-icon" />
                <div className="info-content">
                  <span className="info-label">입원 기간</span>
                  <span className="info-value">{getStayDuration()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 주요 증상 */}
          <div className="symptoms-section">
            <h4 className="section-title">주요 증상</h4>
            <div className="symptoms-content">
              <p>환자의 주요 증상 정보가 여기에 표시됩니다.</p>
            </div>
          </div>
        </div>

        {/* 경고 메시지 */}
        <div className="warning-section">
          <div className="warning-content">
            <AlertTriangle className="warning-icon" />
            <div className="warning-text">
              <span className="warning-title">퇴실 처리 확인</span>
              <span className="warning-message">
                환자를 퇴실 처리하시겠습니까? 이 작업은 되돌릴 수 없습니다.
              </span>
            </div>
          </div>
        </div>

        {/* 모달 푸터 - 버튼들 */}
        <div className="modal-footer">
          <button className="cancel-button" onClick={onClose}>
            취소
          </button>
          <button 
            className="discharge-button"
            onClick={handleDischargeConfirm}
          >
            퇴실
          </button>
        </div>
      </div>
    </div>
  );
};

export default DischargeModal;