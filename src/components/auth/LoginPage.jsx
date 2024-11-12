import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Cpu, CheckCircle2, XCircle } from "lucide-react";

export const LoginPage = () => {
  // 表單數據狀態管理
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({ type: "", message: "" });
  const navigate = useNavigate();
  const { login } = useAuth();

  // Toast 提示函數
  const showNotification = (type, message) => {
    setToastMessage({ type, message });
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // 處理表單提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (formData.username === "admin" && formData.password === "123456") {
        // 登入成功
        showNotification("success", "登入成功！歡迎回來");
        setTimeout(() => {
          login();
          navigate("/dashboard");
        }, 1500);
      } else {
        throw new Error("帳號或密碼錯誤");
      }
    } catch (err) {
      setTimeout(() => {
        showNotification("error", err.message);
        setIsLoading(false);
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1015] flex items-center justify-center p-4 relative">
      {/* Toast 通知 */}
      {showToast && (
        <div
          className={`
          fixed top-4 right-4 p-4 rounded-lg shadow-lg
          transition-all duration-300 transform
          ${
            toastMessage.type === "success"
              ? "bg-green-500/20 border border-green-500 text-green-400"
              : "bg-red-500/20 border border-red-500 text-red-400"
          }
          flex items-center space-x-2
          animate-slide-in-right
        `}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <XCircle className="h-5 w-5" />
          )}
          <span>{toastMessage.message}</span>
        </div>
      )}

      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-3 rounded-lg">
            <Cpu className="h-8 w-8 text-white" />
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-3xl font-bold text-white tracking-wide">SME</h1>
            <p className="text-base text-cyan-400 font-medium">
              Smart Machine Engine
            </p>
          </div>
        </div>

        <div
          className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 shadow-xl border border-gray-700 mt-6
                      transition-all duration-300 hover:shadow-cyan-500/5"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                帳號
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg 
                          focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all 
                          text-white placeholder-gray-500 text-base"
                placeholder="請輸入帳號"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                密碼
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg 
                          focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all 
                          text-white placeholder-gray-500 text-base"
                placeholder="請輸入密碼"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-2.5 px-3 rounded-lg text-white font-medium text-base
                ${
                  isLoading
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                } 
                transition-all duration-200 ease-in-out transform hover:scale-[1.02]
                flex items-center justify-center space-x-2
                focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-900
              `}
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>驗證中...</span>
                </>
              ) : (
                <span>登入系統</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
