import React from "react";
import { Activity, AlertTriangle, Clock, Percent, Wifi } from "lucide-react";

export const StatusBar = ({ summary = {}, devices = [], loading = false }) => {
  // 修改狀態計算
  const statusCounts = {
    error: devices.filter(d => d.status === 'error').length,
    idle: devices.filter(d => d.status === 'idle').length,
    running: devices.filter(d => d.status === 'running').length,
    connected: devices.filter(d => d.connected).length,
    total: devices.length
  };

  // 計算平均稼動率
  const averageEfficiency = devices.length > 0
    ? devices.reduce((sum, device) => {
        const rate = device.rates?.operation ? parseFloat(device.rates.operation) : 0;
        return sum + rate;
      }, 0) / devices.length
    : 0;

  const formattedEfficiency = averageEfficiency.toFixed(2);

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
          icon={<Wifi className="text-yellow-400" />}
          label="已連線"
          value={statusCounts.connected}
          showTotal={true}
          hoverColor="yellow"
        />
        <StatusItem
          icon={<Activity className="text-gray-400" />}
          label="設備總數"
          value={statusCounts.total}
          showTotal={true}
          hoverColor="gray"
        />
        <StatusItem
          icon={<Percent className="text-cyan-400" />}
          label="平均稼動率"
          value={formattedEfficiency}
          showTotal={false}
          hoverColor="cyan"
        />
      </div>
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
