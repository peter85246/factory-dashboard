/**
 * UI頁面：生產歷程
 * 功能：顯示機台的生產歷史記錄
 */

import React, { useState } from "react";
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
import { StatusBar } from './StatusBar';
import { useStatusData } from '../../hooks/useStatusData';

export const ProductionHistory = () => {
  const { summary, devices, loading } = useStatusData();

  // 使用第一台機器的生產歷史作為示例
  const historyData = mockMachines[0].productionHistory;
  // 使用柱狀圖顯示生產歷史數據
  // 數據結構：
  // - date: 日期
  // - production: 生產數量
  // - efficiency: 效率
  // - defects: 不良品數量

  // BarChart 配置：
  // - CartesianGrid: 網格線
  // - XAxis: X軸（日期）
  // - YAxis: Y軸（數量）
  // - Tooltip: 數據提示
  // - Bar: 柱狀圖配置

  return (
    <div className="space-y-6">
       <StatusBar 
        summary={summary} 
        devices={devices} 
        loading={loading} 
      />
      <Card className="p-6 bg-gray-900 text-white">
        <h3 className="text-lg font-semibold mb-4">生產數量趨勢</h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={historyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{ backgroundColor: "#1F2937", border: "none" }}
                itemStyle={{ color: "#E5E7EB" }}
              />
              <Bar dataKey="production" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};
