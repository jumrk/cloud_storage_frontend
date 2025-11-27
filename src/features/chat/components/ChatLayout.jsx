"use client";
import React, { useCallback, useEffect, useState } from "react";
import { FiArrowLeft } from "react-icons/fi";
import axiosClient from "@/shared/lib/axiosClient";
import { decodeTokenGetUser } from "@/shared/lib/jwt";
import "react-loading-skeleton/dist/skeleton.css";
import ChatSideBar from "./ChatSideBar";
import ChatModal from "./ChatModal";
import ChatConversation from "./ChatConversation";
import ChatNavRail from "./ChatNavRail";
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
  const [activeNav, setActiveNav] = useState("chats"); // chats, calls, notifications, settings
  const [notificationCount, setNotificationCount] = useState(0);

  // Mobile: track if we're viewing a conversation
  const [mobileShowConversation, setMobileShowConversation] = useState(false);

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
    const tokenLocal =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (tokenLocal) {
      const info = decodeTokenGetUser(tokenLocal);
      setMyId(info?.id || info?._id || null);
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

  return (
    <div className="w-full h-screen flex bg-[var(--color-surface-50)] relative overflow-hidden">
      <ChatNavRail
        active={activeNav}
        onNavigate={(nav) => {
          setActiveNav(nav);
          // On mobile, when switching tabs, reset conversation view
          if (nav !== "chats") {
            setMobileShowConversation(false);
          }
        }}
        notificationCount={notificationCount}
      />

      {/* Sidebar - only show for chats tab */}
      {activeNav === "chats" && (
        <>
          {/* Desktop: always show sidebar */}
          {/* Mobile: show sidebar when not viewing a conversation */}
          <div
            className={`h-full bg-white border-r border-[var(--color-border)] transition-all duration-300
              /* Desktop */
              lg:relative lg:block lg:w-[360px] lg:max-w-[360px] lg:min-w-[320px]
              /* Mobile */
              ${mobileShowConversation ? "hidden" : "block"}
              w-full max-w-full
            `}
          >
            <ChatSideBar
              chats={chats}
              onSelect={(id) =>
                handleChatSelect(
                  id,
                  chats.find((c) => c.id === id)
                )
              }
              selectedId={selected}
              search={search}
              setSearch={setSearch}
              onlineList={onlineList}
              setChats={setChats}
              loadingChats={loadingChats}
              onOpenCreateGroup={() => setCreateGroupOpen(true)}
              onOpenAddFriend={() => setAddFriendOpen(true)}
            />
          </div>
        </>
      )}

      {/* Main content area */}
      <div
        className={`flex-1 h-full bg-white chat-layout-content
          /* Mobile: hide when showing sidebar in chats tab */
          ${
            activeNav === "chats" && !mobileShowConversation
              ? "hidden lg:block"
              : "block"
          }
        `}
      >
        {renderMainContent()}
      </div>

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
        group={userMap[selected]}
        myId={myId}
        onGroupUpdated={(updatedGroup) => {
          setUserMap((prev) => ({
            ...prev,
            [updatedGroup.id]: { ...prev[updatedGroup.id], ...updatedGroup },
          }));
          setChats((prev) =>
            prev.map((c) =>
              c.id === updatedGroup.id ? { ...c, ...updatedGroup } : c
            )
          );
        }}
        onLeaveGroup={(groupId) => {
          setChats((prev) => prev.filter((c) => c.id !== groupId));
          setUserMap((prev) => {
            const next = { ...prev };
            delete next[groupId];
            return next;
          });
          if (selected === groupId) {
            const remaining = chats.filter((c) => c.id !== groupId);
            setSelected(remaining[0]?.id || null);
          }
          setMobileShowConversation(false);
        }}
        onDeleteGroup={(groupId) => {
          setChats((prev) => prev.filter((c) => c.id !== groupId));
          setUserMap((prev) => {
            const next = { ...prev };
            delete next[groupId];
            return next;
          });
          if (selected === groupId) {
            const remaining = chats.filter((c) => c.id !== groupId);
            setSelected(remaining[0]?.id || null);
          }
          setMobileShowConversation(false);
        }}
      />
      <MediaGalleryModal
        open={mediaGalleryOpen}
        onClose={() => setMediaGalleryOpen(false)}
        chatId={selected}
        chatType={userMap[selected]?.type || "direct"}
      />
      <AddFriendModal
        isOpen={addFriendOpen}
        onClose={() => setAddFriendOpen(false)}
        onStartChat={handleStartChatWithUser}
        myId={myId}
      />
    </div>
  );
}
