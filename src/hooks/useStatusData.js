import { useState, useEffect } from 'react';
import { factoryApi } from '../services/factoryApi';

export const useStatusData = () => {
  const [summary, setSummary] = useState({
    error: 0,
    idle: 0,
    running: 0,
    offline: 0,
    averageEfficiency: 0
  });
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    let updateInterval;

    const fetchData = async () => {
      try {
        const response = await factoryApi.device.getAllDevices();
        
        if (!response.devices || !response.summary) {
          throw new Error('無法取得設備資料');
        }

        if (isMounted) {
          setDevices(response.devices);
          setSummary(response.summary);
          setError(null);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
          console.error('Error fetching data:', err);
          setLoading(false);
        }
      }
    };

    // 立即執行第一次獲取數據
    fetchData();

    // 延遲設置定時器，等第一次數據加載完成後再開始定時更新
    const startInterval = () => {
      updateInterval = setInterval(fetchData, 2000);
    };

    // 第一次數據加載完成後再設置定時器
    const timeoutId = setTimeout(startInterval, 100);

    return () => {
      isMounted = false;
      clearInterval(updateInterval);
      clearTimeout(timeoutId);
    };
  }, []);

  return { summary, devices, loading, error };
}; 