/**
 * UI頁面：系統設定
 * 功能：系統參數配置和設定
 */
import React, { useState } from "react";  // 修改這行
import { Card } from "../ui/card";
import { StatusBar } from './StatusBar';  // 添加這行
import { useStatusData } from '../../hooks/useStatusData';

export const SystemSettings = () => {
  const { summary, devices, loading } = useStatusData();

  return (
    <div className="space-y-6">
      <StatusBar 
        summary={summary} 
        devices={devices} 
        loading={loading} 
      />
      <Card className="p-6 bg-gray-900 text-white">
        <h3 className="text-lg font-semibold mb-4">系統設定</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              資料更新頻率（秒）
            </label>
            <input
              type="number"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              defaultValue={5}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              警告閾值 (%)
            </label>
            <input
              type="number"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              defaultValue={80}
            />
          </div>
        </div>
      </Card>
    </div>
  );
};
