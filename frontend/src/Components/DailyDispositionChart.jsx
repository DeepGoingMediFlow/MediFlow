import React from 'react';
import '../Style/AdminPage.css';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const DailyDispositionChart = ({ data, loading, error }) => {
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
                    <p className="font-semibold">{`날짜: ${label}`}</p>
                    <p className="text-green-600">
                        {`귀가: ${payload[0].value}명`}
                    </p>
                    <p className="text-blue-600">
                        {`일반병동: ${payload[1].value}명`}
                    </p>
                    <p className="text-red-600">
                        {`중환자실: ${payload[2].value}명`}
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
                    <div className="text-lg">일별 통계를 불러오는 중...</div>
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
            <h3 className="admin-graph-header">최근 7일간 환자 배치 현황</h3>

            <div className="admin-graph">
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                        data={data}
                        margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5,
                        }}
                        barCategoryGap="25%"
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 12 }}
                            height={45}
                            label={{
                                value: '날짜',
                                position: 'insideBottom',
                                offset: -5
                            }}
                        />
                        <YAxis
                            tick={{ fontSize: 12 }}
                            label={{ value: '환자 수', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            layout="horizontal"
                            verticalAlign="bottom"
                            align="center"
                            wrapperStyle={{
                                paddingTop: '20px',
                                fontSize: 13,
                                paddingLeft: 40
                            }}
                        />
                        <Bar
                            dataKey="discharge"
                            fill="#22C55E"
                            name="귀가"
                            radius={[4, 4, 0, 0]}
                        />
                        <Bar
                            dataKey="ward"
                            fill="#eab308"
                            name="일반병동"
                            radius={[4, 4, 0, 0]}
                        />
                        <Bar
                            dataKey="icu"
                            fill="#EF4444"
                            name="중환자실"
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

export default DailyDispositionChart;