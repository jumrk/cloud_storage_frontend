"use client";
import React, {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
import {
  FiPaperclip,
  FiSend,
  FiPhoneCall,
  FiVideo,
  FiSearch,
  FiInfo,
  FiBookmark,
  FiX,
  FiChevronUp,
  FiChevronDown,
  FiDownload,
  FiFileText,
  FiSmile,
  FiMic,
  FiFilm,
  FiCornerUpLeft,
  FiEdit2,
  FiTrash2,
  FiShare,
  FiStar,
  FiMoreHorizontal,
  FiSettings,
  FiImage,
  FiHardDrive,
  FiArrowLeft,
} from "react-icons/fi";
import { TbPinnedOff } from "react-icons/tb";
import { BsCheck2All } from "react-icons/bs";
import EmojiPicker from "emoji-picker-react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import SkeletonChat from "@/shared/skeletons/SkeletonChat";
import { useTranslations } from "next-intl";
import Image from "next/image";
import axiosClient from "@/shared/lib/axiosClient";
import {
  formatBytes,
  parseAttachmentContent,
  parseSystemFileContent,
  parseSystemMessage,
  isSystemMessage,
  formatSystemMessage,
  ATTACHMENT_TTL_MS,
} from "@/features/chat/utils/messageUtils";
import getAvatarUrl from "@/shared/utils/getAvatarUrl";
import SystemFilePickerModal from "./SystemFilePickerModal";

const MAIN_PX = "px-3 sm:px-6 lg:px-16";
const AVATAR_SIZE = 44;
const MAX_RECORDING_SECONDS = 60;

const formatRecordingTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
};

export default function ChatConversation({
  chat,
  messages,
  onSend,
  onSendAttachment = () => {},
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
  pinnedMessage,
  onPinMessage = () => {},
  onUnpinMessage = () => {},
  attachmentState = { sending: false, error: null },
  callState = null,
  onStartCall = () => {},
  // New features
  replyingTo = null,
  setReplyingTo = () => {},
  editingMessage = null,
  setEditingMessage = () => {},
  starredMessages = {},
  addReaction = () => {},
  removeReaction = () => {},
  editMessage = () => {},
  deleteMessage = () => {},
  starMessage = () => {},
  onForward = () => {},
  allChats = [],
  onOpenGroupSettings = () => {},
  onOpenMediaGallery = () => {},
  onSendSystemFiles = () => {},
  onMobileBack = () => {},
}) {
  const t = useTranslations();
  const messagesEndRef = useRef(null);
  const scrollRef = useRef(null);
  const prevScrollHeight = useRef(0);
  const messageRefs = useRef({});
  const fileInputRef = useRef(null);
  const shouldForceInstantScrollRef = useRef(true);
  const emojiPickerRef = useRef(null);
  const emojiButtonRef = useRef(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [systemFilePickerOpen, setSystemFilePickerOpen] = useState(false);
  const [attachmentMenuOpen, setAttachmentMenuOpen] = useState(false);
  const attachmentMenuRef = useRef(null);
  const [searchMatches, setSearchMatches] = useState([]);
  const [activeMatch, setActiveMatch] = useState(0);
  const [infoOpen, setInfoOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [gifOpen, setGifOpen] = useState(false);
  const [gifSearch, setGifSearch] = useState("");
  const [gifs, setGifs] = useState([]);
  const [loadingGifs, setLoadingGifs] = useState(false);
  const [trendingGifs, setTrendingGifs] = useState([]);
  const gifPickerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const recordingStreamRef = useRef(null);
  const recordingShouldSaveRef = useRef(true);
  const [recordingActive, setRecordingActive] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingPreview, setRecordingPreview] = useState(null);
  const [recordingError, setRecordingError] = useState("");

  // Context menu and reactions
  const [contextMenu, setContextMenu] = useState(null);
  const [reactionPickerOpen, setReactionPickerOpen] = useState(null);
  const contextMenuRef = useRef(null);
  const reactionPickerRef = useRef(null);
  const [editInput, setEditInput] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

  // Track scroll state
  const lastMessageCountRef = useRef(0);
  const lastChatIdRef = useRef(null);
  const hasInitialScrolledRef = useRef(false);

  // Helper function to scroll to bottom - using scrollRef directly
  const scrollToBottom = useCallback((instant = false) => {
    const container = scrollRef.current;
    if (!container) return;
    if (instant) {
      container.scrollTop = container.scrollHeight;
    } else {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    }
  }, []);

  // Reset scroll flag when chat changes
  useEffect(() => {
    hasInitialScrolledRef.current = false;
    lastMessageCountRef.current = 0;
    lastChatIdRef.current = chat?.id;
  }, [chat?.id]);

  // Reset when loading starts
  useEffect(() => {
    if (loadingMessages) {
      hasInitialScrolledRef.current = false;
      lastMessageCountRef.current = 0;
    }
  }, [loadingMessages]);

  // Main scroll effect - scroll to bottom when messages load
  useEffect(() => {
    // Skip if still loading
    if (loadingMessages) return;
    // Skip if no messages
    if (!messages || messages.length === 0) return;
    // Skip if loading more old messages (user scrolling up)
    if (loadingMore) return;
    const container = scrollRef.current;
    if (!container) return;
    const isInitialLoad = !hasInitialScrolledRef.current;
    const isNewMessage =
      messages.length > lastMessageCountRef.current &&
      hasInitialScrolledRef.current;
    // Update refs
    lastMessageCountRef.current = messages.length;
    if (isInitialLoad) {
      // First time loading this chat - scroll to bottom instantly
      hasInitialScrolledRef.current = true;
      // Force scroll to bottom immediately
      container.scrollTop = container.scrollHeight;
      // Use requestAnimationFrame to ensure DOM is painted
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
      });
      // Also scroll after delays to handle lazy-loaded content (images, etc.)
      const timers = [50, 100, 200, 400, 800, 1500].map((delay) =>
        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        }, delay)
      );
      return () => timers.forEach(clearTimeout);
    } else if (isNewMessage || isTyping) {
      // New message arrived - smooth scroll
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, loadingMessages, loadingMore, isTyping]);
  useEffect(() => {
    messageRefs.current = {};
    setSearchQuery("");
    setSearchMatches([]);
    setActiveMatch(0);
    setSearchOpen(false);
    setInfoOpen(false);
  }, [chat?.id]);
  useEffect(() => {
    if (loadingMore && scrollRef.current) {
      prevScrollHeight.current = scrollRef.current.scrollHeight;
    }
  }, [loadingMore]);
  useEffect(() => {
    if (!loadingMore && scrollRef.current && prevScrollHeight.current) {
      const el = scrollRef.current;
      const diff = el.scrollHeight - prevScrollHeight.current;
      if (diff > 0) el.scrollTop = diff;
      prevScrollHeight.current = 0;
    }
  }, [loadingMore]);
  useEffect(() => {
    if (!searchQuery) {
      setSearchMatches([]);
      setActiveMatch(0);
      return;
    }
    const lowered = searchQuery.toLowerCase();
    const matches = messages
      .map((msg, idx) => ({ idx, id: msg._id || idx, content: msg.content }))
      .filter(({ content }) => {
        if (typeof content !== "string") return false;
        if (parseAttachmentContent(content)) return false;
        return content.toLowerCase().includes(lowered);
      });
    setSearchMatches(matches);
    setActiveMatch((prev) =>
      matches.length ? Math.min(prev, matches.length - 1) : 0
    );
  }, [searchQuery, messages]);
  useEffect(() => {
    if (!searchMatches.length) return;
    const target = messageRefs.current[searchMatches[activeMatch]?.id];
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      target.classList.add("ring-2", "ring-brand", "ring-offset-2");
      const timeout = setTimeout(() => {
        target.classList.remove("ring-2", "ring-brand", "ring-offset-2");
      }, 1200);
      return () => clearTimeout(timeout);
    }
  }, [activeMatch, searchMatches]);
  useEffect(() => {
    if (!searchOpen) {
      Object.values(messageRefs.current).forEach((node) =>
        node?.classList?.remove("ring-2", "ring-brand", "ring-offset-2")
      );
    }
  }, [searchOpen]);
  useEffect(() => {
    if (!emojiOpen) return;
    const handleClick = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target) &&
        !emojiButtonRef.current?.contains(event.target)
      ) {
        setEmojiOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [emojiOpen]);
  const ensureProfile = async () => {
    if (!chat?.id) return;
    if (profile && profile._id === chat.id) return;
    try {
      setLoadingProfile(true);
      const res = await axiosClient.get(`/api/user/profile/${chat.id}`);
      setProfile(res.data.user);
      setProfileError("");
    } catch (err) {
      setProfileError(
        err?.response?.data?.error || "Không thể tải thông tin người dùng."
      );
    } finally {
      setLoadingProfile(false);
    }
  };
  const handleOpenInfo = async () => {
    setInfoOpen(true);
    await ensureProfile();
  };
  const infoData = useMemo(
    () => profile || userMap[chat?.id] || chat || {},
    [profile, userMap, chat]
  );
  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };
  const handleAttachmentChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        await onSendAttachment(file);
      } finally {
        e.target.value = "";
      }
    }
  };
  const handleEmojiSelect = (emojiData) => {
    if (!emojiData?.emoji) return;
    setInput((prev) => `${prev}${emojiData.emoji}`);
  };

  // GIF functions using Tenor API
  const TENOR_API_KEY = "AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ"; // Public demo key

  const fetchTrendingGifs = useCallback(async () => {
    try {
      setLoadingGifs(true);
      const res = await fetch(
        `https://tenor.googleapis.com/v2/featured?key=${TENOR_API_KEY}&limit=20&media_filter=gif`
      );
      const data = await res.json();
      setTrendingGifs(data.results || []);
      setGifs(data.results || []);
    } catch (err) {
      console.error("Failed to fetch trending GIFs:", err);
    } finally {
      setLoadingGifs(false);
    }
  }, []);

  const searchGifs = useCallback(
    async (query) => {
      if (!query.trim()) {
        setGifs(trendingGifs);
        return;
      }
      try {
        setLoadingGifs(true);
        const res = await fetch(
          `https://tenor.googleapis.com/v2/search?key=${TENOR_API_KEY}&q=${encodeURIComponent(
            query
          )}&limit=20&media_filter=gif`
        );
        const data = await res.json();
        setGifs(data.results || []);
      } catch (err) {
        console.error("Failed to search GIFs:", err);
      } finally {
        setLoadingGifs(false);
      }
    },
    [trendingGifs]
  );

  // Debounced GIF search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (gifOpen) {
        searchGifs(gifSearch);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [gifSearch, gifOpen, searchGifs]);

  // Fetch trending when GIF picker opens
  useEffect(() => {
    if (gifOpen && trendingGifs.length === 0) {
      fetchTrendingGifs();
    }
  }, [gifOpen, trendingGifs.length, fetchTrendingGifs]);

  const handleGifSelect = (gif) => {
    // Get the best quality GIF URL
    const gifUrl =
      gif.media_formats?.gif?.url || gif.media_formats?.tinygif?.url;
    if (gifUrl) {
      onSend(`[GIF]${gifUrl}`);
    }
    setGifOpen(false);
    setGifSearch("");
  };

  // Close GIF picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (gifPickerRef.current && !gifPickerRef.current.contains(e.target)) {
        setGifOpen(false);
      }
    };
    if (gifOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [gifOpen]);

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    setRecordingActive(false);
  };

  const startRecording = async () => {
    if (recordingActive || attachmentState?.sending) return;
    if (recordingPreview) {
      setRecordingError(
        "Vui lòng gửi hoặc xóa ghi âm hiện tại trước khi tạo bản mới."
      );
      return;
    }
    setEmojiOpen(false);
    setRecordingError("");

    if (
      typeof window === "undefined" ||
      !navigator?.mediaDevices?.getUserMedia
    ) {
      setRecordingError("Thiết bị không hỗ trợ ghi âm.");
      return;
    }

    try {
      if (typeof MediaRecorder === "undefined") {
        setRecordingError("Trình duyệt không hỗ trợ ghi âm.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingStreamRef.current = stream;
      const mimeType =
        typeof MediaRecorder !== "undefined" &&
        MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      recordingChunksRef.current = [];
      recordingShouldSaveRef.current = true;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size) {
          recordingChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        setRecordingActive(false);
        stream.getTracks().forEach((track) => track.stop());
        recordingStreamRef.current = null;
        mediaRecorderRef.current = null;

        const shouldSave = recordingShouldSaveRef.current;
        recordingShouldSaveRef.current = true; // Reset for next recording
        if (!shouldSave) {
          recordingChunksRef.current = [];
          setRecordingDuration(0);
          return;
        }

        const chunks = recordingChunksRef.current;
        if (!chunks.length) {
          setRecordingError("Không có âm thanh nào được ghi.");
          return;
        }

        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setRecordingPreview({ blob, url, mimeType });
        recordingChunksRef.current = [];
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250); // Collect 250ms chunks

      setRecordingActive(true);
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => {
          const next = prev + 1;
          if (next >= MAX_RECORDING_SECONDS) {
            stopRecording();
          }
          return next;
        });
      }, 1000);
    } catch (err) {
      setRecordingError(
        err?.message || "Không thể truy cập micro. Vui lòng kiểm tra quyền."
      );
    }
  };

  const cancelRecording = () => {
    setRecordingError("");
    if (recordingActive) {
      recordingShouldSaveRef.current = false; // Prevent saving on stop
      stopRecording();
    }
    if (recordingPreview) {
      URL.revokeObjectURL(recordingPreview.url);
      setRecordingPreview(null);
    }
    setRecordingDuration(0);
  };

  const handleSendRecording = async () => {
    if (!recordingPreview?.blob) return;
    try {
      const file = new File(
        [recordingPreview.blob],
        `voice-note-${Date.now()}.webm`,
        {
          type: recordingPreview.mimeType || recordingPreview.blob.type,
        }
      );
      await onSendAttachment(file);
      URL.revokeObjectURL(recordingPreview.url);
      setRecordingPreview(null);
      setRecordingDuration(0);
      setRecordingError("");
    } catch (err) {
      setRecordingError(
        err?.message || "Không thể gửi ghi âm. Vui lòng thử lại."
      );
    }
  };

  const handleNextMatch = () => {
    if (!searchMatches.length) return;
    setActiveMatch((prev) => (prev + 1) % searchMatches.length);
  };

  const handlePrevMatch = () => {
    if (!searchMatches.length) return;
    setActiveMatch((prev) =>
      prev === 0 ? searchMatches.length - 1 : prev - 1
    );
  };

  const base64ToBlob = (base64, mimeType = "application/octet-stream") => {
    const byteChars = atob(base64);
    const byteNumbers = new Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i += 1) {
      byteNumbers[i] = byteChars.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  const handleDownloadAttachment = (attachment) => {
    if (!attachment?.data) return;
    const blob = base64ToBlob(attachment.data, attachment.mime);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = attachment.name || "attachment";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  const highlightContent = (text) => {
    if (!searchQuery) return text;
    const regex = new RegExp(
      `(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi"
    );
    return text.split(regex).map((part, idx) =>
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <mark
          key={`${part}-${idx}`}
          className="bg-yellow-200 text-gray-900 px-1 rounded"
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // Parse GIF content
  const parseGifContent = (content) => {
    if (typeof content !== "string") return null;
    const match = content.match(/^\[GIF\](.+)$/);
    if (match) {
      return match[1]; // Return GIF URL
    }
    return null;
  };

  // Render GIF
  const renderGif = (gifUrl, isMe) => {
    return (
      <div className="relative max-w-[280px] rounded-2xl overflow-hidden">
        <img
          src={gifUrl}
          alt="GIF"
          className="w-full h-auto rounded-2xl"
          loading="lazy"
        />
      </div>
    );
  };

  const formatTime = (value) =>
    value
      ? new Date(value).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

  const renderAttachment = (attachment, isMine, messageCreatedAt) => {
    if (!attachment) return null;

    const expiresAt =
      attachment.expiresAt && !Number.isNaN(Number(attachment.expiresAt))
        ? new Date(Number(attachment.expiresAt))
        : messageCreatedAt
        ? new Date(new Date(messageCreatedAt).getTime() + ATTACHMENT_TTL_MS)
        : null;

    const isExpired =
      Boolean(attachment.expired) ||
      (expiresAt ? Date.now() > expiresAt.getTime() : false);
    const hasData = Boolean(attachment.data);
    const canPreview = hasData && !isExpired;

    const isImage = attachment.mime?.startsWith("image/");
    const isAudio = attachment.mime?.startsWith("audio/");
    const src =
      canPreview && attachment.mime
        ? `data:${attachment.mime};base64,${attachment.data}`
        : null;

    const titleClass = isMine ? "text-white" : "text-gray-900";
    const subClass = isMine ? "text-white/70" : "text-gray-600";

    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-2xl ${
              isMine
                ? "bg-white border-white/30"
                : "bg-[var(--color-surface-50)] border-[var(--color-border)]"
            } border flex items-center justify-center overflow-hidden`}
          >
            {canPreview && isImage ? (
              <img
                src={src}
                alt={attachment.name}
                className="w-full h-full object-cover"
              />
            ) : canPreview && isAudio ? (
              <FiMic className="text-xl" />
            ) : (
              <FiFileText className="text-xl" />
            )}
          </div>
          <div className="flex-1 min-w-0 text-sm">
            <p className={`font-semibold truncate ${titleClass}`}>
              {attachment.name}
            </p>
            <p className={`text-xs ${subClass}`}>
              {formatBytes(attachment.size)}
            </p>
            {expiresAt && (
              <p className="text-[11px] text-gray-600 mt-0.5">
                {isExpired
                  ? "Tệp đã hết hạn (lưu tối đa 3 ngày)."
                  : `Tự xoá vào ${expiresAt.toLocaleDateString()} ${expiresAt.toLocaleTimeString(
                      [],
                      { hour: "2-digit", minute: "2-digit" }
                    )}`}
              </p>
            )}
          </div>
          {canPreview && (
            <button
              type="button"
              className={`text-xs font-semibold flex items-center gap-1 ${
                isMine ? "text-white" : "text-brand"
              }`}
              onClick={() => handleDownloadAttachment(attachment)}
            >
              <FiDownload /> {t("chat.conversation.download_attachment")}
            </button>
          )}
        </div>
        {canPreview && isImage && (
          <img
            src={src}
            alt={attachment.name}
            className={`rounded-2xl border max-h-64 object-cover ${
              isMine ? "border-white/40" : "border-[var(--color-border)]"
            }`}
          />
        )}
        {canPreview && isAudio && (
          <audio
            controls
            src={src}
            className="w-full rounded-xl border border-[var(--color-border)]/60"
          >
            <track kind="captions" />
          </audio>
        )}
        {!canPreview && (
          <p className="text-sm text-[var(--color-danger-500)]">
            Tệp đã hết hạn hoặc không còn tồn tại.
          </p>
        )}
      </div>
    );
  };

  // Render system file attachment (from file management system)
  const renderSystemFile = (systemFile, isMine) => {
    if (!systemFile) return null;

    const isImage = systemFile.mime?.startsWith("image/");
    const isAudio = systemFile.mime?.startsWith("audio/");
    const isVideo = systemFile.mime?.startsWith("video/");

    const titleClass = isMine ? "text-white" : "text-gray-900";
    const subClass = isMine ? "text-white/70" : "text-gray-600";

    const handleDownload = () => {
      if (systemFile.downloadUrl) {
        // ✅ Download URL - cookie sent automatically
        const downloadLink = document.createElement("a");
        downloadLink.href = systemFile.downloadUrl;
        // ✅ Cookie sent automatically with download request
        downloadLink.download = systemFile.name;
        downloadLink.target = "_blank";
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    };

    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-2xl ${
              isMine
                ? "bg-white border-white/30"
                : "bg-[var(--color-surface-50)] border-[var(--color-border)]"
            } border flex items-center justify-center overflow-hidden`}
          >
            {isImage ? (
              <FiImage className="text-xl text-purple-500" />
            ) : isAudio ? (
              <FiMic className="text-xl text-indigo-500" />
            ) : isVideo ? (
              <FiVideo className="text-xl text-pink-500" />
            ) : (
              <FiHardDrive className="text-xl text-brand" />
            )}
          </div>
          <div className="flex-1 min-w-0 text-sm">
            <p className={`font-semibold truncate ${titleClass}`}>
              {systemFile.name}
            </p>
            <p className={`text-xs ${subClass}`}>
              {formatBytes(systemFile.size)}
            </p>
            <p className="text-[11px] text-brand flex items-center gap-1 mt-0.5">
              <FiHardDrive size={10} /> File hệ thống
            </p>
          </div>
          <button
            type="button"
            className={`text-xs font-semibold flex items-center gap-1 ${
              isMine ? "text-white" : "text-brand"
            }`}
            onClick={handleDownload}
          >
            <FiDownload /> {t("chat.conversation.download_attachment")}
          </button>
        </div>
      </div>
    );
  };

  const renderPinnedPreview = (message) => {
    if (!message) return "";
    const attachment = parseAttachmentContent(message.content);
    if (attachment) {
      const expiresAt =
        attachment.expiresAt && !Number.isNaN(Number(attachment.expiresAt))
          ? Number(attachment.expiresAt)
          : message.createdAt
          ? new Date(message.createdAt).getTime() + ATTACHMENT_TTL_MS
          : null;
      const isExpired =
        attachment.expired ||
        (expiresAt ? Date.now() > expiresAt : false) ||
        !attachment.data;
      if (isExpired) {
        return `Tệp đã hết hạn: ${attachment.name || ""}`;
      }
      return `${t("chat.conversation.attachment_label")}: ${attachment.name}`;
    }
    const systemFile = parseSystemFileContent(message.content);
    if (systemFile) {
      return `📁 File hệ thống: ${systemFile.name}`;
    }
    return message.content || "";
  };

  const callBusy = Boolean(
    callState && callState.status && callState.status !== "idle"
  );

  // Load more messages when scrolling to top
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      // Trigger load more when scrolled near the top (within 100px)
      if (el.scrollTop < 100 && hasMore && !loadingMore && onLoadMore) {
        onLoadMore();
      }
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [onLoadMore, hasMore, loadingMore]);

  const isOnline = chat && onlineList && onlineList.includes(chat.id);
  const pinned = pinnedMessage;

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      if (recordingStreamRef.current) {
        recordingStreamRef.current.getTracks().forEach((track) => track.stop());
        recordingStreamRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (recordingPreview?.url) {
        URL.revokeObjectURL(recordingPreview.url);
      }
    };
  }, [recordingPreview]);

  const focusPinnedMessage = () => {
    if (!pinned?.id) return;
    const target = messageRefs.current[pinned.id];
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      target.classList.add("ring-2", "ring-brand", "ring-offset-2");
      setTimeout(() => {
        target.classList.remove("ring-2", "ring-brand", "ring-offset-2");
      }, 1200);
    }
  };

  const handlePinnedKeyDown = (event) => {
    if (event.key === "Enter" || event.key === "") {
      event.preventDefault();
      focusPinnedMessage();
    }
  };

  // Close context menu when clicking outside
  useEffect(() => {
    if (!contextMenu) return;
    const handleClick = (e) => {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(e.target)
      ) {
        setContextMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [contextMenu]);

  // Close reaction picker when clicking outside
  useEffect(() => {
    if (!reactionPickerOpen) return;
    const handleClick = (e) => {
      if (
        reactionPickerRef.current &&
        !reactionPickerRef.current.contains(e.target)
      ) {
        setReactionPickerOpen(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [reactionPickerOpen]);

  // Handle context menu
  const handleContextMenu = (e, msg) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      message: msg,
      isMe:
        String(typeof msg.from === "object" ? msg.from?._id : msg.from) ===
        String(myId),
    });
  };

  // Handle reply
  const handleReply = (msg) => {
    setReplyingTo(msg);
    setContextMenu(null);
  };

  // Handle edit
  const handleStartEdit = (msg) => {
    setEditingMessage(msg);
    setEditInput(msg.content);
    setContextMenu(null);
  };

  const handleSaveEdit = () => {
    if (!editingMessage || !editInput.trim()) return;
    editMessage(editingMessage._id, editInput.trim());
    setEditingMessage(null);
    setEditInput("");
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setEditInput("");
  };

  // Handle delete
  const handleDelete = (msg, forAll = false) => {
    deleteMessage(msg._id, forAll);
    setDeleteConfirm(null);
    setContextMenu(null);
  };

  // Handle forward
  const handleForward = (msg) => {
    onForward(msg);
    setContextMenu(null);
  };

  // Handle star
  const handleStar = (msg) => {
    const isStarred = starredMessages[msg._id];
    starMessage(msg._id, !isStarred);
    setContextMenu(null);
  };

  // Handle reaction
  const handleReaction = (msg, emoji) => {
    const existingReaction = msg.reactions?.find(
      (r) => String(r.user) === String(myId)
    );
    if (existingReaction?.emoji === emoji) {
      removeReaction(msg._id);
    } else {
      addReaction(msg._id, emoji);
    }
    setReactionPickerOpen(null);
    setContextMenu(null);
  };

  // Render reply preview in message
  const renderReplyPreview = (replyTo) => {
    if (!replyTo) return null;
    const sender = userMap[replyTo.from] || {};
    return (
      <div className="mb-2 pl-3 border-l-2 border-brand/50 text-xs">
        <p className="font-semibold text-brand-500">
          {sender.fullName || sender.name || sender.email || "Người dùng"}
        </p>
        <p className="text-gray-600 line-clamp-1">
          {replyTo.content?.startsWith("__CHAT_ATTACHMENT__:")
            ? "📎 Tệp đính kèm"
            : replyTo.content}
        </p>
      </div>
    );
  };

  // Render reactions on message
  const renderReactions = (msg) => {
    if (!msg.reactions?.length) return null;

    const grouped = msg.reactions.reduce((acc, r) => {
      acc[r.emoji] = (acc[r.emoji] || 0) + 1;
      return acc;
    }, {});

    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {Object.entries(grouped).map(([emoji, count]) => {
          const isMyReaction = msg.reactions.some(
            (r) => r.emoji === emoji && String(r.user) === String(myId)
          );
          return (
            <button
              key={emoji}
              type="button"
              className={`text-xs px-1.5 py-0.5 rounded-full border transition ${
                isMyReaction
                  ? "bg-brand/10 border-brand/30"
                  : "bg-white border-[var(--color-border)]/50 hover:bg-white"
              }`}
              onClick={() => handleReaction(msg, emoji)}
            >
              {emoji} {count > 1 && <span className="ml-0.5">{count}</span>}
            </button>
          );
        })}
      </div>
    );
  };

  const conversationBackground =
    "linear-gradient(180deg, rgba(166,219,255,1) 0%, rgba(215,244,255,0.9) 45%, rgba(208,251,236,0.9) 100%), url(\"data:image/svg+xml,%3Csvg width='144' height='144' viewBox='0 0 144 144' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.18'%3E%3Ccircle cx='12' cy='12' r='2'/%3E%3Ccircle cx='72' cy='36' r='2'/%3E%3Ccircle cx='120' cy='90' r='2'/%3E%3Crect x='32' y='96' width='6' height='6' rx='1'/%3E%3Crect x='100' y='26' width='6' height='6' rx='1'/%3E%3Cpath d='M20 58h14v2H20z'/%3E%3Cpath d='M82 118h14v2H82z'/%3E%3C/g%3E%3C/svg%3E\")";

  const formatDayLabel = (value) => {
    if (!value) return "";
    return new Intl.DateTimeFormat("vi-VN", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
    }).format(new Date(value));
  };

  const shouldShowDayDivider = (current, previous) => {
    if (!current?.createdAt) return false;
    if (!previous?.createdAt) return true;
    const currentDay = new Date(current.createdAt).toDateString();
    const previousDay = new Date(previous.createdAt).toDateString();
    return currentDay !== previousDay;
  };

  // Show skeleton only during actual loading (removed artificial delay)
  if (loadingMessages) return <SkeletonChat />;
  if (!chat) return null;

  return (
    <div className="relative flex flex-col h-full w-full">
      <div className="bg-white backdrop-blur py-2 lg:py-3 border-b border-white/80 shadow-[0_8px_30px_rgba(15,23,42,0.12)]">
        <div
          className={`${MAIN_PX} py-2 lg:py-3 flex items-center justify-between gap-2 lg:gap-4`}
        >
          <div className="flex items-center gap-2 lg:gap-4 flex-1 min-w-0">
            {/* Mobile back button */}
            <button
              type="button"
              onClick={onMobileBack}
              className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-[var(--color-surface-50)] transition shrink-0"
              title="Quay lại"
            >
              <FiArrowLeft size={20} />
            </button>
            <div
              className="flex items-center justify-center rounded-xl lg:rounded-2xl bg-white border border-[var(--color-border)]/50 overflow-hidden shadow-sm shrink-0"
              style={{ width: 40, height: 40 }}
            >
              {loadingMessages ? (
                <Skeleton circle width={36} height={36} />
              ) : (
                <Image
                  src={getAvatarUrl(chat?.avatar)}
                  alt="avatar"
                  className="w-full h-full object-cover"
                  width={40}
                  height={40}
                  placeholder="blur"
                  blurDataURL="data:image/png;base64,..."
                  priority
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-base lg:text-lg text-gray-900 truncate">
                  {chat?.name || t("chat.conversation.select_conversation")}
                </h2>
                {/* Labels hidden on mobile */}
                {chat?.labels?.slice(0, 2).map((label) => (
                  <span
                    key={label}
                    className="hidden sm:inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--color-surface-50)] text-brand border border-[var(--color-border)]/60"
                  >
                    {label}
                  </span>
                ))}
              </div>
              <div className="text-[11px] flex items-center gap-3 mt-1 text-gray-600">
                <span
                  className={`inline-flex items-center gap-1 uppercase tracking-widest ${
                    isOnline ? "text-green-600" : "text-gray-400"
                  }`}
                >
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      isOnline ? "bg-green-500" : "bg-gray-400"
                    }`}
                  />
                  {isOnline
                    ? t("chat.status.online")
                    : t("chat.status.offline")}
                </span>
                {chat?.membersCount && (
                  <span className="text-[10px] uppercase tracking-widest text-brand">
                    {`${chat.membersCount} ${t("chat.conversation.members")}`}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 lg:gap-2 shrink-0">
            {/* Mobile: show only essential buttons */}
            <button
              type="button"
              className={`inline-flex items-center justify-center w-9 h-9 lg:w-10 lg:h-10 rounded-xl lg:rounded-2xl border border-[var(--color-border)] transition ${
                searchOpen
                  ? "bg-brand text-white"
                  : "hover:bg-[var(--color-surface-50)] text-gray-900"
              }`}
              onClick={() =>
                setSearchOpen((prev) => {
                  if (prev) setSearchQuery("");
                  return !prev;
                })
              }
              title={t("chat.conversation.search_messages")}
            >
              <FiSearch size={18} />
            </button>
            {/* Call buttons - hidden on small mobile */}
            <button
              type="button"
              className="hidden sm:inline-flex items-center justify-center w-9 h-9 lg:w-10 lg:h-10 rounded-xl lg:rounded-2xl border border-[var(--color-border)] hover:bg-[var(--color-surface-50)] text-gray-900 transition disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={() => onStartCall("audio")}
              disabled={callBusy || !chat}
              title={t("chat.conversation.audio_call")}
            >
              <FiPhoneCall size={18} />
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center w-9 h-9 lg:w-10 lg:h-10 rounded-xl lg:rounded-2xl border border-[var(--color-border)] hover:bg-[var(--color-surface-50)] text-gray-900 transition disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={() => onStartCall("video")}
              disabled={callBusy || !chat}
              title={t("chat.conversation.video_call")}
            >
              <FiVideo size={18} />
            </button>
            {/* Desktop only buttons */}
            <button
              type="button"
              className="hidden lg:inline-flex items-center justify-center w-10 h-10 rounded-2xl border border-[var(--color-border)] hover:bg-[var(--color-surface-50)] text-gray-900 transition"
              onClick={onOpenMediaGallery}
              title="Thư viện phương tiện"
            >
              <FiImage size={18} />
            </button>
            {chat?.type === "group" && (
              <button
                type="button"
                className="inline-flex items-center justify-center w-9 h-9 lg:w-10 lg:h-10 rounded-xl lg:rounded-2xl border border-[var(--color-border)] hover:bg-[var(--color-surface-50)] text-gray-900 transition"
                onClick={onOpenGroupSettings}
                title="Cài đặt nhóm"
              >
                <FiSettings size={18} />
              </button>
            )}
            <button
              type="button"
              className="inline-flex items-center justify-center w-9 h-9 lg:w-10 lg:h-10 rounded-xl lg:rounded-2xl border border-[var(--color-border)] hover:bg-[var(--color-surface-50)] text-gray-900 transition"
              onClick={handleOpenInfo}
              title={t("chat.conversation.info_title")}
            >
              <FiInfo size={18} />
            </button>
          </div>
        </div>
        {callState?.error && (
          <p className="px-7 text-xs text-[var(--color-danger-500)]">
            {callState.error}
          </p>
        )}
        {searchOpen && (
          <div className={`${MAIN_PX} pb-4`}>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                <input
                  className="w-full pl-9 pr-10 py-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-50)] focus:outline-none focus:ring-2 focus:ring-brand"
                  placeholder={t("chat.conversation.search_placeholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                  >
                    <FiX />
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
              <span>
                {searchMatches.length
                  ? `${activeMatch + 1}/${searchMatches.length}`
                  : t("chat.conversation.no_results")}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="w-7 h-7 rounded-full border border-[var(--color-border)] flex items-center justify-center hover:bg-[var(--color-surface-50)] disabled:opacity-40"
                  onClick={handlePrevMatch}
                  disabled={!searchMatches.length}
                >
                  <FiChevronUp />
                </button>
                <button
                  type="button"
                  className="w-7 h-7 rounded-full border border-[var(--color-border)] flex items-center justify-center hover:bg-[var(--color-surface-50)] disabled:opacity-40"
                  onClick={handleNextMatch}
                  disabled={!searchMatches.length}
                >
                  <FiChevronDown />
                </button>
              </div>
            </div>
          </div>
        )}
        {pinned && (
          <div className={`${MAIN_PX} pt-3 pb-3`}>
            <div
              role="button"
              tabIndex={0}
              onClick={focusPinnedMessage}
              onKeyDown={handlePinnedKeyDown}
              className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)]/40 bg-white px-4 py-2 shadow-sm cursor-pointer hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand transition"
            >
              <div className="text-xs font-semibold uppercase text-[var(--color-info-500)] tracking-wide">
                {t("chat.conversation.pinned")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 leading-snug line-clamp-2 break-words">
                  {renderPinnedPreview(pinned)}
                </p>
              </div>
              <button
                type="button"
                className="p-1 rounded-full text-gray-600 hover:text-gray-900"
                onClick={(event) => {
                  event.stopPropagation();
                  onUnpinMessage();
                }}
                title={t("chat.conversation.unpin")}
              >
                <TbPinnedOff />
              </button>
            </div>
          </div>
        )}
      </div>
      <div
        className={`flex-1 overflow-y-auto hide-scrollbar ${MAIN_PX} pt-4 lg:pt-8 pb-24 lg:pb-28 chat-messages-area`}
        ref={scrollRef}
        style={{
          WebkitOverflowScrolling: "touch",
          backgroundImage: conversationBackground,
          backgroundAttachment: "fixed",
          backgroundSize: "cover, 200px",
          backgroundPosition: "center",
        }}
      >
        {/* Loading indicator when scrolling up to load more */}
        {loadingMore && (
          <div className="flex items-center justify-center py-4 mb-2">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-md border border-[var(--color-border)]/30">
              <div className="flex gap-1">
                <span
                  className="w-2 h-2 bg-brand rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="w-2 h-2 bg-brand rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="w-2 h-2 bg-brand rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
              <span className="text-xs text-gray-600 font-medium">
                Đang tải tin nhắn cũ...
              </span>
            </div>
          </div>
        )}
        {/* Show indicator that more messages can be loaded */}
        {hasMore && !loadingMore && (
          <div className="flex items-center justify-center py-2 mb-2">
            <div className="px-3 py-1 rounded-full bg-[var(--color-surface-50)] text-xs text-gray-600">
              ↑ Cuộn lên để xem tin nhắn cũ hơn
            </div>
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
        ) : (
          messages.map((msg, idx) => {
            const rawSender =
              typeof msg.from === "object"
                ? msg.from?._id || msg.from?.toString?.()
                : msg.from;
            const isMe = rawSender === myId;
            const sender =
              chat?.type === "group" && !isMe
                ? chat.members?.find(
                    (member) => member.id === rawSender?.toString?.()
                  ) || userMap[rawSender]
                : isMe
                ? userMap[myId]
                : userMap[chat.id];
            const attachment = parseAttachmentContent(msg.content);
            const systemFile = parseSystemFileContent(msg.content);
            const gifUrl = parseGifContent(msg.content);
            const systemMsg = parseSystemMessage(msg.content);
            const key = msg._id || idx;
            const isPinnedMessage = pinned && pinned.id === msg._id;
            const previousMessage = messages[idx - 1];
            const nextMessage = messages[idx + 1];
            const showDayDivider = shouldShowDayDivider(msg, previousMessage);
            const previousSender =
              typeof previousMessage?.from === "object"
                ? previousMessage?.from?._id ||
                  previousMessage?.from?.toString?.()
                : previousMessage?.from;
            const nextSender =
              typeof nextMessage?.from === "object"
                ? nextMessage?.from?._id || nextMessage?.from?.toString?.()
                : nextMessage?.from;
            const isFirstInGroup = previousSender !== rawSender;
            const isLastInGroup = nextSender !== rawSender;
            const showAvatar = !isMe && isLastInGroup;

            // Render system message (member added/removed/left)
            if (systemMsg) {
              return (
                <React.Fragment key={key}>
                  {showDayDivider && (
                    <div className="flex justify-center my-6">
                      <span className="day-divider px-4 py-1 rounded-full bg-white text-xs font-semibold text-gray-600 shadow-sm border border-white/80">
                        {formatDayLabel(msg.createdAt)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-center my-3">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-surface-100)]/80 text-xs text-gray-600 shadow-sm border border-[var(--color-border)]/30">
                      <span>{formatSystemMessage(systemMsg)}</span>
                    </div>
                  </div>
                </React.Fragment>
              );
            }

            return (
              <React.Fragment key={key}>
                {showDayDivider && (
                  <div className="flex justify-center my-6">
                    <span className="day-divider px-4 py-1 rounded-full bg-white text-xs font-semibold text-gray-600 shadow-sm border border-white/80">
                      {formatDayLabel(msg.createdAt)}
                    </span>
                  </div>
                )}
                <div
                  ref={(el) => {
                    if (el) messageRefs.current[key] = el;
                  }}
                  className={`mb-1 flex gap-2 items-end ${
                    isMe ? "justify-end" : "justify-start"
                  }`}
                >
                  {!isMe && (
                    <div className="w-9 h-9 mr-1 flex items-end justify-center shrink-0">
                      <Image
                        src={getAvatarUrl(sender?.avatar)}
                        alt="avatar"
                        className={`w-9 h-9 rounded-full object-cover border border-[var(--color-border)]/50 shadow-sm ${
                          showAvatar ? "" : "opacity-0"
                        }`}
                        width={36}
                        height={36}
                        placeholder="blur"
                        blurDataURL="data:image/png;base64,..."
                        priority
                      />
                    </div>
                  )}
                  <div
                    className={`relative group max-w-[80%] sm:max-w-[78%] message-bubble ${
                      isMe ? "message-bubble--me" : "message-bubble--other"
                    } ${isPinnedMessage ? "ring-2 ring-brand/40" : ""} ${
                      msg.deletedForAll ? "opacity-60" : ""
                    }`}
                    data-first={isFirstInGroup}
                    data-last={isLastInGroup}
                    onContextMenu={(e) => handleContextMenu(e, msg)}
                  >
                    {/* Reply preview */}
                    {msg.replyTo && renderReplyPreview(msg.replyTo)}
                    {/* Forwarded indicator */}
                    {msg.forwardedFrom && (
                      <div className="flex items-center gap-1 text-[10px] text-gray-600 mb-1">
                        <FiShare size={10} />
                        <span>Đã chuyển tiếp</span>
                      </div>
                    )}
                    {chat?.type === "group" && !isMe && (
                      <p className="text-[11px] font-semibold text-brand-500 mb-1">
                        {sender?.fullName ||
                          sender?.name ||
                          sender?.email ||
                          sender?.slast ||
                          "Thành viên"}
                      </p>
                    )}
                    <div className="text-[15px] leading-relaxed break-words">
                      {msg.deletedForAll ? (
                        <span className="italic text-gray-600">
                          Tin nhắn đã bị xóa
                        </span>
                      ) : gifUrl ? (
                        renderGif(gifUrl, isMe)
                      ) : attachment ? (
                        renderAttachment(attachment, isMe, msg.createdAt)
                      ) : systemFile ? (
                        renderSystemFile(systemFile, isMe)
                      ) : typeof msg.content === "string" ? (
                        highlightContent(msg.content)
                      ) : (
                        msg.content
                      )}
                    </div>
                    {/* Reactions */}
                    {renderReactions(msg)}
                    <div className="flex items-center gap-1 text-[11px] text-gray-600/80 mt-2 justify-end">
                      {msg.edited && (
                        <span className="italic mr-1">đã sửa</span>
                      )}
                      <span>{formatTime(msg.createdAt)}</span>
                      {isMe && (
                        <BsCheck2All
                          className={`text-xs ${
                            msg.isRead ? "text-brand" : "text-gray-600/70"
                          }`}
                        />
                      )}
                      {starredMessages[msg._id] && (
                        <FiStar className="text-xs text-yellow-500 fill-yellow-500" />
                      )}
                    </div>
                    {/* Action buttons on hover */}
                    <div
                      className={`absolute -top-3 ${
                        isMe ? "left-0" : "right-0"
                      } flex items-center gap-1 opacity-0 group-hover:opacity-100 transition`}
                    >
                      {/* Quick reactions */}
                      <div className="flex items-center bg-white rounded-full shadow-lg border border-[var(--color-border)]/50 px-1 py-0.5">
                        {QUICK_REACTIONS.slice(0, 3).map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            className="w-6 h-6 flex items-center justify-center hover:scale-125 transition"
                            onClick={() => handleReaction(msg, emoji)}
                          >
                            {emoji}
                          </button>
                        ))}
                        <button
                          type="button"
                          className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-gray-900 transition"
                          onClick={() => setReactionPickerOpen(msg._id)}
                        >
                          <FiSmile size={14} />
                        </button>
                      </div>
                      {/* More actions */}
                      <button
                        type="button"
                        className="w-7 h-7 flex items-center justify-center bg-white rounded-full shadow-lg border border-[var(--color-border)]/50 text-gray-600 hover:text-gray-900 transition"
                        onClick={(e) => handleContextMenu(e, msg)}
                      >
                        <FiMoreHorizontal size={14} />
                      </button>
                    </div>
                    {/* Reaction picker popup */}
                    {reactionPickerOpen === msg._id && (
                      <div
                        ref={reactionPickerRef}
                        className={`absolute ${
                          isMe ? "left-0" : "right-0"
                        } -top-12 bg-white rounded-2xl shadow-xl border border-[var(--color-border)] p-2 flex gap-1 z-20`}
                      >
                        {QUICK_REACTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            className="w-8 h-8 flex items-center justify-center text-lg hover:scale-125 transition"
                            onClick={() => handleReaction(msg, emoji)}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
        {isTyping && (
          <div className="mb-2 flex justify-start items-end">
            <Image
              src={getAvatarUrl(chat?.avatar)}
              alt="avatar"
              className="w-8 h-8 rounded-full object-cover mr-2 border border-[var(--color-border)]"
              width={32}
              height={32}
              placeholder="blur"
              blurDataURL="data:image/png;base64,..."
              priority
            />
            <div
              className="px-3 py-2 rounded-2xl bg-white border border-[var(--color-border)] flex items-center"
              style={{
                borderRadius: 18,
                minWidth: 48,
                minHeight: 32,
                justifyContent: "center",
              }}
            >
              <span className="typing-ellipsis">
                <span className="dot" /> <span className="dot" />
                <span className="dot" />
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      {recordingActive && (
        <div className={`${MAIN_PX} pt-4`}>
          <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 border border-white/80 shadow-md">
            <div className="flex items-center gap-3 text-sm font-semibold text-gray-900">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-danger-500)] animate-pulse" />
              <span>
                Đang ghi âm • {formatRecordingTime(recordingDuration)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold">
              <button
                type="button"
                className="px-3 py-1 rounded-full bg-[var(--color-surface-50)] hover:bg-[var(--color-surface-100)]"
                onClick={cancelRecording}
              >
                Hủy
              </button>
              <button
                type="button"
                className="px-3 py-1 rounded-full bg-[var(--color-danger-500)] text-white hover:opacity-90"
                onClick={stopRecording}
              >
                Dừng
              </button>
            </div>
          </div>
        </div>
      )}
      {recordingPreview && (
        <div className={`${MAIN_PX} pt-3`}>
          <div className="space-y-3 rounded-2xl bg-white px-4 py-3 border border-white/80 shadow-lg">
            <audio controls src={recordingPreview.url} className="w-full">
              <track kind="captions" />
            </audio>
            <div className="flex items-center justify-between text-sm font-semibold">
              <button
                type="button"
                className="text-[var(--color-danger-500)] hover:underline"
                onClick={cancelRecording}
              >
                Xóa
              </button>
              <button
                type="button"
                className="px-4 py-1 rounded-full bg-brand text-white hover:opacity-90 disabled:opacity-50"
                onClick={handleSendRecording}
                disabled={attachmentState?.sending}
              >
                Gửi ghi âm
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Reply bar */}
      {replyingTo && (
        <div className={`${MAIN_PX} pt-3`}>
          <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-2.5 border border-[var(--color-border)]/40 shadow-sm">
            <FiCornerUpLeft className="text-brand shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-brand">
                Trả lời{""}
                {userMap[replyingTo.from]?.fullName ||
                  userMap[replyingTo.from]?.name ||
                  "Tin nhắn"}
              </p>
              <p className="text-sm text-gray-600 truncate">
                {replyingTo.content?.startsWith("__CHAT_ATTACHMENT__:")
                  ? "📎 Tệp đính kèm"
                  : replyingTo.content}
              </p>
            </div>
            <button
              type="button"
              className="p-1.5 rounded-full hover:bg-[var(--color-surface-50)] text-gray-600 hover:text-gray-900 transition"
              onClick={() => setReplyingTo(null)}
            >
              <FiX size={16} />
            </button>
          </div>
        </div>
      )}
      {/* Edit bar */}
      {editingMessage && (
        <div className={`${MAIN_PX} pt-3`}>
          <div className="rounded-2xl bg-white px-4 py-3 border border-brand/40 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <FiEdit2 className="text-brand shrink-0" size={14} />
              <span className="text-xs font-semibold text-brand">
                Chỉnh sửa tin nhắn
              </span>
              <button
                type="button"
                className="ml-auto p-1 rounded-full hover:bg-[var(--color-surface-50)] text-gray-600 hover:text-gray-900 transition"
                onClick={handleCancelEdit}
              >
                <FiX size={14} />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                className="flex-1 px-3 py-2 rounded-xl border border-[var(--color-border)] bg-white focus:outline-none focus:ring-2 focus:ring-brand/30 text-sm"
                value={editInput}
                onChange={(e) => setEditInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSaveEdit();
                  }
                  if (e.key === "Escape") {
                    handleCancelEdit();
                  }
                }}
                autoFocus
              />
              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-brand text-white text-sm font-medium hover:opacity-90 transition"
                onClick={handleSaveEdit}
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Floating input composer */}
      <div className="fixed lg:absolute bottom-[68px] lg:bottom-0 left-0 right-0 z-30 pointer-events-none">
        {/* Emoji/GIF Picker - positioned above the icons on the left */}
        {(emojiOpen || gifOpen) && (
          <div className="absolute left-4 lg:left-8 bottom-16 lg:bottom-24 z-40 pointer-events-auto">
            {emojiOpen && (
              <div
                ref={emojiPickerRef}
                className="drop-shadow-2xl rounded-2xl overflow-hidden"
              >
                <EmojiPicker
                  onEmojiClick={handleEmojiSelect}
                  theme="auto"
                  searchDisabled
                  previewConfig={{ showPreview: false }}
                  lazyLoadEmojis
                />
              </div>
            )}
            {gifOpen && (
              <div
                ref={gifPickerRef}
                className="w-[280px] sm:w-[340px] h-[320px] sm:h-[400px] bg-white rounded-2xl shadow-2xl border border-[var(--color-border)] overflow-hidden flex flex-col"
              >
                {/* Header */}
                <div className="p-3 border-b border-[var(--color-border)] bg-gradient-to-r from-purple-500 to-pink-500">
                  <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2">
                    <FiSearch size={16} className="text-gray-600" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm GIF..."
                      className="flex-1 bg-transparent border-none focus:outline-none text-sm"
                      value={gifSearch}
                      onChange={(e) => setGifSearch(e.target.value)}
                      autoFocus
                    />
                    {gifSearch && (
                      <button
                        type="button"
                        onClick={() => setGifSearch("")}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <FiX size={14} />
                      </button>
                    )}
                  </div>
                </div>
                {/* GIF Grid */}
                <div className="flex-1 overflow-y-auto p-2">
                  {loadingGifs ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent"></div>
                    </div>
                  ) : gifs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-600">
                      <FiFilm size={40} className="mb-2 opacity-50" />
                      <p className="text-sm">Không tìm thấy GIF</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {gifs.map((gif) => (
                        <button
                          key={gif.id}
                          type="button"
                          className="relative aspect-square rounded-xl overflow-hidden hover:ring-2 hover:ring-purple-500 transition group"
                          onClick={() => handleGifSelect(gif)}
                        >
                          <img
                            src={
                              gif.media_formats?.tinygif?.url ||
                              gif.media_formats?.gif?.url
                            }
                            alt={gif.content_description || "GIF"}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {/* Footer */}
                <div className="p-2 border-t border-[var(--color-border)] bg-gray-50 flex items-center justify-center gap-1">
                  <span className="text-xs text-gray-600">Powered by</span>
                  <span className="text-xs font-semibold text-purple-600">
                    Tenor
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
        <form
          className="px-2 sm:px-4 lg:px-16 py-2 lg:py-4 pointer-events-auto"
          onSubmit={(e) => {
            e.preventDefault();
            if (editingMessage) {
              handleSaveEdit();
            } else if (input.trim()) {
              onSend(input);
            }
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleAttachmentChange}
          />
          <div className="chat-composer flex items-center gap-2 lg:gap-3 rounded-full bg-white backdrop-blur-md px-2 sm:px-3 lg:px-5 py-2 lg:py-3 shadow-[0_-10px_40px_rgba(15,23,42,0.15)] border border-white/80">
            <div className="flex items-center gap-2 lg:gap-3 text-gray-600">
              {/* Attachment dropdown menu */}
              <div className="relative flex items-center">
                <button
                  type="button"
                  className={`flex items-center justify-center hover:text-gray-900 transition disabled:opacity-40 ${
                    attachmentMenuOpen ? "text-brand" : ""
                  }`}
                  tabIndex={-1}
                  onClick={() => setAttachmentMenuOpen((prev) => !prev)}
                  disabled={attachmentState?.sending}
                  title={t("chat.conversation.add_attachment")}
                >
                  <FiPaperclip size={20} />
                </button>
                {attachmentMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setAttachmentMenuOpen(false)}
                    />
                    <div
                      ref={attachmentMenuRef}
                      className="absolute bottom-full left-0 mb-8 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50"
                    >
                      <button
                        type="button"
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-900 hover:bg-white transition"
                        onClick={() => {
                          setAttachmentMenuOpen(false);
                          handleAttachmentClick();
                        }}
                      >
                        <FiPaperclip size={18} className="text-gray-600" />
                        <span>Tải lên từ máy tính</span>
                      </button>
                      <button
                        type="button"
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-900 hover:bg-white transition"
                        onClick={() => {
                          setAttachmentMenuOpen(false);
                          setSystemFilePickerOpen(true);
                        }}
                      >
                        <FiHardDrive size={18} className="text-brand" />
                        <span>Chọn từ hệ thống</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
              <button
                type="button"
                ref={emojiButtonRef}
                className={`flex items-center justify-center transition ${
                  emojiOpen ? "text-brand" : "hover:text-gray-900 text-gray-600"
                }`}
                title="Biểu tượng cảm xúc"
                aria-pressed={emojiOpen}
                onClick={() => {
                  setEmojiOpen((prev) => !prev);
                  setGifOpen(false);
                }}
              >
                <FiSmile size={20} />
              </button>
              <button
                type="button"
                className={`flex items-center justify-center transition ${
                  gifOpen
                    ? "text-purple-500"
                    : "hover:text-gray-900 text-gray-600"
                }`}
                title="GIF"
                aria-pressed={gifOpen}
                onClick={() => {
                  setGifOpen((prev) => !prev);
                  setEmojiOpen(false);
                }}
              >
                <span className="text-sm font-bold leading-none">GIF</span>
              </button>
            </div>
            <input
              className="flex-1 bg-transparent border-none focus:outline-none text-[15px] placeholder:text-gray-600"
              placeholder={t("chat.conversation.input_placeholder")}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onInput={() => {
                if (window.typingTimeout) clearTimeout(window.typingTimeout);
                if (window.lastTypingTo !== chat?.id && chat?.id) {
                  window.lastTypingTo = chat.id;
                }
                if (chat?.id && window.socketRef && window.socketRef.current) {
                  if (chat?.type === "group") {
                    window.socketRef.current.emit("group:typing", {
                      groupId: chat.id,
                    });
                  } else {
                    window.socketRef.current.emit("chat:typing", {
                      to: chat.id,
                    });
                  }
                }
                window.typingTimeout = setTimeout(() => {
                  window.lastTypingTo = null;
                }, 2000);
              }}
            />
            <div className="flex items-center gap-1 text-gray-600 shrink-0">
              <button
                type="button"
                className={`flex items-center justify-center w-8 h-8 lg:w-10 lg:h-10 rounded-full border border-transparent transition ${
                  recordingActive
                    ? "bg-[var(--color-danger-500)] text-white animate-pulse"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                title={recordingActive ? "Dừng ghi âm" : "Ghi âm thoại"}
                onClick={() =>
                  recordingActive ? stopRecording() : startRecording()
                }
                disabled={attachmentState?.sending}
              >
                <FiMic size={16} />
              </button>
              <button
                type="submit"
                className="flex items-center justify-center w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-brand text-white shadow-lg hover:opacity-90 transition"
              >
                <FiSend size={16} />
              </button>
            </div>
          </div>
        </form>
      </div>
      <div className={`${MAIN_PX} -mt-4`}>
        {attachmentState?.sending && (
          <p className="text-xs text-brand flex items-center gap-2">
            <span className="w-3 h-3 border-2 border-brand border-t-transparent rounded-full animate-spin" />
            {t("chat.conversation.sending_attachment")}
          </p>
        )}
        {attachmentState?.error && (
          <p className="text-xs text-[var(--color-danger-500)] mt-1">
            {attachmentState.error}
          </p>
        )}
        {recordingError && (
          <p className="text-xs text-[var(--color-danger-500)] mt-1">
            {recordingError}
          </p>
        )}
      </div>
      {/* Context Menu */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-50"
            onClick={() => setContextMenu(null)}
          />
          <div
            ref={contextMenuRef}
            className="fixed z-50 bg-white rounded-2xl shadow-2xl border border-[var(--color-border)] py-2 min-w-[180px]"
            style={{
              left: Math.min(contextMenu.x, window.innerWidth - 200),
              top: Math.min(contextMenu.y, window.innerHeight - 300),
            }}
          >
            {/* Reply */}
            <button
              type="button"
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-900 hover:bg-[var(--color-surface-50)] transition"
              onClick={() => handleReply(contextMenu.message)}
            >
              <FiCornerUpLeft size={16} /> Trả lời
            </button>
            {/* Forward */}
            <button
              type="button"
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-900 hover:bg-[var(--color-surface-50)] transition"
              onClick={() => handleForward(contextMenu.message)}
            >
              <FiShare size={16} /> Chuyển tiếp
            </button>
            {/* Star */}
            <button
              type="button"
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-900 hover:bg-[var(--color-surface-50)] transition"
              onClick={() => handleStar(contextMenu.message)}
            >
              <FiStar
                size={16}
                className={
                  starredMessages[contextMenu.message._id]
                    ? "text-yellow-500 fill-yellow-500"
                    : ""
                }
              />
              {starredMessages[contextMenu.message._id]
                ? "Bỏ đánh dấu"
                : "Đánh dấu sao"}
            </button>
            {/* Pin/Unpin */}
            <button
              type="button"
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-900 hover:bg-[var(--color-surface-50)] transition"
              onClick={() => {
                const isPinned = pinnedMessage?.id === contextMenu.message._id;
                if (isPinned) {
                  onUnpinMessage();
                } else {
                  onPinMessage(contextMenu.message);
                }
                setContextMenu(null);
              }}
            >
              <FiBookmark
                size={16}
                className={
                  pinnedMessage?.id === contextMenu.message._id
                    ? "text-brand fill-brand"
                    : ""
                }
              />
              {pinnedMessage?.id === contextMenu.message._id
                ? "Bỏ ghim"
                : "Ghim tin nhắn"}
            </button>
            {/* Edit (only for own messages) */}
            {contextMenu.isMe &&
              !contextMenu.message.content?.startsWith(
                "__CHAT_ATTACHMENT__:"
              ) &&
              !contextMenu.message.deletedForAll && (
                <button
                  type="button"
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-900 hover:bg-[var(--color-surface-50)] transition"
                  onClick={() => handleStartEdit(contextMenu.message)}
                >
                  <FiEdit2 size={16} /> Chỉnh sửa
                </button>
              )}
            <div className="h-px bg-[var(--color-border)] my-1" />
            {/* Delete for me */}
            <button
              type="button"
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-danger-500)] hover:bg-[var(--color-surface-50)] transition"
              onClick={() => handleDelete(contextMenu.message, false)}
            >
              <FiTrash2 size={16} /> Xóa phía tôi
            </button>
            {/* Delete for all (only for own messages) */}
            {contextMenu.isMe && !contextMenu.message.deletedForAll && (
              <button
                type="button"
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-danger-500)] hover:bg-[var(--color-surface-50)] transition"
                onClick={() => setDeleteConfirm(contextMenu.message)}
              >
                <FiTrash2 size={16} /> Xóa cho tất cả
              </button>
            )}
          </div>
        </>
      )}
      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-50"
            onClick={() => setDeleteConfirm(null)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Xóa tin nhắn?
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Tin nhắn này sẽ bị xóa cho tất cả mọi người trong cuộc trò chuyện.
              Hành động này không thể hoàn tác.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-900 hover:bg-[var(--color-surface-50)] transition"
                onClick={() => setDeleteConfirm(null)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-xl text-sm font-medium bg-[var(--color-danger-500)] text-white hover:opacity-90 transition"
                onClick={() => handleDelete(deleteConfirm, true)}
              >
                Xóa
              </button>
            </div>
          </div>
        </>
      )}
      {infoOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setInfoOpen(false)}
          />
          <div className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-white z-50 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
              <h3 className="text-lg font-semibold text-gray-900">
                {t("chat.conversation.info_title")}
              </h3>
              <button
                type="button"
                className="p-2 rounded-full hover:bg-[var(--color-surface-50)]"
                onClick={() => setInfoOpen(false)}
              >
                <FiX />
              </button>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {loadingProfile ? (
                <Skeleton count={6} height={20} />
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <Image
                      src={getAvatarUrl(infoData?.avatar)}
                      alt="avatar"
                      className="w-14 h-14 rounded-2xl object-cover border border-[var(--color-border)]"
                      width={56}
                      height={56}
                      placeholder="blur"
                      blurDataURL="data:image/png;base64,..."
                      priority
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {infoData?.fullName || infoData?.name}
                      </p>
                      <p className="text-sm text-gray-600 truncate">
                        {chat?.type === "group"
                          ? `${chat?.members?.length || 0} thành viên`
                          : infoData?.email || infoData?.slast}
                      </p>
                    </div>
                  </div>
                  {profileError && (
                    <p className="text-xs text-[var(--color-danger-500)]">
                      {profileError}
                    </p>
                  )}
                  {/* Group members preview */}
                  {chat?.type === "group" && chat?.members?.length > 0 && (
                    <div>
                      <p className="text-gray-600 text-xs uppercase mb-2">
                        Thành viên
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {chat.members.slice(0, 5).map((member) => (
                          <div
                            key={member.id || member._id}
                            className="flex items-center gap-2 px-2 py-1 rounded-lg bg-[var(--color-surface-50)]"
                          >
                            <Image
                              src={getAvatarUrl(member.avatar)}
                              alt="avatar"
                              className="w-6 h-6 rounded-full object-cover"
                              width={24}
                              height={24}
                            />
                            <span className="text-xs text-gray-900 truncate max-w-[80px]">
                              {member.fullName || member.name || member.email}
                            </span>
                          </div>
                        ))}
                        {chat.members.length > 5 && (
                          <button
                            type="button"
                            className="px-2 py-1 rounded-lg bg-brand/10 text-brand text-xs font-medium"
                            onClick={() => {
                              setInfoOpen(false);
                              onOpenGroupSettings();
                            }}
                          >
                            +{chat.members.length - 5} khác
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  {/* User info (for direct chat) */}
                  {chat?.type !== "group" && (
                    <div className="grid grid-cols-1 gap-3 text-sm">
                      <div>
                        <p className="text-gray-600 text-xs uppercase">
                          {t("chat.conversation.email")}
                        </p>
                        <p className="font-medium">{infoData?.email || "—"}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs uppercase">
                          {t("chat.conversation.phone")}
                        </p>
                        <p className="font-medium">{infoData?.phone || "—"}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs uppercase">
                          {t("chat.conversation.role")}
                        </p>
                        <p className="font-medium capitalize">
                          {infoData?.role || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs uppercase">
                          {t("chat.conversation.joined")}
                        </p>
                        <p className="font-medium">
                          {infoData?.createdAt
                            ? new Date(infoData.createdAt).toLocaleDateString()
                            : "—"}
                        </p>
                      </div>
                    </div>
                  )}
                  {/* Quick Actions */}
                  <div className="space-y-2 pt-4 border-t border-[var(--color-border)]">
                    <button
                      type="button"
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--color-surface-50)] transition text-left"
                      onClick={() => {
                        setInfoOpen(false);
                        onOpenMediaGallery();
                      }}
                    >
                      <FiImage className="text-brand" size={18} />
                      <span className="font-medium text-gray-900">
                        Thư viện phương tiện
                      </span>
                    </button>
                    {chat?.type === "group" && (
                      <button
                        type="button"
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--color-surface-50)] transition text-left"
                        onClick={() => {
                          setInfoOpen(false);
                          onOpenGroupSettings();
                        }}
                      >
                        <FiSettings className="text-brand" size={18} />
                        <span className="font-medium text-gray-900">
                          Cài đặt nhóm
                        </span>
                      </button>
                    )}
                  </div>
                  {pinned && (
                    <div className="border border-[var(--color-border)] rounded-2xl p-3 bg-[var(--color-surface-50)]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs uppercase font-semibold text-brand">
                          {t("chat.conversation.pinned")}
                        </span>
                        <button
                          type="button"
                          className="text-xs text-[var(--color-danger-500)]"
                          onClick={onUnpinMessage}
                        >
                          {t("chat.conversation.unpin")}
                        </button>
                      </div>
                      <p className="text-sm text-gray-900 break-words">
                        {renderPinnedPreview(pinned)}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
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
        .message-bubble {
          padding: 14px 16px;
          border-radius: 22px;
          box-shadow: 0 6px 22px rgba(31, 41, 55, 0.12);
          position: relative;
          background: white;
          border: 1px solid rgba(255, 255, 255, 0.5);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .message-bubble--me {
          background: #d6fbb9;
          color: #1f2937;
        }
        .message-bubble[data-first="false"] {
          border-top-left-radius: 10px;
          border-top-right-radius: 10px;
        }
        .message-bubble[data-last="false"] {
          border-bottom-left-radius: 10px;
          border-bottom-right-radius: 10px;
        }
        .message-bubble--me[data-last="true"] {
          border-bottom-right-radius: 6px;
        }
        .message-bubble--other[data-last="true"] {
          border-bottom-left-radius: 6px;
        }
      `}</style>
      {/* System File Picker Modal */}
      <SystemFilePickerModal
        isOpen={systemFilePickerOpen}
        onClose={() => setSystemFilePickerOpen(false)}
        onSelectFiles={(files) => {
          if (files.length > 0) {
            onSendSystemFiles(files);
          }
        }}
        maxFiles={10}
      />
    </div>
  );
}
