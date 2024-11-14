import React from "react";
import { AlertTriangle } from "lucide-react";
import { motion, useMotionValue, animate } from "framer-motion";
import { useEffect } from "react";

export const MachineStatus = ({ data }) => {
  const errorCount = useMotionValue(0);
  const idleCount = useMotionValue(0);
  const runningCount = useMotionValue(0);
  const offlineCount = useMotionValue(0);

  useEffect(() => {
    animate(errorCount, data.percentage.error, {
      duration: 1.5,
      ease: "easeOut"
    });
    animate(idleCount, data.percentage.idle, {
      duration: 1.5,
      ease: "easeOut"
    });
    animate(runningCount, data.percentage.running, {
      duration: 1.5,
      ease: "easeOut"
    });
    animate(offlineCount, data.percentage.offline, {
      duration: 1.5,
      ease: "easeOut"
    });
  }, [data]);

  return (
    <div className="flex items-stretch bg-gray-900 border-b border-gray-700 h-32">
      {/* 設備名稱和攝影機畫面 */}
      <div className="w-[150px] p-2 bg-black flex flex-col">
        <div className="text-white font-medium mb-2">{data.name}</div>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-20 h-20 bg-gray-800 rounded-lg flex items-center justify-center">
            <AlertTriangle className="text-yellow-500" size={24} />
          </div>
        </div>
      </div>

      {/* 設備狀態資訊 */}
      <div className="w-[100px] p-2 bg-[#1a1a1a] flex flex-col justify-between">
        <div>
          <div className="text-gray-400 text-xs">連線狀態</div>
          <div className="text-white text-sm">{data.connectionStatus}</div>
        </div>
        <div>
          <div className="text-gray-400 text-xs">設備狀態</div>
          <div className="text-white text-sm">{data.status}</div>
        </div>
        <div>
          <div className="text-gray-400 text-xs">加工數量</div>
          <div className="text-white text-sm">{data.processCount}</div>
        </div>
      </div>

      {/* 圓餅圖 - 添加動畫 */}
      <div className="w-[120px] bg-[#1a1a1a] flex items-center justify-center">
        <div className="relative w-20 h-20">
          <svg
            className="w-full h-full transform -rotate-90"
            viewBox="0 0 100 100"
          >
            {data.percentage.offline === 100 ? (
              // 當完全離線時，顯示一個完整的灰色圓
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#4B5563" // 灰色
                strokeWidth="10"
                strokeDasharray="283 283" // 完整圓形
                strokeLinecap="round"
              />
            ) : (
              // 原有的圓餅圖邏輯
              <>
                <motion.circle
                  initial={{ strokeDasharray: "0 283" }}
                  animate={{
                    strokeDasharray: `${data.percentage.idle * 2.83} ${283 - data.percentage.idle * 2.83}`,
                  }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#93c5fd"
                  strokeWidth="10"
                  strokeLinecap="round"
                />
                <motion.circle
                  initial={{ strokeDasharray: "0 283" }}
                  animate={{
                    strokeDasharray: `${data.percentage.running * 2.83} ${283 - data.percentage.running * 2.83}`,
                    strokeDashoffset: -data.percentage.idle * 2.83,
                  }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#4ade80"
                  strokeWidth="10"
                  strokeLinecap="round"
                />
                <motion.circle
                  initial={{ strokeDasharray: "0 283" }}
                  animate={{
                    strokeDasharray: `${data.percentage.error * 2.83} ${283 - data.percentage.error * 2.83}`,
                    strokeDashoffset:
                      -(data.percentage.idle + data.percentage.running) * 2.83,
                  }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="10"
                  strokeLinecap="round"
                />
              </>
            )}
          </svg>
        </div>
      </div>

      {/* 百分比列表 - 添加動畫 */}
      <div className="w-[100px] bg-[#1a1a1a] flex items-center px-2">
        <div className="space-y-1 text-xs">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-red-500"
          >
            {errorCount.get().toFixed(2)}%
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-blue-300"
          >
            {idleCount.get().toFixed(2)}%
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="text-green-400"
          >
            {runningCount.get().toFixed(2)}%
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="text-gray-400"
          >
            {offlineCount.get().toFixed(2)}%
          </motion.div>
        </div>
      </div>

      {/* 稼動率 - 添加動畫 */}
      <div className="w-[150px] bg-[#1a1a1a] flex flex-col justify-center px-1">
        <div className="text-gray-400 text-xs">稼動率(%)</div>
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="text-green-400 text-3xl font-bold"
        >
          {parseFloat(data.percentage.efficiency).toFixed(4)}%
        </motion.div>
      </div>

      {/* 甘特圖 - 添加進度條動畫 */}
      <div className="flex-1 bg-[#1a1a1a] flex items-center p-2">
        <div className="w-full space-y-2">
          {/* 運行中百分比條 */}
          <motion.div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-green-500"
              initial={{ width: "0%" }}
              animate={{ width: `${data.percentage.running}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </motion.div>

          {/* 待機中百分比條 */}
          <motion.div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-blue-400"
              initial={{ width: "0%" }}
              animate={{ width: `${data.percentage.idle}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </motion.div>

          {/* 異常百分比條 */}
          <motion.div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-red-500"
              initial={{ width: "0%" }}
              animate={{ width: `${data.percentage.error}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
};
