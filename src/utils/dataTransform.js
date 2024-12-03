/**
 * 數據轉換工具
 */
export const transformDeviceData = (deviceData) => {
  // 狀態映射
  const getStatus = (status, connected) => {
    if (connected !== "1") return "offline";
    switch (status?.toUpperCase()) {
      case "RUN":
        return "running";
      case "IDLE":
        return "idle";
      case "ALARM":
        return "error";
      default:
        return "offline";
    }
  };

  // 計算效率（這裡需要根據實際業務邏輯調整）
  const calculateEfficiency = (device) => {
    const spindleLoad = parseFloat(device.SpindleLoad) || 0;
    return Math.min(Math.round(spindleLoad), 100);
  };

  return {
    id: deviceData.Num,
    name: deviceData.Name,
    status: getStatus(deviceData.Status, deviceData.Connected),
    connected: deviceData.Connected === "1",
    warning: deviceData.Alarm !== "0" && deviceData.Alarm !== "",
    workCount: parseInt(deviceData.PieceConuter) || 0,
    efficiency: calculateEfficiency(deviceData),
    operationMode: deviceData.OpMode,
    programNo: deviceData.ProgramNo,
    toolCode: deviceData.TCode,
    spindleLoad: parseFloat(deviceData.SpindleLoad) || 0,
    spindleSpeed: parseInt(deviceData.SpindleSpeed) || 0,
    feedRate: parseInt(deviceData.Feedrate) || 0,
  };
};

export const calculateStatusSummary = (devices) => {
  const summary = {
    error: 0,
    idle: 0,
    running: 0,
    offline: 0,
    totalEfficiency: 0,
    connectedCount: 0,
  };

  devices.forEach((device) => {
    summary[device.status]++;
    if (device.connected) {
      summary.connectedCount++;
      summary.totalEfficiency += device.efficiency;
    }
  });

  summary.averageEfficiency = summary.connectedCount
    ? (summary.totalEfficiency / summary.connectedCount).toFixed(2)
    : 0;

  return summary;
};
