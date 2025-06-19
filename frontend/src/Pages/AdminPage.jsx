import "../Style/MainPage.css";
import "../Style/AdminPage.css";
import React, { useState, useEffect, useCallback } from "react";
import { Search, User, Users, Bed, AlertCircle, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logoutIcon from '../assets/images/logout-icon.png';
import AdminUserIcon from '../assets/images/admin-user-icon.svg';
import UserAddModal from "../Modals/UserAddModal";
import UserUpdateModal from "../Modals/UserUpdateModal";
import axios from "axios";
import { useAuth } from '../Components/AuthContext';
import WeeklyChart from '../Components/WeeklyChart';
import DailyDispositionChart from '../Components/DailyDispositionChart';

const AdminPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [userList, setUserList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [daily, setDaily] = useState([""]);
  const navigate = useNavigate();

  // 그래프 탭 상태 추가
  const [activeTab, setActiveTab] = useState("daily"); // "weekly" 또는 "daily"

  // 주간 차트 상태
  const [weeklyData, setWeeklyData] = useState([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [chartError, setChartError] = useState(null);

  // 일별 처치 현황 차트 상태
  const [dailyDispositionData, setDailyDispositionData] = useState([]);
  const [dailyDispositionLoading, setDailyDispositionLoading] = useState(true);
  const [dailyDispositionError, setDailyDispositionError] = useState(null);

  const { user, logout } = useAuth();

  // 기존 useEffect들은 그대로 유지...
  useEffect(() => {
    if (user?.userRole === '관리자') {
      const handlePopState = (event) => {
        window.history.pushState(null, '', '/admin');
      };
      window.history.pushState(null, '', '/admin');
      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [user]);

  useEffect(() => {
    if (user && user.userRole !== '관리자') {
      console.log('관리자가 아닌 사용자의 관리자 페이지 접근 시도:', user.userRole);
      navigate(user.defaultPage || '/');
      return;
    }
  }, [user, navigate]);

  axios.defaults.withCredentials = true;

  const fetchUsers = useCallback(() => {
    axios.get("http://localhost:8081/api/admin/users", {
      withCredentials: true
    })
      .then((res) => {
        console.log("백엔드 응답보기", res.data);
        setUserList(res.data);
      })
      .catch((error) => {
        console.error("사용자 목록 조회 실패:", error);
        if (error.response?.status === 403) {
          console.error("권한이 없습니다. 관리자 권한이 필요합니다.");
          alert("접근 권한이 없습니다. 관리자 권한이 필요합니다.");
          navigate('/');
        }
      });
  }, [navigate]);

  const fetchWeeklyData = useCallback(() => {
    setChartLoading(true);
    axios.get("http://localhost:8081/api/admin/weekly", {
      withCredentials: true
    })
      .then((res) => {
        console.log("주간 데이터 응답보기", res.data);
        const transformedData = res.data.map(item => ({
          preScore: `${item.preScore}-${item.preScore + 9}`,
          lastWeek: item.lastWeekCount,
          thisWeek: item.thisWeekCount
        }));
        setWeeklyData(transformedData);
        setChartError(null);
      })
      .catch((error) => {
        console.error("주간 데이터 조회 실패:", error);
        setChartError("주간 데이터를 불러오는데 실패했습니다.");
        if (error.response?.status === 403) {
          console.error("권한이 없습니다. 관리자 권한이 필요합니다.");
          navigate('/');
        }
      })
      .finally(() => {
        setChartLoading(false);
      });
  }, [navigate]);

  const fetchDailyDispositionData = useCallback(() => {
    setDailyDispositionLoading(true);
    axios.get("http://localhost:8081/api/admin/stats/daily-disposition", {
      withCredentials: true
    })
      .then((res) => {
        console.log("일별 처치 현황 데이터 응답보기", res.data);
        const transformedData = res.data.data.map(item => ({
          date: item.date,
          discharge: item.discharge,
          ward: item.ward,
          icu: item.icu
        }));
        setDailyDispositionData(transformedData);
        setDailyDispositionError(null);
      })
      .catch((error) => {
        console.error("일별 처치 현황 데이터 조회 실패:", error);
        setDailyDispositionError("일별 처치 현황 데이터를 불러오는데 실패했습니다.");
        if (error.response?.status === 403) {
          console.error("권한이 없습니다. 관리자 권한이 필요합니다.");
          navigate('/');
        }
      })
      .finally(() => {
        setDailyDispositionLoading(false);
      });
  }, [navigate]);

  useEffect(() => {
    if (user?.userRole === '관리자') {
      fetchUsers();
      fetchDailyDispositionData();
      fetchWeeklyData();
    }
  }, [user, fetchUsers, fetchDailyDispositionData, fetchWeeklyData]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('로그아웃 오류:', error);
      navigate('/login');
    }
  };

  const openAddModal = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("추가 버튼 클릭됨");
    setSelectedUser(null);
    setModalType("add");
    setShowModal(true);
  };

  const handleUserClick = (clickedUser, e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("사용자 클릭됨:", clickedUser);
    setSelectedUser(clickedUser);
    setModalType("update");
    setShowModal(true);
  };

  const closeModal = (refresh = false) => {
    console.log("모달 닫기, 새로고침:", refresh);
    setShowModal(false);
    setModalType(null);
    setSelectedUser(null);
    if (refresh) {
      fetchUsers();
    }
  };

  const filteredUsers = userList.filter(
    (user) =>
      user.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.userRole?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (user && user.userRole !== '관리자') {
    return (
      <div className="access-denied">
        <h2>접근 권한이 없습니다.</h2>
        <p>관리자 권한이 필요합니다.</p>
      </div>
    );
  }

  return (
    <div className="medical-dashboard admin-page">
      <div className="dashboard-content">
        <div className="header">
          <div className="header-content">
            <div className="header-left">
              <div className="logo">
                <span className="logo-text">MediFlow</span>
              </div>
              <div className="search-container">
                <Search className="search-icon" />
                <input
                  type="text"
                  placeholder="Search"
                  className="search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="admin-user-info">
              <img src={AdminUserIcon} alt="user" className="admin-user-icon" />
              <span className="admin-user-name">{user?.userName}</span>
              <div className="logout-button" onClick={handleLogout}>
                <img src={logoutIcon} alt="logout" className="logout-icon" />
                <span className="logout-text">Logout</span>
              </div>
            </div>
          </div>
        </div>

        <div className="admin-content">
          {/* 그래프 탭 섹션 */}
          <div className="admin-graph-section">
            <div className="admin-graph-tabs">
              <button
                className={`admin-tab ${activeTab === "daily" ? "active" : ""}`}
                onClick={() => setActiveTab("daily")}
              >
                일별 배치 현황
              </button>
              <button
                className={`admin-tab ${activeTab === "weekly" ? "active" : ""}`}
                onClick={() => setActiveTab("weekly")}
              >
                주간 점수 통계
              </button>
            </div>

            <div className="admin-graph-content">
              {activeTab === "daily" && (
                <DailyDispositionChart
                  data={dailyDispositionData}
                  loading={dailyDispositionLoading}
                  error={dailyDispositionError}
                />
              )}
              {activeTab === "weekly" && (
                <WeeklyChart
                  data={weeklyData}
                  loading={chartLoading}
                  error={chartError}
                />
              )}
            </div>
          </div>

          {/* 사용자 관리 테이블 */}
          <div className="admin-table-section">
            <div className="admin-table-header">
              <span>사용자 관리</span>
              <button
                className="admin-add-button"
                onClick={openAddModal}
                type="button"
              >
                추가
              </button>
            </div>

            <div className="admin-table-scroll-wrapper">
              <table className="admin-user-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Position</th>
                    <th>Last login</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((userData, index) => (
                    <tr
                      key={`user-${userData.userId || index}`}
                      onClick={(e) => handleUserClick(userData, e)}
                      className="clickable-name"
                      style={{ cursor: 'pointer' }}
                    >
                      <td>{userData.userId}</td>
                      <td>{userData.userName}</td>
                      <td>{userData.userRole}</td>
                      <td>{userData.lastLogin || userData.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="admin-pagination">
              <button type="button">&lt; 이전</button>
              <span>1</span>
              <button type="button">다음 &gt;</button>
            </div>
          </div>
        </div>
      </div>

      {showModal && modalType === "add" && (
        <UserAddModal onClose={closeModal} />
      )}
      {showModal && modalType === "update" && selectedUser && (
        <UserUpdateModal user={selectedUser} onClose={closeModal} />
      )}
    </div>
  );
};


export default AdminPage;