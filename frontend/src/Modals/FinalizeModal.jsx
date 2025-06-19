import React, { useState } from 'react';
import '../Style/FinalizeModal.css';

function FinalizeModal({ prediction, predictionReason, onClose, onConfirm, getBedInfo }) {
  const [selectedValue, setSelectedValue] = useState(String(prediction)); // 초기값은 예측값
  const [reasonInput, setReasonInput] = useState(predictionReason || ''); // 사유 입력 상태 추가

  const handleConfirm = () => {
    const finalReason = reasonInput.trim() || predictionReason || `${renderDisposition(selectedValue)} 배치`;

    console.log('FinalizeModal에서 전달할 값:', {
      selectedValue: Number(selectedValue),
      reason: finalReason
    });

    onConfirm(Number(selectedValue), finalReason); // Number로 변환하여 전달
  };

  return (
    <div className="finalize-modal-overlay">
      <div className="finalize-modal">
        <h3>최종 배치 확인</h3>
        <p>예측 결과: <strong>{renderDisposition(prediction)}</strong></p>

        <div className="radio-group">
          <label>
            <input
              type="radio"
              value="0"
              checked={selectedValue === '0'}
              onChange={(e) => setSelectedValue(e.target.value)}
            />
            귀가
          </label>
          <label>
            <input
              type="radio"
              value="1"
              checked={selectedValue === '1'}
              onChange={(e) => setSelectedValue(e.target.value)}
            />
            일반 병동
          </label>
          <label>
            <input
              type="radio"
              value="2"
              checked={selectedValue === '2'}
              onChange={(e) => setSelectedValue(e.target.value)}
            />
            중환자실
          </label>
        </div>

        {/* 사유 입력 필드 추가 */}
        <div className="reason-section">
          <label htmlFor="reason-input">배치 사유:</label>
          <textarea
            id="reason-input"
            value={reasonInput}
            onChange={(e) => setReasonInput(e.target.value)}
            placeholder="배치 사유를 입력하세요 (선택사항)"
            rows={3}
            className="reason-textarea"
          />
          {predictionReason && (
            <div className="prediction-reason">
              <small>AI 예측 근거: {predictionReason}</small>
            </div>
          )}
        </div>

        <div className="modal-buttons">
          <button onClick={handleConfirm} className="confirm-btn">확인</button>
          <button onClick={onClose} className="cancel-btn">취소</button>
        </div>
      </div>
    </div>
  );
}

const renderDisposition = (val) => {
  switch (String(val)) {
    case '0': return '귀가';
    case '1': return '일반 병동';
    case '2': return '중환자실';
    default: return '알 수 없음';
  }
};

export default FinalizeModal;