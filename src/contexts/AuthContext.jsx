import React, { createContext, useContext, useState } from "react";

// 創建身份驗證上下文，用於全局管理登入狀態
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // 初始化登入狀態，從 localStorage 中讀取
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem("isAuthenticated") === "true",
  );

  // 登入方法：設置登入狀態並保存到 localStorage
  const login = () => {
    setIsAuthenticated(true);
    localStorage.setItem("isAuthenticated", "true");
  };

  // 登出方法：清除登入狀態和 localStorage
  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("isAuthenticated");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// 自定義 Hook，用於在組件中獲取身份驗證上下文
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
