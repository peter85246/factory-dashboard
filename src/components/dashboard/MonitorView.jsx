/**
 * UI頁面：設備監控
 * 功能：即時監控所有機台的運行狀態
 */
import React, { useState } from "react";
import { Card } from "../ui/card";
import { MachineStatus } from "./MachineStatus";
import { Activity, AlertTriangle } from "lucide-react";
import { StatusBar } from './StatusBar';
import { useStatusData } from '../../hooks/useStatusData';

export const MonitorView = () => {
  const [lastUpdate, setLastUpdate] = useState(null);
  const { summary, devices, loading, error } = useStatusData();

  // 更新最後更新時間
  React.useEffect(() => {
    if (!loading && devices.length > 0) {
      setLastUpdate(new Date().toLocaleTimeString());
    }
  }, [loading, devices]);

  // 優化數據轉換
  const transformedDevices = React.useMemo(() => {
    if (!devices.length) return [];
    
    const STATUS_PRIORITY = {
      'running': 1,
      'idle': 2,
      'error': 3,
      'offline': 4
    };
    
    return devices
      .map(device => ({
        id: device.num,
        name: device.name,
        status: device.status.toLowerCase(),
        connected: device.connected === "Yes",
        warning: device.alarm && device.alarm !== "N/A",
        workCount: device.pieceConuter || 0,
        efficiency: parseFloat(device.rates?.operation || 0).toFixed(2),
        operationMode: device.opMode,
        programNo: device.programNo,
        toolCode: device.tCode,
        spindleLoad: device.spindleLoad === "N/A" ? 0 : parseFloat(device.spindleLoad),
        spindleSpeed: device.spindleSpeed === "N/A" ? 0 : parseFloat(device.spindleSpeed),
        feedRate: parseFloat(device.feedrate) || 0,
        statusDetails: {
          error: parseFloat(device.rates?.alarm || 0),
          idle: parseFloat(device.rates?.idle || 0),
          running: parseFloat(device.rates?.operation || 0),
          offline: parseFloat(device.rates?.offline || 0),
          offlineRate: parseFloat(device.rates?.offline || 0),
          efficiency: parseFloat(device.rates?.operation || 0).toFixed(2)
        }
      }))
      .sort((a, b) => {
        // 首先按狀態優先順序排序
        const statusOrderA = STATUS_PRIORITY[a.status] || 5;
        const statusOrderB = STATUS_PRIORITY[b.status] || 5;
        
        if (statusOrderA !== statusOrderB) {
          return statusOrderA - statusOrderB;
        }
        
        // 如果狀態相同，則按機台名稱排序
        return a.name.localeCompare(b.name, undefined, { numeric: true });
      });
  }, [devices]);

  // 如果有數據就直接顯示，不等待 loading 狀態
  const shouldShowContent = devices.length > 0;

  return (
    <div className="space-y-6">
      <StatusBar 
        summary={summary} 
        devices={devices} 
        loading={loading} 
      />
      
      {/* 更新狀態顯示 */}
      <div className="bg-[#0B1015] p-4 mb-4">
        <div className="h-6 flex justify-between items-center">
          <div className="text-sm">
            {loading && !shouldShowContent && (
              <span className="text-blue-400 animate-pulse">Loading...</span>
            )}
            {error && <span className="text-red-500">{error}</span>}
          </div>
          {lastUpdate && (
            <div className="text-sm text-gray-400">
              最後更新：{lastUpdate}
            </div>
          )}
        </div>
      </div>

      {/* 設備卡片網格 */}
      {shouldShowContent && (
        <div className="grid grid-cols-2 gap-6">
          {transformedDevices.map((machine) => (
            <Card
              key={machine.id}
              className={`
                bg-gray-900 
                p-6 
                transform 
                transition-all 
                duration-300 
                hover:scale-[1.02]
                hover:shadow-lg
                hover:shadow-${
                  machine.status === "running"
                    ? "green"
                    : machine.status === "idle"
                      ? "blue"
                      : machine.status === "error"
                        ? "red"
                        : "gray"
                }-500/10
                border border-gray-800
                hover:border-${
                  machine.status === "running"
                    ? "green"
                    : machine.status === "idle"
                      ? "blue"
                      : machine.status === "error"
                        ? "red"
                        : "gray"
                }-500/30
                relative
                overflow-hidden
              `}
            >
              {/* 狀態指示條 */}
              <div
                className={`
                absolute left-0 top-0 bottom-0 w-1
                ${machine.status === "running" ? "bg-green-500" : ""}
                ${machine.status === "idle" ? "bg-blue-500" : ""}
                ${machine.status === "error" ? "bg-red-500" : ""}
                ${machine.status === "offline" ? "bg-gray-500" : ""}
              `}
              />

              {/* 警告標識 */}
              {machine.warning &&
                (machine.status === "idle" || machine.status === "error") && (
                  <div className="absolute top-4 right-4">
                    <AlertTriangle
                      className={`h-5 w-5 animate-pulse
                      ${machine.status === "idle" ? "text-blue-400" : ""}
                      ${machine.status === "error" ? "text-red-400" : ""}
                    `}
                    />
                  </div>
                )}

              {/* 機台狀態內容 */}
              <div className="pl-4">
                <MachineStatus
                  data={{
                    name: machine.name,
                    num: machine.id,
                    connectionStatus: machine.connected ? "已連線" : "未連線",
                    status: getStatusText(machine.status),
                    processCount: machine.workCount,
                    percentage: {
                      error: parseFloat(machine.statusDetails.error),
                      idle: parseFloat(machine.statusDetails.idle),
                      running: parseFloat(machine.statusDetails.running),
                      offline: parseFloat(machine.statusDetails.offline),
                      offlineRate: parseFloat(machine.statusDetails.offlineRate),
                      efficiency: machine.efficiency
                    }
                  }}
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// 輔助函數：獲取狀態文字
function getStatusText(status) {
  switch (status) {
    case 'running': return '加工中';
    case 'idle': return '閒置';
    case 'error': return '異常';
    case 'offline': return '未連線';
    default: return '未知';
  }
}
