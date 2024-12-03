/**
 * UI頁面：生產歷程
 * 功能：顯示機台的生產歷史記錄
 */

import React, { useState, useMemo } from "react";
import { Card } from "../ui/card";
import { mockMachines } from "../../data/mockData";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { StatusBar } from "./StatusBar";
import { useStatusData } from "../../hooks/useStatusData";

export const ProductionHistory = () => {
  const { summary, devices, loading } = useStatusData();
  const [timeRange, setTimeRange] = useState("month"); // 改為預設顯示月

  // 修改日期生成邏輯
  const dates = useMemo(() => {
    // 固定年份範圍從 2020 到當前年份
    const currentYear = new Date().getFullYear();
    const years = Array.from(
      { length: currentYear - 2019 },
      (_, i) => currentYear - i,
    );

    // 月份保持不變
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    return { years, months };
  }, []);

  // 生成模擬數據
  const generateMockData = useMemo(() => {
    const mockData = [];
    const years = dates.years;

    years.forEach((year) => {
      // 為每年生成12個月的數據
      for (let month = 1; month <= 12; month++) {
        // 為每月生成數據
        const daysInMonth = new Date(year, month, 0).getDate();

        for (let day = 1; day <= daysInMonth; day++) {
          const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          mockData.push({
            date,
            production: Math.floor(800 + Math.random() * 400), // 生產數量在 800-1200 之間
          });
        }
      }
    });

    return mockData;
  }, [dates.years]);

  // 選擇的日期
  const [selectedYear, setSelectedYear] = useState(dates.years[0]);
  const [selectedMonth, setSelectedMonth] = useState(dates.months[0]);

  // 修改數據過濾邏輯
  const filteredData = useMemo(() => {
    const data = generateMockData.filter((item) => {
      const date = new Date(item.date);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      if (timeRange === "year") {
        // 年度視圖：合併同一年每個月的數據
        return year === selectedYear;
      } else {
        // 月度視圖：顯示選定月份的每日數據
        return year === selectedYear && month === selectedMonth;
      }
    });

    // 如果是年度視圖，將數據按月份合併
    if (timeRange === "year") {
      const monthlyData = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        const monthData = data.filter((item) => {
          const date = new Date(item.date);
          return date.getMonth() + 1 === month;
        });

        const totalProduction = monthData.reduce(
          (sum, item) => sum + item.production,
          0,
        );

        return {
          date: `${month}月`,
          production: totalProduction,
        };
      });
      return monthlyData;
    }

    // 月度視圖：格式化日期顯示
    return data.map((item) => ({
      ...item,
      date: new Date(item.date).getDate() + "日", // 只顯示日期
    }));
  }, [timeRange, selectedYear, selectedMonth, generateMockData]);

  // 添加統計數據計算邏輯
  const productionStats = useMemo(() => {
    if (!filteredData.length) return null;

    const totalProduction = filteredData.reduce(
      (sum, item) => sum + item.production,
      0,
    );
    const avgProduction = Math.round(totalProduction / filteredData.length);
    const maxProduction = Math.max(
      ...filteredData.map((item) => item.production),
    );
    const minProduction = Math.min(
      ...filteredData.map((item) => item.production),
    );

    return {
      total: totalProduction.toLocaleString(),
      average: avgProduction.toLocaleString(),
      max: maxProduction.toLocaleString(),
      min: minProduction.toLocaleString(),
      timeRange: timeRange === "year" ? "年度" : "月度",
    };
  }, [filteredData, timeRange]);

  return (
    <div className="space-y-6">
      <StatusBar summary={summary} devices={devices} loading={loading} />
      <Card className="p-6 bg-gray-900 text-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">生產數量趨勢</h3>

          {/* 時間範圍選擇 */}
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
              {dates.years.map((year) => (
                <option key={year} value={year}>
                  {year}年
                </option>
              ))}
            </select>

            {/* 月份選擇（當選擇月視圖時顯示） */}
            {timeRange === "month" && (
              <select
                className="bg-gray-800 text-white px-3 py-1 rounded-md border border-gray-700"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
              >
                {dates.months.map((month) => (
                  <option key={month} value={month}>
                    {month}月
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="date"
                stroke="#9CA3AF"
                tickFormatter={(value) => value}
                interval={0}
                ticks={
                  timeRange === "year"
                    ? undefined // 年度視圖保持原樣
                    : Array.from(
                        { length: 16 }, // 修改長度以確保足夠顯示所有奇數日期
                        (_, i) => i * 2 + 1 + "日", // 生成 1, 3, 5, 7, 9... 的序列
                      )
                }
              />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{ backgroundColor: "#1F2937", border: "none" }}
                itemStyle={{ color: "#E5E7EB" }}
                formatter={(value) => [`${value} 件`, "生產數量"]}
                labelFormatter={(label) =>
                  `${timeRange === "year" ? selectedYear + "年" : selectedYear + "年" + selectedMonth + "月"}${label}`
                }
              />
              <Bar dataKey="production" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 添加統計說明卡片 */}
        {productionStats && (
          <div className="mt-6 grid grid-cols-4 gap-4">
            {/* 總生產卡片 */}
            <div className="bg-gray-800 p-4 rounded-lg relative overflow-hidden">
              {/* 添加閃爍效果背景 */}
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 via-green-500/20 to-green-500/0 animate-shimmer" />

              <div className="relative z-10">
                <div className="text-gray-400 text-sm">
                  {productionStats.timeRange}總生產
                </div>
                <div className="text-2xl font-bold text-green-400 mt-1 animate-pulse-slow">
                  {productionStats.total}
                  <span className="text-sm text-gray-400 ml-1">件</span>
                </div>
              </div>
            </div>

            {/* 平均生產卡片 */}
            <div className="bg-gray-800 p-4 rounded-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/20 to-blue-500/0 animate-shimmer" />

              <div className="relative z-10">
                <div className="text-gray-400 text-sm">平均生產</div>
                <div className="text-2xl font-bold text-blue-400 mt-1 animate-pulse-slow">
                  {productionStats.average}
                  <span className="text-sm text-gray-400 ml-1">件/日</span>
                </div>
              </div>
            </div>

            {/* 最高生產卡片 */}
            <div className="bg-gray-800 p-4 rounded-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/0 via-yellow-500/20 to-yellow-500/0 animate-shimmer" />

              <div className="relative z-10">
                <div className="text-gray-400 text-sm">最高生產</div>
                <div className="text-2xl font-bold text-yellow-400 mt-1 animate-pulse-slow">
                  {productionStats.max}
                  <span className="text-sm text-gray-400 ml-1">件</span>
                </div>
              </div>
            </div>

            {/* 最低生產卡片 */}
            <div className="bg-gray-800 p-4 rounded-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/20 to-red-500/0 animate-shimmer" />

              <div className="relative z-10">
                <div className="text-gray-400 text-sm">最低生產</div>
                <div className="text-2xl font-bold text-red-400 mt-1 animate-pulse-slow">
                  {productionStats.min}
                  <span className="text-sm text-gray-400 ml-1">件</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
