import React from 'react';
import '../Style/AdminPage.css';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const WeeklyChart = ({ data, loading, error }) => {
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
                    <p className="font-semibold">{`점수 범위: ${label}`}</p>
                    <p className="text-blue-600">
                        {`저번주: ${payload[0].value}명`}
                    </p>
                    <p className="text-green-600">
                        {`이번주: ${payload[1].value}명`}
                    </p>
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className="admin-graph">
                <div className="flex items-center justify-center h-64">
                    <div className="text-lg">주간 통계를 불러오는 중...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="admin-graph">
                <div className="flex items-center justify-center h-64">
                    <div className="text-red-500">❌ {error}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="mb-6">
            <h3 className="admin-graph-header">주간 예측 점수 분포 비교</h3>

            <div className="admin-graph">
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                        data={data}
                        margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                        }}
                        barCategoryGap="25%"
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                            dataKey="preScore"
                            tick={{ fontSize: 12 }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                            label={{
                                value: '예측 점수',
                                position: 'insideBottom',
                                offset: 15
                            }}
                        />
                        <YAxis
                            tick={{ fontSize: 12 }}
                            label={{ value: '총 인원수', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            layout="horizontal"
                            verticalAlign="bottom"
                            align="center"
                            wrapperStyle={{
                                transform: 'translateX(3.5%)',
                                fontSize: 13
                            }}
                        />
                        <Bar
                            dataKey="lastWeek"
                            fill="#94C9DE"
                            name="저번주"
                            radius={[4, 4, 0, 0]}
                            wrapperStyle={{ paddingLeft: 100 }}
                        />
                        <Bar
                            dataKey="thisWeek"
                            fill="#2E81FD"
                            name="이번주"
                            radius={[4, 4, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>

                {data.length === 0 && (
                    <div className="text-center text-gray-500 mt-4">
                        표시할 데이터가 없습니다.
                    </div>
                )}
            </div>
        </div>
    );
};

export default WeeklyChart;
