import React, { useState, useRef, useEffect } from "react";
import { ClipboardList, Send, Image as ImageIcon, Loader, Bot } from "lucide-react";
import "./OrderAssistant.css";

const OrderAssistant = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const fileInputRef = useRef(null);
  const [enlargedImage, setEnlargedImage] = useState(null);

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

  useEffect(() => {
    const initializeWelcomeMessage = async () => {
      const welcomeMessage = {
        role: "assistant",
        content: "您好！我是您的訂單助手，請問需要什麼幫助呢？",
        displayContent: "",
        isWelcome: true,
      };

      setMessages([welcomeMessage]);
      await new Promise((resolve) => setTimeout(resolve, 100));
      await typeWriter(welcomeMessage.content, 0, [welcomeMessage]);
    };

    initializeWelcomeMessage();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const currentMessages = [...messages];
    const userMessage = {
      role: "user",
      content: input,
      displayContent: input,
    };
    currentMessages.push(userMessage);

    setMessages(currentMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/order-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          query: input,
        }),
      });

      if (!response.ok) {
        throw new Error(`伺服器回應錯誤: ${response.status}`);
      }

      const data = await response.json();
      
      const assistantMessage = {
        role: "assistant",
        content: data.output,
        displayContent: "",
      };

      setMessages([...currentMessages, assistantMessage]);
      await typeWriter(assistantMessage.content, currentMessages.length, [
        ...currentMessages,
        assistantMessage,
      ]);
    } catch (error) {
      console.error("Fetch Error:", error);
      const errorMessage = {
        role: "assistant",
        content: "抱歉，系統暫時發生問題。請稍後再試，或聯繫系統管理員協助處理。",
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
              id: Date.now() + Math.random(),
            },
          ]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  // 處理圖片移除
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

  return (
    <div className="order-assistant">
      {/* 添加圖片放大模態框 */}
      {enlargedImage && (
        <div className="order-image-modal-overlay" onClick={handleCloseEnlarged}>
          <div className="order-image-modal-content">
            <img src={enlargedImage} alt="enlarged" />
          </div>
        </div>
      )}

      <div className="chat-container">
        <div className="chat-header">
          <Bot className="text-blue-400 w-6 h-6" />
          <span className="text-white ml-2 font-medium">訂單助手</span>
        </div>

        <div className="messages">
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.role}`}>
              {(message.role === "assistant" || message.isWelcome) && (
                <div className="assistant-avatar">
                  <Bot className="text-blue-400 w-5 h-5" />
                </div>
              )}
              <div className="message-content">
                {message.image && (
                  <div className="order-message-image">
                    <img
                      src={message.image}
                      alt="uploaded"
                      onClick={() => handleImageClick(message.image)}
                    />
                  </div>
                )}
                {message.displayContent}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* 添加選中圖片預覽區域 */}
        {selectedImages.length > 0 && (
          <div className="order-selected-images-container">
            <div className="order-images-preview">
              {selectedImages.map((image) => (
                <div key={image.id} className="order-image-preview-item">
                  <img
                    src={image.url}
                    alt="selected"
                    onClick={() => handleImageClick(image.url)}
                  />
                  <button
                    onClick={() => handleRemoveImage(image.id)}
                    className="order-remove-image"
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
            multiple
          />
          {/* <button
            type="button"
            className="order-upload-button"
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
              <div className="order-dots-loading">
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

export default OrderAssistant; 