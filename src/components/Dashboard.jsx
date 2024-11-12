import React, { useState, useEffect } from "react";
import { factoryApi } from '../../services/factoryApi';  // 確保這個路徑正確
import { StatusBar } from './StatusBar';  // 修正 import 路徑

export const Dashboard = () => {
  const [devices, setDevices] = useState([]);
  const [summary, setSummary] = useState({
    running: 0,
    idle: 0,
    error: 0,
    offline: 0,
    averageEfficiency: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { devices, summary } = await factoryApi.device.getAllDevices();
        
        if (!devices || !summary) {
          throw new Error('無法取得設備資料');
        }

        // 添加數據轉換
        const processedSummary = {
          running: Number(summary.running) || 0,
          idle: Number(summary.idle) || 0,
          error: Number(summary.error) || 0,
          offline: Number(summary.offline) || 0,
          averageEfficiency: Number(summary.averageEfficiency).toFixed(4)
        };

        setDevices(devices);
        setSummary(processedSummary);

        console.log('Dashboard Data:', {
          devices,
          summary: processedSummary
        });

      } catch (err) {
        setError('資料更新失敗: ' + err.message);
        console.error('資料更新錯誤:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  // 使用 API 數據計算統計
  const stats = {
    total: devices.length,
    running: summary.running || 0,
    idle: summary.idle || 0,
    error: summary.error || 0,
    offline: summary.offline || 0,
  };

  return (
    <div className="p-6 space-y-6">
      <StatusBar 
        summary={summary}
        devices={devices}
        loading={loading}
      />
      
      {/* 狀態卡片網格 */}
      <div className="grid grid-cols-5 gap-4">
        {/* 總機台數 */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700/50 p-4 hover:shadow-lg hover:shadow-black/20 transition-all duration-300">
          <div className="text-gray-400 text-sm mb-1">總機台數</div>
          <div className="text-2xl font-bold text-white">{stats.total}</div>
        </div>

        {/* 運行中 */}
        <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-xl border border-green-500/20 p-4 hover:shadow-lg hover:shadow-green-500/5 transition-all duration-300">
          <div className="text-green-400 text-sm mb-1">運行中</div>
          <div className="text-2xl font-bold text-green-400">
            {stats.running}
          </div>
        </div>

        {/* 待機中 */}
        <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 rounded-xl border border-yellow-500/20 p-4 hover:shadow-lg hover:shadow-yellow-500/5 transition-all duration-300">
          <div className="text-yellow-400 text-sm mb-1">待機中</div>
          <div className="text-2xl font-bold text-yellow-400">{stats.idle}</div>
        </div>

        {/* 異常 */}
        <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 rounded-xl border border-red-500/20 p-4 hover:shadow-lg hover:shadow-red-500/5 transition-all duration-300">
          <div className="text-red-400 text-sm mb-1">異常</div>
          <div className="text-2xl font-bold text-red-400">{stats.error}</div>
        </div>

        {/* 離線 */}
        <div className="bg-gradient-to-br from-gray-500/10 to-gray-600/10 rounded-xl border border-gray-500/20 p-4 hover:shadow-lg hover:shadow-gray-500/5 transition-all duration-300">
          <div className="text-gray-400 text-sm mb-1">離線</div>
          <div className="text-2xl font-bold text-gray-400">
            {stats.offline}
          </div>
        </div>
      </div>
    </div>
  );
};