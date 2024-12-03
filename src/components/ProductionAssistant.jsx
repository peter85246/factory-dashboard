/**
 * UI頁面：產線智能助手
 */
import React, { useState, useRef, useEffect } from "react";
import { Bot, Send, Image as ImageIcon, Loader } from "lucide-react"; // 引入需要的圖標
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
import "./ProductionAssistant.css";

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

const ProductionAssistant = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const [selectedImages, setSelectedImages] = useState([]); // 改為數組
  const fileInputRef = useRef(null); // 新增檔案輸入參考
  const [enlargedImage, setEnlargedImage] = useState(null);

  // 添加 ResizeObserver 警告處理
  useEffect(() => {
    const resizeObserverError = window.addEventListener("error", (e) => {
      if (
        e.message ===
        "ResizeObserver loop completed with undelivered notifications."
      ) {
        e.stopImmediatePropagation();
      }
    });

    return () => {
      window.removeEventListener("error", resizeObserverError);
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
        content: "您好！我是您的產線助手~請問需要什麼幫助呢？",
        displayContent: "",
        isWelcome: true,
      };

      // 清空之前的消息並設置歡迎消息
      setMessages([welcomeMessage]);

      // 等待一下再開始打字效果
      await new Promise((resolve) => setTimeout(resolve, 100));
      await typeWriter(
        "您好！我是您的產線助手~請問需要什麼幫助呢？",
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

    // 添加文字消息
    if (input.trim()) {
      const textMessage = {
        role: "user",
        content: input,
        displayContent: input,
      };
      currentMessages.push(textMessage);
    }

    // 添加圖片消息到UI顯示
    selectedImages.forEach((image) => {
      const imageMessage = {
        role: "user",
        content: "圖片",
        displayContent: "圖片",
        image: image.url
      };
      currentMessages.push(imageMessage);
    });

    // 更新消息列表並清空輸入
    setMessages(currentMessages);
    setInput("");
    setSelectedImages([]); // 清空已選擇的圖片
    setIsLoading(true);

    try {
      // 維持原有的 JSON 格式
      const response = await fetch("/api/conversation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          query: input,
          images: selectedImages.map(img => img.url) // 可選：如果後端需要處理圖片
        }),
      });

      // 檢查響應狀態
      if (!response.ok) {
        throw new Error(`伺服器回應錯誤: ${response.status}`);
      }

      // 解析響應數據
      const data = await response.json();
      console.log("Response data:", data); // 輸出響應數據以便調試

      // 創建助手回應消息對象
      const assistantMessage = {
        role: "assistant",
        content: data.output || "抱歉，我暫時無法處理您的請求。",
        displayContent: "",
      };

      // 更新消息列表並啟動打字機效
      setMessages([...currentMessages, assistantMessage]);
      await typeWriter(assistantMessage.content, currentMessages.length, [
        ...currentMessages,
        assistantMessage,
      ]);
    } catch (error) {
      // 錯誤處理
      console.error("Fetch Error:", error);
      const errorMessage = {
        role: "assistant",
        content:
          "抱歉，系統暫時發生問題。請稍後再試，或聯繫系統管理員協助處理。",
        displayContent: "",
      };

      // 顯示錯誤消息
      setMessages([...currentMessages, errorMessage]);
      await typeWriter(errorMessage.content, currentMessages.length, [
        ...currentMessages,
        errorMessage,
      ]);
    } finally {
      // 無論成功與否，都結束加載狀態
      setIsLoading(false);
    }
  };

  return (
    <div className="production-assistant">
      {/* 添加圖片放大模態框 */}
      {enlargedImage && (
        <div className="image-modal-overlay" onClick={handleCloseEnlarged}>
          <div className="image-modal-content">
            <img src={enlargedImage} alt="enlarged" />
          </div>
        </div>
      )}

      <div className="chat-container">
        <div className="chat-header">
          <Bot className="text-blue-400 w-6 h-6" />
          <span className="text-white ml-2 font-medium">產線智能助手</span>
        </div>

        <div className="messages">
          {messages.map(
            (message, index) =>
              message && (
                <div key={index} className={`message ${message?.role || ""}`}>
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
                          {message.charts.type === "pie" && (
                            <Chart
                              type="pie"
                              data={message.charts.data}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                  legend: {
                                    position: "bottom",
                                    labels: {
                                      color: "#f3f4f6", // 淺色文字
                                    },
                                  },
                                },
                              }}
                            />
                          )}
                          {message.charts.type === "bar" && (
                            <Chart
                              type="bar"
                              data={message.charts.data}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                  y: {
                                    ticks: { color: "#f3f4f6" },
                                    grid: { color: "rgba(75, 85, 99, 0.3)" },
                                  },
                                  x: {
                                    ticks: { color: "#f3f4f6" },
                                    grid: { color: "rgba(75, 85, 99, 0.3)" },
                                  },
                                },
                                plugins: {
                                  legend: {
                                    labels: { color: "#f3f4f6" },
                                  },
                                },
                              }}
                            />
                          )}
                        </div>
                      )}
                  </div>
                </div>
              ),
          )}
          <div ref={messagesEndRef} />
        </div>

        {selectedImages.length > 0 && (
          <div className="selected-images-container">
            <div className="images-preview">
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

        <form onSubmit={handleSubmit} className="input-form">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="請輸入您的問題..."
            className="chat-input"
            disabled={isLoading || isTyping}
          />
          <input
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            ref={fileInputRef}
            style={{ display: "none" }}
          />
          <button
            type="button"
            className="upload-button"
            disabled={isLoading || isTyping}
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon className="w-5 h-5" />
          </button>
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

export default ProductionAssistant;
