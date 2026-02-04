import ModalShareBoardSkeleton from "@/shared/skeletons/ModalShareBoardSkeleton";
import Button from "@/shared/ui/button";
import Input from "@/shared/ui/Input";
import React, { useState, useRef, useEffect } from "react";
import { FiX } from "react-icons/fi";
import { useTranslations } from "next-intl";
import getAvatarUrl from "@/shared/utils/getAvatarUrl";
import boardService from "../../../services/boardService";

const firstLetter = (s = "") => (s.trim()[0] || "?").toUpperCase();
const colorOf = (s = "") =>
  [
    "bg-brand-500",
    "bg-accent-500",
    "bg-success-500",
    "bg-info-500",
    "bg-warning-500",
    "bg-danger-500",
  ][(s.charCodeAt(0) + (s.charCodeAt(s.length - 1) || 0)) % 6];

export default function ModalShareBoard({
  open,
  onClose,
  members = [],
  onAdd,
  onRemove,
  loading,
}) {
  const t = useTranslations();
  const [email, setEmail] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);
  const { searchUsers } = boardService();

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!email.trim() || email.includes("@")) { 
        // Don't search if it looks like a complete email or empty
        if (!email.trim()) setSuggestions([]);
        return;
      }
      
      try {
        const res = await searchUsers(email);
        if (res.data?.success) {
          // Filter out users already in the board
          const currentMemberEmails = members.map(m => m.email);
          const filtered = res.data.data.filter(u => !currentMemberEmails.includes(u.email));
          setSuggestions(filtered);
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error("Search failed", error);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [email, members]);

  if (!open) return null;

  const handleAdd = (e) => {
    e?.preventDefault();
    if (!email.trim()) return;
    onAdd?.(email.trim());
    setEmail("");
    setSuggestions([]);
  };

  const selectUser = (user) => {
    setEmail(user.email);
    setShowSuggestions(false);
    // Optional: Auto-add? Or let user click Add? 
    // Let's just fill for now to be safe.
  };

  if (loading) return <ModalShareBoardSkeleton />;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 grid place-items-center px-4">
        <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-gray-200">
          <div className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Chia sẻ bảng
              </h3>
              <button
                onClick={onClose}
                className="rounded-md p-2 text-gray-600 hover:bg-white"
                aria-label={t("job_management.modal.close")}
              >
                <FiX />
              </button>
            </div>
            <div className="mt-4 relative" ref={wrapperRef}>
              <label className="text-sm font-medium text-gray-900">
                Mời thành viên bằng tên hoặc email
              </label>
              <form onSubmit={handleAdd} className="flex gap-2 items-center">
                <div className="relative w-full">
                    <Input
                    ref={inputRef}
                    value={email}
                    handelChange={(e) => {
                        setEmail(e.target.value);
                        if (!showSuggestions && e.target.value) setShowSuggestions(true);
                    }}
                    onFocus={() => email && setShowSuggestions(true)}
                    placeholder="Nhập tên hoặc email..."
                    className="w-full"
                    />
                    {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto z-50 divide-y divide-gray-100">
                            {suggestions.map(user => (
                                <div 
                                    key={user._id || user.id}
                                    onClick={() => selectUser(user)}
                                    className="p-3 flex items-center gap-3 hover:bg-gray-50 cursor-pointer transition-colors"
                                >
                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-semibold overflow-hidden ${user.avatar ? '' : colorOf(user.fullName)}`}>
                                        {user.avatar ? (
                                            <img src={getAvatarUrl(user.avatar)} alt="avatar" className="w-full h-full object-cover" />
                                        ) : firstLetter(user.fullName)}
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
                                        <div className="text-xs text-gray-500">{user.email}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <Button
                  className={"mt-3"}
                  size="lg"
                  disabled={loading || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}
                  type="submit"
                  handleClick={handleAdd}
                  loading={loading}
                  children={t("job_management.modal.add")}
                />
              </form>
              <p className="mt-1 text-xs text-gray-600">
                {t("job_management.modal.add_member_note")}
              </p>
            </div>
            <div className="mt-5">
              <p className="text-sm font-medium text-gray-900">
                Thành viên hiện có
              </p>
              {members.length === 0 ? (
                <p className="mt-2 text-sm text-gray-600">
                  Chưa có thành viên.
                </p>
              ) : (
                <ul className="mt-2 max-h-[130px] overflow-auto rounded-xl border border-gray-200 divide-y divide-border">
                  {members.map((m, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between p-3"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-white text-sm font-semibold overflow-hidden ${
                            m.avatar ? "" : colorOf(m.name)
                          }`}
                        >
                          {m.avatar ? (
                            <img
                              src={getAvatarUrl(m.avatar)}
                              alt={m.name || "avatar"}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            firstLetter(m.name)
                          )}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {m.name}
                          </p>
                          <p className="text-xs text-gray-600">{m.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => onRemove?.(m.id)}
                        className="rounded-lg px-2 py-1 text-sm text-danger-600 hover:bg-danger-50"
                      >
                        Gỡ
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="mt-5 flex justify-end">
              <button
                onClick={onClose}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-900 hover:bg-white"
              >
                {t("job_management.modal.close")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
