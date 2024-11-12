import React from "react";
import { mockMachines } from "../../data/mockData";

export const MachineOverview = () => {
  return (
    <div className="grid grid-cols-3 gap-4">
      {mockMachines.map((machine) => (
        <div
          key={machine.id}
          className={`
            relative p-4 rounded-xl
            bg-gradient-to-br from-gray-800/50 to-gray-900/50
            border border-gray-700/50
            backdrop-blur-sm
            hover:shadow-lg hover:shadow-cyan-500/5
            transition-all duration-300
            group
          `}
        >
          {/* 機台狀態指示器 */}
          <div
            className={`
            absolute top-3 right-3 h-2 w-2 rounded-full
            ${machine.status === "running" ? "bg-green-500" : ""}
            ${machine.status === "idle" ? "bg-yellow-500" : ""}
            ${machine.status === "error" ? "bg-red-500" : ""}
            ${machine.status === "offline" ? "bg-gray-500" : ""}
            shadow-lg animate-pulse
          `}
          />

          {/* 機台編號 */}
          <div className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
            {machine.id}
          </div>

          {/* 狀態資訊 */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">狀態</span>
              <span
                className={`
                font-medium
                ${machine.status === "running" ? "text-green-400" : ""}
                ${machine.status === "idle" ? "text-yellow-400" : ""}
                ${machine.status === "error" ? "text-red-400" : ""}
                ${machine.status === "offline" ? "text-gray-400" : ""}
              `}
              >
                {machine.status === "running" && "運行中"}
                {machine.status === "idle" && "待機"}
                {machine.status === "error" && "異常"}
                {machine.status === "offline" && "離線"}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">連線狀態</span>
              <span
                className={`font-medium ${machine.connected ? "text-green-400" : "text-gray-400"}`}
              >
                {machine.connected ? "已連線" : "未連線"}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">加工數量</span>
              <span className="font-medium text-white">
                {machine.workCount}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">稼動率</span>
              <span className="font-medium text-cyan-400">
                {machine.efficiency}%
              </span>
            </div>
          </div>

          {/* 警告標記 */}
          {machine.warning && (
            <div className="absolute bottom-3 left-3 right-3 py-1 px-2 bg-red-500/10 border border-red-500/50 rounded-lg">
              <div className="text-red-500 text-xs text-center">需要注意</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
