import React, { useState } from "react";
import { X } from "lucide-react";
import axios from "axios"; // axios import
import '../Style/userupdate.css';

export default function UserUpdate({ onClose }) {
  // 사용자 정보 상태
  const [userData, setUserData] = useState({
    id: '',
    password: '',
    name: '',
    position: ''
  });

  // 저장 클릭 시 axios로 POST 요청
  const handleSave = async () => {
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
    <div className="user-info-modal">
      <div className="user-info-content">

        {/* 헤더 */}
        <div className="user-info-header">
          <h2 className="user-info-title">사용자 추가</h2>
          <button className="close-button" onClick={handleClose}>
            <X className="close-icon" />
          </button>
        </div>

        {/* 입력 폼 */}
        <div className="user-form">
          <div className="input-group">
            <label className="input-label">ID</label>
            <input
              type="text"
              className="user-data"
              value={userData.id}
              onChange={(e) => setUserData({ ...userData, id: e.target.value })}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">PW</label>
            <input
              type="password"
              className="user-data"
              value={userData.password}
              onChange={(e) => setUserData({ ...userData, password: e.target.value })}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Name</label>
            <input
              type="text"
              className="user-data"
              value={userData.name}
              onChange={(e) => setUserData({ ...userData, name: e.target.value })}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Position</label>
            <div className="radio-group">
              {["의사", "간호사", "관리자"].map((role) => (
                <div className="radio-item" key={role}>
                  <input
                    type="radio"
                    id={role}
                    name="position"
                    value={role}
                    className="radio-input"
                    checked={userData.position === role}
                    onChange={(e) => setUserData({ ...userData, position: e.target.value })}
                  />
                  <label htmlFor={role} className="radio-label">{role}</label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 버튼 */}
        <div className="button-container">
          <button className="submit-button" onClick={handleSave}>저장</button>
        </div>

      </div>
    </div>
  );
}
