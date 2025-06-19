import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import '../Style/UserUpdateModal.css';
import axios from "axios";

export default function UserUpdateModal({ user, onClose }) {
  const [formData, setFormData] = useState({
    userId: '',
    password: '',
    userName: '',
    userRole: ''
  });

  // 비밀번호 변경 여부를 추적
  const [isPasswordChanged, setIsPasswordChanged] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        userId: user.userId || '',
        password: '', // 비밀번호는 빈 값으로 설정
        userName: user.userName || '',
        userRole: user.userRole || ''
      });
      setIsPasswordChanged(false);
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // 비밀번호 필드가 변경되었는지 체크
    if (name === 'password') {
      setIsPasswordChanged(value.trim() !== '');
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 사용자 정보 수정
  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // 제출할 데이터 준비
    const submitData = { ...formData };

    // 비밀번호가 변경되지 않았다면 비밀번호 필드를 제거
    if (!isPasswordChanged) {
      delete submitData.password;
    }

    console.log('사용자 정보 수정:', submitData);

    try {
      const response = await axios.put(
        `http://localhost:8081/api/admin/users/${formData.userId}`,
        submitData,
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
    <>
      <div className="user-info-backdrop" onClick={handleModalClick}></div>
      <div className="user-info-modal">
        <div className="user-info-content" onClick={(e) => e.stopPropagation()}>
          <div className="user-info-header">
            <h2 className="user-info-title">사용자 정보</h2>
            <button
              className="user-info-close-button"
              onClick={handleClose}
              type="button"
            >
              <X className="user-info-close-icon" />
            </button>
          </div>

          <form className="user-form" onSubmit={handleFormSubmit}>
            <div className="user-input-group">
              <label className="user-input-label">ID</label>
              <input
                type="text"
                name="userId"
                className="user-input-field user-input-readonly"
                value={formData.userId}
                readOnly
                placeholder="아이디"
              />
            </div>

            <div className="user-input-group">
              <label className="user-input-label">PW</label>
              <div className="user-password-container">
                <input
                  type="password"
                  name="password"
                  className="user-input-field"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder={isPasswordChanged ? "새 비밀번호를 입력해주세요" : "비밀번호 변경 시 입력하세요"}
                />
                {isPasswordChanged && (
                  <small className="user-password-notice">
                    비밀번호가 변경됩니다
                  </small>
                )}
              </div>
            </div>

            <div className="user-input-group">
              <label className="user-input-label">Name</label>
              <input
                type="text"
                name="userName"
                className="user-input-field"
                placeholder="이름을 입력해주세요"
                value={formData.userName}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="user-input-group">
              <label className="user-input-label">Position</label>
              <div className="user-radio-group">
                <div className="user-radio-item">
                  <input
                    type="radio"
                    id="doctor"
                    name="userRole"
                    value="의사"
                    className="user-radio-input"
                    checked={formData.userRole === "의사"}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="doctor" className="user-radio-label">의사</label>
                </div>

                <div className="user-radio-item">
                  <input
                    type="radio"
                    id="nurse"
                    name="userRole"
                    value="간호사"
                    className="user-radio-input"
                    checked={formData.userRole === "간호사"}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="nurse" className="user-radio-label">간호사</label>
                </div>

                <div className="user-radio-item">
                  <input
                    type="radio"
                    id="admin"
                    name="userRole"
                    value="관리자"
                    className="user-radio-input"
                    checked={formData.userRole === "관리자"}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="admin" className="user-radio-label">관리자</label>
                </div>
              </div>
            </div>
          </form>

          <div className="user-button-container">
            <button
              className="user-submit-button"
              onClick={handleSubmit}
              type="button"
            >
              저장
            </button>
            <button
              className="user-submit-button-del"
              onClick={handleDelete}
              type="button"
            >
              삭제
            </button>
          </div>
        </div>
      </div>
    </>
  );
}