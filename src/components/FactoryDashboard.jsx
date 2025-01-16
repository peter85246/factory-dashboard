import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Cpu,
  LayoutDashboard,
  Activity,
  Monitor,
  Clock,
  BarChart,
  Settings,
  LogOut,
  Bot,
  FileText,
} from "lucide-react";
import { SideNavItem } from "./dashboard/SideNavItem";
import { MachineList } from "./dashboard/MachineList";
import { StatusBar } from "./dashboard/StatusBar";
import { OEEDashboard } from "./dashboard/OEEDashboard";
import { MonitorView } from "./dashboard/MonitorView";
import { ProductionHistory } from "./dashboard/ProductionHistory";
import { Statistics } from "./dashboard/Statistics";
import { SystemSettings } from "./dashboard/SystemSettings";
import { getStatusSummary } from "../data/mockData";
import ProductionAssistant from "./ProductionAssistant";
import LogAnalysis from "./LogAnalysis";

const FactoryDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const summary = getStatusSummary();

  const handleLogout = () => {
    setIsLoggingOut(true);

    setTimeout(() => {
      logout();
      navigate("/login");
    }, 1000);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <MachineList />;
      case "oee":
        return <OEEDashboard />;
      case "monitor":
        return <MonitorView />;
      case "history":
        return <ProductionHistory />;
      case "stats":
        return <Statistics />;
      case "assistant":
        return <ProductionAssistant />;
      case "log-analysis":
        return <LogAnalysis />;
      case "settings":
        return <SystemSettings />;
      default:
        return <div className="text-white">開發中...</div>;
    }
  };

  return (
    <div className="flex h-screen bg-[#0B1015]">
      {/* 側邊欄 */}
      <div className="w-56 bg-[#0B1015] border-r border-gray-800 flex flex-col">
        {/* Logo 區域 - 添加點擊事件 */}
        <div
          onClick={() => setActiveTab("overview")}
          className="p-4 border-b border-gray-800 cursor-pointer 
                     transition-all duration-200 hover:bg-gray-800/50"
        >
          <div className="flex items-center space-x-2">
            <div
              className="text-cyan-400 transition-transform duration-200 
                          group-hover:scale-110"
            >
              <Cpu size={24} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">SME</h1>
              <div className="text-xs text-cyan-400">Smart Machine Engine</div>
            </div>
          </div>
        </div>

        {/* 導航選項 */}
        <div className="flex-1 py-4">
          <SideNavItem
            icon={LayoutDashboard}
            text="總覽"
            active={activeTab === "overview"}
            onClick={() => setActiveTab("overview")}
          />
          <SideNavItem
            icon={Activity}
            text="稼動率資訊"
            active={activeTab === "oee"}
            onClick={() => setActiveTab("oee")}
          />
          <SideNavItem
            icon={Monitor}
            text="設備監控"
            active={activeTab === "monitor"}
            onClick={() => setActiveTab("monitor")}
          />
          <SideNavItem
            icon={Clock}
            text="生產歷程"
            active={activeTab === "history"}
            onClick={() => setActiveTab("history")}
          />
          <SideNavItem
            icon={BarChart}
            text="統計分析"
            active={activeTab === "stats"}
            onClick={() => setActiveTab("stats")}
          />
          <SideNavItem
            icon={Bot}
            text="產線智能助手"
            active={activeTab === "assistant"}
            onClick={() => setActiveTab("assistant")}
          />
          <SideNavItem
            icon={FileText}
            text="日誌分析"
            active={activeTab === "log-analysis"}
            onClick={() => setActiveTab("log-analysis")}
          />
          <SideNavItem
            icon={Settings}
            text="系統設定"
            active={activeTab === "settings"}
            onClick={() => setActiveTab("settings")}
          />
        </div>

        {/* 登出按鈕 */}
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={`
              w-full py-2 px-4 
              ${
                isLoggingOut
                  ? "bg-red-500/50 cursor-not-allowed"
                  : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
              }
              text-white rounded-lg 
              transition-all duration-200 
              flex items-center justify-center space-x-2
              shadow-lg hover:shadow-red-500/20
              disabled:opacity-80
            `}
          >
            {isLoggingOut ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                <span>登出中...</span>
              </>
            ) : (
              <>
                <LogOut
                  size={18}
                  className="transition-transform group-hover:scale-110"
                />
                <span>登出系統</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 主要內容區域 */}
      <div className="flex-1 bg-[#0B1015] overflow-auto">
        {/* <StatusBar summary={summary} /> */}
        <div className="p-4">{renderContent()}</div>
      </div>
    </div>
  );
};

export default FactoryDashboard;
