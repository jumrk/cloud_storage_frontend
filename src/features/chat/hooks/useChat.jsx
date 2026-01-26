import { useState, useCallback, useEffect, useRef } from "react";
import useSocket from "@/shared/lib/useSocket";
import chatServices from "../services/chatServices";
import {
  encodeAttachmentPayload,
  encodeSystemFilePayload,
} from "../utils/messageUtils";

const PIN_STORAGE_KEY = "chat:pins";
const DRAFT_STORAGE_KEY = "chat:drafts";
const STARRED_STORAGE_KEY = "chat:starred";
const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;

export default function useChat(updateUnreadCount) {
  const { getConversationMessages, getGroupMessages, markConversationAsRead } =
    chatServices();
  const [chats, setChats] = useState([]);
  const [selected, setSelected] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [userMap, setUserMap] = useState({});
  const [loadingChats, setLoadingChats] = useState(false);
  const [initialChatsLoaded, setInitialChatsLoaded] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  // ✅ No need for token - cookie sent automatically
  const [myId, setMyId] = useState(null);
  const [pinnedMap, setPinnedMap] = useState({});
  const [attachmentState, setAttachmentState] = useState({
    sending: false,
    error: null,
  });
  const [draftChats, setDraftChats] = useState([]);
  const draftChatsRef = useRef([]);

  // New states for advanced features
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [forwardModalOpen, setForwardModalOpen] = useState(false);
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const [starredMessages, setStarredMessages] = useState({});

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const storedPins = JSON.parse(
        localStorage.getItem(PIN_STORAGE_KEY) || "{}"
      );
      setPinnedMap(storedPins || {});
    } catch {}
    try {
      const storedDrafts = JSON.parse(
        localStorage.getItem(DRAFT_STORAGE_KEY) || "[]"
      );
      setDraftChats(storedDrafts || []);
      draftChatsRef.current = storedDrafts || [];
    } catch {}
    try {
      const storedStarred = JSON.parse(
        localStorage.getItem(STARRED_STORAGE_KEY) || "{}"
      );
      setStarredMessages(storedStarred || {});
    } catch {}
  }, []);

  useEffect(() => {
    draftChatsRef.current = draftChats;
  }, [draftChats]);

  const persistPins = (next) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(PIN_STORAGE_KEY, JSON.stringify(next));
    }
    return next;
  };

  const persistDrafts = (next) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(next));
    }
    return next;
  };

  const persistStarred = (next) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STARRED_STORAGE_KEY, JSON.stringify(next));
    }
    return next;
  };

  const pinMessage = useCallback((chatId, message) => {
    if (!chatId || !message) return;
    setPinnedMap((prev) => {
      const next = {
        ...prev,
        [chatId]: {
          id: message._id,
          content: message.content,
          createdAt: message.createdAt || new Date().toISOString(),
          from: message.from,
        },
      };
      persistPins(next);
      return next;
    });
  }, []);

  const unpinMessage = useCallback((chatId) => {
    if (!chatId) return;
    setPinnedMap((prev) => {
      if (!prev[chatId]) return prev;
      const next = { ...prev };
      delete next[chatId];
      persistPins(next);
      return next;
    });
  }, []);

  const addDraftChat = useCallback((chat) => {
    if (!chat || !chat.id) return;
    setDraftChats((prev) => {
      if (prev.some((c) => c.id === chat.id)) return prev;
      const next = [chat, ...prev];
      persistDrafts(next);
      return next;
    });
  }, []);

  const removeDraftChat = useCallback((chatId) => {
    if (!chatId) return;
    setDraftChats((prev) => {
      if (!prev.some((c) => c.id === chatId)) return prev;
      const next = prev.filter((c) => c.id !== chatId);
      persistDrafts(next);
      return next;
    });
  }, []);

  const mergeWithDrafts = useCallback((serverConversations = []) => {
    if (!draftChatsRef.current.length) return serverConversations;
    const extras = draftChatsRef.current.filter(
      (draft) => !serverConversations.some((c) => c.id === draft.id)
    );
    return [...extras, ...serverConversations];
  }, []);

  const onLoadMore = useCallback(async () => {
    if (!hasMore || loadingMore || !messages.length || !selected) return;
    const target = userMap[selected];

    setLoadingMore(true);
    try {
      const firstMsg = messages[0];
      const res =
        target?.type === "group"
          ? await getGroupMessages(selected, firstMsg)
          : await getConversationMessages(selected, firstMsg);

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
      }
    } catch (err) {
      console.error("Load more error:", err);
    }
    setLoadingMore(false);
  }, [
    hasMore,
    loadingMore,
    messages,
    selected,
    userMap,
    getGroupMessages,
    getConversationMessages,
  ]);

  const playMessageSound = () => {
    if (
      typeof window !== "undefined" &&
      document.visibilityState === "visible"
    ) {
      const audio = new Audio("/sound/sounds.wav");
      audio.play();
    }
  };

  const [onlineList, setOnlineList] = useState([]);

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () =>
        reject(new Error("Không thể đọc file. Vui lòng thử lại."));
      reader.readAsDataURL(file);
    });

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
      const chatId = msg.from === myId ? msg.to : msg.from;
      removeDraftChat(chatId);
    },
    [selected, myId, updateUnreadCount, removeDraftChat]
  );
  const socketRef = useSocket(token, onMessage);

  // Handle socket events for reactions, edits, deletes
  useEffect(() => {
    if (!socketRef.current) return;

    const handleReaction = ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((msg) => (msg._id === messageId ? { ...msg, reactions } : msg))
      );
    };

    const handleEdited = ({ messageId, content, edited, editedAt }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId ? { ...msg, content, edited, editedAt } : msg
        )
      );
    };

    const handleDeleted = ({ messageId, deletedForAll, deletedForMe }) => {
      if (deletedForAll) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === messageId
              ? { ...msg, content: "Tin nhắn đã bị xóa", deletedForAll: true }
              : msg
          )
        );
      } else if (deletedForMe) {
        setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
      }
    };

    const handleStarred = ({ messageId, starred }) => {
      setStarredMessages((prev) => {
        const next = { ...prev };
        if (starred) {
          next[messageId] = true;
        } else {
          delete next[messageId];
        }
        persistStarred(next);
        return next;
      });
    };

    socketRef.current.on("message:reaction", handleReaction);
    socketRef.current.on("message:edited", handleEdited);
    socketRef.current.on("message:deleted", handleDeleted);
    socketRef.current.on("message:starred", handleStarred);

    return () => {
      socketRef.current.off("message:reaction", handleReaction);
      socketRef.current.off("message:edited", handleEdited);
      socketRef.current.off("message:deleted", handleDeleted);
      socketRef.current.off("message:starred", handleStarred);
    };
  }, [socketRef]);

  useEffect(() => {
    if (!socketRef.current) return;
    const handleGroupMessage = (msg) => {
      const { groupId } = msg;
      setChats((prev) => {
        if (!prev.some((c) => c.id === groupId)) return prev;
        const updated = prev.map((c) =>
          c.id === groupId
            ? { ...c, lastMessage: msg.content, time: msg.createdAt }
            : c
        );
        return [
          ...updated.filter((c) => c.id === groupId),
          ...updated.filter((c) => c.id !== groupId),
        ];
      });
      if (groupId === selected) {
        setMessages((prev) => [...prev, msg]);
      }
    };
    socketRef.current.on("group:message", handleGroupMessage);
    return () => {
      socketRef.current.off("group:message", handleGroupMessage);
    };
  }, [socketRef, selected]);

  const emitMessage = useCallback(
    (payload, options = {}) => {
      if (!payload || !selected) return;
      const target = userMap[selected];
      if (socketRef.current) {
        const messageData = {
          content: payload,
          ...(options.replyTo && { replyTo: options.replyTo }),
        };

        if (target?.type === "group") {
          socketRef.current.emit("group:send", {
            groupId: selected,
            ...messageData,
          });
        } else {
          socketRef.current.emit("chat:send", {
            to: selected,
            ...messageData,
          });
        }
      }
      setChats((prev) => {
        const updated = prev.map((c) =>
          c.id === selected
            ? { ...c, lastMessage: payload, time: new Date().toISOString() }
            : c
        );
        return [
          ...updated.filter((c) => c.id === selected),
          ...updated.filter((c) => c.id !== selected),
        ];
      });
      removeDraftChat(selected);
    },
    [selected, removeDraftChat, userMap, socketRef]
  );

  const handleSend = (content) => {
    const text = content.trim();
    if (!text || !selected) return;

    const options = {};
    if (replyingTo) {
      options.replyTo = replyingTo._id;
    }

    emitMessage(text, options);
    setInput("");
    setReplyingTo(null);
  };

  const handleSendAttachment = async (file) => {
    if (!file || !selected) return;
    if (file.size > MAX_ATTACHMENT_SIZE) {
      const error = "Tệp vượt quá 5MB. Vui lòng chọn tệp nhỏ hơn.";
      setAttachmentState({ sending: false, error });
      throw new Error(error);
    }
    setAttachmentState({ sending: true, error: null });
    try {
      const base64 = await fileToBase64(file);
      const data = base64.includes(",") ? base64.split(",")[1] : base64;
      const payload = encodeAttachmentPayload({
        name: file.name,
        size: file.size,
        mime: file.type || "application/octet-stream",
        data,
      });

      const options = {};
      if (replyingTo) {
        options.replyTo = replyingTo._id;
      }

      emitMessage(payload, options);
      setAttachmentState({ sending: false, error: null });
      setReplyingTo(null);
    } catch (err) {
      const message =
        err?.message || "Không thể gửi tệp. Vui lòng thử lại sau.";
      setAttachmentState({ sending: false, error: message });
      throw err instanceof Error ? err : new Error(message);
    }
  };

  // Send files from the system file management
  const handleSendSystemFiles = async (files) => {
    if (!files || files.length === 0 || !selected) return;
    setAttachmentState({ sending: true, error: null });

    try {
      const apiBase =
        process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

      for (const file of files) {
        const downloadUrl = `${apiBase}/api/download/file/${file._id}`;

        const payload = encodeSystemFilePayload({
          fileId: file._id,
          name: file.originalName,
          size: file.size,
          mime: file.mimeType || "application/octet-stream",
          downloadUrl,
        });

        const options = {};
        if (replyingTo) {
          options.replyTo = replyingTo._id;
        }

        emitMessage(payload, options);
      }

      setAttachmentState({ sending: false, error: null });
      setReplyingTo(null);
    } catch (err) {
      const message =
        err?.message || "Không thể gửi tệp. Vui lòng thử lại sau.";
      setAttachmentState({ sending: false, error: message });
      throw err instanceof Error ? err : new Error(message);
    }
  };

  // Reaction handlers
  const addReaction = useCallback(
    (messageId, emoji) => {
      if (!socketRef.current || !messageId || !emoji) return;
      const target = userMap[selected];
      socketRef.current.emit("message:reaction", {
        messageId,
        emoji,
        partnerId: target?.type === "group" ? null : selected,
        groupId: target?.type === "group" ? selected : null,
      });
    },
    [socketRef, selected, userMap]
  );

  const removeReaction = useCallback(
    (messageId) => {
      if (!socketRef.current || !messageId) return;
      const target = userMap[selected];
      socketRef.current.emit("message:reaction", {
        messageId,
        emoji: null,
        partnerId: target?.type === "group" ? null : selected,
        groupId: target?.type === "group" ? selected : null,
      });
    },
    [socketRef, selected, userMap]
  );

  // Edit message
  const editMessage = useCallback(
    (messageId, content) => {
      if (!socketRef.current || !messageId || !content?.trim()) return;
      const target = userMap[selected];
      socketRef.current.emit("message:edit", {
        messageId,
        content: content.trim(),
        partnerId: target?.type === "group" ? null : selected,
        groupId: target?.type === "group" ? selected : null,
      });
      setEditingMessage(null);
    },
    [socketRef, selected, userMap]
  );

  // Delete message
  const deleteMessage = useCallback(
    (messageId, forAll = false) => {
      if (!socketRef.current || !messageId) return;
      const target = userMap[selected];
      socketRef.current.emit("message:delete", {
        messageId,
        forAll,
        partnerId: target?.type === "group" ? null : selected,
        groupId: target?.type === "group" ? selected : null,
      });
    },
    [socketRef, selected, userMap]
  );

  // Forward message
  const forwardMessage = useCallback(
    (messageId, toUsers = [], toGroups = []) => {
      if (!socketRef.current || !messageId) return;
      if (!toUsers.length && !toGroups.length) return;
      socketRef.current.emit("message:forward", {
        messageId,
        toUsers,
        toGroups,
      });
      setForwardModalOpen(false);
      setForwardingMessage(null);
    },
    [socketRef]
  );

  // Star/unstar message
  const starMessage = useCallback(
    (messageId, starred = true) => {
      if (!socketRef.current || !messageId) return;
      socketRef.current.emit("message:star", { messageId, starred });
    },
    [socketRef]
  );

  const modalOptions = Object.values(userMap);

  const [isTyping, setIsTyping] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  const handleSelectChat = async (id, chat) => {
    setSelected(id);
    setShowSidebar(false);
    setReplyingTo(null);
    setEditingMessage(null);
    if (chat && chat.unread && chat.type !== "group") {
      try {
        await markConversationAsRead(chat);
      } catch {}
      if (updateUnreadCount) updateUnreadCount();
    }
  };

  return {
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
    initialChatsLoaded,
    setInitialChatsLoaded,
    setMyId,
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
    // New exports
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
  };
}
