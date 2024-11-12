import React, { useState, useEffect } from "react";
import { factoryApi } from '../../services/factoryApi';
import { StatusBar } from './StatusBar';

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await factoryApi.device.getAllDevices();
        
        if (!response.devices || !response.summary) {
          throw new Error('無法取得設備資料');
        }

        // 計算新的 summary
        const newSummary = {
          running: response.devices.filter(d => d.status === 'running').length,
          idle: response.devices.filter(d => d.status === 'idle').length,
          error: response.devices.filter(d => d.status === 'error').length,
          offline: response.devices.filter(d => !d.connected).length,
          averageEfficiency: response.summary.averageEfficiency
        };

        console.log('New Summary:', newSummary);
        
        setDevices(response.devices);
        setSummary(newSummary);

      } catch (err) {
        console.error('資料更新失敗:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 space-y-6">
      <StatusBar 
        summary={summary}
        devices={devices}
        loading={loading}
      />
    </div>
  );
}; 