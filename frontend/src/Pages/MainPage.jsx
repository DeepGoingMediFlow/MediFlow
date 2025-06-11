import React, { useState, useEffect } from 'react';
import { Search, User, Users, Bed, AlertCircle, AlertTriangle } from 'lucide-react';
import logoutIcon from '../assets/images/logout-icon.png';
import UserIcon from '../assets/images/user-icon.png';
import { useNavigate } from 'react-router-dom';
import '../Style/mainpage.css';
import History from '../Components/History';
import axios from 'axios';
import EmergencyRoom from './EmergencyRoom';
import { useAuth } from '../Components/AuthContext'; // AuthContext 추가

const MainPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [labelFilter, setLabelFilter] = useState('전체');
  const [showEmergencyRoom, setShowEmergencyRoom] = useState(false);

  const [bedStatus, setBedStatus] = useState(null);
  const [patientData, setPatientData] = useState([]);

  // AuthContext 사용
  const { user, isAuthenticated, logout } = useAuth();

  // 병상 정보 조회 (필요시 주석 해제)
  // useEffect(() => {
  //   axios.get(`http://localhost:8081/api/visits/${visitId}/available-beds`)
  //     .then(res => setBedStatus(res.data))
  //     .catch(err => {
  //       console.error('병상 정보 조회 실패:', err);
  //       setBedStatus(null);
  //     });
  // }, []);

  // 환자 데이터 가져오기
  useEffect(() => {
    axios.get('http://localhost:8081/api/patients')
      .then(response => {
        const rawData = response.data;
        console.log(response);
        const transformed = rawData.map(p => ({
          pid: p.pid,
          name: p.name,
          age: p.age,
          sex: p.gender ? 'M' : 'F', // boolean을 성별 문자열로
          bed: p.bed,
          ktas: p.acuity,
          complaint: p.chiefComplaint,
          label: p.label === 1 ? '위험' : (p.label === 0 ? '주의' : '경미'),
          history: '확인',
          visitId: p.visitId
        }));
        console.log(transformed);
        setPatientData(transformed);
      })
      .catch(error => {
        console.error('환자 데이터 불러오기 실패:', error);
      });
  }, []);

  // 카운트 계산
  const totalCount = patientData.length;
  const dangerCount = patientData.filter(p => p.label === '위험').length;
  const warningCount = patientData.filter(p => p.label === '주의').length;

  // 필터링(주의,위험,전체)환자보기
  const handleWarningClick = () => {
    setLabelFilter('주의');
  };

  const handleDangerClick = () => {
    setLabelFilter('위험');
  };

  const resetFilter = () => {
    setLabelFilter('전체');
  };

  // 리스트 전환 토글
  const handleToggle = () => {
    setShowEmergencyRoom(!showEmergencyRoom);
  };

  // 모달 열기
  const openHistoryModal = (patient) => {
    setSelectedPatient(patient);
    setShowModal(true);
  };

  // 모달 닫기
  const closeHistoryModal = () => {
    setSelectedPatient(null);
    setShowModal(false);
  };

  // 디테일로 이동
  const goToDetail = (patient) => {
    navigate(`/detail/${patient.pid}`, {
      state: {
        name: patient.name,
        age: patient.age,
        sex: patient.sex,
        visitId: patient.visitId
      },
    });
  };

  // 로그아웃 핸들러
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getLabelClass = (label) => {
    switch (label) {
      case '위험': return 'label label-danger';
      case '경미': return 'label label-success';
      case '주의': return 'label label-warning';
      default: return 'label';
    }
  };

  // 필터링
  const filteredPatients = patientData.filter((patient) => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.complaint.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLabel = labelFilter === '전체' ? true : patient.label === labelFilter;

    return matchesSearch && matchesLabel;
  });


  return (
    <div className="medical-dashboard">
      <div className="dashboard-content">
        {/* Header - 원래 디자인 유지 */}
        <div className="header">
          <div className="header-content">
            <div className="header-left">
              <div className="logo">
                <span className="logo-text" onClick={resetFilter}>MediFlow</span>
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
            <div className="user-info">
              <img src={UserIcon} alt="user" className="user-icon" />
              <span className="user-name">{user.userRole} {user.userName}</span>
              <div className="logout-button" onClick={handleLogout}>
                <img src={logoutIcon} alt="logout" className="logout-icon" />
                <span className="logout-text">Logout</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-content">
              <Users className="stat-icon blue" />
              <div>
                <div className="stat-number blue">{patientData.length}</div>

              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <Bed className="stat-icon blue" />
              <div>

                <div className="stat-number blue">{totalCount}/30</div>
              </div>
            </div>
          </div>

          <div className="stat-card stat-card-danger" onClick={handleDangerClick}>
            <div className="stat-content">
              <AlertCircle className="stat-icon red" />
              <div className="stat-text">
                <div className="stat-label">위험 환자</div>

                <div className="stat-number red">{dangerCount}</div>
              </div>
            </div>
          </div>

          <div className="stat-card stat-card-warning" onClick={handleWarningClick}>
            <div className="stat-content">
              <AlertTriangle className="stat-icon yellow" />
              <div className="stat-text">
                <div className="stat-label">주의 환자</div>
                <div className="stat-number yellow">{warningCount}</div>
              </div>
            </div>
          </div>
        </div>


        {/* 토글 스위치 */}
        <div className="toggle-container">
          <div className="toggle-wrapper">
            <span className="toggle-label">
              {showEmergencyRoom ? '환자 리스트 보기' : '응급실 배치도 보기'}
            </span>
            <div className={`toggle-switch ${showEmergencyRoom ? 'active' : ''}`} onClick={handleToggle}>
              <div className="toggle-slider"></div>
            </div>
          </div>
        </div>

        {/* 조건부 렌더링 */}
        {showEmergencyRoom ? (
          <EmergencyRoom hideHeader={true} />
        ) : (
          <div className="table-container">
            <div className="table-wrapper">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">PID</th>
                    <th className="table-header-cell">Name</th>
                    <th className="table-header-cell">Age</th>
                    <th className="table-header-cell">Gender</th>
                    <th className="table-header-cell">Bed</th>
                    <th className="table-header-cell">KTAS</th>
                    <th className="table-header-cell">Chief Complaint</th>
                    <th className="table-header-cell">Label</th>
                    <th className="table-header-cell">History</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.slice(0, 20).map((patient) => (
                    <tr key={patient.pid} className="table-row" >

                      <td className="table-cell" onClick={() => goToDetail(patient)}>{patient.pid}</td>
                      <td className="table-cell" onClick={() => goToDetail(patient)}>{patient.name}</td>
                      <td className="table-cell" onClick={() => goToDetail(patient)}>{patient.age}</td>
                      <td className="table-cell" onClick={() => goToDetail(patient)}>{patient.sex}</td>
                      <td className="table-cell" onClick={() => goToDetail(patient)}>{patient.bed}</td>
                      <td className="table-cell" onClick={() => goToDetail(patient)}>{patient.ktas}</td>
                      <td className="table-cell" onClick={() => goToDetail(patient)}>{patient.complaint}</td>
                      <td className="table-cell">
                        <span className={getLabelClass(patient.label)}>{patient.label}</span>
                      </td>
                      <td className="table-cell">
                        <span className="history-link" onClick={() => openHistoryModal(patient)}>{patient.history}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>


            {/* 페이지네이션 */}
            <div className="pagination">
              <div className="pagination-info">
                <span className="pagination-text">&lt; 이전</span>
                <span className="pagination-current">1</span>
                <span className="pagination-text">다음 &gt;</span>
              </div>
            </div>
          </div>
        )}

        {/* 모달창 */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <History patient={selectedPatient} onClose={closeHistoryModal} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MainPage;