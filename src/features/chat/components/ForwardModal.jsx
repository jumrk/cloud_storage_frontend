"use client";
import React, { useState, useMemo } from "react";
import { FiX, FiSearch, FiCheck, FiSend } from "react-icons/fi";
import { useTranslations } from "next-intl";
import Image from "next/image";
import getAvatarUrl from "@/shared/utils/getAvatarUrl";

export default function ForwardModal({
  open,
  onClose,
  message,
  chats = [],
  onForward,
}) {
  const t = useTranslations();
  const [search, setSearch] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);

  const filteredChats = useMemo(() => {
    if (!search.trim()) return chats;
    const lowered = search.toLowerCase();
    return chats.filter(
      (chat) =>
        chat.name?.toLowerCase().includes(lowered) ||
        chat.email?.toLowerCase().includes(lowered)
    );
  }, [chats, search]);

  const handleToggle = (chat) => {
    if (chat.type === "group") {
      setSelectedGroups((prev) =>
        prev.includes(chat.id)
          ? prev.filter((id) => id !== chat.id)
          : [...prev, chat.id]
      );
    } else {
      setSelectedUsers((prev) =>
        prev.includes(chat.id)
          ? prev.filter((id) => id !== chat.id)
          : [...prev, chat.id]
      );
    }
  };

  const handleForward = () => {
    if (!selectedUsers.length && !selectedGroups.length) return;
    onForward(message._id, selectedUsers, selectedGroups);
    setSelectedUsers([]);
    setSelectedGroups([]);
    setSearch("");
    onClose();
  };

  const isSelected = (chat) =>
    chat.type === "group"
      ? selectedGroups.includes(chat.id)
      : selectedUsers.includes(chat.id);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-50"
        onClick={onClose}
      />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
          <h3 className="text-lg font-semibold text-text-strong">
            Chuyển tiếp tin nhắn
          </h3>
          <button
            type="button"
            className="p-2 rounded-full hover:bg-[var(--color-surface-50)] transition"
            onClick={onClose}
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-50)] focus:outline-none focus:ring-2 focus:ring-brand/30"
              placeholder="Tìm kiếm cuộc trò chuyện..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Preview message */}
        {message && (
          <div className="px-5 pb-3">
            <div className="p-3 rounded-xl bg-[var(--color-surface-50)] border border-[var(--color-border)]">
              <p className="text-xs text-text-muted mb-1">Tin nhắn:</p>
              <p className="text-sm text-text-strong line-clamp-2">
                {message.content?.startsWith("__CHAT_ATTACHMENT__:")
                  ? "📎 Tệp đính kèm"
                  : message.content}
              </p>
            </div>
          </div>
        )}

        {/* Chat list */}
        <div className="max-h-64 overflow-y-auto px-5 pb-3">
          {filteredChats.length === 0 ? (
            <p className="text-center text-text-muted py-8">
              Không tìm thấy cuộc trò chuyện
            </p>
          ) : (
            <div className="space-y-2">
              {filteredChats.map((chat) => (
                <button
                  key={chat.id}
                  type="button"
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition ${
                    isSelected(chat)
                      ? "bg-brand/10 border border-brand"
                      : "bg-[var(--color-surface-50)] border border-transparent hover:border-[var(--color-border)]"
                  }`}
                  onClick={() => handleToggle(chat)}
                >
                  <div className="relative">
                    <Image
                      src={getAvatarUrl(chat.avatar)}
                      alt="avatar"
                      className="w-10 h-10 rounded-full object-cover"
                      width={40}
                      height={40}
                    />
                    {chat.type === "group" && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-brand text-white text-[10px] flex items-center justify-center">
                        G
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-medium text-text-strong truncate">
                      {chat.name}
                    </p>
                    <p className="text-xs text-text-muted truncate">
                      {chat.type === "group"
                        ? `${chat.members?.length || 0} thành viên`
                        : chat.email || ""}
                    </p>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
                      isSelected(chat)
                        ? "bg-brand border-brand text-white"
                        : "border-[var(--color-border)]"
                    }`}
                  >
                    {isSelected(chat) && <FiCheck size={14} />}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[var(--color-border)] bg-[var(--color-surface-50)]">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-muted">
              Đã chọn: {selectedUsers.length + selectedGroups.length}
            </p>
            <button
              type="button"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand text-white font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleForward}
              disabled={!selectedUsers.length && !selectedGroups.length}
            >
              <FiSend size={16} />
              Gửi
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

