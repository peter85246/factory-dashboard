import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity, Target, Award, Zap, Clock, Calendar, Settings, Wrench, BarChart, Goal, LogOut, User, Key } from 'lucide-react';
// import { performanceAPI } from '../services/api';
// import { calculateWeightedScore, calculateFairnessIndex, generateImprovement } from '../utils/performanceCalculations';
// import { performanceMonitor } from '../utils/performance';
import { useNavigate } from 'react-router-dom';

const shimmerAnimation = `
  @keyframes shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
`;

export default function PerformanceDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedEmployee, setSelectedEmployee] = useState('EMP001');
  const [isLoading, setIsLoading] = useState(false);
  const [employeeData, setEmployeeData] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  const employees = [
    { id: 'EMP001', name: '張小明' },
    { id: 'EMP002', name: '李小華' },
    { id: 'EMP003', name: '王大明' }
  ];

  const timeSeriesData = [
    { month: '1月', completion: 82, quality: 88, efficiency: 85 },
    { month: '2月', completion: 85, quality: 90, efficiency: 86 },
    { month: '3月', completion: 88, quality: 92, efficiency: 89 },
    { month: '4月', completion: 85, quality: 91, efficiency: 87 },
    { month: '5月', completion: 87, quality: 93, efficiency: 88 },
    { month: '6月', completion: 89, quality: 94, efficiency: 90 }
  ];

  const metrics = [
    { 
      id: 1,
      title: '工作完成量',
      value: (data) => data.workCompletion,
      icon: <Activity className="w-6 h-6" />,
      color: 'bg-emerald-500',
      target: 85,
      weight: 0.125
    },
    {
      id: 2,
      title: '產品質量',
      value: (data) => data.productQuality,
      icon: <Award className="w-6 h-6" />,
      color: 'bg-blue-500',
      target: 90,
      weight: 0.125
    },
    {
      id: 3,
      title: '工作時間',
      value: (data) => {
        const standardHours = 176;
        const percentage = Math.min((data.workHours / standardHours) * 100, 100);
        return Math.round(percentage);
      },
      icon: <Clock className="w-6 h-6" />,
      color: 'bg-indigo-500',
      target: 100,
      weight: 0.125
    },
    {
      id: 4,
      title: '差勤紀錄',
      value: (data) => data.attendance,
      icon: <Calendar className="w-6 h-6" />,
      color: 'bg-purple-500',
      target: 95,
      weight: 0.125
    },
    {
      id: 5,
      title: '機台運行狀態',
      value: (data) => data.machineStatus,
      icon: <Settings className="w-6 h-6" />,
      color: 'bg-cyan-500',
      target: 90,
      weight: 0.125
    },
    {
      id: 6,
      title: '機台維護紀錄',
      value: (data) => data.maintenanceRecord,
      icon: <Wrench className="w-6 h-6" />,
      color: 'bg-teal-500',
      target: 90,
      weight: 0.125
    },
    {
      id: 7,
      title: '目標達成率',
      value: (data) => data.targetAchievement,
      icon: <Target className="w-6 h-6" />,
      color: 'bg-rose-500',
      target: 90,
      weight: 0.125
    },
    {
      id: 8,
      title: '關鍵績效指標',
      value: (data) => data.kpi,
      icon: <BarChart className="w-6 h-6" />,
      color: 'bg-violet-500',
      target: 85,
      weight: 0.125
    },
    {
      id: 9,
      title: '效率指標',
      value: (data) => data.efficiency,
      icon: <Zap className="w-6 h-6" />,
      color: 'bg-amber-500',
      target: 85,
      weight: 0.125
    }
  ];

  const mockEmployeeData = {
    EMP001: {
      workCompletion: 92,
      productQuality: 95,
      workHours: 176,
      attendance: 98,
      machineStatus: 94,
      maintenanceRecord: 92,
      targetAchievement: 91,
      kpi: 88,
      efficiency: 93,
      historicalData: [
        { month: '1月', completion: 88, quality: 92, efficiency: 90 },
        { month: '2月', completion: 90, quality: 93, efficiency: 91 },
        { month: '3月', completion: 92, quality: 95, efficiency: 93 }
      ]
    },
    EMP002: {
      workCompletion: 85,
      productQuality: 88,
      workHours: 168,
      attendance: 95,
      machineStatus: 87,
      maintenanceRecord: 86,
      targetAchievement: 84,
      kpi: 82,
      efficiency: 85,
      historicalData: [
        { month: '1月', completion: 82, quality: 85, efficiency: 83 },
        { month: '2月', completion: 84, quality: 86, efficiency: 84 },
        { month: '3月', completion: 85, quality: 88, efficiency: 85 }
      ]
    },
    EMP003: {
      workCompletion: 78,
      productQuality: 82,
      workHours: 160,
      attendance: 88,
      machineStatus: 80,
      maintenanceRecord: 79,
      targetAchievement: 77,
      kpi: 75,
      efficiency: 78,
      historicalData: [
        { month: '1月', completion: 75, quality: 80, efficiency: 76 },
        { month: '2月', completion: 76, quality: 81, efficiency: 77 },
        { month: '3月', completion: 78, quality: 82, efficiency: 78 }
      ]
    }
  };

  useEffect(() => {
    setIsLoading(true);
    // 模擬加載延遲
    setTimeout(() => {
      setEmployeeData(mockEmployeeData[selectedEmployee]);
      setIsLoading(false);
    }, 500);
  }, [selectedEmployee]);

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest('.user-menu')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  // 添加處理點擊標題的函數
  const handleTitleClick = () => {
    setSelectedEmployee('EMP001');  // 重置為預設員工
    setActiveTab('dashboard');      // 重置為儀表板視圖
  };

  if (!employeeData || isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  const handleEmployeeChange = (e) => {
    setSelectedEmployee(e.target.value);
  };

  return (
    <>
      <style>{shimmerAnimation}</style>
      <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-lg">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 
              onClick={handleTitleClick}
              className="text-3xl font-bold text-white cursor-pointer hover:text-blue-400 transition-colors duration-200 flex items-center gap-2"
            >
              <Activity className="w-8 h-8" />
              員工智慧考核系統
            </h1>
            <div className="flex items-center gap-4">
              <select
                className="bg-slate-700 text-white border-slate-600 rounded-lg p-2"
                value={selectedEmployee}
                onChange={handleEmployeeChange}
              >
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>

              {/* 用戶選單 */}
              <div className="relative user-menu">
                {/* <button
                  className="flex items-center gap-2 bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <User className="w-5 h-5" />
                  <span>用戶選項</span>
                </button> */}

                {/* 下拉選單 */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-700 rounded-lg shadow-lg py-1 z-10">
                    <button
                      className="flex items-center gap-2 px-4 py-2 text-white hover:bg-slate-600 w-full text-left"
                      onClick={() => {
                        // TODO: 實現修改密碼功能
                        alert('修改密碼功能待實現');
                      }}
                    >
                      <Key className="w-4 h-4" />
                      修改密碼
                    </button>
                    <button
                      className="flex items-center gap-2 px-4 py-2 text-white hover:bg-slate-600 w-full text-left text-red-400 hover:text-red-300"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-4 h-4" />
                      登出
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-6">
            {[
              { label: '績效儀表板', value: 'dashboard', icon: <Activity className="w-5 h-5" /> },
              { label: '詳細數據', value: 'details', icon: <Target className="w-5 h-5" /> },
              { label: '改進建議', value: 'recommendations', icon: <Award className="w-5 h-5" /> }
            ].map((tab) => (
              <button
                key={tab.value}
                className={`flex items-center px-6 py-3 rounded-lg transition-all duration-300 ${
                  activeTab === tab.value 
                    ? 'bg-blue-600 text-white shadow-lg scale-105' 
                    : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                }`}
                onClick={() => setActiveTab(tab.value)}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="space-y-6">
            {/* Dashboard View */}
            {activeTab === 'dashboard' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {metrics.map((metric) => (
                    <div 
                      key={metric.id}
                      className="bg-slate-700 rounded-xl p-6 text-white shadow-lg hover:scale-105 transition-transform duration-300"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">{metric.title}</h3>
                        {metric.icon}
                      </div>
                      <div className="text-3xl font-bold mb-2">
                        {metric.value(employeeData)}%
                      </div>
                      <div className="w-full bg-slate-600 rounded-full h-2">
                        <div
                          className={`${metric.color} h-2 rounded-full transition-all duration-500`}
                          style={{ width: `${metric.value(employeeData)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-700 rounded-xl p-6 text-white">
                  <h3 className="text-xl font-bold mb-4">績效趨勢分析</h3>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={timeSeriesData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="month" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
                        <Legend />
                        <Line type="monotone" dataKey="completion" stroke="#10B981" name="完成率" />
                        <Line type="monotone" dataKey="quality" stroke="#3B82F6" name="質量" />
                        <Line type="monotone" dataKey="efficiency" stroke="#F59E0B" name="效率" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}

            {/* Details View */}
            {activeTab === 'details' && (
              <div className="bg-slate-700 rounded-xl p-6 text-white">
                <h3 className="text-xl font-bold mb-4">詳細績效數據</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-600">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                          評估項目
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                          數值
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                          目標
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                          狀態
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-600">
                      {metrics.map((metric) => (
                        <tr key={metric.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-slate-200">
                            <div className="flex items-center">
                              <span className="mr-2">{metric.icon}</span>
                              {metric.title}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-slate-200">
                            {metric.value(employeeData)}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-slate-200">
                            80%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span 
                              className={`px-2 py-1 rounded-full text-sm ${
                                metric.value(employeeData) === 100
                                  ? 'bg-gradient-to-r from-purple-300 via-purple-100 to-purple-300 text-purple-800'
                                  : metric.value(employeeData) >= 90
                                  ? 'bg-green-100 text-green-800'
                                  : metric.value(employeeData) >= 80
                                  ? 'bg-blue-100 text-blue-800'
                                  : metric.value(employeeData) >= 70
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : metric.value(employeeData) >= 60
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                              style={metric.value(employeeData) === 100 ? {
                                backgroundSize: '200% 100%',
                                animation: 'shimmer 2s infinite linear'
                              } : undefined}
                            >
                              {/* {metric.value(employeeData) === 100 && (
                                <span className="mr-1">✨</span>
                              )} */}
                              {metric.value(employeeData) === 100
                                ? '完美'
                                : metric.value(employeeData) >= 90
                                ? '優秀'
                                : metric.value(employeeData) >= 80
                                ? '良好'
                                : metric.value(employeeData) >= 70
                                ? '待加強'
                                : metric.value(employeeData) >= 60
                                ? '不及格'
                                : '極需改進'}
                              {/* {metric.value(employeeData) === 100 && (
                                <span className="ml-1">✨</span>
                              )} */}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Recommendations View */}
            {activeTab === 'recommendations' && (
              <div className="space-y-4">
                {metrics.map((metric) => {
                  const value = metric.value(employeeData);
                  const performanceLevel = 
                    value === 100 ? 'perfect' :
                    value >= 90 ? 'excellent' :
                    value >= 80 ? 'good' :
                    value >= 70 ? 'needsImprovement' :
                    value >= 60 ? 'poor' : 'critical';

                  return (
                    <div
                      key={metric.id}
                      className={`bg-slate-700 rounded-xl p-6 text-white border-l-4 ${
                        performanceLevel === 'perfect' ? 'border-purple-500' :
                        performanceLevel === 'excellent' ? 'border-green-500' :
                        performanceLevel === 'good' ? 'border-blue-500' :
                        performanceLevel === 'needsImprovement' ? 'border-yellow-500' :
                        performanceLevel === 'poor' ? 'border-orange-500' : 'border-red-500'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <span className="mr-2">{metric.icon}</span>
                          <h3 className="text-lg font-bold">{metric.title}建議</h3>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-sm ${
                          performanceLevel === 'perfect' 
                            ? 'bg-gradient-to-r from-purple-300 via-purple-100 to-purple-300 text-purple-800 animate-shimmer relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent'
                            : performanceLevel === 'excellent' 
                            ? 'bg-green-100 text-green-800'
                            : performanceLevel === 'good' 
                            ? 'bg-blue-100 text-blue-800'
                            : performanceLevel === 'needsImprovement' 
                            ? 'bg-yellow-100 text-yellow-800'
                            : performanceLevel === 'poor' 
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                        style={performanceLevel === 'perfect' ? {
                          backgroundSize: '200% 100%',
                          animation: 'shimmer 2s infinite linear'
                        } : undefined}>
                          {/* {performanceLevel === 'perfect' && (
                            <span className="mr-1">✨</span>
                          )} */}
                          {performanceLevel === 'perfect' ? '表現完美' :
                           performanceLevel === 'excellent' ? '表現優異' :
                           performanceLevel === 'good' ? '表現良好' :
                           performanceLevel === 'needsImprovement' ? '需要改進' :
                           performanceLevel === 'poor' ? '表現不佳' : '急需改進'}
                          {/* {performanceLevel === 'perfect' && (
                            <span className="ml-1">✨</span>
                          )} */}
                        </span>
                      </div>
                      <p className="text-slate-300">
                        {performanceLevel === 'perfect'
                          ? `目前${metric.title}表現完美，建議持續保持並協助其他同仁。`
                          : performanceLevel === 'excellent'
                          ? `目前${metric.title}表現優異，建議持續保持並協助其他同仁。`
                          : performanceLevel === 'good'
                          ? `目前${metric.title}表現良好，建議持續保持並協助其他同仁。`
                          : performanceLevel === 'needsImprovement'
                          ? `建議參加${metric.title}相關培訓課程，提升專業技能。`
                          : performanceLevel === 'poor'
                          ? `建議參加${metric.title}相關培訓課程，提升專業技能。`
                          : `急需改進${metric.title}，建議參加相關培訓課程，提升專業技能。`}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}