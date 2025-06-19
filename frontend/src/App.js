import logo from './logo.svg';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './Components/AuthContext';
import ProtectedRoute from './Components/ProtectedRoute';
import LoginPage from './Pages/LoginPage';
import MainPage from './Pages/MainPage';
import DetailPage from './Pages/DetailPage';
import AdminPage from './Pages/AdminPage';
import History from './Components/History';
import UserUpdateModal from './Modals/UserUpdateModal';
import UserAddModal from './Modals/UserAddModal';

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <Router>
          <Routes>
            {/* 로그인 페이지 (인증 불필요) */}
            <Route path="/login" element={<LoginPage />} />

            {/* 보호된 라우트들 */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/detail/:pid"
              element={
                <ProtectedRoute>
                  <DetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history/:pid"
              element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/userupdate"
              element={
                <ProtectedRoute>
                  <UserUpdateModal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/useradd/:pid"
              element={
                <ProtectedRoute>
                  <UserAddModal />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </div>
  );
}


export default App;