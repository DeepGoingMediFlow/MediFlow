import React from "react";
import { X } from "lucide-react";
import "../Style/Editmodal.css";

const EditModal = ({ value, onChange, onClose, onSubmit }) => {
  return (
    <div className="edit-modal">
      <div className="edit-modal-header">
        <span className="edit-title">메모 수정</span>
        <button className="edit-close-button" onClick={onClose}>
          <X size={16} />
        </button>
      </div>
      <div className="edit-modal-body">
        <input
          className="edit-input-field"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onSubmit();
            }
          }}
        />
        <button className="edit-save-button" onClick={onSubmit}>
          저장
        </button>
      </div>
    </div>
  );
};

export default EditModal;
