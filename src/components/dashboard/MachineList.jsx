/**
 * UI頁面：總攬
 */
import React, { useEffect, useState } from "react";
import { AlertTriangle, Activity, Box } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { factoryApi } from "../../services/factoryApi";
import { StatusBar } from "./StatusBar"; // 添加這行

export const MachineList = () => {
  const [devices, setDevices] = useState([]);
  const [summary, setSummary] = useState({
    error: 0,
    idle: 0,
    running: 0,
    offline: 0,
    averageEfficiency: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [updateStatus, setUpdateStatus] = useState("");

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        setLoading(true);
        setError(null);
        const { devices, summary } = await factoryApi.device.getAllDevices();

        if (!devices || !summary) {
          throw new Error("無法取得設備資料");
        }

        setDevices(devices);
        setSummary(summary);
      } catch (err) {
        setError("資料更新失敗: " + err.message);
        console.error("資料更新錯誤:", err);
      } finally {
        setTimeout(() => {
          setLoading(false);
        }, 500);
      }
    };

    fetchDevices();
    const interval = setInterval(fetchDevices, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <StatusBar summary={summary} devices={devices} loading={loading} />
      {/* 頂部狀態列 */}
      <div className="bg-[#0B1015] p-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <span className="text-gray-400">平均稼動率(%)</span>
            <div className="text-xl text-white">
              {summary.averageEfficiency}%
            </div>
          </div>
          <div className="flex items-center gap-4">
            <StatusBox label="異常" count={summary.error} color="red" />
            <StatusBox label="閒置" count={summary.idle} color="blue" />
            <StatusBox label="加工中" count={summary.running} color="green" />
            <StatusBox label="未連線" count={summary.offline} color="gray" />
          </div>
        </div>
        {/* 更新狀態顯示 */}
        <div className="h-6">
          <div className="text-sm">
            {error ? (
              <span className="text-red-500">{error}</span>
            ) : loading ? (
              <span className="text-blue-400 animate-pulse">Loading...</span>
            ) : null}
          </div>
        </div>
      </div>

      {/* 機台列表 */}
      <div className="space-y-1">
        {devices.map((machine) => (
          <MachineStatusRow key={machine.id} data={machine} />
        ))}
      </div>
    </div>
  );
};

const StatusBox = ({ label, count, color }) => {
  const colors = {
    red: "bg-red-500",
    blue: "bg-blue-500",
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    gray: "bg-gray-500",
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`w-16 h-2 ${colors[color]}`}></div>
      <span className="text-gray-400">{label}</span>
      <span className="text-white">{count}</span>
    </div>
  );
};

const MachineStatusRow = ({ data }) => {
  console.log("Current machine status:", data.status);

  const statusConfig = {
    running: {
      color: "text-green-400",
      text: "加工中",
      bgColor: "bg-gray-900",
      borderColor: "border-green-500/30",
      hoverBorder: "hover:border-green-500/50",
      hoverShadow: "hover:shadow-green-500/10",
      iconColor: "text-green-400",
    },
    idle: {
      color: "text-blue-400",
      text: "閒置",
      bgColor: "bg-gray-900",
      borderColor: "border-blue-500/30",
      hoverBorder: "hover:border-blue-500/50",
      hoverShadow: "hover:shadow-blue-500/10",
      iconColor: "text-blue-400",
    },
    error: {
      color: "text-red-400",
      text: "異常",
      bgColor: "bg-gray-900",
      borderColor: "border-red-500/30",
      hoverBorder: "hover:border-red-500/50",
      hoverShadow: "hover:shadow-red-500/10",
      iconColor: "text-red-400",
    },
    offline: {
      color: "text-gray-400",
      text: "未連線",
      bgColor: "bg-gray-900",
      borderColor: "border-gray-500/30",
      hoverBorder: "hover:border-gray-500/50",
      hoverShadow: "hover:shadow-gray-500/10",
      iconColor: "text-gray-400",
    },
  };

  const config = statusConfig[data.status] || statusConfig.offline;

  const pieData = [
    {
      name: "進度",
      value: parseFloat(data.efficiency || 0),
      color: "#F97316", // 橘色，表示進度
      label: `進度 ${parseFloat(data.efficiency || 0).toFixed(2)}%`,
    },
    {
      name: "背景",
      value: 100 - parseFloat(data.efficiency || 0),
      color: "#10B981", // 綠色，作為背景
      label: `剩餘 ${(100 - parseFloat(data.efficiency || 0)).toFixed(2)}%`,
    },
  ];

  return (
    <div
      className={`
        p-4 
        flex items-center 
        border 
        ${config.borderColor}
        ${config.hoverBorder}
        ${config.hoverShadow}
        transition-all duration-300
        hover:bg-gray-800/50
        rounded-lg
        group
        relative
        overflow-hidden
        gap-4
      `}
    >
      {/* 調整光暈效果透明度 */}
      <div
        className={`
        absolute inset-0 
        bg-gradient-to-r 
        ${data.status === "running" ? "from-green-500/0 via-green-500/20 to-green-500/0" : ""}
        ${data.status === "idle" ? "from-blue-500/0 via-blue-500/20 to-blue-500/0" : ""}
        ${data.status === "error" ? "from-red-500/0 via-red-500/20 to-red-500/0" : ""}
        ${data.status === "offline" ? "from-gray-500/0 via-gray-500/20 to-gray-500/0" : ""}
        animate-shimmer
      `}
      />

      {/* 左側狀態指示條 */}
      <div
        className={`
          absolute left-0 top-0 bottom-0 w-1
          ${data.status === "running" ? "bg-green-500" : ""}
          ${data.status === "idle" ? "bg-blue-500" : ""}
          ${data.status === "error" ? "bg-red-500" : ""}
          ${data.status === "offline" ? "bg-gray-500" : ""}
          z-10
        `}
      />

      {/* 內容區域需要設置 z-index 確保在動畫層上方 */}
      <div className="relative z-20 flex items-center w-full gap-4">
        {/* 左側機台資訊 */}
        <div className="w-48 flex items-center gap-4 pl-3">
          <div className="relative">
            <div
              className={`
              bg-gray-800/80 
              backdrop-blur-sm 
              p-4 
              rounded-lg
              border border-gray-700/50
              group-hover:scale-105
              transition-transform duration-300
              flex items-center gap-2
            `}
            >
              <Activity className={`h-4 w-4 ${config.iconColor}`} />
              <span className="text-white font-bold">{data.name}</span>
            </div>
            {/* {data.warning && (
              <AlertTriangle className="absolute -top-2 -right-2 h-5 w-5 text-yellow-400 animate-pulse" />
            )} */}
          </div>
        </div>

        {/* 連線狀態 */}
        <div className="w-32 group-hover:scale-105 transition-transform duration-300">
          <div className="text-sm text-gray-400">連線狀態</div>
          <div className="text-white flex items-center gap-2">
            <span
              className={`
              h-2 w-2 rounded-full 
              ${data.connected ? "bg-green-400" : "bg-gray-400"}
            `}
            ></span>
            {data.connected ? "Connected" : "Disconnected"}
          </div>
        </div>

        {/* 設備狀態 */}
        <div className="w-32 group-hover:scale-105 transition-transform duration-300">
          <div className="text-sm text-gray-400">設備狀態</div>
          <div className={`${config.color} flex items-center gap-2`}>
            <Box className={`h-4 w-4 ${config.iconColor}`} />
            {config.text}
          </div>
        </div>

        {/* 加工數量 */}
        <div className="w-32 group-hover:scale-105 transition-transform duration-300">
          <div className="text-sm text-gray-400">加工數量</div>
          <div className="text-white">{data.workCount}</div>
        </div>

        {/* 圓環圖區域 */}
        <div className="w-48 h-32 shrink-0 relative flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
          <div className="absolute inset-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={25}
                  outerRadius={35}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                  paddingAngle={0} // 移除間隔
                  animationBegin={0}
                  animationDuration={800}
                  animationEasing="ease-out"
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      strokeWidth={0}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value.toFixed(2)}%`, name]}
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    padding: "8px",
                  }}
                  itemStyle={{ color: "#fff" }}
                  labelStyle={{ color: "#9CA3AF" }}
                  isAnimationActive={true}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* 中心顯示總稼動率 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className={`text-sm font-medium ${
                data.status === "offline" ? "text-gray-400" : "text-green-400"
              }`}
            >
              {parseFloat(data.efficiency || 0).toFixed(2)}%
            </span>
          </div>
        </div>

        {/* 百分比條 */}
        <div className="w-32 group-hover:scale-105 transition-transform duration-300 flex flex-col justify-center">
          <div className="text-sm text-gray-400 mb-2"></div>
          <div className="relative">
            {/* 背景條 */}
            <div className="h-2 w-full bg-gray-700/50 rounded-full overflow-hidden backdrop-blur-sm">
              {/* 進度條 */}
              <div
                className={`h-full transition-all duration-300 rounded-full
                  ${data.status === "offline" ? "bg-gray-400" : "bg-green-400"}
                  ${data.status === "running" ? "bg-gradient-to-r from-green-400 to-green-500" : ""}
                `}
                style={{ width: `${data.efficiency}%` }}
              />
            </div>
            {/* 百分比數值 */}
            <div className="text-center mt-1.5">
              <span
                className={`text-sm font-medium
                ${data.status === "offline" ? "text-gray-400" : "text-green-400"}
              `}
              >
                {data.efficiency}%
              </span>
            </div>
          </div>
        </div>

        {/* 稼動率 */}
        <div className="w-40 shrink-0 text-right group-hover:scale-105 transition-transform duration-300 ml-auto">
          <div className="text-sm text-gray-400">稼動率(%)</div>
          <div
            className={`text-3xl font-bold truncate ${
              data.status === "offline" ? "text-gray-400" : "text-green-400"
            }`}
          >
            {data.efficiency}%
          </div>
        </div>
      </div>
    </div>
  );
};
