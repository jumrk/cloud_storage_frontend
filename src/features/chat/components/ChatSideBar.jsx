import axiosClient from "@/shared/lib/axiosClient";
import { useTranslations, useMessages } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  FiSearch,
  FiSliders,
  FiEdit3,
  FiCheck,
  FiUserPlus,
} from "react-icons/fi";
import Skeleton from "react-loading-skeleton";
import getAvatarUrl from "@/shared/utils/getAvatarUrl";
import {
  parseAttachmentContent,
  parseSystemFileContent,
} from "@/features/chat/utils/messageUtils";

// Format last message for sidebar preview
function formatLastMessagePreview(content) {
  if (!content || typeof content !== "string") return "";

  // Check if it's a GIF
  if (content.startsWith("[GIF]")) {
    return "🎞️ Đã gửi GIF";
  }

  // Check if it's a system file
  const systemFile = parseSystemFileContent(content);
  if (systemFile) {
    return "📁 Đã gửi 1 file";
  }

  // Check if it's an attachment (uploaded file)
  const attachment = parseAttachmentContent(content);
  if (attachment) {
    // Check if it's a voice note
    if (
      attachment.mime?.startsWith("audio/") ||
      attachment.name?.includes("voice-note")
    ) {
      return "🎤 Đã gửi tin nhắn thoại";
    }
    // Check if it's an image
    if (attachment.mime?.startsWith("image/")) {
      return "🖼️ Đã gửi hình ảnh";
    }
    // Check if it's a video
    if (attachment.mime?.startsWith("video/")) {
      return "🎬 Đã gửi video";
    }
    // Default file
    return "📎 Đã gửi 1 tệp đính kèm";
  }

  // Regular text message
  return content;
}

const LABEL_STYLES = {
  Admin: { bg: "#ffe7d6", color: "#e26a1b" },
  Leader: { bg: "#e6f4ff", color: "#189ff2" },
  Member: { bg: "#d6fbe7", color: "#1bbf3a" },
};

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

// Removed capitalizeWords - names should be displayed as stored in database

export default function ChatSideBar({
  chats,
  onSelect,
  selectedId,
  search,
  setSearch,
  onlineList = [],
  setChats,
  loadingChats = false,
  onOpenCreateGroup,
  onOpenAddFriend,
}) {
  const t = useTranslations();
  const messages = useMessages();
  const [activeFilter, setActiveFilter] = useState("all");
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const safeText = (key, fallback) => {
    const parts = key.split(".");
    let cursor = messages;
    for (const part of parts) {
      cursor = cursor?.[part];
      if (cursor === undefined || cursor === null) break;
    }
    return typeof cursor === "string" ? cursor : fallback;
  };
  const filtered = chats
    .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    .filter((c) => {
      if (activeFilter === "unread") return c.unread;
      if (activeFilter === "pinned") return c.pinned;
      return true;
    });

  // Only show skeleton when loading AND no chats exist yet
  if (loadingChats && chats.length === 0) {
    const skeletonWidths = [120, 110, 130, 100, 140, 115];
    return (
      <div className="w-full h-full flex flex-col bg-white border-r border-[var(--color-border)]">
        {/* Mobile Header with Logo */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)]">
          <Link href="/">
            <Image
              src="/images/Logo_1.png"
              alt="D2MBox"
              width={36}
              height={36}
              className="w-9 h-9 object-contain"
              priority
            />
          </Link>
          <h1 className="text-lg font-bold text-text-strong">Tin nhắn</h1>
        </div>

        <div className="flex items-center justify-end px-4 lg:px-7 py-5 border-b border-[var(--color-border)]">
          <Skeleton circle width={40} height={40} />
        </div>
        <div className="px-4 lg:px-7 py-3">
          <div className="relative w-full">
            <Skeleton width="100%" height={40} style={{ borderRadius: 20 }} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="flex gap-3 p-2 mb-1 rounded-2xl items-center bg-[var(--color-surface-50)]"
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
                    className="rounded-full px-2 py-0.5 text-[12px] font-medium border bg-[var(--color-brand-50)] text-brand border-[var(--color-brand-50)]"
                    style={{
                      minWidth: 38,
                      height: 18,
                      display: "inline-block",
                    }}
                  >
                    <Skeleton width={32} height={12} />
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
    <div className="w-full h-full flex flex-col bg-white border-r border-[var(--color-border)] pb-20 lg:pb-0">
      {/* Mobile Header with Logo */}
      <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)]">
        <Link href="/">
          <Image
            src="/images/Logo_1.png"
            alt="D2MBox"
            width={36}
            height={36}
            className="w-9 h-9 object-contain"
            priority
          />
        </Link>
        <h1 className="text-lg font-bold text-text-strong">Tin nhắn</h1>
      </div>

      {/* Search and Actions */}
      <div className="px-4 lg:px-7 pt-4 lg:pt-6 pb-4 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="min-w-[40px] lg:min-w-[42px] h-10 border border-[var(--color-border)] bg-white flex items-center justify-center text-text-muted hover:text-text-strong rounded-xl"
            title="Bộ lọc"
            onClick={() => setFilterMenuOpen((prev) => !prev)}
          >
            <FiSliders size={16} />
          </button>
          <div className="relative flex-1">
            <input
              className="w-full rounded-full border border-[var(--color-border)] bg-white pl-10 lg:pl-12 pr-4 py-2 text-[14px] placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/30"
              placeholder={safeText(
                "chat.sidebar.search_placeholder",
                "Tìm kiếm tin nhắn"
              )}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <FiSearch className="absolute left-4 lg:left-6 top-1/2 -translate-y-1/2 text-text-muted" />
            {filterMenuOpen && (
              <div className="absolute z-[100] left-0 top-12 w-48 rounded-2xl border border-[var(--color-border)] bg-white shadow-xl py-2">
                {[
                  { key: "all", label: t("chat.sidebar.filter_all") },
                  { key: "unread", label: t("chat.sidebar.filter_unread") },
                  { key: "pinned", label: t("chat.sidebar.filter_pinned") },
                ].map((option) => {
                  const active = activeFilter === option.key;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      className={`w-full px-4 py-2 flex items-center justify-between text-sm hover:bg-[var(--color-surface-50)] ${
                        active ? "text-brand font-semibold" : "text-text-strong"
                      }`}
                      onClick={() => {
                        setActiveFilter(option.key);
                        setFilterMenuOpen(false);
                      }}
                    >
                      <span>{option.label}</span>
                      {active && <FiCheck />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onOpenAddFriend}
            className="min-w-[40px] lg:min-w-[42px] h-10 rounded-xl border border-brand text-brand bg-white flex items-center justify-center hover:bg-brand/5 transition"
            title="Tìm bạn bè"
          >
            <FiUserPlus size={18} />
          </button>
          <button
            type="button"
            onClick={onOpenCreateGroup}
            className="min-w-[40px] lg:min-w-[42px] h-10 rounded-xl bg-brand text-white flex items-center justify-center shadow hover:opacity-90 transition"
            title="Tạo nhóm"
          >
            <FiEdit3 size={18} />
          </button>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto mt-2 px-2 pb-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-text-muted">
            <p className="text-sm">Không tìm thấy cuộc trò chuyện</p>
          </div>
        ) : (
          filtered.map((chat) => {
            const isActive = selectedId === chat.id;
            return (
              <button
                key={chat.id}
                type="button"
                onClick={async () => {
                  onSelect(chat.id);
                  if (chat.unread) {
                    try {
                      await axiosClient.patch("/api/message/read", {
                        partnerId: chat.id,
                      });
                      setChats((prev) =>
                        prev.map((c) =>
                          c.id === chat.id ? { ...c, unread: false } : c
                        )
                      );
                    } catch {}
                  }
                }}
                className={`w-full mb-2 rounded-2xl px-3 lg:px-4 py-3 text-left transition-colors duration-150 relative overflow-hidden ${
                  isActive
                    ? "bg-gradient-to-r from-[#1da1f2] to-[#0b70c2] text-white shadow-[0_12px_30px_rgba(17,104,197,0.35)]"
                    : "bg-white border border-[var(--color-border)]/60 hover:border-brand/40 hover:shadow-[0_8px_20px_rgba(15,23,42,0.08)]"
                }`}
                style={{ minHeight: 70 }}
              >
                {isActive && (
                  <span className="absolute inset-0 rounded-2xl border border-white/40 pointer-events-none" />
                )}
                <div className="flex items-center gap-3 relative z-10">
                  <div className="relative shrink-0">
                    <Image
                      src={getAvatarUrl(chat.avatar)}
                      alt="avatar"
                      className={`w-11 h-11 rounded-full object-cover border ${
                        isActive
                          ? "border-white/80"
                          : "border-[var(--color-border)]"
                      }`}
                      width={44}
                      height={44}
                      placeholder="blur"
                      blurDataURL="data:image/png;base64,..."
                      priority
                    />
                    <span
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 ${
                        isActive ? "border-[#0b70c2]" : "border-white"
                      } ${
                        onlineList.includes(chat.id)
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`font-semibold text-[15px] truncate ${
                          isActive ? "text-white" : "text-text-strong"
                        }`}
                      >
                        {chat.name}
                      </span>
                      <span
                        className={`text-[12px] flex-shrink-0 ${
                          isActive ? "text-white/90" : "text-text-muted"
                        }`}
                      >
                        {formatTimeShort(chat.time)}
                      </span>
                    </div>
                    <div
                      className={`text-[13px] mt-1 truncate ${
                        chat.unread && !isActive
                          ? "font-semibold text-text-strong"
                          : isActive
                          ? "text-white/90"
                          : "text-text-muted"
                      }`}
                    >
                      {formatLastMessagePreview(chat.lastMessage) ||
                        safeText("chat.sidebar.no_message", "Chưa có tin nhắn")}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {chat.unread && (
                        <span
                          className={`text-[11px] font-semibold uppercase tracking-wide ${
                            isActive ? "text-white" : "text-brand"
                          }`}
                        >
                          {safeText("chat.sidebar.new", "Mới")}
                        </span>
                      )}
                      {chat.labels?.length ? (
                        <span
                          className={`text-[11px] truncate ${
                            isActive ? "text-white/80" : "text-text-muted"
                          }`}
                        >
                          {chat.labels[0]}
                          {chat.labels.length > 1
                            ? ` +${chat.labels.length - 1}`
                            : ""}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
