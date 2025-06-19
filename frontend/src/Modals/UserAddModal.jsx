import React, { useState } from "react";
import { X } from "lucide-react";
import axios from "axios";
import '../Style/UserAddModal.css';

export default function UserAddModal({ onClose }) {
  // 사용자 정보 상태
  const [userData, setUserData] = useState({
    id: '',
    password: '',
    name: '',
    position: ''
  });

  // 입력값 검증 함수
  const validateUserData = () => {
    if (!userData.id.trim()) {
      alert("아이디를 입력해주세요.");
      return false;
    }
    if (!userData.password.trim()) {
      alert("비밀번호를 입력해주세요.");
      return false;
    }
    if (!userData.name.trim()) {
      alert("이름을 입력해주세요.");
      return false;
    }
    if (!userData.position) {
      alert("직책을 선택해주세요.");
      return false;
    }
    return true;
  };

  // 저장 클릭 시 axios로 POST 요청
  const handleSave = async () => {
    // 입력값 검증
    if (!validateUserData()) {
      return;
    }

    const payload = {
      userId: userData.id,
      password: userData.password,
      userName: userData.name,
      userRole: userData.position,
    };

    try {
      await axios.post("http://localhost:8081/api/admin/users", payload); // 서버 주소 맞게 설정
      alert("사용자 등록 성공!");
      onClose(true); // 등록 성공 시 모달 닫고 목록 새로고침
    } catch (error) {
      console.error("등록 실패", error);
      alert("등록 실패");
    }
  };

  // 모달 닫기 함수
  const handleClose = () => {
    onClose(false);
  };

  return (
    <div className="user-update-backdrop" onClick={handleClose}>
      <div className="user-update-modal" onClick={(e) => e.stopPropagation()}>
        <div className="user-update-content">

          {/* 헤더 */}
          <div className="user-update-header">
            <h2 className="user-update-title">사용자 추가</h2>
            <button className="user-update-close-button" onClick={handleClose}>
              <X className="user-update-close-icon" />
            </button>
          </div>

          {/* 입력 폼 */}
          <div className="user-update-form">
            <div className="user-update-input-group">
              <label className="user-update-input-label">ID</label>
              <input
                type="text"
                className="user-update-input-field"
                placeholder="아이디를 입력해주세요"
                value={userData.id}
                onChange={(e) => setUserData({ ...userData, id: e.target.value })}
                required
              />
            </div>

            <div className="user-update-input-group">
              <label className="user-update-input-label">PW</label>
              <input
                type="password"
                className="user-update-input-field"
                placeholder="비밀번호를 입력해주세요"
                value={userData.password}
                onChange={(e) => setUserData({ ...userData, password: e.target.value })}
                required
              />
            </div>

            <div className="user-update-input-group">
              <label className="user-update-input-label">Name</label>
              <input
                type="text"
                className="user-update-input-field"
                placeholder="이름을 입력해주세요"
                value={userData.name}
                onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                required
              />
            </div>

            <div className="user-update-input-group">
              <label className="user-update-input-label">Position</label>
              <div className="user-update-radio-group">
                {["의사", "간호사", "관리자"].map((role) => (
                  <div className="user-update-radio-item" key={role}>
                    <input
                      type="radio"
                      id={role}
                      name="position"
                      value={role}
                      className="user-update-radio-input"
                      checked={userData.position === role}
                      onChange={(e) => setUserData({ ...userData, position: e.target.value })}
                    />
                    <label htmlFor={role} className="user-update-radio-label">{role}</label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 버튼 */}
          <div className="user-update-button-container">
            <button className="user-update-submit-button" onClick={handleSave}>저장</button>
          </div>

        </div>
      </div>
    </div>
  );
}