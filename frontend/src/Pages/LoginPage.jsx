import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../Components/AuthContext';
import '../Style/LoginPage.css';

const LoginPage = () => {
    const [formData, setFormData] = useState({
        userId: '',
        password: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [alert, setAlert] = useState({ message: '', type: '' });

    const { login, isAuthenticated, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // 컴포넌트 마운트 시 이미 로그인된 상태라면 리다이렉트
    useEffect(() => {
        if (isAuthenticated && user && !isLoading) {
            console.log('이미 로그인된 사용자:', user.userRole, '기본 페이지:', user.defaultPage);

            // 사용자의 역할에 따른 기본 페이지로 리다이렉트
            const redirectPath = user.defaultPage || '/';
            navigate(redirectPath, { replace: true });
        }
    }, [isAuthenticated, user, navigate, isLoading]); // user를 의존성에 추가

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleKeyPress = (e, nextField) => {
        if (e.key === 'Enter') {
            if (nextField === 'password') {
                document.getElementById('password').focus();
            } else if (nextField === 'submit') {
                handleSubmit(e);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const { userId, password } = formData;

        if (!userId.trim() || !password.trim()) {
            showAlert('아이디와 비밀번호를 입력해주세요.', 'error');
            return;
        }

        setIsLoading(true);
        clearAlert();

        try {
            const result = await login(userId.trim(), password.trim());

            if (result.success) {
                showAlert(`환영합니다, ${result.user.username || result.user.userId}님!`, 'success');

                console.log('로그인 성공:', result.user.userRole, '기본 페이지:', result.user.defaultPage);

                // 역할에 따른 페이지 라우팅
                let redirectPath = result.user.defaultPage || '/';

                // 관리자가 아닌 경우만 이전 페이지로 리다이렉트 허용
                if (location.state?.from?.pathname && result.user.userRole !== '관리자') {
                    redirectPath = location.state.from.pathname;
                }

                console.log('리다이렉트 경로:', redirectPath);

                setTimeout(() => {
                    navigate(redirectPath, { replace: true });
                }, 1500);
            } else {
                showAlert(result.message || '로그인에 실패했습니다.', 'error');
                setFormData(prev => ({ ...prev, password: '' }));
                document.getElementById('password')?.focus();
            }

        } catch (error) {
            console.error('로그인 오류:', error);
            showAlert('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const showAlert = (message, type = 'error') => {
        setAlert({ message, type });
        setTimeout(() => {
            clearAlert();
        }, 5000);
    };

    const clearAlert = () => {
        setAlert({ message: '', type: '' });
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="logo">
                    <h1>MediFlow</h1>
                </div>
                <div className="logo"><p>의료진 전용 대시보드</p></div>

                <div className="alert-container">
                    {alert.message && (
                        <div className={`alert alert-${alert.type}`}>
                            {alert.message}
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label htmlFor="userId">아이디</label>
                        <div className="input-wrapper">
                            <input
                                type="text"
                                id="userId"
                                name="userId"
                                placeholder="아이디를 입력하세요"
                                value={formData.userId}
                                onChange={handleInputChange}
                                onKeyPress={(e) => handleKeyPress(e, 'password')}
                                required
                                autoComplete="username"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">비밀번호</label>
                        <div className="input-wrapper">
                            <input
                                type="password"
                                id="password"
                                name="password"
                                placeholder="비밀번호를 입력하세요"
                                value={formData.password}
                                onChange={handleInputChange}
                                onKeyPress={(e) => handleKeyPress(e, 'submit')}
                                required
                                autoComplete="current-password"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="login-btn"
                        disabled={isLoading}
                    >
                        {isLoading && <span className="loading-spinner"></span>}
                        <span>{isLoading ? '로그인 중...' : '로그인'}</span>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;