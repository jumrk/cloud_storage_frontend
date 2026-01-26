"use client";
import React, { useCallback, useEffect, useState } from "react";
import {
  FiArrowLeft,
  FiMessageSquare,
  FiBell,
  FiSettings,
  FiPhoneCall,
  FiChevronRight,
  FiUsers,
  FiStar,
  FiMoon,
  FiSun,
} from "react-icons/fi";
import axiosClient from "@/shared/lib/axiosClient";
import { decodeTokenGetUser } from "@/shared/lib/jwt";
import "react-loading-skeleton/dist/skeleton.css";
import "../styles/chat.css";
import ChatSideBar from "./ChatSideBar";
import ChatModal from "./ChatModal";
import ChatConversation from "./ChatConversation";
import CreateGroupModal from "./CreateGroupModal";
import ForwardModal from "./ForwardModal";
import GroupSettingsModal from "./GroupSettingsModal";
import MediaGalleryModal from "./MediaGalleryModal";
import CallsPage from "./CallsPage";
import NotificationsPage from "./NotificationsPage";
import SettingsPage from "./SettingsPage";
import useChat from "../hooks/useChat";
import useCallManager from "../hooks/useCallManager";
import CallOverlay from "./CallOverlay";
import AddFriendModal from "./AddFriendModal";
import { useChatNav } from "@/app/(chat)/chat/ChatNavContext";
import Image from "next/image";

// Apply theme and font size from settings
const applySettings = (settings) => {
  if (typeof window === "undefined") return;
  const root = document.documentElement;

  // Apply theme
  if (settings.theme) {
    root.classList.remove("theme-light", "theme-dark");
    let effectiveTheme = settings.theme;
    if (settings.theme === "system") {
      effectiveTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    root.classList.add(`theme-${effectiveTheme}`);
    root.setAttribute("data-theme", effectiveTheme);
  }

  // Apply font size
  if (settings.font_size) {
    root.classList.remove("font-small", "font-medium", "font-large");
    root.classList.add(`font-${settings.font_size}`);
    const fontSizeMap = { small: "14px", medium: "16px", large: "18px" };
    root.style.setProperty(
      "--chat-font-size",
      fontSizeMap[settings.font_size] || "16px"
    );
  }
};

export default function ChatLayout({ isAdmin = false, updateUnreadCount }) {
  const {
    chats,
    selected,
    modalOpen,
    messages,
    hasMore,
    loadingMore,
    input,
    search,
    userMap,
    loadingChats,
    loadingMessages,
    myId,
    onlineList,
    isTyping,
    showSidebar,
    modalOptions,
    socketRef,
    setChats,
    setSelected,
    setModalOpen,
    setMessages,
    setHasMore,
    setInput,
    setSearch,
    setUserMap,
    setLoadingChats,
    setLoadingMessages,
    setMyId,
    initialChatsLoaded,
    setInitialChatsLoaded,
    setOnlineList,
    setIsTyping,
    setShowSidebar,
    onLoadMore,
    handleSend,
    handleSendAttachment,
    handleSendSystemFiles,
    handleSelectChat,
    pinMessage,
    unpinMessage,
    pinnedMap,
    mergeWithDrafts,
    attachmentState,
    // New features
    replyingTo,
    setReplyingTo,
    editingMessage,
    setEditingMessage,
    forwardModalOpen,
    setForwardModalOpen,
    forwardingMessage,
    setForwardingMessage,
    starredMessages,
    addReaction,
    removeReaction,
    editMessage,
    deleteMessage,
    forwardMessage,
    starMessage,
  } = useChat(updateUnreadCount);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [groupSettingsOpen, setGroupSettingsOpen] = useState(false);
  const [mediaGalleryOpen, setMediaGalleryOpen] = useState(false);
  const [addFriendOpen, setAddFriendOpen] = useState(false);
  const { activeNav, setActiveNav, notificationCount, setNotificationCount } =
    useChatNav();

  // Mobile: track if we're viewing a conversation
  const [mobileShowConversation, setMobileShowConversation] = useState(false);
  // Desktop: track if sidebar is open/closed
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch notification count and settings on mount
  useEffect(() => {
    const fetchNotificationCount = async () => {
      try {
        const res = await axiosClient.get("/api/notification/unread-count");
        if (res.data?.success) {
          setNotificationCount(res.data.count || 0);
        }
      } catch (err) {
        console.error("Failed to fetch notification count:", err);
      }
    };

    const fetchAndApplySettings = async () => {
      try {
        const res = await axiosClient.get("/api/settings");
        if (res.data?.success) {
          applySettings(res.data.settings);
        }
      } catch (err) {
        console.error("Failed to fetch settings:", err);
      }
    };

    fetchNotificationCount();
    fetchAndApplySettings();
  }, []);

  const getUserById = useCallback(
    (id) => userMap[id] || modalOptions?.find((item) => item.id === id),
    [userMap, modalOptions]
  );

  const { callState, startCall, acceptCall, rejectCall, endCall } =
    useCallManager({
      socketRef,
      myId,
      getUserById,
    });

  useEffect(() => {
    // ✅ Fetch user from API (cookie sent automatically)
    axiosClient.get("/api/user")
      .then((res) => {
        if (res.data) {
          setMyId(res.data.id || res.data._id || null);
        }
      })
      .catch(() => {});
    }
  }, []);

  useEffect(() => {
    async function fetchConversations() {
      // Only show loading skeleton on initial load (when no chats yet)
      if (!initialChatsLoaded) {
        setLoadingChats(true);
      }
      let conversations = [];
      let groups = [];
      try {
        const res = await axiosClient.get("/api/message/conversations");
        conversations =
          (res.data.conversations || []).map((item) => ({
            ...item,
            type: item.type || "direct",
          })) || [];
      } catch {}
      if (!isAdmin) {
        try {
          const res = await axiosClient.get("/api/user/admin");
          if (res.data && res.data.admin) {
            const adminId = res.data.admin._id;
            // Check if admin already exists in conversations
            const existingAdmin = conversations.find((c) => c.id === adminId);
            if (!existingAdmin) {
              // Only add if no conversation exists - with empty lastMessage
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
                type: "direct",
              });
            }
          }
        } catch {}
      }
      try {
        const resGroup = await axiosClient.get("/api/message/group");
        groups =
          (resGroup.data?.groups || []).map((group) => ({
            ...group,
            id: group.id || group._id,
            type: "group",
          })) || [];
      } catch {}
      const combined = mergeWithDrafts([...groups, ...conversations]);

      // Merge with existing chats to preserve lastMessage from local updates
      setChats((prevChats) => {
        const prevChatMap = {};
        prevChats.forEach((c) => {
          prevChatMap[c.id] = c;
        });

        const merged = combined.map((newChat) => {
          const prevChat = prevChatMap[newChat.id];
          // If we have a local lastMessage that's newer, keep it
          if (prevChat && prevChat.lastMessage && prevChat.time) {
            const prevTime = new Date(prevChat.time).getTime();
            const newTime = newChat.time ? new Date(newChat.time).getTime() : 0;
            if (prevTime > newTime) {
              return {
                ...newChat,
                lastMessage: prevChat.lastMessage,
                time: prevChat.time,
              };
            }
          }
          return newChat;
        });

        // Sort by time (newest first)
        merged.sort((a, b) => {
          if (!a.time) return 1;
          if (!b.time) return -1;
          return new Date(b.time) - new Date(a.time);
        });

        return merged;
      });

      setUserMap(
        combined.reduce((acc, item) => {
          acc[item.id] = item;
          if (item.type === "group" && Array.isArray(item.members)) {
            item.members.forEach((member) => {
              acc[member.id] = {
                ...member,
                id: member.id,
                name:
                  member.fullName ||
                  member.email ||
                  member.slast ||
                  "Thành viên",
                avatar: member.avatar,
              };
            });
          }
          return acc;
        }, {})
      );
      if (combined.length > 0 && !selected) setSelected(combined[0].id);
      setLoadingChats(false);
      setInitialChatsLoaded(true);
    }
    fetchConversations();
  }, [
    isAdmin,
    mergeWithDrafts,
    setUserMap,
    setChats,
    initialChatsLoaded,
    setInitialChatsLoaded,
  ]);

  // Use ref to track current chat type without causing re-renders
  const chatTypeRef = React.useRef(null);

  useEffect(() => {
    if (!selected) return;
    const activeChat = userMap[selected];
    if (!activeChat) return;

    // Store chat type in ref
    chatTypeRef.current = activeChat.type;

    // Clear messages immediately when switching chats to show skeleton
    setMessages([]);
    setLoadingMessages(true);

    async function fetchHistory() {
      try {
        const endpoint =
          chatTypeRef.current === "group"
            ? `/api/message/group/${selected}/messages?limit=20`
            : `/api/message?withUser=${selected}&limit=20`;
        const res = await axiosClient.get(endpoint);
        if (res.data && res.data.messages) {
          setMessages(res.data.messages);
          setHasMore(res.data.hasMore);
        }
      } catch {}
      setLoadingMessages(false);
    }
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const handleGroupCreated = (group) => {
    if (!group || !group.id) return;
    setChats((prev) => [group, ...prev.filter((chat) => chat.id !== group.id)]);
    setUserMap((prev) => {
      const next = {
        ...prev,
        [group.id]: group,
      };
      if (Array.isArray(group.members)) {
        group.members.forEach((member) => {
          next[member.id] = {
            ...next[member.id],
            ...member,
            id: member.id,
            name:
              member.fullName || member.email || member.slast || "Thành viên",
            avatar: member.avatar,
          };
        });
      }
      return next;
    });
    setSelected(group.id);
    setMobileShowConversation(true);
  };

  // Handle selecting a chat - show conversation on mobile
  const handleChatSelect = (id, chat) => {
    handleSelectChat(id, chat);
    setMobileShowConversation(true);
  };

  // Handle going back to chat list on mobile
  const handleMobileBack = () => {
    setMobileShowConversation(false);
  };

  // Handle starting a new chat with a user from search
  const handleStartChatWithUser = (user) => {
    if (!user || !user._id) return;

    // Check if chat already exists
    const existingChat = chats.find((c) => c.id === user._id);
    if (existingChat) {
      setSelected(user._id);
      setActiveNav("chats");
      setMobileShowConversation(true);
      return;
    }

    // Create new chat entry
    const newChat = {
      id: user._id,
      name: user.fullName || user.email || user.slast || "Người dùng",
      avatar: user.avatar,
      email: user.email,
      slast: user.slast,
      lastMessage: "",
      time: "",
      type: "direct",
    };

    setChats((prev) => [newChat, ...prev]);
    setUserMap((prev) => ({
      ...prev,
      [user._id]: newChat,
    }));
    setSelected(user._id);
    setActiveNav("chats");
    setMobileShowConversation(true);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.socketRef = socketRef;
    }
  }, [socketRef]);

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

  useEffect(() => {
    if (!socketRef.current) return;
    const handleTyping = (data) => {
      if (data.from === selected) {
        setIsTyping(true);
        if (window.typingTimeout2) clearTimeout(window.typingTimeout2);
        window.typingTimeout2 = setTimeout(() => setIsTyping(false), 1500);
      }
    };
    const handleGroupTyping = (data) => {
      if (data.groupId === selected && data.from !== myId) {
        setIsTyping(true);
        if (window.typingTimeout2) clearTimeout(window.typingTimeout2);
        window.typingTimeout2 = setTimeout(() => setIsTyping(false), 1500);
      }
    };
    socketRef.current.on("chat:typing", handleTyping);
    socketRef.current.on("group:typing", handleGroupTyping);
    return () => {
      socketRef.current.off("chat:typing", handleTyping);
      socketRef.current.off("group:typing", handleGroupTyping);
    };
  }, [selected, socketRef.current, myId]);

  // Render content based on active navigation
  const renderMainContent = () => {
    switch (activeNav) {
      case "calls":
        return (
          <CallsPage
            onStartCall={(type, userId) => startCall(type, userId)}
            userMap={userMap}
          />
        );
      case "notifications":
        return (
          <NotificationsPage
            onUpdateUnreadCount={(count) => setNotificationCount(count)}
          />
        );
      case "settings":
        return <SettingsPage />;
      case "chats":
      default:
        if (!selected || !userMap[selected]) {
          return (
            <div className="flex-1 flex items-center justify-center bg-[var(--chat-bg-primary)]">
              <div className="text-center px-4">
                <div className="text-6xl mb-4 opacity-30">💬</div>
                <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--chat-text-primary)" }}>
                  Select a conversation
                </h2>
                <p className="text-sm" style={{ color: "var(--chat-text-secondary)" }}>
                  Choose a chat from the sidebar to start messaging
                </p>
              </div>
            </div>
          );
        }
        return (
          <ChatConversation
            chat={userMap[selected]}
            messages={messages}
            onSend={handleSend}
            onSendAttachment={handleSendAttachment}
            onSendSystemFiles={handleSendSystemFiles}
            input={input}
            setInput={setInput}
            userMap={userMap}
            myId={myId}
            isTyping={isTyping}
            onLoadMore={onLoadMore}
            hasMore={hasMore}
            loadingMore={loadingMore}
            loadingMessages={loadingMessages}
            onlineList={onlineList}
            pinnedMessage={selected ? pinnedMap[selected] : null}
            onPinMessage={(message) => pinMessage(selected, message)}
            onUnpinMessage={() => unpinMessage(selected)}
            attachmentState={attachmentState}
            callState={callState}
            onStartCall={(type) =>
              selected ? startCall(type, selected) : undefined
            }
            onAcceptCall={acceptCall}
            onRejectCall={rejectCall}
            onEndCall={endCall}
            // New features
            replyingTo={replyingTo}
            setReplyingTo={setReplyingTo}
            editingMessage={editingMessage}
            setEditingMessage={setEditingMessage}
            starredMessages={starredMessages}
            addReaction={addReaction}
            removeReaction={removeReaction}
            editMessage={editMessage}
            deleteMessage={deleteMessage}
            starMessage={starMessage}
            onForward={(msg) => {
              setForwardingMessage(msg);
              setForwardModalOpen(true);
            }}
            allChats={chats}
            onOpenGroupSettings={() => setGroupSettingsOpen(true)}
            onOpenMediaGallery={() => setMediaGalleryOpen(true)}
            onMobileBack={handleMobileBack}
          />
        );
    }
  };

  // Theme state
  const [theme, setTheme] = useState("light");

  // Toggle theme
  const toggleTheme = useCallback(() => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    // Save to settings
    axiosClient
      .put("/api/settings", { theme: newTheme })
      .catch((err) => console.error("Failed to save theme:", err));
  }, [theme]);

  // Load theme from settings
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const res = await axiosClient.get("/api/settings");
        if (res.data?.settings?.theme) {
          const userTheme = res.data.settings.theme;
          setTheme(userTheme);
          document.documentElement.setAttribute("data-theme", userTheme);
        }
      } catch (err) {
        console.error("Failed to load theme:", err);
      }
    };
    loadTheme();
  }, []);

  return (
    <div className="chat-app-container">
      {/* Vertical Navigation - Left Side */}
      <div className="chat-vertical-nav">
        {/* Logo */}
        <div className="mb-8">
          <Image
            src="/images/Logo_1.png"
            alt="Logo"
            width={40}
            height={40}
            className="w-10 h-10"
            priority
          />
        </div>

        {/* Nav Icons */}
        <div
          className={`chat-nav-icon ${
            activeNav === "chats" ? "active" : ""
          }`}
          onClick={() => {
            setActiveNav("chats");
            if (mobileShowConversation) setMobileShowConversation(false);
          }}
        >
          <FiMessageSquare size={20} />
          {chats.filter((c) => c.unreadCount > 0).length > 0 && (
            <span className="badge">
              {chats.filter((c) => c.unreadCount > 0).length}
            </span>
          )}
        </div>

        <div
          className={`chat-nav-icon ${
            activeNav === "calls" ? "active" : ""
          }`}
          onClick={() => {
            setActiveNav("calls");
            setMobileShowConversation(false);
          }}
        >
          <FiPhoneCall size={20} />
        </div>

        <div
          className={`chat-nav-icon ${
            activeNav === "notifications" ? "active" : ""
          }`}
          onClick={() => {
            setActiveNav("notifications");
            setMobileShowConversation(false);
          }}
        >
          <FiBell size={20} />
          {notificationCount > 0 && (
            <span className="badge">{notificationCount > 9 ? "9+" : notificationCount}</span>
          )}
        </div>

        <div
          className={`chat-nav-icon ${
            activeNav === "settings" ? "active" : ""
          }`}
          onClick={() => {
            setActiveNav("settings");
            setMobileShowConversation(false);
          }}
        >
          <FiSettings size={20} />
        </div>

        {/* Theme Toggle - Bottom */}
        <button className="chat-theme-toggle" onClick={toggleTheme}>
          {theme === "light" ? <FiMoon size={18} /> : <FiSun size={18} />}
        </button>
      </div>

      {/* Chat Sidebar - Middle Column */}
      {activeNav === "chats" && (
        <div
          className={`chat-sidebar ${
            mobileShowConversation ? "hidden md:flex" : "flex"
          }`}
        >
          <ChatSideBar
            chats={chats}
            selected={selected}
            onSelectChat={(chat) => {
              handleSelectChat(chat.id, chat);
              setMobileShowConversation(true);
            }}
            search={search}
            setSearch={setSearch}
            loading={loadingChats}
            onlineList={onlineList}
            userMap={userMap}
            onCreateGroup={() => setCreateGroupOpen(true)}
            onAddFriend={() => setAddFriendOpen(true)}
          />
        </div>
      )}

      {/* Main Content Area - Right Column */}
      <div className="chat-main-area flex-1">
        {renderMainContent()}
      </div>

      {/* Modals */}
      <ChatModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        options={modalOptions}
        onSelect={setSelected}
      />
      <CreateGroupModal
        open={createGroupOpen}
        onClose={() => setCreateGroupOpen(false)}
        onCreated={handleGroupCreated}
      />
      <CallOverlay
        state={callState}
        onAccept={acceptCall}
        onReject={rejectCall}
        onEnd={endCall}
      />
      <ForwardModal
        open={forwardModalOpen}
        onClose={() => {
          setForwardModalOpen(false);
          setForwardingMessage(null);
        }}
        message={forwardingMessage}
        chats={chats}
        onForward={forwardMessage}
      />
      <GroupSettingsModal
        open={groupSettingsOpen}
        onClose={() => setGroupSettingsOpen(false)}
        chat={selected ? chats.find((c) => c.id === selected) : null}
      />
      <MediaGalleryModal
        open={mediaGalleryOpen}
        onClose={() => setMediaGalleryOpen(false)}
        chatId={selected}
      />
      <AddFriendModal
        open={addFriendOpen}
        onClose={() => setAddFriendOpen(false)}
      />
    </div>
  );
}
