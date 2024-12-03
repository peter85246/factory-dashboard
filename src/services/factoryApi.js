/**
 * 工廠 API 服務
 */
import axios from "axios";
import { API_CONFIG } from "../config/apiConfig";

export const factoryApi = {
  device: {
    getAllDevices: async () => {
      try {
        console.log("Fetching all devices...");

        const response = await axios({
          method: "post",
          url: `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.deviceData}`,
          data: {
            keyword: "",
          },
          headers: API_CONFIG.headers,
        });

        if (response.data.code !== "0000") {
          throw new Error(`API Error: ${response.data.message}`);
        }

        return transformData(response.data.result || []);
      } catch (error) {
        console.error("API Error:", error);
        throw error;
      }
    },

    getAssignDevice: async (keyword) => {
      try {
        const response = await axios({
          method: "post",
          url: `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.assignDeviceData}`,
          data: { keyword },
          headers: API_CONFIG.headers,
        });

        if (!response.data) {
          throw new Error("No data received from server");
        }

        return transformData(response.data);
      } catch (error) {
        console.error("Error fetching assigned device:", error);
        throw error;
      }
    },

    getYearDeviceData: async (year) => {
      try {
        console.log("Fetching year data:", year);

        const response = await axios({
          method: "post",
          url: `${API_CONFIG.baseUrl}/api/AREditior/GetYearDeviceData`,
          data: {
            year: year.toString(),
            month: "0",
          },
          headers: API_CONFIG.headers,
        });

        console.log("Year API response:", response.data);
        return response.data;
      } catch (error) {
        console.error("Error fetching year device data:", error);
        throw error;
      }
    },

    getMonthDeviceData: async (year, month) => {
      try {
        console.log("Fetching month data:", year, month);

        const response = await axios({
          method: "post",
          url: `${API_CONFIG.baseUrl}/api/AREditior/GetMonthDeviceData`,
          data: {
            year: year.toString(),
            month: month.toString(),
          },
          headers: API_CONFIG.headers,
        });

        console.log("Month API response:", response.data);
        return response.data;
      } catch (error) {
        console.error("Error fetching month device data:", error);
        throw error;
      }
    },
  },
};

// 定義狀態優先順序
const STATUS_PRIORITY = {
  running: 1,
  idle: 2,
  error: 3,
  offline: 4,
};

// 輔助函數：排序邏輯
function sortDevices(devices) {
  return devices.sort((a, b) => {
    // 首先按狀態優先順序排序
    const statusOrderA = STATUS_PRIORITY[a.status] || 5;
    const statusOrderB = STATUS_PRIORITY[b.status] || 5;

    if (statusOrderA !== statusOrderB) {
      return statusOrderA - statusOrderB;
    }

    // 如果狀態相同，則按機台名稱排序
    return a.name.localeCompare(b.name, undefined, { numeric: true });
  });
}

// 統一的數據轉換函數
function transformData(data) {
  const devicesData = Array.isArray(data) ? data : [data];

  const transformedDevices = devicesData.map((device) => ({
    id: device.Num || device.num,
    name: device.Name || device.name,
    status: getDeviceStatus(
      device.Status || device.status,
      device.Connected || device.connected,
    ),
    connected:
      (device.Connected || device.connected) === "1" ||
      (device.Connected || device.connected) === "Yes",
    warning:
      (device.Alarm || device.alarm) !== "0" &&
      (device.Alarm || device.alarm) !== "",
    workCount: parseInt(device.PieceConuter || device.pieceConuter) || 0,
    efficiency: calculateEfficiency(device),
    operationMode: device.OpMode || device.opMode,
    programNo: device.ProgramNo || device.programNo,
    toolCode: device.TCode || device.tCode,
    spindleLoad: parseFloat(device.SpindleLoad || device.spindleLoad) || 0,
    spindleSpeed: parseInt(device.SpindleSpeed || device.spindleSpeed) || 0,
    feedRate: parseInt(device.Feedrate || device.feedrate) || 0,
    powerOnTime: device.PowerOnTime || device.powerOnTime,
    rates: {
      operation: parseFloat(device.operationRate || 0).toFixed(2),
      idle: parseFloat(device.idleRate || 0).toFixed(2),
      alarm: parseFloat(device.alarmRate || 0).toFixed(2),
      offline: parseFloat(device.offlineRate || 0).toFixed(2),
    },
  }));

  // 應用排序
  const sortedDevices = sortDevices(transformedDevices);

  const summary = {
    error: sortedDevices.filter((d) => d.status === "error").length,
    idle: sortedDevices.filter((d) => d.status === "idle").length,
    running: sortedDevices.filter((d) => d.status === "running").length,
    offline: sortedDevices.filter((d) => !d.connected).length,
    averageEfficiency: calculateAverageEfficiency(sortedDevices),
  };

  return { devices: sortedDevices, summary };
}

// 輔助函數
function getDeviceStatus(status, connected) {
  console.log("Status before transform:", status, "Connected:", connected);

  if (connected !== "Yes") return "offline";

  switch (status?.toUpperCase()) {
    case "RUN":
    case "RUNNING":
      return "running"; // 綠色
    case "IDLE":
      return "idle"; // 藍色
    case "ALARM":
    case "ERROR":
      return "error"; // 紅色
    case "OFFLINE":
      return "offline"; // 黃色
    default:
      console.log("Unknown status:", status);
      return "offline";
  }
}

function calculateEfficiency(device) {
  if (device.operationRate) {
    return parseFloat(device.operationRate).toFixed(4);
  }
  return "0.0000";
}

function calculateAverageEfficiency(devices) {
  const connectedDevices = devices.filter((d) => d.connected);
  if (connectedDevices.length === 0) return 0;

  const totalEfficiency = connectedDevices.reduce((sum, d) => {
    return sum + parseFloat(d.efficiency || 0);
  }, 0);

  return (totalEfficiency / connectedDevices.length).toFixed(4);
}
