import { format, subDays } from "date-fns";

export const mockMachines = [
  {
    id: "T15", // 機台編號
    status: "running", // 運行狀態：running/idle/error/offline
    connected: true, // 連線狀態
    workCount: 63, // 加工數量
    efficiency: 55.83, // 效率百分比
    warning: true, // 警告狀態
    statusDetails: {
      // 狀態詳細數據
      error: 0.0, // 異常時間比例
      idle: 44.17, // 閒置時間比例
      running: 55.83, // 運行時間比例
    },
  },
  {
    id: "T09",
    status: "idle",
    connected: true,
    workCount: 0,
    efficiency: 44.77,
    warning: true,
    statusDetails: {
      error: 0.0,
      idle: 55.23,
      running: 44.77,
    },
  },
  {
    id: "T16",
    status: "running",
    connected: true,
    workCount: 3289,
    efficiency: 95.37,
    warning: true,
    statusDetails: {
      error: 0.0,
      idle: 4.63,
      running: 95.37,
    },
  },
  {
    id: "T23",
    status: "error",
    connected: true,
    workCount: 1567,
    efficiency: 32.45,
    warning: true,
    statusDetails: {
      error: 35.5,
      idle: 32.05,
      running: 32.45,
    },
  },
  {
    id: "T04",
    status: "offline",
    connected: false,
    workCount: 0,
    efficiency: 0,
    warning: false,
    statusDetails: {
      error: 0,
      idle: 0,
      running: 0,
    },
  },
  {
    id: "T11",
    status: "running",
    connected: true,
    workCount: 892,
    efficiency: 78.92,
    warning: false,
    statusDetails: {
      error: 0.0,
      idle: 21.08,
      running: 78.92,
    },
  },
];

// 獲取狀態匯總數據
// 添加 getStatusSummary 函數
export const getStatusSummary = () => {
  // 計算各狀態機台數量
  // 計算平均效率
  // 返回匯總數據
  const summary = mockMachines.reduce(
    (acc, machine) => {
      switch (machine.status) {
        case "running":
          acc.running += 1;
          break;
        case "idle":
          acc.idle += 1;
          break;
        case "error":
          acc.error += 1;
          break;
        case "offline":
          acc.offline += 1;
          break;
      }
      return acc;
    },
    {
      running: 0,
      idle: 0,
      error: 0,
      offline: 0,
    },
  );

  // 計算總數
  const total = Object.values(summary).reduce((a, b) => a + b, 0);

  // 計算平均稼動率
  const averageEfficiency =
    mockMachines
      .filter((m) => m.status !== "offline")
      .reduce((sum, machine) => sum + machine.efficiency, 0) /
    (total - summary.offline || 1);

  return {
    ...summary,
    total,
    averageEfficiency: averageEfficiency.toFixed(2),
  };
};

// 添加 getOEEStats 函數
export const getOEEStats = () => {
  const summary = getStatusSummary();

  return {
    daily: {
      labels: ["運行", "待機", "異常", "離線"],
      data: [summary.running, summary.idle, summary.error, summary.offline],
    },
    weekly: {
      labels: ["週一", "週二", "週三", "週四", "週五"],
      data: [75, 82, 68, 79, 85],
    },
    monthly: {
      efficiency: parseFloat(summary.averageEfficiency),
      availability: 85.2,
      quality: 98.3,
    },
    current: {
      running: summary.running,
      idle: summary.idle,
      error: summary.error,
      offline: summary.offline,
    },
    averageOEE: summary.averageEfficiency,
  };
};

// 生成生產歷史數據的輔助函數
function generateProductionHistory() {
  return Array.from({ length: 30 }, (_, i) => ({
    date: format(subDays(new Date(), i), "yyyy-MM-dd"),
    production: Math.floor(Math.random() * 100) + 50,
    efficiency: Math.floor(Math.random() * 30) + 70,
    defects: Math.floor(Math.random() * 5),
  })).reverse();
}

// 為每個機台添加生產歷史
mockMachines.forEach((machine) => {
  if (!machine.productionHistory) {
    machine.productionHistory = generateProductionHistory();
  }
});
