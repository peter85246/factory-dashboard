/**
 * UI頁面：日誌分析助手
 */
import React, { useState, useRef, useEffect } from "react";
import { Bot, Send, Image as ImageIcon, Loader } from "lucide-react";
import { ErrorBoundary } from "react-error-boundary";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from "chart.js";
import { Chart } from "react-chartjs-2";
import "./LogAnalysis.css";

// 註冊 Chart.js 組件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
);

// 添加 ErrorFallback 組件
const ErrorFallback = ({ error }) => {
  return null;
};

// 修改 ChartWrapper 組件
const ChartWrapper = ({ type, data }) => {
  const [isReady, setIsReady] = useState(false);
  const chartRef = useRef(null);

  useEffect(() => {
    // 延遲渲染圖表
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 300);

    return () => {
      clearTimeout(timer);
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [data]);

  const commonOptions = {
    animation: false,
    responsive: true,
    maintainAspectRatio: false,
    resizeDelay: 200,
    onResize: () => {}, // 空函數來防止 resize 事件
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: "#f3f4f6",
        },
      },
    },
    scales:
      type === "bar"
        ? {
            y: {
              ticks: { color: "#f3f4f6" },
              grid: { color: "rgba(75, 85, 99, 0.3)" },
            },
            x: {
              ticks: { color: "#f3f4f6" },
              grid: { color: "rgba(75, 85, 99, 0.3)" },
            },
          }
        : undefined,
  };

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div
        style={{
          position: "relative",
          height: "300px",
          width: "100%",
          overflow: "hidden",
        }}
      >
        {isReady && (
          <Chart
            ref={chartRef}
            type={type}
            data={data}
            options={commonOptions}
            redraw={false}
          />
        )}
      </div>
    </ErrorBoundary>
  );
};

const LogAnalysis = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const [selectedImages, setSelectedImages] = useState([]); // 改為數組
  const fileInputRef = useRef(null); // 新增檔案輸入參考
  const [enlargedImage, setEnlargedImage] = useState(null);

  useEffect(() => {
    // 處理 console.error
    const originalConsoleError = console.error;
    const ignoreMessages = [
      "ResizeObserver loop completed with undelivered notifications.",
      "ResizeObserver loop limit exceeded",
    ];

    console.error = (...args) => {
      if (
        args.length > 0 &&
        typeof args[0] === "string" &&
        ignoreMessages.some((msg) => args[0].includes(msg))
      ) {
        return;
      }
      originalConsoleError.apply(console, args);
    };

    // 處理 window error
    const handleWindowError = (event) => {
      if (ignoreMessages.some((msg) => event.message?.includes(msg))) {
        event.preventDefault();
        event.stopPropagation();
        return true;
      }
    };

    // 處理 unhandledrejection
    const handleUnhandledRejection = (event) => {
      if (ignoreMessages.some((msg) => event.reason?.message?.includes(msg))) {
        event.preventDefault();
        event.stopPropagation();
        return true;
      }
    };

    window.addEventListener("error", handleWindowError, true);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      console.error = originalConsoleError;
      window.removeEventListener("error", handleWindowError, true);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
    };
  }, []);

  // 修改打字機效果函數
  const typeWriter = async (text, messageIndex, currentMessages) => {
    setIsTyping(true);
    let tempMessages = [...currentMessages];

    for (let i = 0; i <= text.length; i++) {
      tempMessages[messageIndex] = {
        ...tempMessages[messageIndex],
        role: "assistant",
        displayContent: text.substring(0, i),
      };
      setMessages([...tempMessages]);
      await new Promise((resolve) => setTimeout(resolve, 30));
    }

    setIsTyping(false);
  };

  // 修改初始歡迎訊息
  useEffect(() => {
    const initializeWelcomeMessage = async () => {
      const welcomeMessage = {
        role: "assistant",
        content: "您好！我是您的日誌分析助手，請上傳日誌檔案或輸入您的問題。",
        displayContent: "",
        isWelcome: true,
      };

      // 清空之前的消息並設置歡迎消息
      setMessages([welcomeMessage]);

      // 等待一下再開始打字效果
      await new Promise((resolve) => setTimeout(resolve, 100));
      await typeWriter(
        "您好！我是您的日誌分析助手，請輸入您的問題~!",
        0,
        messages,
      );
    };

    initializeWelcomeMessage();
  }, []); // 空依賴數組，確保只在組件掛載時執行一次

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 處理圖片選擇
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setSelectedImages((prev) => [
            ...prev,
            {
              url: e.target.result,
              file: file,
              id: Date.now() + Math.random(), // 添加唯一ID
            },
          ]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  // 處理單個圖片移除
  const handleRemoveImage = (imageId) => {
    setSelectedImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  // 處理圖片點擊放大
  const handleImageClick = (imageUrl) => {
    setEnlargedImage(imageUrl);
  };

  // 處理關閉放大圖片
  const handleCloseEnlarged = () => {
    setEnlargedImage(null);
  };

  // 修改提交處理函數
  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((!input.trim() && selectedImages.length === 0) || isTyping) return;

    const currentMessages = [...messages];

    if (input.trim()) {
      const textMessage = {
        role: "user",
        content: input,
        displayContent: input,
      };
      currentMessages.push(textMessage);
    }

    setMessages(currentMessages);
    setInput("");
    setIsLoading(true);

    try {
      console.log(
        "發送請求到:",
        "https://f1m76mqd-8000.asse.devtunnels.ms/conversation",
      );

      //   const response = await fetch("http://192.168.1.156:8000/conversation", {
      const response = await fetch("http://192.168.1.156:8000/conversation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          query: input,
        }),
      });

      console.log("請求響應狀態:", response.status);

      if (!response.ok) {
        throw new Error(`伺服器回應錯誤: ${response.status}`);
      }

      const rawData = await response.json();
      console.log("Raw response data:", rawData);

      // 將純文本回應轉換為所需的格式 (JSON 格式、純文本
      const formattedData = {
        output:
          typeof rawData === "string"
            ? rawData // 處理純文本格式 "範例。"
            : rawData.output || JSON.stringify(rawData), // 處理 JSON 格式 {"output": "範例。"}
      };
      console.log("Formatted data:", formattedData);

      // 創建助手回應消息對象
      const assistantMessage = {
        role: "assistant",
        content: formattedData.output,
        displayContent: "",
        charts: formattedData.charts || null,
      };

      setMessages([...currentMessages, assistantMessage]);
      await typeWriter(assistantMessage.content, currentMessages.length, [
        ...currentMessages,
        assistantMessage,
      ]);
    } catch (error) {
      console.error("請求錯誤:", error);
      const errorMessage = {
        role: "assistant",
        content: `系統錯誤：${error.message}`,
        displayContent: "",
      };

      setMessages([...currentMessages, errorMessage]);
      await typeWriter(errorMessage.content, currentMessages.length, [
        ...currentMessages,
        errorMessage,
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="log-analysis">
      {/* 添加圖片放大模態框 */}
      {enlargedImage && (
        <div className="log-image-modal-overlay" onClick={handleCloseEnlarged}>
          <div className="log-image-modal-content">
            <img src={enlargedImage} alt="enlarged" />
          </div>
        </div>
      )}

      <div className="log-chat-container">
        <div className="log-chat-header">
          <Bot className="text-blue-400 w-6 h-6" />
          <span className="text-white ml-2 font-medium">日誌分析助手</span>
        </div>

        <div className="log-messages">
          {messages.map(
            (message, index) =>
              message && (
                <div
                  key={index}
                  className={`log-message ${message?.role || ""}`}
                >
                  {(message?.role === "assistant" || message?.isWelcome) && (
                    <div className="assistant-avatar">
                      <Bot className="text-blue-400 w-5 h-5" />
                    </div>
                  )}
                  <div className="message-content">
                    {message.image && (
                      <div className="message-image">
                        <img
                          src={message.image}
                          alt="uploaded"
                          onClick={() => handleImageClick(message.image)}
                        />
                      </div>
                    )}
                    {message.displayContent}
                    {message.charts &&
                      message.displayContent === message.content && (
                        <div className="chart-container">
                          <ChartWrapper
                            type={message.charts.type}
                            data={message.charts.data}
                          />
                        </div>
                      )}
                  </div>
                </div>
              ),
          )}
          <div ref={messagesEndRef} />
        </div>

        {selectedImages.length > 0 && (
          <div className="log-selected-images-container">
            <div className="log-images-preview">
              {selectedImages.map((image) => (
                <div key={image.id} className="image-preview-item">
                  <img
                    src={image.url}
                    alt="selected"
                    onClick={() => handleImageClick(image.url)}
                  />
                  <button
                    onClick={() => handleRemoveImage(image.id)}
                    className="remove-image"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="log-input-form">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="請輸入您的問題..."
            className="log-chat-input"
            disabled={isLoading || isTyping}
          />
          <input
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            ref={fileInputRef}
            style={{ display: "none" }}
          />
          {/* <button
            type="button"
            className="upload-button"
            disabled={isLoading || isTyping}
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon className="w-5 h-5" />
          </button> */}
          <button
            type="submit"
            className="send-button"
            disabled={isLoading || isTyping}
          >
            {isLoading ? (
              <div className="dots-loading">
                <div></div>
                <div></div>
                <div></div>
              </div>
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LogAnalysis;
