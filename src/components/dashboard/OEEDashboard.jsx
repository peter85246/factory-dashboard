/**
 * UI頁面：稼動率資訊
 */
import React, { useEffect, useState, useMemo } from "react";
import { Card } from "../ui/card";
import { factoryApi } from '../../services/factoryApi';
import { StatusBar } from './StatusBar';  // 添加這行
import { useStatusData } from '../../hooks/useStatusData';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export const OEEDashboard = () => {
  const [deviceData, setDeviceData] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState({
    efficiency: "0.0000",
    availability: "0.0000"
  });
  
  const [timeRange, setTimeRange] = useState('month');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  // 添加 dates 定義
  const dates = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return {
      // 生成年份選項（從 2020 到當前年份）
      years: Array.from(
        { length: currentYear - 2019 },
        (_, i) => currentYear - i
      ),
      // 生成月份選項（1-12月）
      months: Array.from(
        { length: 12 },
        (_, i) => i + 1
      )
    };
  }, []);

  const { summary, devices, loading } = useStatusData();
  
  // fetchDeviceData 函數
  const fetchDeviceData = async () => {
    try {
      console.log('Fetching data for:', timeRange, selectedYear, selectedMonth);
      
      let response;
      if (timeRange === 'year') {
        console.log('Fetching year data for:', selectedYear);
        response = await factoryApi.device.getYearDeviceData(selectedYear);
        console.log('Year data response:', response);
      } else {
        response = await factoryApi.device.getMonthDeviceData(selectedYear, selectedMonth);
      }

      if (!response || response.code !== '0000') {
        console.error('API Error:', response);
        throw new Error('Invalid API response');
      }

      // 轉換 API 數據為圖表所需格式，不要在這裡 toFixed
      const formattedData = response.result.map(item => ({
        name: timeRange === 'year' ? `${item.month || ''}月` : `${item.day}日`,
        稼動率: parseFloat(item.utilization_rate || 0),  // 移除 toFixed
        設備數: item.device_count || 0,
        OEE: calculateOEE(item.utilization_rate || 0)    // 移除 toFixed
      }));

      console.log('Raw data:', response.result);
      console.log('Formatted data:', formattedData);
      
      // 更新統計數據
      if (formattedData.length > 0) {
        const validData = formattedData.filter(item => item.設備數 > 0);
        console.log('Valid data for stats:', validData);
        
        // 計算平均值
        const avgOEE = validData.length > 0 
          ? (validData.reduce((sum, item) => sum + item.OEE, 0) / validData.length).toFixed(4)
          : "0.0000";
        
        const avgAvailability = validData.length > 0
          ? (validData.reduce((sum, item) => sum + item.稼動率, 0) / validData.length).toFixed(4)
          : "0.0000";
        
        console.log('Raw averages:', {
          OEE: avgOEE,
          availability: avgAvailability
        });

        setMonthlyStats({
          efficiency: avgOEE,
          availability: avgAvailability
        });
      }

      // 在設置到 state 之前再處理顯示格式
      const displayData = formattedData.map(item => ({
        ...item,
        稼動率: item.稼動率.toFixed(2),
        OEE: item.OEE.toFixed(2)
      }));

      setDeviceData(displayData);

    } catch (error) {
      console.error('Error in fetchDeviceData:', error);
      setDeviceData([]);
      setMonthlyStats({
        efficiency: "0.0000",
        availability: "0.0000"
      });
    }
  };

  // 移除原有的 useEffect，只保留 API 相關的
  useEffect(() => {
    fetchDeviceData();
  }, [timeRange, selectedYear, selectedMonth]);

  // 格式化標題
  const getTimeRangeTitle = () => {
    if (timeRange === 'year') {
      return `${selectedYear}年度`;
    }
    return `${selectedYear}年${selectedMonth}月`;
  };

  // 計算 OEE
  const calculateOEE = (utilizationRate) => {
    const availability = parseFloat(utilizationRate) / 100;
    const performance = 0.8;  // 性能效率 80%
    const quality = 0.95;     // 良品率 95%
    return availability * performance * quality * 100;
  };

  return (
    <div className="space-y-6">
      <StatusBar 
        summary={summary} 
        devices={devices} 
        loading={loading} 
      />

      {/* 添加時間選擇器 */}
      <div className="bg-[#0B1015] p-4">
        <div className="flex gap-4 items-center">
          <select 
            className="bg-gray-800 text-white px-3 py-1 rounded-md border border-gray-700"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="month">月</option>
            <option value="year">年</option>
          </select>

          {/* 年份選擇 */}
          <select 
            className="bg-gray-800 text-white px-3 py-1 rounded-md border border-gray-700"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {dates.years.map(year => (
              <option key={year} value={year}>{year}年</option>
            ))}
          </select>

          {/* 月份選擇（當選擇月視圖時顯示） */}
          {timeRange === 'month' && (
            <select 
              className="bg-gray-800 text-white px-3 py-1 rounded-md border border-gray-700"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
            >
              {dates.months.map(month => (
                <option key={month} value={month}>{month}月</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* OEE 指標卡片 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 設備綜合效率卡片 */}
        <Card className="p-4 bg-gray-900 text-white relative overflow-hidden">
          {/* 添加閃爍效果背景 */}
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 via-green-500/20 to-green-500/0 animate-shimmer" />
          
          <div className="relative z-10">
            <h3 className="text-gray-400">設備綜合效率 ({getTimeRangeTitle()})</h3>
            <div className="text-3xl font-bold text-green-400 mt-2 animate-pulse-slow">
              {monthlyStats.efficiency}%
            </div>
          </div>
        </Card>

        {/* 設備稼動率卡片 */}
        <Card className="p-4 bg-gray-900 text-white relative overflow-hidden">
          {/* 添加閃爍效果背景 */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/20 to-blue-500/0 animate-shimmer" />
          
          <div className="relative z-10">
            <h3 className="text-gray-400">設備稼動率 ({getTimeRangeTitle()})</h3>
            <div className="text-3xl font-bold text-blue-400 mt-2 animate-pulse-slow">
              {monthlyStats.availability}%
            </div>
          </div>
        </Card>
      </div>

      {/* 趨勢圖 */}
      <Card className="p-6 bg-gray-900 text-white">
        <h3 className="text-lg font-semibold mb-4">
          OEE 趨勢分析 ({getTimeRangeTitle()})
        </h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={deviceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="name"
                stroke="#9CA3AF"
                tick={{ fill: "#9CA3AF" }}
                interval={0}
                ticks={
                  timeRange === 'year' 
                    ? undefined
                    : Array.from(
                        { length: 16 },
                        (_, i) => (i * 2 + 1) + '日'
                      )
                }
              />
              <YAxis
                stroke="#9CA3AF"
                tick={{ fill: "#9CA3AF" }}
                domain={[0, 100]}
                ticks={[0, 20, 40, 60, 80, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1F2937",
                  border: "none",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
                itemStyle={{ color: "#E5E7EB" }}
                labelStyle={{ color: "#E5E7EB", fontWeight: "bold" }}
                formatter={(value) => [`${value}%`]}
              />
              <Legend
                verticalAlign="top"
                height={36}
                wrapperStyle={{
                  paddingBottom: "20px",
                  color: "#9CA3AF",
                }}
              />
              <Line
                type="monotone"
                dataKey="OEE"
                name="OEE"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ fill: "#10B981", strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="稼動率"
                name="稼動率"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ fill: "#3B82F6", strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* 詳細數據表格 */}
      <Card className="p-6 bg-gray-900 text-white">
        <h3 className="text-lg font-semibold mb-4">
          詳細數據 ({getTimeRangeTitle()})
        </h3>
        <div className="overflow-x-auto rounded-lg border border-gray-800">
          <table className="w-full table-fixed">
            <thead>
              <tr className="bg-gray-800/50">
                <th className="w-1/3 px-4 py-3 text-left text-sm font-semibold text-gray-400">
                  {timeRange === 'year' ? '月份' : '日期'}
                </th>
                <th className="w-1/3 px-4 py-3 text-center text-sm font-semibold text-gray-400">
                  OEE
                </th>
                <th className="w-1/3 px-4 py-3 text-center text-sm font-semibold text-gray-400">
                  稼動率
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {deviceData.map((item) => (
                <tr key={item.name}>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {item.name}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm font-medium text-green-400">
                      {item.OEE}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm font-medium text-blue-400">
                      {item.稼動率}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
