import React, { useState, useEffect } from 'react';
import { Search, Users, Bed, AlertCircle, AlertTriangle } from 'lucide-react';
import logoutIcon from '../assets/images/logout-icon.png';
import UserIcon from '../assets/images/user-icon.png';
import { useNavigate } from 'react-router-dom';
import '../Style/MainPage.css';

import History from '../Components/History';
import axios from 'axios';
import EmergencyRoomLayout from '../Components/EmergencyRoomLayout';
import { useAuth } from '../Components/AuthContext';

const MainPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [labelFilter, setLabelFilter] = useState('전체');
  const [bedFilter, setBedFilter] = useState('all');
  const [showEmergencyRoomLayout, setShowEmergencyRoomLayout] = useState(false);
  const [bedStatus, setBedStatus] = useState(null);
  const [patientData, setPatientData] = useState([]);
  const { user, isAuthenticated, logout } = useAuth();

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
          sex: p.gender ? 'F' : 'M', // boolean을 성별 문자열로
          bed: p.bed ? p.bed : '-',
          ktas: p.acuity,
          complaint: p.chiefComplaint,
          label: p.label === 2 ? '위험' : (p.label === 1 ? '주의' : (p.label === 0 ? '경미' : '-')),
          history: '확인',
          visitId: p.visitId,
          admissionTime: p.admissionTime
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

  // 침대가 배정된 환자 수 계산
  const bedAssignedCount = patientData.filter(p => p.bed && p.bed !== '-').length;

  // 입실시간 포맷팅 함수
  const formatAdmissionTime = (admissionTime) => {
    if (!admissionTime) return '-';
    const date = new Date(admissionTime);
    const year = String(date.getFullYear()).slice(2).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}/${month}/${day} ${hours}:${minutes}`;
  };

  // 전체 환자 버튼 클릭 핸들러
  const handleAllPatientsClick = () => {
    setBedFilter('all');
    setLabelFilter('전체');
  };

  // 침대 배정 환자 버튼 클릭 핸들러  
  const handleBedAssignedClick = () => {
    setBedFilter('assigned');
    setLabelFilter('전체');
  };

  // 필터링(주의,위험,전체)환자보기
  const handleWarningClick = () => {
    setLabelFilter('주의');
  };

  const handleDangerClick = () => {
    setLabelFilter('위험');
  };

  const resetFilter = () => {
    setLabelFilter('전체');
    setBedFilter('all');
  };

  // 리스트 전환 토글
  const handleToggle = () => {
    setShowEmergencyRoomLayout(!showEmergencyRoomLayout);
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
      case '주의': return 'label label-warning';
      case '경미': return 'label label-success';
      default: return 'label';
    }
  };

  // 필터링 (검색어, 라벨, 침대 배정 상태 모두 적용)
  const filteredPatients = patientData.filter((patient) => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.complaint.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLabel = labelFilter === '전체' ? true : patient.label === labelFilter;

    // 침대 필터 조건 추가
    const matchesBedFilter = bedFilter === 'all' ? true :
      (bedFilter === 'assigned' ? (patient.bed && patient.bed !== '-') : true);

    return matchesSearch && matchesLabel && matchesBedFilter;
  });

  // 디버깅용 useEffect
  useEffect(() => {
    console.log("=== 진단용 출력 ===");
    console.log("검색어:", searchTerm);
    console.log("라벨 필터:", labelFilter);
    console.log("침대 필터:", bedFilter);
    console.log("전체 환자 수:", patientData.length);
    console.log("필터링 후:", filteredPatients.length);
  }, [searchTerm, labelFilter, bedFilter, patientData, filteredPatients]);

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
              <span className="user-name">{user?.userName}</span>
              <div className="logout-button" onClick={handleLogout}>
                <img src={logoutIcon} alt="logout" className="logout-icon" />
                <span className="logout-text">Logout</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className={`stat-card ${bedFilter === 'all' ? 'stat-card-active' : ''}`} onClick={handleAllPatientsClick}>
            <div className="stat-content">
              <Users className="stat-icon blue" />
              <div>
                <div className="stat-number blue">{totalCount}</div>
              </div>
            </div>
          </div>

          <div className={`stat-card ${bedFilter === 'assigned' ? 'stat-card-active' : ''}`} onClick={handleBedAssignedClick}>
            <div className="stat-content">
              <Bed className="stat-icon blue" />
              <div>
                <div className="stat-number blue">{bedAssignedCount}/28</div>
              </div >
            </div >
          </div >

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
        </div >

        {/* 토글 스위치 */}
        < div className="toggle-container" >
          <div className="toggle-wrapper">
            <span className="toggle-label">
              {showEmergencyRoomLayout ? '응급실 배치도' : '환자 리스트'}
            </span>
            <div className={`toggle-switch ${showEmergencyRoomLayout ? 'active' : ''}`} onClick={handleToggle}>
              <div className="toggle-slider"></div>
            </div>
          </div>
        </div >

        {/* 조건부 렌더링 */}
        {
          showEmergencyRoomLayout ? (
            <EmergencyRoomLayout
              patientData={patientData}
              onPatientClick={goToDetail}
              onBedAssign={(patient, bedId) => {
                // 환자 데이터 업데이트 로직
                setPatientData(prev =>
                  prev.map(p =>
                    p.pid === patient.pid
                      ? { ...p, bed: bedId }
                      : p
                  )
                );
              }}
              hideHeader={true}
            />
          ) : (
            <div className="table-container">
              <div className="table-wrapper">
                <table className="table">
                  <thead className="table-header">
                    <tr>
                      <th className="table-header-cell">Admission Time</th>
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
                      <tr key={patient.pid} className="table-row">
                        <td className="table-cell" onClick={() => goToDetail(patient)}>{formatAdmissionTime(patient.admissionTime)}</td>
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
          )
        }

        {/* 모달창 */}
        {
          showModal && (
            <div className="modal-overlay">
              <div className="modal-content">
                <History patient={selectedPatient} onClose={closeHistoryModal} />
              </div>
            </div>
          )
        }
      </div >
    </div >
  );
};

export default MainPage;