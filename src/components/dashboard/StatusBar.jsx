import React from "react";
import { Activity, AlertTriangle, Clock, Percent, WifiOff } from "lucide-react";

export const StatusBar = ({ summary = {}, devices = [], loading = false }) => {
  // 直接從 API 返回的 devices 數據計算狀態
  const statusCounts = {
    error: devices.filter(d => d.status === 'error').length,
    idle: devices.filter(d => d.status === 'idle').length,
    running: devices.filter(d => d.status === 'running').length,
    offline: devices.filter(d => !d.connected).length
  };

  // 計算平均稼動率（從 operationRate）
  const averageEfficiency = devices.length > 0
    ? devices.reduce((sum, device) => {
        const rate = device.rates?.operation ? parseFloat(device.rates.operation) : 0;
        return sum + rate;
      }, 0) / devices.length
    : 0;

  const formattedEfficiency = averageEfficiency.toFixed(2);

  // 計算警告數量
  const warningCount = devices.filter(d => d.warning).length;

  console.log('StatusBar Data:', {
    devices,
    statusCounts,
    averageEfficiency,
    warningCount,
    rawDevices: devices.map(d => ({
      id: d.id,
      status: d.status,
      connected: d.connected,
      warning: d.warning,
      rates: d.rates
    }))
  });

  return (
    <div className="bg-gray-900 rounded-lg p-4">
      <div className="grid grid-cols-6 gap-4">
        <StatusItem
          icon={<AlertTriangle className="text-red-400" />}
          label="異常"
          value={statusCounts.error}
          showTotal={true}
          hoverColor="red"
        />
        <StatusItem
          icon={<Clock className="text-blue-400" />}
          label="閒置"
          value={statusCounts.idle}
          showTotal={true}
          hoverColor="blue"
        />
        <StatusItem
          icon={<Activity className="text-green-400" />}
          label="加工中"
          value={statusCounts.running}
          showTotal={true}
          hoverColor="green"
        />
        <StatusItem
          icon={<WifiOff className="text-gray-400" />}
          label="未連線"
          value={statusCounts.offline}
          showTotal={true}
          hoverColor="gray"
        />
        <StatusItem
          icon={<Percent className="text-cyan-400" />}
          label="平均稼動率"
          value={`${formattedEfficiency}`}
          showTotal={false}
          hoverColor="cyan"
        />
        <StatusItem
          icon={<AlertTriangle className={`${warningCount > 0 ? "text-yellow-400 animate-pulse" : "text-gray-400"}`} />}
          label="警告數"
          value={warningCount}
          showTotal={true}
          hoverColor="yellow"
        />
      </div>
      {/* {loading && (
        <div className="text-sm text-blue-400 animate-pulse mt-2">
          資料更新中...
        </div>
      )} */}
    </div>
  );
};

// StatusItem 組件
const StatusItem = ({ icon, label, value, total, showTotal, hoverColor }) => (
  <div
    className={`
      flex items-center space-x-3 
      bg-gray-800 rounded-lg p-3 
      transition-all duration-300
      cursor-pointer
      hover:bg-gray-700 hover:shadow-lg hover:scale-[1.02]
      hover:shadow-${hoverColor}-500/5
    `}
  >
    <div className="w-8 h-8 flex items-center justify-center">{icon}</div>
    <div>
      <div className="text-sm text-gray-400">{label}</div>
      <div className="text-xl font-bold text-white">
        {showTotal ? `${value}` : value}
      </div>
    </div>
  </div>
);
