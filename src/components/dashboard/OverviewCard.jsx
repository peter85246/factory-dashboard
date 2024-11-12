import React from "react";
import { Card } from "../ui/card";
import { Activity, AlertTriangle, Clock, Thermometer } from "lucide-react";

export const OverviewCard = ({ data }) => {
  if (!data) return null;

  return (
    <Card className="p-4 bg-gray-900 text-white">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{data.name}</h3>
            {data.alerts.length > 0 && (
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
            )}
          </div>
          <div className="text-sm text-gray-400">{data.model}</div>
          <div className="text-xs text-gray-500">{data.description}</div>
        </div>
        <Activity className="text-cyan-400" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-gray-400">運行狀態</div>
          <div
            className={`text-lg font-semibold ${getStatusColor(data.status)}`}
          >
            {getStatusText(data.status)}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-400">稼動率</div>
          <div className="text-lg font-semibold text-cyan-400">{data.oee}%</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="flex items-center gap-1">
          <Thermometer className="h-4 w-4 text-gray-400" />
          <span className="text-sm">{data.temperature}°C</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4 text-gray-400" />
          <span className="text-sm">{Math.floor(data.runtime / 24)}天</span>
        </div>
        <div className="text-sm text-right">
          {data.productionCount.actual}/{data.productionCount.target}
        </div>
      </div>

      {data.alerts.length > 0 && (
        <div className="mt-3 text-xs text-yellow-400">
          最新警告: {data.alerts[0].message}
        </div>
      )}
    </Card>
  );
};

const getStatusColor = (status) => {
  const colors = {
    running: "text-green-400",
    idle: "text-yellow-400",
    error: "text-red-400",
    offline: "text-gray-400",
  };
  return colors[status] || "text-gray-400";
};

const getStatusText = (status) => {
  const statusMap = {
    running: "運行中",
    idle: "待機",
    error: "異常",
    offline: "離線",
  };
  return statusMap[status] || "未知";
};
