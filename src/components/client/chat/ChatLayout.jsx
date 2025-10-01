"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  FiUser,
  FiPlus,
  FiSearch,
  FiX,
  FiPaperclip,
  FiSend,
  FiMenu,
} from "react-icons/fi";
import useSocket from "@/lib/useSocket";
import axiosClient from "@/lib/axiosClient";
import { useRef } from "react";
import { decodeTokenGetUser } from "@/lib/jwt";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import SkeletonChat from "@/components/ui/SkeletonChat";
import { useTranslations } from "next-intl";
import Image from "next/image";

// Định nghĩa màu cho các loại label
const LABEL_STYLES = {
  Admin: { bg: "#ffe7d6", color: "#e26a1b" },
  Leader: { bg: "#e6f4ff", color: "#189ff2" },
  Member: { bg: "#d6fbe7", color: "#1bbf3a" },
  // Có thể thêm các loại khác nếu muốn
};
const PRIMARY = "#189ff2";
const SIDEBAR_PX = "px-7"; // đồng bộ padding
const MAIN_PX = "px-7";
const AVATAR_SIZE = 44;
const ICON_SIZE = 22;

function ChatSidebar({
  chats,
  onSelect,
  selectedId,
  search,
  setSearch,
  onAddUser,
  onlineList = [], // <-- thêm prop này
  setChats,
  loadingChats = false,
}) {
  const t = useTranslations();
  const [showSearch, setShowSearch] = useState(false);
  const [searchUser, setSearchUser] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const searchTimeout = useRef();
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    // Lấy user hiện tại từ token
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      const info = decodeTokenGetUser(token);
      setCurrentUserId(info?.id || info?._id || null);
    }
  }, []);

  // Debounce search user
  useEffect(() => {
    if (!showSearch) return;
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!searchUser.trim()) {
      setSearchResults([]);
      return;
    }
    setLoading(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await axiosClient.get(
          `/api/user/search?query=${encodeURIComponent(searchUser.trim())}`
        );
        setSearchResults(res.data.users || []);
      } catch {
        setSearchResults([]);
      }
      setLoading(false);
    }, 350);
    // eslint-disable-next-line
  }, [searchUser, showSearch]);

  const filtered = chats.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );
  if (loadingChats) {
    // Dùng width cố định cho skeleton lastMessage để tránh hydration error
    const skeletonWidths = [120, 110, 130, 100, 140, 115];
    return (
      <div
        className="w-full h-full flex flex-col bg-white border-r border-gray-200"
        style={{ minWidth: 300, maxWidth: 340 }}
      >
        <div
          className={`flex items-center justify-end ${SIDEBAR_PX} py-5 border-b border-gray-200`}
          style={{ position: "relative" }}
        >
          <Skeleton
            circle
            width={40}
            height={40}
            style={{ minWidth: 40, minHeight: 40 }}
          />
        </div>
        <div className={`${SIDEBAR_PX} py-3`}>
          <div className="relative" style={{ width: 240, maxWidth: "100%" }}>
            <Skeleton width={240} height={40} style={{ borderRadius: 20 }} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="flex gap-3 p-2 mb-1 rounded-2xl items-center bg-[#f7f8fc]"
              style={{ minHeight: 54, borderRadius: 16 }}
            >
              <div className="relative">
                <Skeleton circle width={40} height={40} />
                <span className="absolute bottom-0 left-7 w-3 h-3 rounded-full border-2 border-white bg-gray-300" />
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-center justify-between">
                  <Skeleton
                    width={120}
                    height={16}
                    style={{ borderRadius: 8 }}
                  />
                  <Skeleton
                    width={28}
                    height={13}
                    style={{ borderRadius: 6, marginLeft: 8 }}
                  />
                </div>
                <Skeleton
                  width={skeletonWidths[i % skeletonWidths.length]}
                  height={13}
                  style={{ marginTop: 4, borderRadius: 6 }}
                />
                <div className="flex gap-2 flex-wrap mt-1 items-center">
                  <span
                    className="rounded-full px-2 py-0.5 text-[12px] font-medium border bg-[#e6f4ff] text-[#189ff2] border-[#e6f4ff]"
                    style={{
                      minWidth: 38,
                      height: 18,
                      display: "inline-block",
                    }}
                  >
                    <Skeleton
                      width={32}
                      height={12}
                      style={{ backgroundColor: "#e6f4ff" }}
                    />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div
      className={`w-full h-full flex flex-col bg-white border-r border-gray-200`}
      style={{ minWidth: 300, maxWidth: 340 }}
    >
      <div
        className={`flex items-center justify-end ${SIDEBAR_PX} py-5 border-b border-gray-200`}
        style={{ position: "relative" }}
      >
        <button
          className="rounded-full p-2 shadow-md hover:shadow-lg transition bg-[#189ff2] text-white hover:bg-[#0d8ae6] flex items-center justify-center"
          onClick={() => setShowSearch((v) => !v)}
          style={{ boxShadow: "0 2px 8px rgba(24,159,242,0.10)" }}
        >
          <FiPlus size={ICON_SIZE} />
        </button>
        {showSearch && (
          <div
            className="absolute left-0 right-0 top-full z-50 px-4"
            style={{ minWidth: 300, maxWidth: 340 }}
          >
            <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100 mt-2">
              <input
                className="w-full border border-gray-200 rounded-xl px-3 py-2 mb-2 text-[15px] focus:outline-none focus:ring-1 focus:ring-[#189ff2]"
                placeholder={t("chat.sidebar.search_user_placeholder")}
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                autoFocus
              />
              <div className="bg-white rounded-xl shadow p-2 max-h-56 overflow-y-auto border border-gray-100">
                {loading && (
                  <div className="text-center text-gray-400 py-2 text-sm">
                    {t("chat.sidebar.searching")}
                  </div>
                )}
                {!loading &&
                  searchResults.length === 0 &&
                  searchUser.trim() && (
                    <div className="text-center text-gray-400 py-2 text-sm">
                      {t("chat.sidebar.no_user_found")}
                    </div>
                  )}
                {searchResults
                  .filter((u) => u._id !== currentUserId)
                  .map((u) => (
                    <div
                      key={u._id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#f5f8ff] cursor-pointer transition"
                      onClick={() => {
                        onAddUser(u);
                        setShowSearch(false);
                        setSearchUser("");
                        setSearchResults([]);
                      }}
                    >
                      <Image
                        src={u.avatar || "/images/avatar_empty.png"}
                        alt="avatar"
                        className="w-9 h-9 rounded-lg object-cover"
                        width={36}
                        height={36}
                        placeholder="blur"
                        blurDataURL="data:image/png;base64,..."
                        priority
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-[15px] text-[#222] truncate">
                          {u.fullName || u.email || u.slast}
                        </div>
                        <div className="text-xs text-gray-400 truncate">
                          {u.email || u.slast}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
      <div className={`${SIDEBAR_PX} py-3`}>
        <div className="relative">
          <FiSearch
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            className="w-full pl-10 pr-3 py-2 rounded-full bg-gray-100 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#189ff2] text-[15px]"
            placeholder={t("chat.sidebar.search_placeholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.map((chat) => (
          <div
            key={chat.id}
            className={`flex gap-3 p-2 mb-1 rounded-2xl cursor-pointer items-center transition-all duration-150 ${
              selectedId === chat.id ? "bg-[#f7f8fc]" : ""
            }`}
            onClick={async () => {
              onSelect(chat.id);
              // Đánh dấu đã đọc khi click vào chat
              if (chat.unread) {
                try {
                  await axiosClient.patch("/api/message/read", {
                    partnerId: chat.id,
                  });
                  // Cập nhật luôn FE: set unread = false
                  setChats((prev) =>
                    prev.map((c) =>
                      c.id === chat.id ? { ...c, unread: false } : c
                    )
                  );
                } catch {}
              }
            }}
            style={{ minHeight: 54, borderRadius: 16 }}
          >
            <div className="relative">
              <Image
                src={chat.avatar || "/images/avatar_empty.png"}
                alt="avatar"
                className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-gray-200"
                style={{ backgroundColor: "#fff" }}
                width={40}
                height={40}
                placeholder="blur"
                blurDataURL="data:image/png;base64,..."
                priority
              />
              {/* Chấm online/offline */}
              <span
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                  onlineList.includes(chat.id) ? "bg-green-500" : "bg-gray-300"
                }`}
                title={onlineList.includes(chat.id) ? "Online" : "Offline"}
              />
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[15px] text-[#222] truncate">
                  {capitalizeWords(chat.name)}
                </span>
                <span
                  className="text-[13px] text-[#b0b0b0] ml-2 relative"
                  style={{ minWidth: 28, textAlign: "right" }}
                >
                  {formatTimeShort(chat.time)}
                  {/* Chấm xanh báo unread */}
                  {chat.unread && (
                    <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1 w-2 h-2 rounded-full bg-[#189ff2]" />
                  )}
                </span>
              </div>
              <div
                className={`text-[13px] mt-0.5 truncate font-normal ${
                  chat.unread ? "font-bold text-[#222]" : "text-[#8a8f98]"
                }`}
              >
                {chat.lastMessage}
              </div>
              <div className="flex gap-2 flex-wrap mt-1">
                {/* Gán label theo role, có thể mở rộng nhiều label nếu muốn */}
                {chat.role && (
                  <span
                    className="rounded-full px-2 py-0.5 text-[12px] font-medium border"
                    style={{
                      background:
                        LABEL_STYLES[capitalizeWords(chat.role)]?.bg || "#eee",
                      color:
                        LABEL_STYLES[capitalizeWords(chat.role)]?.color ||
                        "#555",
                      borderColor:
                        LABEL_STYLES[capitalizeWords(chat.role)]?.bg || "#eee",
                    }}
                  >
                    {t(`chat.role.${chat.role.toLowerCase()}`)}
                  </span>
                )}
                {/* Nếu muốn có thêm label khác, có thể map thêm ở đây */}
                {chat.labels?.map((label) => (
                  <span
                    key={label}
                    className="rounded-full px-2 py-0.5 text-[12px] font-medium border"
                    style={{
                      background: LABEL_STYLES[label]?.bg || "#eee",
                      color: LABEL_STYLES[label]?.color || "#555",
                      borderColor: LABEL_STYLES[label]?.bg || "#eee",
                    }}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChatModal({ open, onClose, options, onSelect }) {
  const t = useTranslations();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl shadow-2xl p-6 min-w-[320px] max-w-xs relative border border-gray-100">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
          onClick={onClose}
        >
          <FiX size={20} />
        </button>
        <div className="font-bold text-lg mb-4 flex items-center gap-2 text-[#189ff2]">
          <FiUser size={ICON_SIZE} /> {t("chat.modal.new_conversation")}
        </div>
        <div className="flex flex-col gap-2">
          {options.map((opt) => (
            <button
              key={opt.id}
              className="w-full px-4 py-2 rounded-lg bg-[#eaf6fd] text-[#189ff2] font-semibold hover:bg-[#d2eafd] flex items-center gap-2"
              onClick={() => {
                onSelect(opt.id);
                onClose();
              }}
            >
              <FiUser size={ICON_SIZE} /> {opt.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChatConversation({
  chat,
  messages,
  onSend,
  input,
  setInput,
  userMap,
  myId,
  isTyping,
  onLoadMore,
  hasMore,
  loadingMore,
  loadingMessages,
  onlineList,
}) {
  const t = useTranslations();
  const messagesEndRef = useRef(null);
  const scrollRef = useRef(null);
  const prevScrollHeight = useRef(0);
  const prevMsgCount = useRef(0);
  const shouldScrollToBottom = useRef(true);

  // Khi vào chat mới, luôn scroll xuống đáy
  useEffect(() => {
    shouldScrollToBottom.current = true;
  }, [chat]);

  // Sửa lại auto scroll: luôn scroll xuống đáy khi có tin nhắn mới hoặc vừa load xong
  useEffect(() => {
    if (!loadingMessages) {
      setTimeout(() => {
        const el = messagesEndRef.current;
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
      }, 0);
    }
  }, [messages, isTyping, loadingMessages]);

  // Khi load thêm (prepend), không scroll xuống đáy
  useEffect(() => {
    if (loadingMore && scrollRef.current) {
      prevScrollHeight.current = scrollRef.current.scrollHeight;
      shouldScrollToBottom.current = false;
    }
  }, [loadingMore]);

  // Khi load xong, set lại scrollTop để giữ vị trí
  useEffect(() => {
    if (!loadingMore && scrollRef.current && prevScrollHeight.current) {
      const el = scrollRef.current;
      const diff = el.scrollHeight - prevScrollHeight.current;
      if (diff > 0) {
        el.scrollTop = diff;
      }
      prevScrollHeight.current = 0;
    }
  }, [loadingMore]);

  // Infinite scroll: khi kéo lên đầu sẽ load thêm
  useEffect(() => {
    if (!onLoadMore || !hasMore) return;
    const handleScroll = () => {
      const el = scrollRef.current;
      if (el && el.scrollTop < 40 && hasMore && !loadingMore) {
        onLoadMore();
      }
    };
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", handleScroll);
      return () => el.removeEventListener("scroll", handleScroll);
    }
  }, [onLoadMore, hasMore, loadingMore]);

  // Lấy trạng thái online của user đang chat
  const isOnline = chat && onlineList && onlineList.includes(chat.id);

  // Nếu loadingMessages (hoặc loadingChats) thì luôn render skeleton
  if (loadingMessages) return <SkeletonChat />;
  if (!chat && !loadingMessages) return null;

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div
        className={`flex items-center gap-3 ${MAIN_PX} py-5 border-b border-gray-100 bg-white shadow-sm`}
      >
        <div
          className="flex items-center justify-center rounded-full bg-[#eaf6fd] border-2 border-[#189ff2] shadow overflow-hidden"
          style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
        >
          {loadingMessages ? (
            <Skeleton circle width={AVATAR_SIZE} height={AVATAR_SIZE} />
          ) : (
            <Image
              src={chat?.avatar || "/images/avatar_empty.png"}
              alt="avatar"
              className="w-full h-full object-cover"
              width={AVATAR_SIZE}
              height={AVATAR_SIZE}
              placeholder="blur"
              blurDataURL="data:image/png;base64,..."
              priority
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-[18px] text-[#222]">
            {loadingMessages ? (
              <Skeleton width={120} height={20} />
            ) : (
              chat?.name || t("chat.conversation.select_conversation")
            )}
          </div>
          <div className="text-xs flex items-center gap-1 mt-0.5">
            {loadingMessages ? (
              <Skeleton width={60} height={12} />
            ) : (
              <>
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    isOnline ? "bg-green-500" : "bg-gray-400"
                  }`}
                />
                <span className={isOnline ? "text-green-500" : "text-gray-400"}>
                  {isOnline
                    ? t("chat.status.online")
                    : t("chat.status.offline")}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
      {/* Messages */}
      <div
        className={`flex-1 overflow-y-auto hide-scrollbar ${MAIN_PX} py-6 bg-[#f7fafd]`}
        ref={scrollRef}
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {hasMore && loadingMore && (
          <div className="text-center text-xs text-[#189ff2] mb-2">
            {t("chat.conversation.loading_more")}
          </div>
        )}
        {loadingMessages ? (
          <>
            {[...Array(8)].map((_, i) => (
              <div key={i} className="mb-2 flex justify-start items-end">
                <Skeleton
                  circle
                  width={32}
                  height={32}
                  style={{ marginRight: 8 }}
                />
                <Skeleton
                  width={120 + Math.random() * 80}
                  height={28}
                  borderRadius={18}
                />
              </div>
            ))}
          </>
        ) : chat ? (
          messages.map((msg, idx) => {
            const isMe = msg.from === myId;
            const user = isMe ? userMap[myId] : userMap[chat.id];
            return (
              <div
                key={msg._id || idx}
                className={`mb-2 flex ${
                  isMe ? "justify-end" : "justify-start"
                }`}
              >
                {!isMe && (
                  <Image
                    src={user?.avatar || "/images/avatar_empty.png"}
                    alt="avatar"
                    className="w-8 h-8 rounded-full object-cover mr-2 border border-gray-200"
                    width={32}
                    height={32}
                    placeholder="blur"
                    blurDataURL="data:image/png;base64,..."
                    priority
                  />
                )}
                <div
                  className={`px-4 py-2 rounded-2xl max-w-[70%] text-[15px] shadow ${
                    isMe
                      ? "bg-[#189ff2] text-white"
                      : "bg-white text-[#222] border border-gray-100"
                  }`}
                  style={{ borderRadius: 18, fontWeight: 500 }}
                >
                  {msg.content}
                </div>
                {isMe && (
                  <Image
                    src={user?.avatar || "/images/avatar_empty.png"}
                    alt="avatar"
                    className="w-8 h-8 rounded-full object-cover ml-2 border border-gray-200"
                    width={32}
                    height={32}
                    placeholder="blur"
                    blurDataURL="data:image/png;base64,..."
                    priority
                  />
                )}
              </div>
            );
          })
        ) : null}
        {/* Typing indicator */}
        {isTyping && (
          <div className="mb-2 flex justify-start items-end">
            <Image
              src={chat?.avatar || "/images/avatar_empty.png"}
              alt="avatar"
              className="w-8 h-8 rounded-full object-cover mr-2 border border-gray-200"
              width={32}
              height={32}
              placeholder="blur"
              blurDataURL="data:image/png;base64,..."
              priority
            />
            <div
              className="px-3 py-2 rounded-2xl bg-white border border-gray-100 flex items-center"
              style={{
                borderRadius: 18,
                minWidth: 48,
                minHeight: 32,
                justifyContent: "center",
              }}
            >
              <span className="typing-ellipsis">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      {/* Input */}
      <form
        className={`flex items-center gap-2 ${MAIN_PX} py-5 border-t border-gray-100 bg-white`}
        style={{ minHeight: 64 }}
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim()) {
            onSend(input);
          }
        }}
      >
        <button
          type="button"
          className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 text-gray-400 transition"
          tabIndex={-1}
          style={{ flexShrink: 0 }}
        >
          <FiPaperclip size={20} />
        </button>
        <input
          className="flex-1 border border-gray-200 rounded-full px-4 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-[#189ff2] text-[15px] placeholder:text-gray-400"
          placeholder={t("chat.conversation.input_placeholder")}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ minHeight: 44 }}
          onInput={() => {
            if (window.typingTimeout) clearTimeout(window.typingTimeout);
            if (window.lastTypingTo !== chat?.id && chat?.id) {
              window.lastTypingTo = chat.id;
            }
            if (chat?.id && window.socketRef && window.socketRef.current) {
              window.socketRef.current.emit("chat:typing", { to: chat.id });
            }
            window.typingTimeout = setTimeout(() => {
              window.lastTypingTo = null;
            }, 2000);
          }}
        />
        <button
          type="submit"
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-gray-200 hover:bg-[#eaf6fd] transition"
          style={{ flexShrink: 0 }}
        >
          <FiSend size={20} className="text-[#189ff2]" />
        </button>
      </form>
      {/* Typing indicator animation CSS */}
      <style jsx>{`
        .typing-ellipsis {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 20px;
          gap: 4px;
        }
        .typing-ellipsis .dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #b0b0b0;
          opacity: 0.7;
          animation: typing-bounce 1s infinite both;
        }
        .typing-ellipsis .dot:nth-child(2) {
          animation-delay: 0.2s;
        }
        .typing-ellipsis .dot:nth-child(3) {
          animation-delay: 0.4s;
        }
        @keyframes typing-bounce {
          0%,
          80%,
          100% {
            transform: translateY(0);
            opacity: 0.7;
          }
          40% {
            transform: translateY(-6px);
            opacity: 1;
          }
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

function formatTime(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diff = (now - date) / 1000; // seconds
  if (diff < 60) return `${Math.floor(diff)}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

// Thêm hàm format tên và thời gian
function capitalizeWords(str) {
  if (!str) return "";
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}
function formatTimeDisplay(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// Hàm format thời gian ngắn: 24m, 2h, 3d
function formatTimeShort(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export default function ChatLayout({ isAdmin = false, updateUnreadCount }) {
  const [chats, setChats] = useState([]);
  const [selected, setSelected] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [userMap, setUserMap] = useState({}); // id -> {name}
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : "";

  const [myId, setMyId] = useState(null);
  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      const info = decodeTokenGetUser(token);
      setMyId(info?.id || info?._id || null);
    }
  }, []);

  useEffect(() => {
    async function fetchConversations() {
      setLoadingChats(true);
      let conversations = [];
      try {
        const res = await axiosClient.get("/api/message/conversations");
        conversations = res.data.conversations || [];
      } catch {}
      if (!isAdmin) {
        try {
          const res = await axiosClient.get("/api/user/admin");
          if (res.data && res.data.admin) {
            const adminId = res.data.admin._id;
            if (!conversations.some((c) => c.id === adminId)) {
              conversations.unshift({
                id: adminId,
                name:
                  res.data.admin.fullName ||
                  res.data.admin.email ||
                  res.data.admin.username ||
                  res.data.admin._id,
                avatar: res.data.admin.avatar,
                role: res.data.admin.role,
                lastMessage: "",
                time: "",
              });
            }
          }
        } catch {}
      }
      setChats(conversations);
      setUserMap(
        conversations.reduce((acc, u) => {
          acc[u.id] = u;
          return acc;
        }, {})
      );
      if (conversations.length > 0) setSelected(conversations[0].id);
      setLoadingChats(false);
    }
    fetchConversations();
  }, [isAdmin]);

  useEffect(() => {
    if (!selected) return;
    setLoadingMessages(true);
    async function fetchHistory() {
      try {
        const res = await axiosClient.get(
          `/api/message?withUser=${selected}&limit=20`
        );
        if (res.data && res.data.messages) {
          setMessages(res.data.messages);
          setHasMore(res.data.hasMore);
        }
      } catch {}
      setLoadingMessages(false);
    }
    fetchHistory();
  }, [selected]);

  const onLoadMore = async () => {
    if (!hasMore || loadingMore || !messages.length) return;
    setLoadingMore(true);
    try {
      const firstMsg = messages[0];
      const res = await axiosClient.get(
        `/api/message?withUser=${selected}&before=${firstMsg._id}&limit=20`
      );
      if (res.data && res.data.messages) {
        setMessages((prev) => {
          const all = [...res.data.messages, ...prev];
          const unique = [];
          const seen = new Set();
          for (const msg of all) {
            if (!seen.has(msg._id)) {
              unique.push(msg);
              seen.add(msg._id);
            }
          }
          return unique;
        });
        setHasMore(res.data.hasMore);
        shouldScrollToBottom.current = false;
      }
    } catch {}
    setLoadingMore(false);
  };

  const playMessageSound = () => {
    if (
      typeof window !== "undefined" &&
      document.visibilityState === "visible"
    ) {
      const audio = new Audio("/sound/sounds.wav");
      audio.play();
    }
  };

  const onMessage = useCallback(
    (msg) => {
      if (msg.from === selected || msg.to === selected) {
        setMessages((prev) => [...prev, msg]);
        if (msg.from !== myId) playMessageSound();
        if (updateUnreadCount) updateUnreadCount();
      }
      setChats((prev) => {
        const chatId = msg.from === myId ? msg.to : msg.from;
        const updated = prev.map((c) =>
          c.id === chatId
            ? { ...c, lastMessage: msg.content, time: msg.createdAt }
            : c
        );
        return [
          ...updated.filter((c) => c.id === chatId),
          ...updated.filter((c) => c.id !== chatId),
        ];
      });
    },
    [selected, myId, updateUnreadCount]
  );
  const socketRef = useSocket(token, onMessage);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.socketRef = socketRef;
    }
  }, [socketRef]);

  const [onlineList, setOnlineList] = useState([]);
  useEffect(() => {
    if (!socketRef.current) return;
    socketRef.current.emit("user:getOnline");
    socketRef.current.on("user:onlineList", (list) => setOnlineList(list));
    socketRef.current.on("user:online", (id) =>
      setOnlineList((prev) => [...new Set([...prev, id])])
    );
    socketRef.current.on("user:offline", (id) =>
      setOnlineList((prev) => prev.filter((uid) => uid !== id))
    );
    return () => {
      socketRef.current.off("user:onlineList");
      socketRef.current.off("user:online");
      socketRef.current.off("user:offline");
    };
  }, [socketRef.current]);

  const handleSend = (content) => {
    if (!content.trim() || !selected) return;
    if (socketRef.current) {
      socketRef.current.emit("chat:send", { to: selected, content });
    }
    setInput("");
    setChats((prev) => {
      const updated = prev.map((c) =>
        c.id === selected
          ? { ...c, lastMessage: content, time: new Date().toISOString() }
          : c
      );
      return [
        ...updated.filter((c) => c.id === selected),
        ...updated.filter((c) => c.id !== selected),
      ];
    });
  };

  const modalOptions = Object.values(userMap);

  const handleAddUser = (user) => {
    setUserMap((prev) => ({
      ...prev,
      [user._id]: {
        id: user._id,
        name: user.fullName || user.email || user.slast,
        avatar: user.avatar,
        role: user.role,
        labels: user.labels || [],
      },
    }));
    setChats((prev) => {
      if (prev.find((c) => c.id === user._id)) return prev;
      return [
        {
          id: user._id,
          name: user.fullName || user.email || user.slast,
          avatar: user.avatar,
          role: user.role,
          labels: user.labels || [],
          lastMessage: "",
          time: "",
        },
        ...prev,
      ];
    });
    setSelected(user._id);
  };

  const [isTyping, setIsTyping] = useState(false);
  useEffect(() => {
    if (!socketRef.current) return;
    const handleTyping = (data) => {
      if (data.from === selected) {
        setIsTyping(true);
        if (window.typingTimeout2) clearTimeout(window.typingTimeout2);
        window.typingTimeout2 = setTimeout(() => setIsTyping(false), 1500);
      }
    };
    socketRef.current.on("chat:typing", handleTyping);
    return () => {
      socketRef.current.off("chat:typing", handleTyping);
    };
  }, [selected, socketRef.current]);

  const [showSidebar, setShowSidebar] = useState(false);

  const handleSelectChat = async (id, chat) => {
    setSelected(id);
    setShowSidebar(false);
    if (chat && chat.unread) {
      try {
        await axiosClient.patch("/api/message/read", { partnerId: chat.id });
      } catch {}
      if (updateUnreadCount) updateUnreadCount();
    }
  };

  return (
    <div className="w-full h-screen flex bg-white relative">
      {!showSidebar && (
        <button
          className="block md:hidden fixed top-4 right-4 z-40 bg-[#189ff2] text-white rounded-full p-2 shadow-lg"
          onClick={() => setShowSidebar(true)}
          aria-label="Mở danh sách chat"
          style={{ boxShadow: "0 2px 8px rgba(24,159,242,0.10)" }}
        >
          <FiMenu size={28} />
        </button>
      )}
      <div
        className={`h-full bg-white border-r border-gray-200 z-50 transition-transform duration-300 md:relative fixed top-0 left-0 w-[85vw] max-w-[340px] md:w-[340px] md:max-w-[340px] md:block ${
          showSidebar ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
        style={{ minWidth: 300 }}
      >
        <ChatSidebar
          chats={chats}
          onSelect={(id) =>
            handleSelectChat(
              id,
              chats.find((c) => c.id === id)
            )
          }
          selectedId={selected}
          search={search}
          setSearch={setSearch}
          onAddUser={handleAddUser}
          onlineList={onlineList}
          setChats={setChats}
          loadingChats={loadingChats}
        />
      </div>
      {showSidebar && (
        <div
          className="fixed inset-0 bg-black/30 z-20 md:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}
      <div className="flex-1 h-full">
        <ChatConversation
          chat={userMap[selected]}
          messages={messages}
          onSend={handleSend}
          input={input}
          setInput={setInput}
          userMap={userMap}
          myId={myId}
          isTyping={isTyping}
          onLoadMore={onLoadMore}
          hasMore={hasMore}
          loadingMore={loadingMore}
          loadingMessages={loadingMessages || loadingChats}
          onlineList={onlineList}
        />
      </div>
      <ChatModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        options={modalOptions}
        onSelect={setSelected}
      />
    </div>
  );
}
