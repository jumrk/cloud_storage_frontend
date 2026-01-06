"use client";
import { useState, useRef, useEffect } from "react";
import { FiMessageCircle, FiX, FiSend, FiLoader } from "react-icons/fi";
import { useTranslations } from "next-intl";
import axiosClient from "@/shared/lib/axiosClient";
import { sanitizeAndFormat } from "@/shared/utils/sanitizeHtml"; // Sparkles icon component
const SparklesIcon = ({ className = "text-white text-xs", size = 12 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
      fill="currentColor"
    />
    <path
      d="M6 4L6.5 6.5L9 7L6.5 7.5L6 10L5.5 7.5L3 7L5.5 6.5L6 4Z"
      fill="currentColor"
    />
    <path
      d="M18 14L18.5 16.5L21 17L18.5 17.5L18 20L17.5 17.5L15 17L17.5 16.5L18 14Z"
      fill="currentColor"
    />
  </svg>
);

export default function FileManagerChat({
  isOpen,
  onClose,
  currentFolderId,
  folders,
  files,
  onNavigateToFile,
  onNavigateToFolder,
  onRefresh, // Callback to refresh file/folder list after actions (fallback)
  onUpdateData, // Callback to update data directly without reload (preferred)
}) {
  const t = useTranslations();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [currentAssistantMessageId, setCurrentAssistantMessageId] =
    useState(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const closeTimeoutRef = useRef(null);
  const openTimeRef = useRef(null);
  const scrollToBottom = (instant = false) => {
    // Use setTimeout to ensure DOM is updated
    setTimeout(
      () => {
        if (messagesContainerRef.current) {
          // Scroll container directly
          messagesContainerRef.current.scrollTop =
            messagesContainerRef.current.scrollHeight;
        } else if (messagesEndRef.current) {
          // Fallback to scrollIntoView
          messagesEndRef.current.scrollIntoView({
            behavior: instant ? "auto" : "smooth",
          });
        }
      },
      instant ? 0 : 100
    );
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    // Scroll to bottom when chat opens (if there are messages)
    // Wait for slide-in animation to complete (300ms) before scrolling
    if (isOpen && messages.length > 0) {
      setTimeout(() => {
        scrollToBottom(true); // Instant scroll to bottom
      }, 350); // Wait for animation to complete
    }
  }, [isOpen, messages.length]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    const messageText = input.trim();
    setInput("");
    setIsLoading(true);

    // Don't create assistant message yet - we'll create it when first chunk arrives
    const assistantMessageId = Date.now() + 1;
    setCurrentAssistantMessageId(assistantMessageId);
    let hasReceivedFirstChunk = false;

    try {
      // Build conversation history (last 10 messages, excluding the one we just added)
      const conversationHistory = messages.slice(-10).map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Get token for authorization
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

      // Call streaming API
      const baseURL =
        process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";
      const response = await fetch(
        `${baseURL}/api/chat/file-management/stream`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify({
            message: messageText,
            currentFolderId: currentFolderId || null,
            conversationHistory,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Lỗi không xác định");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data:")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "chunk") {
                // Create message on first chunk, then update incrementally
                if (!hasReceivedFirstChunk) {
                  hasReceivedFirstChunk = true;
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: assistantMessageId,
                      role: "assistant",
                      content: data.content,
                      timestamp: new Date(),
                      actions: [],
                      files: [],
                      folders: [],
                    },
                  ]);
                } else {
                  // Update message content incrementally
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? { ...msg, content: msg.content + data.content }
                        : msg
                    )
                  );
                }
              } else if (data.type === "done") {
                // Final update: replace content with cleaned response text (only text, no JSON)
                // Actions, files, folders will be displayed separately after text is done
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? {
                          ...msg,
                          // Replace content with cleaned response text (from parsed JSON)
                          // This removes any JSON blocks that were streamed
                          content: data.response || msg.content,
                          // Actions, files, folders will be shown after text finishes typing
                          actions: data.actions || [],
                          actionResults: data.actionResults || [],
                          // Results from backend execution
                          files: data.files || [],
                          folders: data.folders || [],
                        }
                      : msg
                  )
                );
                // Backend has already executed actions automatically
                // Update UI with updated data if available (preferred method)
                if (data.updatedData && Array.isArray(data.updatedData) && data.updatedData.length >= 0) {
                  // Use updatedData to update UI directly without reload
                  if (onUpdateData) {
                    onUpdateData(data.updatedData);
                  } else if (onRefresh) {
                    // Fallback to refresh if onUpdateData is not provided
                    setTimeout(() => {
                      onRefresh();
                    }, 500);
                  }
                } else if (data.actionResults && data.actionResults.length > 0) {
                  // Fallback: if no updatedData but actions were executed, refresh
                  const hasSuccessfulActions = data.actionResults.some(
                    (result) => result.success
                  );
                  if (hasSuccessfulActions && onRefresh) {
                    // Wait a bit for backend to finish, then refresh
                    setTimeout(() => {
                      onRefresh();
                    }, 1000);
                  }
                }
                // Handle navigation actions
                if (data.actions && data.actions.length > 0) {
                  data.actions.forEach((action) => {
                    if (action.type === "navigate") {
                      if (
                        action.target === "file" &&
                        action.id &&
                        onNavigateToFile
                      ) {
                        const file = files.find(
                          (f) => (f._id || f.id) === action.id
                        );
                        if (file) {
                          setTimeout(() => onNavigateToFile(file), 500);
                        }
                      } else if (
                        action.target === "folder" &&
                        action.id &&
                        onNavigateToFolder
                      ) {
                        const folder = folders.find(
                          (f) => (f._id || f.id) === action.id
                        );
                        if (folder) {
                          setTimeout(() => onNavigateToFolder(folder), 500);
                        }
                      }
                    }
                  });
                }
              } else if (data.type === "error") {
                // Handle error: create message if doesn't exist, or update existing one
                setMessages((prev) => {
                  const existingMessage = prev.find(
                    (msg) => msg.id === assistantMessageId
                  );
                  if (existingMessage) {
                    // Update existing message with error
                    return prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? { ...msg, content: `❌ ${data.error}` }
                        : msg
                    );
                  } else {
                    // Create new error message
                    return [
                      ...prev,
                      {
                        id: assistantMessageId,
                        role: "assistant",
                        content: `❌ ${data.error}`,
                        timestamp: new Date(),
                        actions: [],
                        files: [],
                        folders: [],
                      },
                    ];
                  }
                });
                // Mark as received first chunk to prevent loading indicator
                hasReceivedFirstChunk = true;
              }
            } catch (e) {
              console.error("Error parsing SSE data:", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat API Error:", error);
      const errorMessage =
        error.message || "Có lỗi xảy ra khi gửi tin nhắn. Vui lòng thử lại.";
      // Create error message if no message was created yet
      setMessages((prev) => {
        const existingMessage = prev.find(
          (msg) => msg.id === assistantMessageId
        );
        if (existingMessage) {
          return prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: `❌ ${errorMessage}` }
              : msg
          );
        } else {
          return [
            ...prev,
            {
              id: assistantMessageId,
              role: "assistant",
              content: `❌ ${errorMessage}`,
              timestamp: new Date(),
              actions: [],
              files: [],
              folders: [],
            },
          ];
        }
      });
    } finally {
      setIsLoading(false);
      setCurrentAssistantMessageId(null);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClose = () => {
    if (isClosing) return; // Prevent multiple close calls
    setIsClosing(true);
    // Clear any existing timeout
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => {
      setIsClosing(false);
      setIsVisible(false);
      closeTimeoutRef.current = null;
      // Call onClose after state is updated
      if (onClose) {
        onClose();
      }
    }, 350); // Slightly longer to ensure animation completes
  };

  useEffect(() => {
    if (isOpen && !isClosing) {
      // Track when we opened
      openTimeRef.current = Date.now();
      setIsVisible(true);
      // Clear any pending close timeout
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
    } else if (isOpen && isClosing) {
      // If opened while closing, cancel the close
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
      setIsClosing(false);
      setIsVisible(true);
    }
    // When isOpen becomes false, don't change isVisible - let the closing animation finish
  }, [isOpen]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  if (!isVisible && !isClosing) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isClosing ? "opacity-0" : "opacity-100"
        }`}
        onClick={handleClose}
      />
      {/* Chat Panel */}
      <div
        className={`fixed right-0 top-0 h-screen w-full md:w-[420px] flex flex-col z-50 shadow-2xl transition-transform duration-300 ease-out ${
          isClosing ? "translate-x-full" : "translate-x-0"
        }`}
        style={{
          background: "linear-gradient(to bottom, #ffffff 0%, #ebf2f7 100%)",
          transform:
            isVisible && !isClosing ? "translateX(0)" : "translateX(100%)",
        }}
      >
        {/* Close Button - Only show on mobile */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
          }}
          className="absolute top-4 right-4 z-[60] text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg p-2 transition-colors md:hidden"
          aria-label="Đóng chat"
        >
          <FiX className="text-lg" />
        </button>
        {/* Messages */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 sidebar-scrollbar relative"
        >
          {/* Gradient glow effect ở giữa */}
          {messages.length === 0 && !isLoading && (
            <>
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(ellipse 800px 500px at center 40%, rgba(235, 242, 247, 0.8) 0%, rgba(218, 231, 240, 0.5) 25%, rgba(235, 242, 247, 0.3) 40%, rgba(255, 255, 255, 0.1) 55%, transparent 75%)",
                  zIndex: 0,
                }}
              />
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(circle 300px at center 40%, rgba(182, 207, 225, 0.4) 0%, transparent 60%)",
                  zIndex: 0,
                }}
              />
            </>
          )}
          {messages.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center justify-center h-full -mt-20 relative z-10">
              <div className="mb-4">
                <SparklesIcon className="text-[#0e5f9b]" size={48} />
              </div>
              <p className="text-gray-900 font-medium text-base mb-8">
                Hỏi AI của chúng tôi bất cứ điều gì
              </p>
            </div>
          ) : (
            <div className="relative z-10">
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`flex mb-4 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-4 py-3 ${
                      message.role === "user"
                        ? "bg-[#ebf2f7] text-[#0e5f9b] border border-[#b6cfe1]/50 transition-all"
                        : "bg-white text-gray-900 border border-[#b6cfe1]/50 transition-all"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-[#0e5f9b] flex items-center justify-center">
                          <SparklesIcon size={16} />
                        </div>
                      </div>
                    )}
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">
                      <div
                        dangerouslySetInnerHTML={{
                          __html: sanitizeAndFormat(message.content),
                        }}
                      />
                      {/* Display actions and their results */}
                      {message.actions && message.actions.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-[#e2e8f0]">
                          <p className="text-xs font-medium text-gray-600 mb-1.5">
                            Thao tác:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {message.actions.map((action, idx) => {
                              // Find corresponding result
                              const result = message.actionResults?.find(
                                (r) => r.action?.type === action.type
                              );
                              const isSuccess = result?.success;
                              const hasError = result && !result.success;
                              let actionLabel = "";
                              let actionIcon = "⚡";
                              switch (action.type) {
                                case "create_folder":
                                  actionLabel = isSuccess
                                    ? `Đã tạo: ${action.name || "Mới"}`
                                    : `Tạo thư mục: ${action.name || "Mới"}`;
                                  actionIcon = isSuccess ? "✅" : "📁";
                                  break;
                                case "move_files":
                                  actionLabel = isSuccess
                                    ? `Đã di chuyển ${
                                        action.items?.length || 0
                                      } mục`
                                    : `Di chuyển ${
                                        action.items?.length || 0
                                      } mục`;
                                  actionIcon = isSuccess ? "✅" : "📦";
                                  break;
                                case "rename":
                                  actionLabel = isSuccess
                                    ? `Đã đổi tên: ${action.newName || ""}`
                                    : `Đổi tên: ${action.newName || ""}`;
                                  actionIcon = isSuccess ? "✅" : "✏️";
                                  break;
                                case "delete":
                                  actionLabel = isSuccess
                                    ? `Đã xóa ${action.items?.length || 0} mục`
                                    : `Xóa ${action.items?.length || 0} mục`;
                                  actionIcon = isSuccess ? "✅" : "🗑️";
                                  break;
                                case "navigate":
                                  actionLabel =
                                    action.target === "file"
                                      ? "Mở file"
                                      : "Mở thư mục";
                                  actionIcon =
                                    action.target === "file" ? "📄" : "📁";
                                  break;
                                case "search":
                                  actionLabel = isSuccess
                                    ? `Tìm thấy ${result.count || 0} kết quả`
                                    : `Tìm kiếm: ${action.query || ""}`;
                                  actionIcon = isSuccess ? "🔍" : "🔎";
                                  break;
                                default:
                                  actionLabel = action.type;
                              }
                              return (
                                <div
                                  key={idx}
                                  className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${
                                    isSuccess
                                      ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                      : hasError
                                      ? "bg-red-100 text-red-700 border border-red-200"
                                      : "bg-brand text-white"
                                  }`}
                                  title={
                                    hasError
                                      ? `Lỗi: ${result.error}`
                                      : JSON.stringify(action, null, 2)
                                  }
                                >
                                  <span>{actionIcon}</span>
                                  <span className="max-w-[200px] truncate">
                                    {actionLabel}
                                  </span>
                                  {hasError && (
                                    <span className="text-[10px] opacity-75 ml-1">
                                      ({result.error})
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          {message.actionResults &&
                            message.actionResults.some((r) => r.success) && (
                              <p className="text-xs text-emerald-600 mt-2">
                                ✓ Các thao tác đã được thực hiện tự động
                              </p>
                            )}
                        </div>
                      )}
                      {/* Display files and folders as interactive buttons */}
                      {(message.files && message.files.length > 0) ||
                      (message.folders && message.folders.length > 0) ? (
                        <div className="mt-3 pt-3 border-t border-[#e2e8f0]">
                          {message.folders && message.folders.length > 0 && (
                            <div className="mb-2">
                              <p className="text-xs font-medium text-gray-600 mb-1.5">
                                Thư mục:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {message.folders.map((folder, idx) => (
                                  <button
                                    key={folder.id || folder._id || idx}
                                    onClick={() => {
                                      if (onNavigateToFolder) {
                                        onNavigateToFolder(folder);
                                      }
                                    }}
                                    className="text-xs px-3 py-1.5 rounded-lg bg-[#ebf2f7] text-[#0e5f9b] hover:bg-[#dae7f0] transition-all border border-[#b6cfe1]/50 flex items-center gap-1.5"
                                  >
                                    <span>📁</span>
                                    <span className="max-w-[150px] truncate">
                                      {folder.name}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          {message.files && message.files.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-gray-600 mb-1.5">
                                Tệp tin:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {message.files.map((file, idx) => (
                                  <button
                                    key={file.id || file._id || idx}
                                    onClick={() => {
                                      if (onNavigateToFile) {
                                        onNavigateToFile(file);
                                      }
                                    }}
                                    className="text-xs px-3 py-1.5 rounded-lg bg-[#ebf2f7] text-[#0e5f9b] hover:bg-[#dae7f0] transition-all border border-[#b6cfe1]/50 flex items-center gap-1.5"
                                  >
                                    <span>📄</span>
                                    <span className="max-w-[150px] truncate">
                                      {file.name}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                    <span
                      className={`text-xs mt-2 block ${
                        message.role === "user"
                          ? "text-[#0e5f9b]/70"
                          : "text-gray-600"
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))}
              {/* Loading indicator - only show when loading and no assistant message yet */}
              {isLoading &&
                currentAssistantMessageId &&
                !messages.some(
                  (msg) =>
                    msg.role === "assistant" &&
                    msg.id === currentAssistantMessageId
                ) && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-[#b6cfe1]/50 rounded-lg px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#0e5f9b] flex items-center justify-center">
                          <SparklesIcon size={16} />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-2 h-2 rounded-full bg-[#0e5f9b] animate-bounce"
                            style={{ animationDelay: "0s" }}
                          ></div>
                          <div
                            className="w-2 h-2 rounded-full bg-[#0e5f9b] animate-bounce"
                            style={{ animationDelay: "0.15s" }}
                          ></div>
                          <div
                            className="w-2 h-2 rounded-full bg-[#0e5f9b] animate-bounce"
                            style={{ animationDelay: "0.3s" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        {/* Suggestions */}
        {messages.length === 0 && (
          <div className="px-4 pt-4 pb-2">
            <h3 className="text-sm font-medium text-[#0e5f9b] mb-3 text-center">
              Gợi ý những gì bạn có thể hỏi AI
            </h3>
            <div className="flex flex-wrap gap-2 justify-center mb-4">
              <button
                onClick={() => setInput("Tôi có thể yêu cầu bạn làm gì?")}
                className="text-xs px-4 py-2 rounded-lg bg-[#ebf2f7] text-[#0e5f9b] hover:bg-[#dae7f0] transition-all border border-[#b6cfe1]/50"
              >
                Tôi có thể yêu cầu bạn làm gì?
              </button>
              <button
                onClick={() =>
                  setInput("File nào của tôi đang được sử dụng nhiều nhất?")
                }
                className="text-xs px-4 py-2 rounded-lg bg-[#ebf2f7] text-[#0e5f9b] hover:bg-[#dae7f0] transition-all border border-[#b6cfe1]/50"
              >
                File nào của tôi đang được sử dụng nhiều nhất?
              </button>
              <button
                onClick={() =>
                  setInput("File nào tôi nên quan tâm ngay bây giờ?")
                }
                className="text-xs px-4 py-2 rounded-lg bg-[#ebf2f7] text-[#0e5f9b] hover:bg-[#dae7f0] transition-all border border-[#b6cfe1]/50"
              >
                File nào tôi nên quan tâm ngay bây giờ?
              </button>
            </div>
          </div>
        )}
        {/* Input */}
        <div className="border-t border-[#e2e8f0]/50 p-4">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                <SparklesIcon className="text-[#0e5f9b]" size={24} />
              </div>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Hỏi tôi bất cứ điều gì về file của bạn"
                className="w-full resize-none rounded-xl border border-[#e2e8f0] bg-white pl-12 pr-12 py-3 text-sm text-gray-900 placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#0e5f9b]/30 focus:border-[#0e5f9b] transition-all max-h-32"
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 flex-shrink-0 border border-[#e2e8f0] bg-white text-[#94a3b8] mb-[2px] hover:bg-[#f8fafc] disabled:hover:bg-white flex items-center justify-center"
              style={{
                width: "44px",
                height: "44px",
                boxSizing: "border-box",
                flexShrink: 0,
              }}
              aria-label="Gửi tin nhắn"
            >
              <FiSend className="text-lg" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
