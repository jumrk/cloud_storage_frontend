"use client";
import { useState, useRef, useEffect } from "react";
import { FiX, FiSend } from "react-icons/fi";
import { useTranslations } from "next-intl";
import { sanitizeAndFormat } from "@/shared/utils/sanitizeHtml";

// Sparkles icon component
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

export default function JobManagementChat({
  isOpen,
  onClose,
  currentBoardId,
  boards,
  tasks,
  onNavigateToTask,
  onNavigateToBoard,
  onRefresh,
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
  const scrollToBottom = (instant = false) => {
    setTimeout(
      () => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop =
            messagesContainerRef.current.scrollHeight;
        } else if (messagesEndRef.current) {
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
    if (isOpen && messages.length > 0) {
      setTimeout(() => {
        scrollToBottom(true);
      }, 350);
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
    const assistantMessageId = Date.now() + 1;
    setCurrentAssistantMessageId(assistantMessageId);
    let hasReceivedFirstChunk = false;
    try {
      const conversationHistory = messages
        .slice(-10)
        .map((msg) => ({ role: msg.role, content: msg.content }));
      const baseURL =
        process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";
      const response = await fetch(
        `${baseURL}/api/chat/job-management/stream`,
        {
          method: "POST",
          credentials: "include", // ✅ Send cookies with request
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: messageText,
            currentBoardId: currentBoardId || null,
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
                      tasks: [],
                      boards: [],
                    },
                  ]);
                } else {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? { ...msg, content: msg.content + data.content }
                        : msg
                    )
                  );
                }
              } else if (data.type === "done") {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? {
                          ...msg,
                          content: data.response || msg.content,
                          actions: data.actions || [],
                          actionResults: data.actionResults || [],
                          tasks: data.tasks || [],
                          boards: data.boards || [],
                        }
                      : msg
                  )
                );
                if (data.actionResults && data.actionResults.length > 0) {
                  const hasSuccessfulActions = data.actionResults.some(
                    (result) => result.success
                  );
                  if (hasSuccessfulActions && onRefresh) {
                    setTimeout(() => {
                      onRefresh();
                    }, 1000);
                  }
                }
                if (data.actions && data.actions.length > 0) {
                  data.actions.forEach((action) => {
                    if (
                      action.type === "navigate" ||
                      action.type === "open_board" ||
                      action.type === "open_task"
                    ) {
                      if (
                        action.target === "board" &&
                        action.id &&
                        onNavigateToBoard
                      ) {
                        const board = boards?.find(
                          (b) => (b._id || b.id) === action.id
                        );
                        if (board) {
                          setTimeout(() => onNavigateToBoard(board), 500);
                        }
                      } else if (
                        action.target === "task" &&
                        action.id &&
                        onNavigateToTask
                      ) {
                        const task = tasks?.find(
                          (t) => (t._id || t.id) === action.id
                        );
                        if (task) {
                          setTimeout(() => onNavigateToTask(task), 500);
                        }
                      }
                    }
                  });
                }
              } else if (data.type === "error") {
                setMessages((prev) => {
                  const existingMessage = prev.find(
                    (msg) => msg.id === assistantMessageId
                  );
                  if (existingMessage) {
                    return prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? { ...msg, content: `❌ ${data.error}` }
                        : msg
                    );
                  } else {
                    return [
                      ...prev,
                      {
                        id: assistantMessageId,
                        role: "assistant",
                        content: `❌ ${data.error}`,
                        timestamp: new Date(),
                        actions: [],
                        tasks: [],
                        boards: [],
                      },
                    ];
                  }
                });
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
              tasks: [],
              boards: [],
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
    if (isClosing) return;
    setIsClosing(true);
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => {
      setIsClosing(false);
      setIsVisible(false);
      closeTimeoutRef.current = null;
      if (onClose) {
        onClose();
      }
    }, 300);
  };
  useEffect(() => {
    if (isOpen && !isClosing) {
      setIsVisible(true);
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
    } else if (isOpen && isClosing) {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
      setIsClosing(false);
      setIsVisible(true);
    }
  }, [isOpen]);
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);
  if (!isVisible && !isClosing) return null;
  const getActionInfo = (action, result) => {
    const isSuccess = result?.success;
    const hasError = result && !result.success;
    let actionLabel = "";
    let actionIcon = "⚡";
    switch (action.type) {
      case "create_task":
        actionLabel = isSuccess
          ? `Đã tạo: ${action.title || "Task mới"}`
          : `Tạo task: ${action.title || "Task mới"}`;
        actionIcon = isSuccess ? "✅" : "📝";
        break;
      case "update_task":
        actionLabel = isSuccess ? `Đã cập nhật task` : `Cập nhật task`;
        actionIcon = isSuccess ? "✅" : "✏️";
        break;
      case "assign_task":
        actionLabel = isSuccess ? `Đã gán task` : `Gán task`;
        actionIcon = isSuccess ? "✅" : "👤";
        break;
      case "move_task":
        actionLabel = isSuccess ? `Đã di chuyển task` : `Di chuyển task`;
        actionIcon = isSuccess ? "✅" : "📦";
        break;
      case "delete_task":
        actionLabel = isSuccess ? `Đã xóa task` : `Xóa task`;
        actionIcon = isSuccess ? "✅" : "🗑️";
        break;
      case "search_tasks":
        actionLabel = isSuccess
          ? `Tìm thấy ${result.count || 0} task`
          : `Tìm kiếm: ${action.query || ""}`;
        actionIcon = isSuccess ? "🔍" : "🔎";
        break;
      case "search_boards":
        actionLabel = isSuccess
          ? `Tìm thấy ${result.count || 0} board`
          : `Tìm kiếm: ${action.query || ""}`;
        actionIcon = isSuccess ? "🔍" : "🔎";
        break;
      case "create_board":
        actionLabel = isSuccess
          ? `Đã tạo board: ${action.title || "Mới"}`
          : `Tạo board: ${action.title || "Mới"}`;
        actionIcon = isSuccess ? "✅" : "📋";
        break;
      case "create_list":
        actionLabel = isSuccess
          ? `Đã tạo list: ${action.title || "Mới"}`
          : `Tạo list: ${action.title || "Mới"}`;
        actionIcon = isSuccess ? "✅" : "📝";
        break;
      default:
        actionLabel = action.type;
    }
    return { actionLabel, actionIcon, isSuccess, hasError };
  };
  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isClosing ? "opacity-0" : "opacity-100"
        }`}
        onClick={handleClose}
      />
      <div
        className={`fixed right-0 top-0 h-screen w-full md:w-[420px] flex flex-col z-50 shadow-2xl ${
          isClosing ? "animate-slide-out-right" : "animate-slide-in-right"
        }`}
        style={{
          background: "linear-gradient(to bottom, #ffffff 0%, #ebf2f7 100%)",
        }}
      >
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
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 sidebar-scrollbar relative"
        >
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
                Hỏi AI của chúng tôi bất cứ điều gì về công việc
              </p>
            </div>
          ) : (
            <div className="relative z-10">
              {messages.map((message) => (
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
                      {message.actions && message.actions.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-[#e2e8f0]">
                          <p className="text-xs font-medium text-gray-600 mb-1.5">
                            Thao tác:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {message.actions.map((action, idx) => {
                              const result = message.actionResults?.find(
                                (r) => r.action?.type === action.type
                              );
                              const {
                                actionLabel,
                                actionIcon,
                                isSuccess,
                                hasError,
                              } = getActionInfo(action, result);
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
                      {(message.tasks && message.tasks.length > 0) ||
                      (message.boards && message.boards.length > 0) ? (
                        <div className="mt-3 pt-3 border-t border-[#e2e8f0]">
                          {message.boards && message.boards.length > 0 && (
                            <div className="mb-2">
                              <p className="text-xs font-medium text-gray-600 mb-1.5">
                                Boards:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {message.boards.map((board, idx) => (
                                  <button
                                    key={board.id || board._id || idx}
                                    onClick={() => {
                                      if (onNavigateToBoard) {
                                        onNavigateToBoard(board);
                                        handleClose();
                                      }
                                    }}
                                    className="text-xs px-3 py-1.5 rounded-lg bg-[#ebf2f7] text-[#0e5f9b] hover:bg-[#dae7f0] transition-all border border-[#b6cfe1]/50 flex items-center gap-1.5"
                                  >
                                    <span>📋</span>
                                    <span className="max-w-[150px] truncate">
                                      {board.title || board.name}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          {message.tasks && message.tasks.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-gray-600 mb-1.5">
                                Tasks:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {message.tasks.map((task, idx) => (
                                  <button
                                    key={task.id || task._id || idx}
                                    onClick={() => {
                                      if (onNavigateToTask) {
                                        onNavigateToTask(task);
                                        handleClose();
                                      }
                                    }}
                                    className="text-xs px-3 py-1.5 rounded-lg bg-[#ebf2f7] text-[#0e5f9b] hover:bg-[#dae7f0] transition-all border border-[#b6cfe1]/50 flex items-center gap-1.5"
                                  >
                                    <span>📝</span>
                                    <span className="max-w-[150px] truncate">
                                      {task.title || task.name}
                                    </span>
                                    {task.dueAt && (
                                      <span className="text-[10px] opacity-75">
                                        (
                                        {new Date(
                                          task.dueAt
                                        ).toLocaleDateString("vi-VN")}
                                        )
                                      </span>
                                    )}
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
        {messages.length === 0 && (
          <div className="px-4 pt-4 pb-2">
            <h3 className="text-sm font-medium text-[#0e5f9b] mb-3 text-center">
              Gợi ý những gì bạn có thể hỏi AI
            </h3>
            <div className="flex flex-wrap gap-2 justify-center mb-4">
              <button
                onClick={() =>
                  setInput(
                    "Tạo task'Review design' cho John, deadline ngày mai"
                  )
                }
                className="text-xs px-4 py-2 rounded-lg bg-[#ebf2f7] text-[#0e5f9b] hover:bg-[#dae7f0] transition-all border border-[#b6cfe1]/50"
              >
                Tạo task mới
              </button>
              <button
                onClick={() => setInput("Task nào của tôi sắp đến hạn?")}
                className="text-xs px-4 py-2 rounded-lg bg-[#ebf2f7] text-[#0e5f9b] hover:bg-[#dae7f0] transition-all border border-[#b6cfe1]/50"
              >
                Task sắp đến hạn
              </button>
              <button
                onClick={() => setInput("Gợi ý task nào tôi nên làm tiếp theo")}
                className="text-xs px-4 py-2 rounded-lg bg-[#ebf2f7] text-[#0e5f9b] hover:bg-[#dae7f0] transition-all border border-[#b6cfe1]/50"
              >
                Gợi ý task
              </button>
              <button
                onClick={() => setInput("Báo cáo năng suất team tuần này")}
                className="text-xs px-4 py-2 rounded-lg bg-[#ebf2f7] text-[#0e5f9b] hover:bg-[#dae7f0] transition-all border border-[#b6cfe1]/50"
              >
                Báo cáo năng suất
              </button>
            </div>
          </div>
        )}
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
                placeholder="Hỏi tôi bất cứ điều gì về công việc của bạn"
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
