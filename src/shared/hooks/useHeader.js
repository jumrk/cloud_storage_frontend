import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { decodeTokenGetUser } from "../lib/jwt";
import toast from "react-hot-toast";
import headerService from "../services/headerService";
import axiosClient from "../lib/axiosClient";
import useSocket from "../lib/useSocket";
export default function useHeader() {
  const { authLogout } = headerService();
  const router = useRouter();
  const t = useTranslations();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Loading state for initial auth check
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef();
  const [currentLocale, setCurrentLocale] = useState("vi");
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const socketRef = useSocket(token);

  const updateUnreadNotificationCount = useCallback(async () => {
    try {
      const res = await axiosClient.get("/api/notification/unread-count");
      const count = res?.data?.count ?? 0;
      setUnreadNotificationCount(count);
    } catch {}
  }, []);

  useEffect(() => {
    const tokenStored = localStorage.getItem("token");
    if (tokenStored) {
      const info = decodeTokenGetUser(tokenStored);
      setUser(info);
      setIsLoading(false); // User found from token, stop loading
      updateUnreadNotificationCount();
      axiosClient
        .get("/api/user")
        .then((res) => {
          if (res?.data) {
            setUser((prev) => ({ ...prev, ...res.data }));
          }
        })
        .catch(() => {
          /* ignore */
        });
    } else {
      setUser(null);
      setUnreadNotificationCount(0);
      setIsLoading(false); // No token, stop loading
    }
    if (typeof window !== "undefined") {
      const match = document.cookie.match(/NEXT_LOCALE=([^;]+)/);
      setCurrentLocale(match ? match[1] : "vi");
    }
  }, [updateUnreadNotificationCount]);

  useEffect(() => {
    if (!socketRef.current) return;
    const handleNewNotification = () => {
      updateUnreadNotificationCount();
    };
    socketRef.current.on("notification:new", handleNewNotification);
    return () => {
      socketRef.current.off("notification:new", handleNewNotification);
    };
  }, [socketRef.current, updateUnreadNotificationCount]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const handleSwitchLocale = () => {
    const nextLocale = currentLocale === "vi" ? "en" : "vi";
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; SameSite=Lax`;

    window.location.reload();
  };
  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await authLogout();
    } catch {}
    localStorage.removeItem("token");
    localStorage.clear();
    toast.success(t("header.logout_success"));
    router.push("/login");
  };

  return {
    router,
    t,
    user,
    isLoading,
    menuOpen,
    menuRef,
    currentLocale,
    setMenuOpen,
    handleSwitchLocale,
    handleLogout,
    unreadNotificationCount,
    setUnreadNotificationCount,
  };
}
