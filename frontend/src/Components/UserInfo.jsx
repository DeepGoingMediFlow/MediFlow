import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import '../Style/userinfo.css';
import axios from "axios";

export default function UserInfo({ user, onClose }) {
  const [formData, setFormData] = useState({
    userId: '',
    password: '',
    userName: '',
    userRole: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        userId: user.userId || '',
        password: user.password || '',
        userName: user.userName || '',
        userRole: user.userRole || ''
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 사용자 정보 수정
  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('사용자 정보 수정:', formData);

    try {
      const response = await axios.put(
        `http://localhost:8081/api/admin/users/${formData.userId}`,
        formData,
        { withCredentials: true }
      );

      console.log("수정된 거:", response.data);
      alert("수정되었습니다.");
      if (onClose) onClose(true); // 수정됨을 알림
    } catch (err) {
      console.error("수정 오류 : ", err);
      alert("수정에 실패했습니다.");
    }
  };

  // 모달 배경 클릭 시 닫기
  const handleModalClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleClose = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (onClose) onClose();
  };

  // 삭제 기능
  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm("정말 삭제하시겠습니까?")) return;

    try {
      await axios.delete(
        `http://localhost:8081/api/admin/users/${formData.userId}`,
        { withCredentials: true }
      );
      alert('삭제되었습니다.');
      if (onClose) onClose(true);
    } catch (err) {
      console.error("삭제 실패 : ", err);
      alert("삭제 실패");
    }
  };

  // 폼 제출 방지
  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSubmit(e);
  };

  return (
    <div className="user-info-modal" onClick={handleModalClick}>
      <div className="user-info-content" onClick={(e) => e.stopPropagation()}>
        <div className="user-info-header">
          <h2 className="user-info-title">사용자 정보</h2>
          <button
            className="close-button"
            onClick={handleClose}
            type="button"
          >
            <X className="close-icon" />
          </button>
        </div>

        <form className="user-form" onSubmit={handleFormSubmit}>
          <div className="input-group">
            <label className="input-label">ID</label>
            <input
              type="text"
              name="userId"
              className="input-field"
              value={formData.userId}
              onChange={handleInputChange}
              placeholder="아이디를 입력해주세요"
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">PW</label>
            <input
              type="password"
              name="password"
              className="input-field"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="비밀번호를 입력해주세요"
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Name</label>
            <input
              type="text"
              name="userName"
              className="input-field"
              placeholder="이름을 입력해주세요"
              value={formData.userName}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Position</label>
            <div className="radio-group">
              <div className="radio-item">
                <input
                  type="radio"
                  id="doctor"
                  name="userRole"
                  value="의사"
                  className="radio-input"
                  checked={formData.userRole === "의사"}
                  onChange={handleInputChange}
                />
                <label htmlFor="doctor" className="radio-label">의사</label>
              </div>

              <div className="radio-item">
                <input
                  type="radio"
                  id="nurse"
                  name="userRole"
                  value="간호사"
                  className="radio-input"
                  checked={formData.userRole === "간호사"}
                  onChange={handleInputChange}
                />
                <label htmlFor="nurse" className="radio-label">간호사</label>
              </div>

              <div className="radio-item">
                <input
                  type="radio"
                  id="admin"
                  name="userRole"
                  value="관리자"
                  className="radio-input"
                  checked={formData.userRole === "관리자"}
                  onChange={handleInputChange}
                />
                <label htmlFor="admin" className="radio-label">관리자</label>
              </div>
            </div>
          </div>
        </form>

        <div className="button-container">
          <button
            className="submit-button"
            onClick={handleSubmit}
            type="button"
          >
            저장
          </button>
          <button
            className="submit-button-del"
            onClick={handleDelete}
            type="button"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}