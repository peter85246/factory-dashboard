/**
 * UI頁面：設備製程監控
 */
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Card } from "./ui/card";
import { StatusBar } from "./dashboard/StatusBar";
import { useStatusData } from "../hooks/useStatusData";
import { factoryApi } from "../services/factoryApi";
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
import axios from 'axios';
import './EquipmentProcessMonitor.css';

export const EquipmentProcessMonitor = () => {
  const [equipmentData, setEquipmentData] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [devices, setDevices] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [currentStats, setCurrentStats] = useState({
    current: 0,
    temperature: 0,
    voltage: 0,
    power: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  
  // 新增狀態：用於存儲動態檢測到的參數類型
  const [detectedParams, setDetectedParams] = useState(new Set());
  const [analysisData, setAnalysisData] = useState({
    anomalies: [],
    healthScore: 0,
    correlation: 0,
    utilization: 0,
    energyEfficiency: 0,
    processCapability: {},
    distributions: {}
  });
  
  // 日期時間選擇 - 設定為您的後端API數據時間範圍
  const [dateRange, setDateRange] = useState({
    startDate: '2025-06-13', // 後端真實數據日期
    endDate: '2025-06-13',
    startTime: '00:00', // 從天首開始
    endTime: '23:59'     // 到天末結束
  });
  
  // 追蹤用戶是否手動修改了時間範圍
  const [userModifiedTime, setUserModifiedTime] = useState(false);

  // 使用現有的狀態數據
  const { summary, devices: statusDevices, loading: statusLoading } = useStatusData();

  // 獲取設備製程數據
  const fetchEquipmentData = useCallback(async () => {
    if (!selectedDevice) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // 格式化時間為 YYYYMMDDHHMM 格式 (後端要求的格式)
      const formatDateTime = (date, time) => {
        const [year, month, day] = date.split('-');
        const [hour, minute] = time.split(':');
        // 為了匹配您的 curl 示例: 2025061300000 和 20250613235959
        // 如果是 00:00 或結束時間，特殊處理
        if (hour === '00' && minute === '00') {
          return `${year}${month}${day}00000`; // 2025061300000 格式
        } else if (hour === '23' && minute === '59') {
          return `${year}${month}${day}235959`; // 20250613235959 格式
        }
        return `${year}${month}${day}${hour}${minute}00`; // 一般格式
      };

      const startTime = formatDateTime(dateRange.startDate, dateRange.startTime);
      const endTime = formatDateTime(dateRange.endDate, dateRange.endTime);

      console.log('Fetching data with params:', { startTime, endTime, selectedDevice });

      const response = await factoryApi.equipmentProcess.getDetectedContent(
        startTime,
        endTime,
        selectedDevice // 使用cam_index作為查詢參數
      );

      console.log('API Response:', response);

      if (response && Array.isArray(response)) {
        const processedData = processEquipmentData(response);
        setEquipmentData(processedData.chartData);
        setCurrentStats(processedData.latestStats);
        setEquipmentList(processedData.equipmentList);
        setDetectedParams(processedData.detectedParams);
        
        // 執行前端分析
        const analysis = performAnalysis(processedData.chartData, processedData.detectedParams);
        console.log('Analysis result:', analysis);
        setAnalysisData(analysis);
        
        setLastUpdate(new Date());
      } else {
        setError('無法獲取設備數據：請檢查時間範圍或設備選擇');
        // 清空數據顯示
        setEquipmentData([]);
        setCurrentStats({ current: 0, temperature: 0, voltage: 0, power: 0 });
        setEquipmentList([]);
        setDetectedParams(new Set());
        setAnalysisData({
          anomalies: [],
          healthScore: 0,
          correlation: 0,
          utilization: 0,
          energyEfficiency: 0,
          processCapability: {},
          distributions: {}
        });
      }
    } catch (err) {
      console.error('API Error:', err);
      setError(`無法連接到後端服務: ${err.message}`);
      // 清空數據顯示
      setEquipmentData([]);
      setCurrentStats({ current: 0, temperature: 0, voltage: 0, power: 0 });
      setEquipmentList([]);
      setDetectedParams(new Set());
      setAnalysisData({
        anomalies: [],
        healthScore: 0,
        correlation: 0,
        utilization: 0,
        energyEfficiency: 0,
        processCapability: {},
        distributions: {}
      });
    } finally {
      setLoading(false);
    }
  }, [selectedDevice, dateRange]);

  // 處理實際API回傳的設備數據 - 動態處理參數名稱
  const processEquipmentData = (rawData) => {
    const chartData = [];
    const equipmentMap = new Map();
    const detectedParamsSet = new Set();
    let latestStats = {};

    console.log('Processing raw data:', rawData);

    // rawData 是一個陣列，每個元素包含 datetime, cam_index, detected_list
    if (Array.isArray(rawData)) {
      // 為了解決曲線圖擠壓問題，如果數據量太大，進行取樣
      // 改善取樣邏輯：確保包含開始點、結束點，避免重要數據遺失
      const sampledData = rawData.length > 100 ? 
        rawData.filter((_, index) => {
          const step = Math.ceil(rawData.length / 100);
          return index % step === 0 || 
                 index === rawData.length - 1 || // 確保包含最後一個點
                 index === 0; // 確保包含第一個點
        }) : 
        rawData;
      
      console.log(`Original data points: ${rawData.length}, Sampled data points: ${sampledData.length}`);

      sampledData.forEach((timePoint, index) => {
        try {
          const datetime = timePoint.datetime;
          const camIndex = timePoint.cam_index;
          const detectedList = timePoint.detected_list || [];

          // 只處理匹配選中設備的數據
          if (String(camIndex) !== String(selectedDevice)) {
            console.log('Skipping data - camIndex:', camIndex, 'selectedDevice:', selectedDevice);
            return;
          }
          
          console.log('Processing matched device data:', { camIndex, selectedDevice, detectedList: detectedList.length });

          // 為每個時間點創建數據點
          const dataPoint = {
            time: formatDisplayTime(datetime),
            datetime: datetime
          };

          // 處理檢測到的設備列表
          if (Array.isArray(detectedList)) {
            detectedList.forEach(detection => {
              const deviceId = detection.device_id;
              const deviceName = detection.device_name;
              const value = parseFloat(detection.value) || 0;
              const detectionTime = detection.latest_detection_time;

              console.log('Processing detection:', { deviceId, deviceName, value });

              // 動態添加參數到數據點
              if (deviceName) {
                dataPoint[deviceName] = value;
                detectedParamsSet.add(deviceName);
                console.log(`設定 ${deviceName}:`, value, '時間:', datetime);
              }
              
              // 檢查是否為異常數值
              if (value < 0) {
                console.warn('發現異常數值:', { deviceName, value, datetime });
              }

              // 更新設備映射
              const equipmentKey = `${deviceId}_${deviceName}`;
              if (!equipmentMap.has(equipmentKey)) {
              equipmentMap.set(equipmentKey, {
                id: deviceId,
                name: deviceName || `設備-${deviceId}`,
                  values: {},
                status: getStatusByValue(value),
                lastUpdate: detectionTime || datetime
              });
              }
              
              const equipment = equipmentMap.get(equipmentKey);
              equipment.values[deviceName] = value;
              equipment.status = getStatusByValue(value);
            });
          }

          // 改善數據點處理：即使部分參數缺失也要保持時間連續性
          const hasAnyData = Object.keys(dataPoint).length > 2; // 除了time和datetime
          
          if (hasAnyData) {
            // 對於已知的參數類型，如果當前時間點沒有該參數，填入上一個時間點的值或null
            // 這樣可以避免曲線突然斷掉
            if (chartData.length > 0) {
              const lastDataPoint = chartData[chartData.length - 1];
              
              // 檢查每個已知參數，如果當前點缺失但上一點有，則進行插值或保持
              detectedParamsSet.forEach(param => {
                if (!(param in dataPoint) && (param in lastDataPoint)) {
                  // 如果當前點缺失該參數，但上一個點有，則使用上一個點的值
                  dataPoint[param] = lastDataPoint[param];
                  console.log(`填補缺失參數 ${param}:`, lastDataPoint[param], '時間:', datetime);
                }
              });
            }
            
            console.log('Final dataPoint:', dataPoint);
            chartData.push(dataPoint);
          } else {
            console.log('跳過完全空的數據點:', dataPoint);
          }

          // 更新最新數值（使用最後一個時間點的數據）
          if (index === sampledData.length - 1) {
            latestStats = { ...dataPoint };
            delete latestStats.time;
            delete latestStats.datetime;
          }
        } catch (e) {
          console.error('Error processing time point:', e, timePoint);
        }
      });
    }

    // 轉換設備映射為陣列
    const equipmentList = Array.from(equipmentMap.values());

    // 最終數據完整性修復：確保所有參數在所有時間點都有值
    const repairedChartData = chartData.map((dataPoint, index) => {
      const repairedPoint = { ...dataPoint };
      
      // 對每個檢測到的參數進行檢查
      detectedParamsSet.forEach(param => {
        if (!(param in repairedPoint) || repairedPoint[param] === undefined || repairedPoint[param] === null) {
          // 如果當前點缺失該參數，嘗試從前後點插值
          let filledValue = null;
          
          // 向前查找最近的有效值
          for (let i = index - 1; i >= 0; i--) {
            if (chartData[i][param] !== undefined && chartData[i][param] !== null) {
              filledValue = chartData[i][param];
              break;
            }
          }
          
          // 如果向前找不到，向後查找
          if (filledValue === null) {
            for (let i = index + 1; i < chartData.length; i++) {
              if (chartData[i][param] !== undefined && chartData[i][param] !== null) {
                filledValue = chartData[i][param];
                break;
              }
            }
          }
          
          // 如果找到有效值，則填入
          if (filledValue !== null) {
            repairedPoint[param] = filledValue;
            console.log(`修復缺失數據 ${param}:`, filledValue, '於時間:', dataPoint.time);
          }
        }
      });
      
      return repairedPoint;
    });

    console.log('Final processed data:', { 
      chartDataLength: repairedChartData.length, 
      sampleChartData: repairedChartData.slice(0, 2),
      latestStats, 
      equipmentListLength: equipmentList.length,
      detectedParams: Array.from(detectedParamsSet)
    });

    return {
      chartData: repairedChartData,
      latestStats,
      equipmentList,
      detectedParams: detectedParamsSet
    };
  };

  // 執行完整的前端分析
  const performAnalysis = (data, detectedParams) => {
    if (data.length === 0) {
      return {
        anomalies: [],
        healthScore: 0,
        correlation: 0,
        utilization: 0,
        energyEfficiency: 0,
        processCapability: {},
        distributions: {}
      };
    }

    const paramsArray = Array.from(detectedParams);
    
    // 1. 異常檢測
    const anomalies = detectAnomalies(data, paramsArray);
    
    // 2. 健康度評分
    const healthScore = calculateHealthScore(data, anomalies, paramsArray);
    
    // 如果計算結果為0且有數據，給一個基礎分數
    const adjustedHealthScore = (healthScore === 0 && data.length > 0) ? 
      Math.max(30, 100 - anomalies.length * 5) : healthScore;
    
    console.log('健康度計算結果:', {
      dataLength: data.length,
      anomaliesCount: anomalies.length,
      paramsCount: paramsArray.length,
      originalHealthScore: healthScore,
      adjustedHealthScore: adjustedHealthScore
    });
    
    // 3. 相關性分析 (如果有多個參數)
    const correlation = paramsArray.length >= 2 ? 
      calculateCorrelation(data, paramsArray[0], paramsArray[1]) : 0;
    
    // 4. 稼動率計算 (基於第一個參數，通常是電流)
    const mainParam = paramsArray[0];
    const utilization = mainParam ? calculateUtilization(data, mainParam) : 0;
    
    // 5. 能耗效率 (基於主要參數)
    const energyEfficiency = mainParam ? calculateEnergyEfficiency(data, mainParam) : 0;
    
    // 6. 製程能力指標
    const processCapability = {};
    paramsArray.forEach(param => {
      const values = data.map(d => d[param]).filter(v => v > 0);
      processCapability[param] = calculateProcessCapability(values);
    });
    
    // 7. 頻率分布
    const distributions = {};
    paramsArray.forEach(param => {
      const values = data.map(d => d[param]).filter(v => v > 0);
      distributions[param] = calculateDistribution(values);
    });

    return {
      anomalies,
      healthScore: adjustedHealthScore,
      correlation,
      utilization,
      energyEfficiency,
      processCapability,
      distributions
    };
  };

  // 根據參數名稱判斷單位
  const getParameterUnit = (paramName) => {
    const lowerName = paramName.toLowerCase();
    if (lowerName.includes('電流') || lowerName.includes('current')) {
      return 'A';
    } else if (lowerName.includes('溫度') || lowerName.includes('temperature')) {
      return '°C';
    } else if (lowerName.includes('電壓') || lowerName.includes('voltage')) {
      return 'V';
    } else if (lowerName.includes('功率') || lowerName.includes('power')) {
      return 'W';
    } else if (lowerName.includes('速度') || lowerName.includes('speed')) {
      return 'RPM';
    } else if (lowerName.includes('壓力') || lowerName.includes('pressure')) {
      return 'Bar';
    } else if (lowerName.includes('流量') || lowerName.includes('flow')) {
      return 'L/min';
    } else {
      return ''; // 無法判斷時不顯示單位
    }
  };

  // 動態異常檢測邏輯 - 調整為更敏感的檢測標準
  const detectAnomalies = (data, params) => {
    const anomalies = [];
    
    // 更敏感的閾值設定
    const getThresholds = (paramName) => {
      const lowerName = paramName.toLowerCase();
      if (lowerName.includes('電流') || lowerName.includes('current')) {
        return { 
          min: 2, max: 40, suddenChange: 15, // 降低閾值
          highWarning: 35, lowWarning: 5    // 新增警告閾值
        };
      } else if (lowerName.includes('溫度') || lowerName.includes('temperature')) {
        return { 
          min: 15, max: 60, suddenChange: 10, // 降低閾值
          highWarning: 55, lowWarning: 20     // 新增警告閾值
        };
      } else if (lowerName.includes('電壓') || lowerName.includes('voltage')) {
        return { 
          min: 180, max: 240, suddenChange: 20,
          highWarning: 230, lowWarning: 190
        };
      } else {
        // 默認更敏感的閾值
        return { 
          min: 1, max: 80, suddenChange: 15,
          highWarning: 70, lowWarning: 5
        };
      }
    };
    
    params.forEach(param => {
      const thresholds = getThresholds(param);
      const unit = getParameterUnit(param);
      
      data.forEach((point, index) => {
        const value = point[param];
        const prevPoint = index > 0 ? data[index - 1] : null;
        const nextPoint = index < data.length - 1 ? data[index + 1] : null;
        
        // 1. 嚴重異常檢測
        if (value > thresholds.max) {
          anomalies.push({
            time: point.time,
            type: `${param}_critical_high`,
            message: `${param}嚴重過高: ${value.toFixed(1)}${unit} (>${thresholds.max}${unit})`,
            severity: 'high',
            value: value,
            param: param
          });
        }
        
        if (value < thresholds.min && value > 0) {
          anomalies.push({
            time: point.time,
            type: `${param}_critical_low`,
            message: `${param}嚴重過低: ${value.toFixed(1)}${unit} (<${thresholds.min}${unit})`,
            severity: 'high',
            value: value,
            param: param
          });
        }
        
        // 2. 警告級異常檢測
        if (value > thresholds.highWarning && value <= thresholds.max) {
          anomalies.push({
            time: point.time,
            type: `${param}_warning_high`,
            message: `${param}偏高警告: ${value.toFixed(1)}${unit} (>${thresholds.highWarning}${unit})`,
            severity: 'medium',
            value: value,
            param: param
          });
        }
        
        if (value < thresholds.lowWarning && value >= thresholds.min) {
          anomalies.push({
            time: point.time,
            type: `${param}_warning_low`,
            message: `${param}偏低警告: ${value.toFixed(1)}${unit} (<${thresholds.lowWarning}${unit})`,
            severity: 'medium',
            value: value,
            param: param
          });
        }
        
        // 3. 突然變化檢測
        if (prevPoint && prevPoint[param] !== undefined) {
          const change = Math.abs(value - prevPoint[param]);
          if (change > thresholds.suddenChange) {
            anomalies.push({
              time: point.time,
              type: `${param}_spike`,
              message: `${param}突變: ${change.toFixed(1)}${unit} (前值:${prevPoint[param].toFixed(1)}${unit})`,
              severity: 'medium',
              value: change,
              param: param
            });
          }
        }
        
        // 4. 趨勢檢測 (連續上升/下降)
        if (prevPoint && nextPoint && prevPoint[param] !== undefined && nextPoint[param] !== undefined) {
          const prev = prevPoint[param];
          const next = nextPoint[param];
          
          // 連續上升趨勢
          if (prev < value && value < next && (next - prev) > thresholds.suddenChange * 0.5) {
            anomalies.push({
              time: point.time,
              type: `${param}_trend_up`,
              message: `${param}連續上升趨勢: ${prev.toFixed(1)}→${value.toFixed(1)}→${next.toFixed(1)}${unit}`,
              severity: 'low',
              value: next - prev,
              param: param
            });
          }
          
          // 連續下降趨勢
          if (prev > value && value > next && (prev - next) > thresholds.suddenChange * 0.5) {
            anomalies.push({
              time: point.time,
              type: `${param}_trend_down`,
              message: `${param}連續下降趨勢: ${prev.toFixed(1)}→${value.toFixed(1)}→${next.toFixed(1)}${unit}`,
              severity: 'low',
              value: prev - next,
              param: param
            });
          }
        }
        
        // 5. 數據品質檢測
        if (value === 0 && prevPoint && prevPoint[param] > 0) {
          anomalies.push({
            time: point.time,
            type: `${param}_data_loss`,
            message: `${param}數據中斷: 數值歸零 (前值:${prevPoint[param].toFixed(1)}${unit})`,
            severity: 'medium',
            value: 0,
            param: param
          });
        }
        
        // 6. 穩定性檢測 (在5個數據點內波動過大)
        if (index >= 4) {
          const recentValues = data.slice(index - 4, index + 1).map(d => d[param]);
          const recentMax = Math.max(...recentValues);
          const recentMin = Math.min(...recentValues);
          const fluctuation = recentMax - recentMin;
          
          if (fluctuation > thresholds.suddenChange * 1.5) {
            anomalies.push({
              time: point.time,
              type: `${param}_unstable`,
              message: `${param}不穩定: 近期波動${fluctuation.toFixed(1)}${unit} (範圍:${recentMin.toFixed(1)}-${recentMax.toFixed(1)}${unit})`,
              severity: 'low',
              value: fluctuation,
              param: param
            });
          }
        }
      });
    });
    
    // 按時間和嚴重程度排序
    return anomalies.sort((a, b) => {
      const severityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[b.severity] - severityOrder[a.severity];
      }
      return new Date(`2000-01-01 ${a.time}`) - new Date(`2000-01-01 ${b.time}`);
    });
  };

  // 動態健康度計算
  const calculateHealthScore = (data, anomalies, params) => {
    console.log('計算健康度 - 輸入參數:', { 
      dataLength: data.length, 
      anomaliesLength: anomalies.length, 
      paramsLength: params.length 
    });
    
    if (data.length === 0 || params.length === 0) {
      console.log('健康度計算返回0 - 數據或參數為空');
      return 0;
    }
    
    // 基礎分數
    let score = 100;
    console.log('初始健康度分數:', score);
    
    // 1. 異常扣分 (根據異常嚴重程度)
    const highSeverityCount = anomalies.filter(a => a.severity === 'high').length;
    const mediumSeverityCount = anomalies.filter(a => a.severity === 'medium').length;
    const lowSeverityCount = anomalies.filter(a => a.severity === 'low').length;
    
    console.log('異常統計:', { highSeverityCount, mediumSeverityCount, lowSeverityCount });
    
    // 嚴重異常大幅扣分
    score -= highSeverityCount * 15;
    // 警告異常中度扣分
    score -= mediumSeverityCount * 8;
    // 提示異常輕微扣分
    score -= lowSeverityCount * 3;
    
    console.log('異常扣分後分數:', score);
    
    // 2. 數據品質評分
    const totalDataPoints = data.length;
    let validDataPoints = 0;
    
    params.forEach(param => {
      const values = data.map(d => d[param]).filter(v => v != null && v >= 0);
      validDataPoints += values.length;
      console.log(`參數 ${param} 有效數據點:`, values.length);
    });
    
    const dataQuality = totalDataPoints > 0 ? (validDataPoints / (totalDataPoints * params.length)) : 0;
    console.log('數據品質:', dataQuality);
    
    // 避免數據品質過低導致分數歸零
    if (dataQuality > 0.1) { // 至少10%的數據有效才進行品質調整
      score = score * Math.max(0.5, dataQuality); // 最低保持50%的分數
    }
    
    console.log('數據品質調整後分數:', score);
    
    // 3. 穩定性加分 (基於所有參數的平均穩定性)
    let totalStability = 0;
    let validParams = 0;
    
    params.forEach(param => {
      const values = data.map(d => d[param]).filter(v => v != null && v >= 0);
      if (values.length > 1) {
        const stability = calculateStability(values);
        totalStability += stability;
        validParams++;
        console.log(`參數 ${param} 穩定性:`, stability);
      }
    });
    
    if (validParams > 0) {
      const avgStability = totalStability / validParams;
      const stabilityBonus = avgStability * 15;
      score += stabilityBonus;
      console.log('穩定性獎勵:', stabilityBonus);
    }
    
    // 4. 運行時間加分
    const runningTimeBonus = Math.min(10, totalDataPoints / 10); // 最多加10分
    score += runningTimeBonus;
    
    console.log('運行時間獎勵後分數:', score);
    
    // 確保分數在0-100範圍內
    const finalScore = Math.max(0, Math.min(100, Math.round(score)));
    console.log('最終健康度分數:', finalScore);
    
    return finalScore;
  };

  // 計算穩定性 (變異係數的倒數)
  const calculateStability = (values) => {
    const validValues = values.filter(v => v > 0);
    if (validValues.length === 0) return 0;
    
    const mean = validValues.reduce((a, b) => a + b, 0) / validValues.length;
    if (mean === 0) return 0;
    
    const variance = validValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / validValues.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / mean; // 變異係數
    
    return Math.max(0, Math.min(1, 1 - cv)); // 穩定性 = 1 - 變異係數，限制在0-1之間
  };

  // 根據數值判斷狀態
  const getStatusByValue = (value) => {
    if (value === 0) return 'offline';
    if (value > 0 && value < 10) return 'idle';
    if (value >= 10 && value < 100) return 'running';
    return 'error'; // 異常高值
  };

  // 格式化顯示時間
  const formatDisplayTime = (timestamp) => {
    if (!timestamp) return new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    try {
      // 處理 YYYYMMDDHHMMSS 格式 (14位數)
      if (timestamp.length === 14) {
        const year = timestamp.substring(0, 4);
        const month = timestamp.substring(4, 6);
        const day = timestamp.substring(6, 8);
        const hour = timestamp.substring(8, 10);
        const minute = timestamp.substring(10, 12);
        const second = timestamp.substring(12, 14);
        return `${hour}:${minute}:${second}`;
      }
      // 處理 YYYYMMDDHHMM 格式 (12位數)
      else if (timestamp.length === 12) {
        const hour = timestamp.substring(8, 10);
        const minute = timestamp.substring(10, 12);
        return `${hour}:${minute}`;
      }
      // 其他格式嘗試解析
      else {
        const date = new Date(timestamp);
        if (!isNaN(date.getTime())) {
          return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        }
        return timestamp; // 如果無法解析，直接返回原始字串
      }
    } catch (e) {
      console.error('Error formatting time:', e, timestamp);
      return timestamp || new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
    }
  };

  // 獲取狀態顏色
  const getStatusColor = (status) => {
    switch (status) {
      case 'running': return 'text-green-400 bg-green-900/20';
      case 'idle': return 'text-blue-400 bg-blue-900/20';
      case 'error': return 'text-red-400 bg-red-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  // 獲取狀態文字
  const getStatusText = (status) => {
    switch (status) {
      case 'running': return '加工中';
      case 'idle': return '閒置';
      case 'error': return '異常';
      default: return '離線';
    }
  };

  // 初始化設備列表
  useEffect(() => {
    const initDevices = async () => {
      try {
        const availableDevices = await factoryApi.equipmentProcess.getAvailableDevices();
        setDevices(availableDevices);
        
        if (availableDevices.length > 0 && !selectedDevice) {
          setSelectedDevice(availableDevices[0].id);
        }
      } catch (error) {
        console.error("Error loading devices:", error);
        // 使用真實後端設備列表
        const realDevices = [
          { 
            id: "1", 
            name: "設備2", 
            type: "CNC設備", 
            cam_index: "1",
            sensors: ["ID5-電流", "ID6-溫度"]
          },
          { 
            id: "2", 
            name: "設備3", 
            type: "CNC設備", 
            cam_index: "2",
            sensors: ["ID2-電流", "ID1-溫度"]
          }
        ];
        setDevices(realDevices);
        if (!selectedDevice) {
          setSelectedDevice(realDevices[0].cam_index); // 使用 cam_index 作為預設選擇
        }
      }
    };

    initDevices();
  }, [selectedDevice]);

  // 定期更新數據（保持用戶選擇的日期範圍不變）
  useEffect(() => {
    if (selectedDevice) {
      const interval = setInterval(() => {
        // 只在用戶選擇的時間範圍內更新數據，不修改日期
        console.log('定期更新數據，保持用戶選擇的時間範圍');
        fetchEquipmentData();
      }, 10000); // 每10秒更新一次數據

      return () => clearInterval(interval);
    }
  }, [selectedDevice, fetchEquipmentData]);

  // 當選中設備或時間範圍改變時獲取數據
  useEffect(() => {
    if (selectedDevice) {
      fetchEquipmentData();
    }
  }, [selectedDevice, dateRange, fetchEquipmentData]);

  // 計算相關性係數 (電流與溫度)
  const calculateCorrelation = (data, param1, param2) => {
    const pairs = data.filter(d => d[param1] > 0 && d[param2] > 0)
                     .map(d => ({ x: d[param1], y: d[param2] }));
    
    if (pairs.length < 2) return 0;
    
    const n = pairs.length;
    const sumX = pairs.reduce((sum, p) => sum + p.x, 0);
    const sumY = pairs.reduce((sum, p) => sum + p.y, 0);
    const sumXY = pairs.reduce((sum, p) => sum + p.x * p.y, 0);
    const sumX2 = pairs.reduce((sum, p) => sum + p.x * p.x, 0);
    const sumY2 = pairs.reduce((sum, p) => sum + p.y * p.y, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  };

  // 計算頻率分布
  const calculateDistribution = (values, binCount = 10) => {
    if (values.length === 0) return [];
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    const binWidth = (max - min) / binCount;
    
    const bins = Array.from({ length: binCount }, (_, i) => ({
      range: `${(min + i * binWidth).toFixed(1)}-${(min + (i + 1) * binWidth).toFixed(1)}`,
      count: 0,
      percentage: 0
    }));
    
    values.forEach(value => {
      const binIndex = Math.min(Math.floor((value - min) / binWidth), binCount - 1);
      bins[binIndex].count++;
    });
    
    bins.forEach(bin => {
      bin.percentage = ((bin.count / values.length) * 100).toFixed(1);
    });
    
    return bins;
  };

  // 計算製程能力指標 (Cp, Cpk)
  const calculateProcessCapability = (values, lsl = 0, usl = 100) => {
    const validValues = values.filter(v => v > 0);
    if (validValues.length === 0) return { cp: 0, cpk: 0, sigma: 0 };
    
    const mean = validValues.reduce((a, b) => a + b, 0) / validValues.length;
    const variance = validValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / validValues.length;
    const sigma = Math.sqrt(variance);
    
    const cp = (usl - lsl) / (6 * sigma);
    const cpkUpper = (usl - mean) / (3 * sigma);
    const cpkLower = (mean - lsl) / (3 * sigma);
    const cpk = Math.min(cpkUpper, cpkLower);
    
    return { cp: cp.toFixed(3), cpk: cpk.toFixed(3), sigma: sigma.toFixed(2) };
  };

  // 計算稼動率
  const calculateUtilization = (data, param) => {
    if (data.length === 0) return 0;
    
    const runningPoints = data.filter(d => d[param] > 10).length; // 電流>10A視為運行
    const totalPoints = data.length;
    
    return ((runningPoints / totalPoints) * 100).toFixed(1);
  };

  // 計算能耗效率 (假設的生產效率指標)
  const calculateEnergyEfficiency = (data, param) => {
    if (data.length === 0) return 0;
    
    const totalEnergy = data.reduce((sum, d) => sum + d[param], 0);
    const averageEnergy = totalEnergy / data.length;
    const runningTime = data.filter(d => d[param] > 10).length;
    
    // 簡化的能耗效率計算：運行時間 / 平均耗電
    return runningTime === 0 ? 0 : (runningTime / averageEnergy).toFixed(2);
  };

  return (
    <div className="space-y-6">
      {/* 狀態顯示欄 */}
      <StatusBar summary={summary} devices={statusDevices} loading={statusLoading} />

      {/* 控制面板 */}
      <div className="bg-[#0B1015] p-4 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
          {/* 設備選擇 */}
          <div>
            <label className="text-gray-400 text-sm block mb-1">選擇設備</label>
            <select
              className="w-full bg-gray-800 text-white px-3 py-2.5 rounded-md border border-gray-700"
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
            >
              <option value="">請選擇設備</option>
              {devices.map((device) => (
                <option key={device.id} value={device.cam_index}>
                  {device.name} - {device.type} (cam_index: {device.cam_index})
                </option>
              ))}
            </select>
          </div>

          {/* 開始日期 */}
          <div>
            <label className="text-gray-400 text-sm block mb-1">開始日期</label>
            <input
              type="date"
              className="w-full bg-gray-800 text-white px-3 py-2 rounded-md border border-gray-700"
              value={dateRange.startDate}
              onChange={(e) => {
                setDateRange({...dateRange, startDate: e.target.value});
                setUserModifiedTime(true); // 標記用戶修改了時間
              }}
            />
          </div>

          {/* 開始時間 */}
          <div>
            <label className="text-gray-400 text-sm block mb-1">開始時間</label>
            <input
              type="time"
              className="w-full bg-gray-800 text-white px-3 py-2 rounded-md border border-gray-700"
              value={dateRange.startTime}
              min="00:00"
              max="23:59"
              onChange={(e) => {
                setDateRange({...dateRange, startTime: e.target.value});
                setUserModifiedTime(true); // 標記用戶修改了時間
              }}
            />
          </div>

          {/* 結束日期 */}
          <div>
            <label className="text-gray-400 text-sm block mb-1">結束日期</label>
            <input
              type="date"
              className="w-full bg-gray-800 text-white px-3 py-2 rounded-md border border-gray-700"
              value={dateRange.endDate}
              onChange={(e) => {
                setDateRange({...dateRange, endDate: e.target.value});
                setUserModifiedTime(true); // 標記用戶修改了時間
              }}
            />
          </div>

          {/* 結束時間 */}
          <div>
            <label className="text-gray-400 text-sm block mb-1">結束時間</label>
            <input
              type="time"
              className="w-full bg-gray-800 text-white px-3 py-2 rounded-md border border-gray-700"
              value={dateRange.endTime}
              min="00:00"
              max="23:59"
              onChange={(e) => {
                setDateRange({...dateRange, endTime: e.target.value});
                setUserModifiedTime(true); // 標記用戶修改了時間
              }}
            />
          </div>

          {/* 查詢按鈕 */}
          <div>
            <button
              onClick={fetchEquipmentData}
              disabled={!selectedDevice || loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2.5 rounded-md transition-colors"
            >
              {loading ? '查詢中...' : '查詢數據'}
            </button>
          </div>
        </div>

        {/* 狀態指示 */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-4">
            {loading && (
              <div className="flex items-center text-blue-400">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400 border-t-transparent mr-2" />
                <span className="text-sm">更新中...</span>
              </div>
            )}
            {userModifiedTime && (
              <div className="flex items-center text-green-400">
                <span className="text-sm">✓ 使用自訂時間範圍</span>
              </div>
            )}
          </div>
          {lastUpdate && (
            <div className="text-gray-400 text-sm">
              最後更新: {lastUpdate.toLocaleTimeString('zh-TW')}
            </div>
          )}
        </div>

        {error && (
          <div className="mt-2 text-red-400 text-sm p-2 bg-red-900/20 rounded">{error}</div>
        )}
      </div>

      {/* 趨勢圖 - 移至上方 */}
      <Card className="p-6 bg-gray-900 text-white">
        <h3 className="text-lg font-semibold mb-4">
          設備參數趨勢分析
          {selectedDevice && devices.find(d => d.id === selectedDevice) && 
            ` - ${devices.find(d => d.id === selectedDevice).name}`}
        </h3>
        <div className="h-[500px]">
          {equipmentData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={equipmentData}
                margin={{
                  top: 20,
                  right: 50,
                  left: 60,
                  bottom: 80,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="time"
                  stroke="#9CA3AF"
                  tick={{ fill: "#9CA3AF", fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={equipmentData.length > 20 ? Math.max(Math.floor(equipmentData.length / 10), 0) : 0}
                  tickFormatter={(value) => {
                    // 只顯示部分時間標籤，減少擠壓
                    return value;
                  }}
                  label={{ 
                    value: '時間 (Time)', 
                    position: 'insideBottom', 
                    offset: -10,
                    style: { textAnchor: 'middle', fill: '#9CA3AF', fontSize: '14px' }
                  }}
                />
                {/* 動態生成Y軸 */}
                {Array.from(detectedParams).map((param, index) => {
                  const colors = ['#FBBF24', '#EF4444', '#3B82F6', '#10B981', '#8B5CF6'];
                  const color = colors[index % colors.length];
                  const orientation = index % 2 === 0 ? 'left' : 'right';
                  
                  return (
                <YAxis
                      key={param}
                      yAxisId={param}
                      orientation={orientation}
                      stroke={color}
                      tick={{ fill: color, fontSize: 12 }}
                  label={{
                        value: param,
                        angle: orientation === 'left' ? -90 : 90,
                        position: orientation === 'left' ? 'insideLeft' : 'insideRight',
                        style: { textAnchor: 'middle', fill: color, fontSize: '14px' }
                  }}
                  domain={['dataMin - 1', 'dataMax + 1']}
                />
                  );
                })}
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "none",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                  itemStyle={{ color: "#E5E7EB" }}
                  labelStyle={{ color: "#E5E7EB", fontWeight: "bold" }}
                  formatter={(value, name) => [
                    `${value.toFixed(2)}`,
                    name
                  ]}
                />
                <Legend
                  verticalAlign="top"
                  height={36}
                  wrapperStyle={{
                    paddingBottom: "20px",
                    color: "#9CA3AF",
                  }}
                />
                {/* 動態生成數據線 */}
                {Array.from(detectedParams).map((param, index) => {
                  const colors = ['#FBBF24', '#EF4444', '#3B82F6', '#10B981', '#8B5CF6'];
                  const color = colors[index % colors.length];
                  
                  return (
                <Line
                      key={param}
                      yAxisId={param}
                  type="monotone"
                      dataKey={param}
                      name={param}
                      stroke={color}
                  strokeWidth={2}
                      dot={equipmentData.length > 50 ? false : { fill: color, strokeWidth: 1, r: 2 }}
                      activeDot={{ r: 5, fill: color, stroke: "#FFF", strokeWidth: 2 }}
                      connectNulls={true}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              {loading ? '載入中...' : '請選擇設備並設定時間範圍查詢數據'}
            </div>
          )}
        </div>
      </Card>

      {/* 智能分析面板 */}
      {equipmentData.length > 0 && (
        <>
          {/* 設備健康度與KPI總覽 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 bg-gray-900 text-white">
              <div className="text-center">
                <div className={`text-3xl font-bold mb-2 ${
                  (analysisData.healthScore || 0) >= 80 ? 'text-green-400 health-score-glow light-breathing-green' :
                  (analysisData.healthScore || 0) >= 60 ? 'text-yellow-400 light-breathing-yellow' : 'text-red-400 light-breathing-red'
                }`}>
                  {analysisData.healthScore || 0}/100
              </div>
                <div className="text-gray-300 text-sm font-medium">設備健康度</div>
                                <div className="text-xs text-gray-500 mb-3">
                  {(analysisData.healthScore || 0) >= 80 ? (
                    <span>
                      <span className="status-dot-blink-green">🟢</span> 優良
                    </span>
                  ) : (analysisData.healthScore || 0) >= 60 ? (
                    <span>
                      <span className="status-dot-blink-yellow">🟡</span> 正常
                    </span>
                  ) : (
                    <span>
                      <span className="status-dot-blink-red">🔴</span> 需注意
                    </span>
                  )}
                </div>
                <div className="w-full health-progress-bar rounded-full h-3 relative overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ease-out ${
                      (analysisData.healthScore || 0) >= 80 ? 'health-progress-fill progress-breathing-green' :
                      (analysisData.healthScore || 0) >= 60 ? 'health-progress-fill warning progress-breathing-yellow' : 'health-progress-fill danger progress-breathing-red'
                    }`}
                    style={{ width: `${analysisData.healthScore || 0}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
              </div>
            </div>
                <div className="text-xs text-gray-500 mt-2">
                  基於 {equipmentData.length} 筆數據分析
              </div>
            </div>
            </Card>

            <Card className="p-4 bg-gray-900 text-white">
              <div className="text-center">
                <div className={`text-3xl font-bold mb-2 ${
                  (analysisData.utilization || 0) >= 80 ? 'text-blue-400 light-breathing-blue' :
                  (analysisData.utilization || 0) >= 60 ? 'text-yellow-400 light-breathing-yellow' : 'text-red-400 light-breathing-red'
                }`}>
                  {analysisData.utilization || 0}%
              </div>
                <div className="text-gray-300 text-sm font-medium">設備稼動率</div>
                                <div className="text-xs text-gray-500 mb-3">
                  {(analysisData.utilization || 0) >= 80 ? (
                    <span>
                      <span className="status-dot-blink-green">🟢</span> 高效運行
                    </span>
                  ) : (analysisData.utilization || 0) >= 60 ? (
                    <span>
                      <span className="status-dot-blink-yellow">🟡</span> 正常運行
                    </span>
                  ) : (
                    <span>
                      <span className="status-dot-blink-red">🔴</span> 運行不足
                    </span>
                  )}
                </div>
                <div className="w-full health-progress-bar rounded-full h-3 relative overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ease-out ${
                      (analysisData.utilization || 0) >= 80 ? 'bg-gradient-to-r from-blue-500 to-blue-400 progress-breathing-blue' :
                      (analysisData.utilization || 0) >= 60 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400 progress-breathing-yellow' : 'bg-gradient-to-r from-red-500 to-red-400 progress-breathing-red'
                    }`}
                    style={{ width: `${analysisData.utilization || 0}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
          </div>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  運行時間占比分析
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-gray-900 text-white">
                <div className="text-center">
                <div className={`text-3xl font-bold mb-2 ${
                  (parseFloat(analysisData.energyEfficiency) || 0) >= 1.5 ? 'text-green-400 light-breathing-green' :
                  (parseFloat(analysisData.energyEfficiency) || 0) >= 1.0 ? 'text-yellow-400 light-breathing-yellow' : 'text-red-400 light-breathing-red'
                }`}>
                  {analysisData.energyEfficiency || '0.00'}
                  </div>
                <div className="text-gray-300 text-sm font-medium">能耗效率指標</div>
                <div className="text-xs text-gray-500 mb-3">
                  {(parseFloat(analysisData.energyEfficiency) || 0) >= 1.5 ? (
                    <span>
                      <span className="status-dot-blink-green">🟢</span> 高效節能
                    </span>
                  ) : (parseFloat(analysisData.energyEfficiency) || 0) >= 1.0 ? (
                    <span>
                      <span className="status-dot-blink-yellow">🟡</span> 標準效率
                    </span>
                  ) : (
                    <span>
                      <span className="status-dot-blink-red">🔴</span> 效率偏低
                    </span>
                  )}
                </div>
                <div className="w-full health-progress-bar rounded-full h-3 relative overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ease-out ${
                      (parseFloat(analysisData.energyEfficiency) || 0) >= 1.5 ? 'bg-gradient-to-r from-green-500 to-green-400 progress-breathing-green' :
                      (parseFloat(analysisData.energyEfficiency) || 0) >= 1.0 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400 progress-breathing-yellow' : 'bg-gradient-to-r from-red-500 to-red-400 progress-breathing-red'
                    }`}
                    style={{ width: `${Math.min(100, (parseFloat(analysisData.energyEfficiency) || 0) * 50)}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  運行效率 / 平均耗能
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-gray-900 text-white">
                <div className="text-center">
                <div className={`text-3xl font-bold mb-2 ${
                  analysisData.anomalies.length === 0 ? 'text-green-400 light-breathing-green' :
                  analysisData.anomalies.filter(a => a.severity === 'high').length > 0 ? 'text-red-400 light-breathing-red' :
                  analysisData.anomalies.filter(a => a.severity === 'medium').length > 0 ? 'text-yellow-400 light-breathing-yellow' : 'text-blue-400 light-breathing-blue'
                }`}>
                  {analysisData.anomalies.length}
                  </div>
                <div className="text-gray-300 text-sm font-medium">異常事件總數</div>
                <div className="text-xs text-gray-500 mb-3">
                  {analysisData.anomalies.length === 0 ? (
                    <span>
                      <span className="status-dot-blink-green">🟢</span> 運行正常
                    </span>
                  ) : analysisData.anomalies.filter(a => a.severity === 'high').length > 0 ? (
                    <span>
                      <span className="status-dot-blink-red">🔴</span> 需要關注
                    </span>
                  ) : analysisData.anomalies.filter(a => a.severity === 'medium').length > 0 ? (
                    <span>
                      <span className="status-dot-blink-yellow">🟡</span> 輕微異常
                    </span>
                  ) : (
                    <span>
                      <span className="status-dot-blink-blue">🔵</span> 狀況良好
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-1 mb-3">
                  <div className="bg-red-900/30 rounded px-2 py-1">
                    <div className="text-red-400 text-sm font-bold light-breathing-red">
                      {analysisData.anomalies.filter(a => a.severity === 'high').length}
              </div>
                    <div className="text-xs text-gray-400">嚴重</div>
            </div>
                  <div className="bg-yellow-900/30 rounded px-2 py-1">
                    <div className="text-yellow-400 text-sm font-bold light-breathing-yellow">
                      {analysisData.anomalies.filter(a => a.severity === 'medium').length}
                    </div>
                    <div className="text-xs text-gray-400">警告</div>
                  </div>
                  <div className="bg-blue-900/30 rounded px-2 py-1">
                    <div className="text-blue-400 text-sm font-bold light-breathing-blue">
                      {analysisData.anomalies.filter(a => a.severity === 'low').length}
                    </div>
                    <div className="text-xs text-gray-400">提示</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  基於 {equipmentData.length} 筆數據檢測
                </div>
              </div>
            </Card>
          </div>

          {/* 異常預警面板 - 優化顯示 */}
          {analysisData.anomalies.length > 0 && (
            <Card className="p-6 bg-gray-900 border border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <span className="mr-2">🚨</span>
                  異常事件警報
                </h3>
                <div className="flex gap-2 text-xs">
                  <span className="px-2 py-1 bg-red-600 text-white rounded">
                    嚴重 {analysisData.anomalies.filter(a => a.severity === 'high').length}
                  </span>
                  <span className="px-2 py-1 bg-yellow-600 text-black rounded">
                    警告 {analysisData.anomalies.filter(a => a.severity === 'medium').length}
                  </span>
                  <span className="px-2 py-1 bg-blue-600 text-white rounded">
                    提示 {analysisData.anomalies.filter(a => a.severity === 'low').length}
                    </span>
                  </div>
              </div>
              
              <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                {analysisData.anomalies.map((anomaly, index) => {
                  const severityConfig = {
                    'high': { 
                      bg: 'bg-red-800/30 border-red-600', 
                      text: 'text-red-300',
                      badge: 'bg-red-600 text-white',
                      icon: '🔴',
                      label: '嚴重'
                    },
                    'medium': { 
                      bg: 'bg-yellow-800/30 border-yellow-600', 
                      text: 'text-yellow-300',
                      badge: 'bg-yellow-600 text-black',
                      icon: '🟡',
                      label: '警告'
                    },
                    'low': { 
                      bg: 'bg-blue-800/30 border-blue-600', 
                      text: 'text-blue-300',
                      badge: 'bg-blue-600 text-white',
                      icon: '🔵',
                      label: '提示'
                    }
                  };
                  
                  const config = severityConfig[anomaly.severity];
                  
                  return (
                    <div 
                      key={index} 
                      className={`p-3 rounded-md border ${config.bg}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm">{config.icon}</span>
                            <span className="text-xs text-gray-400">[{anomaly.time}]</span>
                            <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-300">
                              {anomaly.param}
                    </span>
                  </div>
                          <span className={`font-medium ${config.text} text-sm`}>
                            {anomaly.message}
                    </span>
                  </div>
                        <span className={`text-xs px-2 py-1 rounded ml-3 ${config.badge}`}>
                          {config.label}
                        </span>
                </div>
              </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* 無異常時的友善提示 */}
          {analysisData.anomalies.length === 0 && (
            <Card className="p-6 bg-green-900/20 border border-green-800">
              <div className="text-center">
                <div className="text-4xl mb-2">✅</div>
                <h3 className="text-lg font-semibold text-green-400 mb-2">設備運行正常</h3>
                <p className="text-gray-400 text-sm">
                  所有參數均在正常範圍內，未檢測到異常事件
                </p>
              </div>
            </Card>
          )}

          {/* 統計分析面板 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 製程能力指標 */}
            <Card className="p-6 bg-gray-900 text-white">
              <h3 className="text-lg font-semibold mb-4">製程能力指標</h3>
              <div className="space-y-4">
                {Array.from(detectedParams).map(param => (
                  <div key={param} className="bg-gray-800 p-4 rounded-lg">
                    <h4 className="font-medium text-cyan-400 mb-2 light-breathing-cyan">{param}</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-white font-bold">
                          {analysisData.processCapability[param]?.cp || '0.000'}
                        </div>
                        <div className="text-gray-400">Cp</div>
                      </div>
                      <div className="text-center">
                        <div className="text-white font-bold">
                          {analysisData.processCapability[param]?.cpk || '0.000'}
                        </div>
                        <div className="text-gray-400">Cpk</div>
                      </div>
                      <div className="text-center">
                        <div className="text-white font-bold">
                          {analysisData.processCapability[param]?.sigma || '0.00'}
                        </div>
                        <div className="text-gray-400">σ</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* 相關性分析 */}
            {Array.from(detectedParams).length >= 2 && (
              <Card className="p-6 bg-gray-900 text-white">
                <h3 className="text-lg font-semibold mb-4">參數相關性分析</h3>
                <div className="bg-gray-800 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-400 light-breathing-cyan">
                    {analysisData.correlation.toFixed(3)}
                  </div>
                  <div className="text-gray-400 text-sm mt-1">
                    {Array.from(detectedParams)[0]} vs {Array.from(detectedParams)[1]}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    相關係數 (-1 ~ 1, 越接近±1相關性越強)
                  </div>
                </div>
                <div className="mt-4 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">相關性強度:</span>
                    <span className={`font-medium ${
                      Math.abs(analysisData.correlation) > 0.7 ? 'text-green-400' :
                      Math.abs(analysisData.correlation) > 0.3 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {Math.abs(analysisData.correlation) > 0.7 ? '強相關' :
                       Math.abs(analysisData.correlation) > 0.3 ? '中等相關' : '弱相關'}
                    </span>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* 頻率分布分析 */}
          <Card className="p-6 bg-gray-900 text-white">
            <h3 className="text-lg font-semibold mb-4">參數分布分析</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Array.from(detectedParams).map((param, paramIndex) => (
                <div key={param} className="bg-gray-800 p-4 rounded-lg">
                  <h4 className={`font-medium mb-3 ${
                    paramIndex === 0 ? 'text-cyan-400 light-breathing-cyan' :
                    paramIndex === 1 ? 'text-yellow-400 light-breathing-yellow' :
                    paramIndex === 2 ? 'text-red-400 light-breathing-red' :
                    paramIndex === 3 ? 'text-blue-400 light-breathing-blue' : 'text-green-400 light-breathing-green'
                  }`}>{param} 分布</h4>
                  <div className="space-y-2">
                    {analysisData.distributions[param]?.map((bin, index) => (
                      <div key={index} className="flex items-center">
                        <div className="w-20 text-xs text-gray-400">
                          {bin.range}
                        </div>
                        <div className="flex-1 mx-2">
                          <div className="bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-blue-400 h-2 rounded-full"
                              style={{ width: `${bin.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className={`w-12 text-xs text-white text-right ${
                          paramIndex === 0 ? 'light-breathing-cyan' :
                          paramIndex === 1 ? 'light-breathing-yellow' :
                          paramIndex === 2 ? 'light-breathing-red' :
                          paramIndex === 3 ? 'light-breathing-blue' : 'light-breathing-green'
                        }`}>
                          {bin.percentage}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {/* 設備數據統計面板 - 優化排版與單位顯示 */}
      {equipmentData.length > 0 && (
        <Card className="p-6 bg-gray-900 text-white">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">設備數據統計</h3>
            <div className="text-sm text-gray-400">
              📅 {dateRange.startDate} {dateRange.startTime} ~ {dateRange.endDate} {dateRange.endTime}
            </div>
          </div>
          
          {/* 基本統計資訊 */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            {/* 數據點數統計 */}
            <div className="bg-cyan-900/20 border border-cyan-500/30 p-4 rounded-lg text-center">
              <div className="text-cyan-400 text-2xl font-bold mb-2 light-breathing-cyan">
                {equipmentData.length}
              </div>
              <div className="text-gray-300 text-sm font-medium">數據筆數</div>
              <div className="text-xs text-gray-500 mt-1">採樣間隔: 自動</div>
            </div>

            {/* 動態參數統計 */}
            {Array.from(detectedParams).map((param, index) => {
              const colors = ['text-yellow-400', 'text-red-400', 'text-blue-400', 'text-green-400'];
              const bgColors = ['bg-yellow-900/20', 'bg-red-900/20', 'bg-blue-900/20', 'bg-green-900/20'];
              const borderColors = ['border-yellow-500/30', 'border-red-500/30', 'border-blue-500/30', 'border-green-500/30'];
              
              const colorClass = colors[index % colors.length];
              const bgClass = bgColors[index % bgColors.length];
              const borderClass = borderColors[index % borderColors.length];
              const values = equipmentData.map(d => d[param]).filter(v => v > 0);
              const maxValue = values.length > 0 ? Math.max(...values) : 0;
              const avgValue = values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;
              const unit = getParameterUnit(param);
              
              return (
                <div key={param} className={`${bgClass} border ${borderClass} p-4 rounded-lg text-center`}>
                  <div className={`${colorClass} text-2xl font-bold mb-2 ${
                    index === 0 ? 'light-breathing-yellow' :
                    index === 1 ? 'light-breathing-red' :
                    index === 2 ? 'light-breathing-blue' : 'light-breathing-green'
                  }`}>
                    {maxValue.toFixed(1)}{unit}
                  </div>
                  <div className="text-gray-300 text-sm font-medium">{param}</div>
                  <div className="text-xs text-gray-500 mt-1">最大值 | 均值: {avgValue.toFixed(1)}{unit}</div>
                </div>
              );
            })}
          </div>

          {/* 即時數據面板 */}
          {currentStats && Object.keys(currentStats).length > 0 && (
            <div className="mb-8">
              <h4 className="text-white font-medium mb-4 flex items-center">
                <span className="mr-2">⚡</span>
                即時監控數值
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from(detectedParams).map((param, index) => {
                  const colors = ['text-yellow-400', 'text-red-400', 'text-blue-400', 'text-green-400'];
                  const bgColors = ['bg-yellow-900/20', 'bg-red-900/20', 'bg-blue-900/20', 'bg-green-900/20'];
                  const borderColors = ['border-yellow-500/30', 'border-red-500/30', 'border-blue-500/30', 'border-green-500/30'];
                  
                  const colorClass = colors[index % colors.length];
                  const bgClass = bgColors[index % bgColors.length];
                  const borderClass = borderColors[index % borderColors.length];
                  const value = currentStats[param] || 0;
                  const unit = getParameterUnit(param);
                  
                  return (
                    <div key={param} className={`${bgClass} border ${borderClass} p-4 rounded-lg text-center`}>
                                          <div className={`${colorClass} text-2xl font-bold mb-2 ${
                      index === 0 ? 'light-breathing-yellow' :
                      index === 1 ? 'light-breathing-red' :
                      index === 2 ? 'light-breathing-blue' : 'light-breathing-green'
                    }`}>
                      {value.toFixed(1)}{unit}
                    </div>
                      <div className="text-gray-300 text-sm font-medium">{param}</div>
                      <div className="text-xs text-gray-500 mt-1">即時值</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 詳細數據範圍分析 */}
          {equipmentData.length > 0 && (
            <div>
              <h4 className="text-white font-medium mb-4 flex items-center">
                <span className="mr-2">📊</span>
                參數範圍分析
              </h4>
              <div className={`grid grid-cols-1 lg:grid-cols-${Math.min(detectedParams.size, 2)} gap-6`}>
                {Array.from(detectedParams).map((param, index) => {
                  const colors = ['text-yellow-400', 'text-red-400', 'text-blue-400', 'text-green-400'];
                  const colorClass = colors[index % colors.length];
                  const values = equipmentData.map(d => d[param]).filter(v => v >= 0);
                  const unit = getParameterUnit(param);
                  
                  const maxVal = values.length > 0 ? Math.max(...values) : 0;
                  const minVal = values.length > 0 ? Math.min(...values) : 0;
                  const avgVal = values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;
                  const range = maxVal - minVal;
                  
                  return (
                    <div key={param} className="bg-gray-800 p-5 rounded-lg border border-gray-600">
                      <h5 className={`${colorClass} font-semibold mb-4 text-lg`}>{param} 統計</h5>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">最大值:</span>
                            <span className={`${colorClass} font-bold ${
                              index === 0 ? 'light-breathing-yellow' :
                              index === 1 ? 'light-breathing-red' :
                              index === 2 ? 'light-breathing-blue' : 'light-breathing-green'
                            }`}>
                              {maxVal.toFixed(2)}{unit}
                    </span>
                  </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">最小值:</span>
                            <span className={`${colorClass} font-bold ${
                              index === 0 ? 'light-breathing-yellow' :
                              index === 1 ? 'light-breathing-red' :
                              index === 2 ? 'light-breathing-blue' : 'light-breathing-green'
                            }`}>
                              {minVal.toFixed(2)}{unit}
                    </span>
                  </div>
                </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">平均值:</span>
                            <span className={`${colorClass} font-bold ${
                              index === 0 ? 'light-breathing-yellow' :
                              index === 1 ? 'light-breathing-red' :
                              index === 2 ? 'light-breathing-blue' : 'light-breathing-green'
                            }`}>
                              {avgVal.toFixed(2)}{unit}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">變化範圍:</span>
                            <span className={`${colorClass} font-bold ${
                              index === 0 ? 'light-breathing-yellow' :
                              index === 1 ? 'light-breathing-red' :
                              index === 2 ? 'light-breathing-blue' : 'light-breathing-green'
                            }`}>
                              {range.toFixed(2)}{unit}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* 數據品質指標 */}
                      <div className="mt-4 pt-3 border-t border-gray-700">
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <div className="text-xs text-gray-500">有效數據</div>
                            <div className={`text-white text-sm font-medium ${
                              index === 0 ? 'light-breathing-yellow' :
                              index === 1 ? 'light-breathing-red' :
                              index === 2 ? 'light-breathing-blue' : 'light-breathing-green'
                            }`}>
                              {values.length}/{equipmentData.length}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">數據完整性</div>
                            <div className={`text-white text-sm font-medium ${
                              index === 0 ? 'light-breathing-yellow' :
                              index === 1 ? 'light-breathing-red' :
                              index === 2 ? 'light-breathing-blue' : 'light-breathing-green'
                            }`}>
                              {((values.length / equipmentData.length) * 100).toFixed(1)}%
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">變異係數</div>
                            <div className={`text-white text-sm font-medium ${
                              index === 0 ? 'light-breathing-yellow' :
                              index === 1 ? 'light-breathing-red' :
                              index === 2 ? 'light-breathing-blue' : 'light-breathing-green'
                            }`}>
                              {avgVal > 0 ? ((Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - avgVal, 2), 0) / values.length) / avgVal) * 100).toFixed(1) : '0.0'}%
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};