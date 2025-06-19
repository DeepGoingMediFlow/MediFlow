import React, { useState, useEffect } from 'react';
import { Activity, Brain, Stethoscope, Heart, TrendingUp } from 'lucide-react';
import '../Style/PredictionLoadingModal.css';

const PredictionLoadingModal = ({
    isOpen,
    predictionType = "1차", // "1차" 또는 "2차"
    onClose,
    minDisplayTime = 3000 // 최소 표시 시간 (기본값: 3초)
}) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [progress, setProgress] = useState(0);
    const [dots, setDots] = useState('');
    const [internalOpen, setInternalOpen] = useState(false);
    const [startTime, setStartTime] = useState(null);

    // 로딩 단계 정의
    const loadingSteps = [
        {
            icon: <Stethoscope className="step-icon" />,
            title: "환자 데이터 분석중",
            description: "바이탈 사인 및 검사수치 검토"
        },
        {
            icon: <Brain className="step-icon" />,
            title: "AI 모델 처리중",
            description: "머신러닝 알고리즘 실행"
        },
        {
            icon: <TrendingUp className="step-icon" />,
            title: "예측 결과 생성중",
            description: "최적 배치 결정 계산"
        }
    ];

    // isOpen이 true가 되면 내부 모달을 열고 시작 시간 기록
    useEffect(() => {
        if (isOpen && !internalOpen) {
            setInternalOpen(true);
            setStartTime(Date.now());
            setCurrentStep(0);
            setProgress(0);
        }
    }, [isOpen, internalOpen]);

    // isOpen이 false가 되면 최소 시간 확인 후 모달 닫기
    useEffect(() => {
        if (!isOpen && internalOpen && startTime) {
            const elapsedTime = Date.now() - startTime;
            const remainingTime = Math.max(0, minDisplayTime - elapsedTime);

            setTimeout(() => {
                setInternalOpen(false);
                setStartTime(null);
            }, remainingTime);
        }
    }, [isOpen, internalOpen, startTime, minDisplayTime]);

    // 애니메이션 점들
    useEffect(() => {
        if (!internalOpen) return;

        const interval = setInterval(() => {
            setDots(prev => {
                if (prev === '...') return '';
                return prev + '.';
            });
        }, 500);

        return () => clearInterval(interval);
    }, [internalOpen]);

    // 진행 단계 애니메이션 (더 느리게)
    useEffect(() => {
        if (!internalOpen) return;

        const stepInterval = setInterval(() => {
            setCurrentStep(prev => (prev + 1) % loadingSteps.length);
        }, 1000); // 1.5초에서 2초로 변경

        return () => clearInterval(stepInterval);
    }, [internalOpen, loadingSteps.length]);

    // 프로그레스 바 애니메이션 (100% 제한)
    useEffect(() => {
        if (!internalOpen) return;

        const progressInterval = setInterval(() => {
            setProgress(prev => {
                const increment = Math.random() * 6 + 4; // 더 작은 증가량
                const newProgress = Math.min(prev + increment, 100); // 100%로 제한
                return newProgress;
            });
        }, 100);

        return () => clearInterval(progressInterval);
    }, [internalOpen]);

    if (!internalOpen) return null;

    return (
        <div className="loading-modal-overlay">
            <div className="loading-modal-container">
                {/* 헤더 */}
                <div className="loading-header">
                    <div className="mediflow-logo">
                        <Activity className="logo-icon" />
                        <span className="loading-logo-text">MediFlow</span>
                    </div>
                    <h2 className="loading-title">
                        {predictionType} 배치 예측 진행중{dots}
                    </h2>
                </div>

                {/* 메인 로딩 영역 */}
                <div className="loading-content">
                    {/* 중앙 펄스 애니메이션 */}
                    <div className="pulse-container">
                        <div className="pulse-ring pulse-ring-1"></div>
                        <div className="pulse-ring pulse-ring-2"></div>
                        <div className="pulse-ring pulse-ring-3"></div>
                        <div className="pulse-center">
                            <Activity className="pulse-icon" />
                        </div>
                    </div>

                    {/* 현재 단계 표시 */}
                    <div className="current-step">
                        <div className="step-icon-container">
                            {loadingSteps[currentStep].icon}
                        </div>
                        <h3 className="step-title">{loadingSteps[currentStep].title}</h3>
                        <p className="step-description">{loadingSteps[currentStep].description}</p>
                    </div>

                    {/* 프로그레스 바 */}
                    <div className="progress-container">
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                        <span className="progress-text">{Math.round(progress)}%</span>
                    </div>

                    {/* 단계 인디케이터 */}
                    <div className="steps-indicator">
                        {loadingSteps.map((step, index) => (
                            <div
                                key={index}
                                className={`step-dot ${index === currentStep ? 'active' : ''} 
                           ${index < currentStep ? 'completed' : ''}`}
                            >
                                <span className="step-number">{index + 1}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 하단 정보 */}
                <div className="loading-footer">
                    <div className="loading-message">
                        <p>MediFlow AI가 최적의 환자 배치를 결정하고 있습니다.</p>
                        <p className="sub-message">
                            {!isOpen
                                ? '결과를 확인해주세요.'
                                : '잠시만 기다려 주세요.'
                            }
                        </p>
                    </div>
                </div>

                {/* 데코레이션 요소들 */}
                <div className="decoration-elements">
                    <div className="floating-icon floating-icon-1">
                        <Heart size={16} />
                    </div>
                    <div className="floating-icon floating-icon-2">
                        <Brain size={14} />
                    </div>
                    <div className="floating-icon floating-icon-3">
                        <Stethoscope size={18} />
                    </div>
                    <div className="floating-icon floating-icon-4">
                        <TrendingUp size={16} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PredictionLoadingModal;