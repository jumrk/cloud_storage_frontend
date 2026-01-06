import axiosClient from "@/shared/lib/axiosClient";
import { useTranslations, useMessages } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  FiSearch,
  FiUserPlus,
  FiUsers,
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

  // Regular text message - truncate if too long
  return content.length > 40 ? content.substring(0, 40) + "..." : content;
}

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

// Get initials from name
function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

export default function ChatSideBar({
  chats = [],
  selected,
  onSelectChat,
  search,
  setSearch,
  onlineList = [],
  loading = false,
  userMap = {},
  onCreateGroup,
  onAddFriend,
}) {
  const t = useTranslations();
  const [activeFilter, setActiveFilter] = useState("All");

  // Filter chats
  const filtered = chats
    .filter((c) => {
      const searchLower = search.toLowerCase();
      return c.name?.toLowerCase().includes(searchLower);
    })
    .filter((c) => {
      if (activeFilter === "Group") return c.type === "group";
      if (activeFilter === "Unread") return c.unreadCount > 0;
      if (activeFilter === "Online") {
        const chat = userMap[c.id];
        return chat && onlineList.includes(chat.id || chat._id);
      }
      return true;
    });

  // Skeleton loading
  if (loading && chats.length === 0) {
    return (
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <Skeleton width={150} height={28} className="mb-4" />
          <Skeleton width="100%" height={48} style={{ borderRadius: 20 }} />
        </div>
        <div className="chat-users-list">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="chat-user-item">
              <Skeleton circle width={48} height={48} />
              <div className="chat-user-info" style={{ flex: 1 }}>
                <Skeleton width={120} height={16} className="mb-1" />
                <Skeleton width={180} height={14} />
              </div>
              <div className="chat-user-meta">
                <Skeleton width={30} height={12} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="chat-sidebar">
      {/* Sidebar Header */}
      <div className="chat-sidebar-header">
        <div className="flex items-center justify-end mb-4">
          <div className="flex gap-2">
            <button
              onClick={onCreateGroup}
              className="chat-action-btn"
              title="Create Group"
            >
              <FiUsers size={18} />
            </button>
            <button
              onClick={onAddFriend}
              className="chat-action-btn"
              title="Add Friend"
            >
              <FiUserPlus size={18} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="chat-search-container">
          <FiSearch className="chat-search-icon" size={16} />
          <input
            type="text"
            className="chat-search-input"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filter Tabs */}
        <div className="chat-filter-tabs">
          {["All", "Group", "Unread", "Online"].map((filter) => (
            <button
              key={filter}
              className={`chat-filter-tab ${
                activeFilter === filter ? "active" : ""
              }`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Users List */}
      <div className="chat-users-list">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="text-4xl mb-3 opacity-30">💬</div>
            <p className="text-sm" style={{ color: "var(--chat-text-secondary)" }}>
              {search ? "No conversations found" : "No conversations yet"}
            </p>
          </div>
        ) : (
          filtered.map((chat) => {
            const isActive = selected === chat.id;
            const isOnline =
              chat.type !== "group" &&
              userMap[chat.id] &&
              onlineList.includes(userMap[chat.id].id || userMap[chat.id]._id);
            const unreadCount = chat.unreadCount || 0;

            return (
              <div
                key={chat.id}
                className={`chat-user-item ${isActive ? "active" : ""}`}
                onClick={() => onSelectChat(chat)}
              >
                {/* Avatar */}
                <div className={`chat-user-avatar ${isOnline ? "online" : ""}`}>
                  {chat.avatar ? (
                    <Image
                      src={getAvatarUrl(chat.avatar)}
                      alt={chat.name}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{getInitials(chat.name)}</span>
                  )}
                </div>

                {/* User Info */}
                <div className="chat-user-info">
                  <div className="chat-user-name">{chat.name}</div>
                  <div className="chat-user-message">
                    {formatLastMessagePreview(chat.lastMessage || "")}
                  </div>
                </div>

                {/* Meta (Time + Unread) */}
                <div className="chat-user-meta">
                  <div className="chat-message-time">
                    {formatTimeShort(chat.time)}
                  </div>
                  {unreadCount > 0 && (
                    <div className="chat-unread-badge">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
