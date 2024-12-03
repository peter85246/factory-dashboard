// 創建一個配置存儲 (更新秒數設定)
let settings = {
  updateInterval: 2000, // 預設值 2 秒
  warningThreshold: 80, // 預設 80%
};

// 導出獲取和更新配置的方法
export const getSettings = () => settings;

export const updateSettings = (newSettings) => {
  settings = { ...settings, ...newSettings };
  // 使用自定義事件通知其他組件
  const event = new CustomEvent("settingsUpdated", {
    detail: settings,
  });
  window.dispatchEvent(event);
  console.log("Settings updated:", settings); // 添加日誌
};
