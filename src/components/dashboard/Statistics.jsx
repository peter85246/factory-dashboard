/**
 * UI頁面：統計分析
 * 功能：提供各類統計數據和分析圖表
 */

import React, { useEffect, useState } from "react";
import { Card } from "../ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import { factoryApi } from "../../services/factoryApi";
import { StatusBar } from "./StatusBar"; // 添加這行

export const Statistics = () => {
  const [devices, setDevices] = useState([]);
  const [summary, setSummary] = useState({
    error: 0,
    idle: 0,
    running: 0,
    offline: 0,
    averageEfficiency: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        setLoading(true);
        setError(null);
        const { devices, summary } = await factoryApi.device.getAllDevices();

        if (!devices || !summary) {
          throw new Error("無法取得設備資料");
        }

        setDevices(devices);
        setSummary(summary);
      } catch (err) {
        setError("資料更新失敗: " + err.message);
        console.error("資料更新錯誤:", err);
      } finally {
        setTimeout(() => {
          setLoading(false);
        }, 500);
      }
    };

    fetchDevices();
    const interval = setInterval(fetchDevices, 2000);
    return () => clearInterval(interval);
  }, []);

  // 將 summary 數據轉換為圓餅圖所需格式
  const statusData = [
    {
      name: "運行中",
      value: summary.running,
      color: "#10B981", // green
    },
    {
      name: "閒置",
      value: summary.idle,
      color: "#3B82F6", // blue
    },
    {
      name: "異常",
      value: summary.error,
      color: "#EF4444", // red
    },
    {
      name: "未連線",
      value: summary.offline,
      color: "#6B7280", // gray
    },
  ];

  return (
    <div className="space-y-6">
      {/* StatusBar */}
      <StatusBar summary={summary} devices={devices} loading={loading} />

      {/* 錯誤/載入提示 */}
      <div className="h-6">
        <div className="text-sm">
          {loading && (
            <span className="text-blue-400 animate-pulse">Loading...</span>
          )}
          {error && <span className="text-red-500">{error}</span>}
        </div>
      </div>

      {/* 卡片網格 */}
      <div className="grid grid-cols-2 gap-6">
        <Card className="p-6 bg-gray-900 text-white">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">設備狀態分布</h3>
            <div className="text-gray-400">總機台數：{devices.length}</div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend
                  formatter={(value, entry) => (
                    <span className="text-gray-300">
                      {value}: {entry.payload.value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 bg-gray-900 text-white">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">效率分析</h3>
            <div className="text-gray-400">
              平均稼動率：{summary.averageEfficiency}%
            </div>
          </div>
          <div className="space-y-4">
            {devices.map((device) => (
              <div key={device.id} className="bg-gray-800 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300">{device.name}</span>
                  <span
                    className={`
                    ${device.status === "running" ? "text-green-400" : ""}
                    ${device.status === "idle" ? "text-blue-400" : ""}
                    ${device.status === "error" ? "text-red-400" : ""}
                    ${device.status === "offline" ? "text-gray-400" : ""}
                  `}
                  >
                    {device.efficiency}%
                  </span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300
                      ${device.status === "running" ? "bg-green-500" : ""}
                      ${device.status === "idle" ? "bg-blue-500" : ""}
                      ${device.status === "error" ? "bg-red-500" : ""}
                      ${device.status === "offline" ? "bg-gray-500" : ""}
                    `}
                    style={{ width: `${device.efficiency}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
