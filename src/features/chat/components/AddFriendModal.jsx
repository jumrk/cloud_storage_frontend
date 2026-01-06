"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { FiX, FiSearch, FiUser, FiLoader } from "react-icons/fi";
import axiosClient from "@/shared/lib/axiosClient";
import { useTranslations } from "next-intl";
import { UserItem } from "./UserItem";

export default function AddFriendModal({ isOpen, onClose, onStartChat, myId }) {
  const t = useTranslations();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recentSearches, setRecentSearches] = useState([]);
  const searchInputRef = useRef(null);
  const debounceRef = useRef(null);

  // Load recent searches from localStorage
  useEffect(() => {
    if (isOpen && typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("chat:recentSearches");
        if (saved) {
          setRecentSearches(JSON.parse(saved));
        }
      } catch {}
    }
  }, [isOpen]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      // Reset state when modal closes
      setSearchQuery("");
      setSearchResults([]);
      setError(null);
    }
  }, [isOpen]);

  // Search users with debounce
  const searchUsers = useCallback(
    async (query) => {
      if (!query || query.trim().length < 2) {
        setSearchResults([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const response = await axiosClient.get(
          `/api/user/search?query=${encodeURIComponent(query.trim())}`
        );
        const users = response.data?.users || [];
        // Filter out current user
        const filtered = users.filter((u) => u._id !== myId);
        setSearchResults(filtered);
      } catch (err) {
        console.error("Error searching users:", err);
        setError("Không thể tìm kiếm. Vui lòng thử lại.");
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    },
    [myId]
  );

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    if (searchQuery.trim().length >= 2) {
      debounceRef.current = setTimeout(() => {
        searchUsers(searchQuery);
      }, 300);
    } else {
      setSearchResults([]);
    }
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery, searchUsers]);

  // Handle start chat
  const handleStartChat = (user) => {
    // Save to recent searches
    const newRecent = [
      user,
      ...recentSearches.filter((u) => u._id !== user._id),
    ].slice(0, 5);
    setRecentSearches(newRecent);
    if (typeof window !== "undefined") {
      localStorage.setItem("chat:recentSearches", JSON.stringify(newRecent));
    }
    onStartChat(user);
    onClose();
  };

  // Remove from recent searches
  const removeFromRecent = (userId) => {
    const newRecent = recentSearches.filter((u) => u._id !== userId);
    setRecentSearches(newRecent);
    if (typeof window !== "undefined") {
      localStorage.setItem("chat:recentSearches", JSON.stringify(newRecent));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Tìm kiếm người dùng
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white transition"
          >
            <FiX size={20} />
          </button>
        </div>
        {/* Search Input */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Nhập email hoặc tên người dùng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition"
            />
            {loading && (
              <FiLoader className="absolute right-4 top-1/2 -translate-y-1/2 text-brand animate-spin" />
            )}
          </div>
          <p className="text-xs text-gray-600 mt-2">
            Nhập ít nhất 2 ký tự để tìm kiếm
          </p>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {error && (
            <div className="px-6 py-4 text-center text-red-500 text-sm">
              {error}
            </div>
          )}
          {/* Search Results */}
          {searchQuery.trim().length >= 2 && (
            <div className="p-4">
              {searchResults.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wide px-2 mb-3">
                    Kết quả tìm kiếm
                  </p>
                  {searchResults.map((user) => (
                    <UserItem
                      key={user._id}
                      user={user}
                      onStartChat={() => handleStartChat(user)}
                    />
                  ))}
                </div>
              ) : !loading ? (
                <div className="text-center py-8">
                  <FiUser className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-600">Không tìm thấy người dùng nào</p>
                </div>
              ) : null}
            </div>
          )}
          {/* Recent Searches */}
          {searchQuery.trim().length < 2 && recentSearches.length > 0 && (
            <div className="p-4">
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wide px-2 mb-3">
                Tìm kiếm gần đây
              </p>
              <div className="space-y-2">
                {recentSearches.map((user) => (
                  <UserItem
                    key={user._id}
                    user={user}
                    onStartChat={() => handleStartChat(user)}
                    onRemove={() => removeFromRecent(user._id)}
                    showRemove
                  />
                ))}
              </div>
            </div>
          )}
          {/* Empty State */}
          {searchQuery.trim().length < 2 && recentSearches.length === 0 && (
            <div className="text-center py-12 px-6">
              <div className="w-16 h-16 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-4">
                <FiSearch className="w-8 h-8 text-brand" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Tìm kiếm bạn bè
              </h3>
              <p className="text-gray-600 text-sm">
                Nhập email hoặc tên người dùng để bắt đầu cuộc trò chuyện mới
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
