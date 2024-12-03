// 產線助手GPT，使用代理中間件解決 CORS 問題

// 引入 http-proxy-middleware 中的代理中間件創建函數
const { createProxyMiddleware } = require("http-proxy-middleware");

// 導出代理配置函數，app 參數是 Express 應用實例
module.exports = function (app) {
  // 使用代理中間件
  app.use(
    "/api", // 設置需要代理的路徑前綴
    createProxyMiddleware({
      target: "http://120.113.124.106:10010", // 設置目標服務器地址
      changeOrigin: true, // 允許跨域請求，修改請求頭中的 host 值
      pathRewrite: {
        "^/api": "", // 重寫路徑，將 '/api' 前綴移除，使請求轉發到正確的後端路徑
      },
      // 代理響應處理函數，添加 CORS 頭
      onProxyRes: function (proxyRes, req, res) {
        proxyRes.headers["Access-Control-Allow-Origin"] = "*"; // 允許所有來源的請求
      },
      // 代理錯誤處理函數
      onError: (err, req, res) => {
        console.error("Proxy Error:", err); // 輸出代理錯誤信息
      },
    }),
  );
};
