import { useEffect, useMemo, useState } from "react";
import { FiX, FiUserPlus } from "react-icons/fi";
import axiosClient from "@/shared/lib/axiosClient";
import toast from "react-hot-toast";
import Image from "next/image";
import getAvatarUrl from "@/shared/utils/getAvatarUrl";
export default function CreateGroupModal({ open, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  useEffect(() => {
    if (!open) {
      setName("");
      setSearch("");
      setResults([]);
      setSelected([]);
      setLoading(false);
      setSearching(false);
    }
  }, [open]);
  useEffect(() => {
    if (!open) return;
    if (!search.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await axiosClient.get(
          `/api/user/search?query=${encodeURIComponent(search.trim())}`
        );
        setResults(res.data?.users || []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, open]);
  const handleSelect = (user) => {
    if (selected.some((item) => item._id === user._id)) return;
    setSelected((prev) => [...prev, user]);
  };
  const handleRemove = (userId) => {
    setSelected((prev) => prev.filter((item) => item._id !== userId));
  };
  const canSubmit = useMemo(
    () => Boolean(name.trim()) && selected.length >= 1,
    [name, selected]
  );
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    try {
      setLoading(true);
      const res = await axiosClient.post("/api/message/group", {
        name: name.trim(),
        memberIds: selected.map((user) => user._id),
      });
      if (res.data?.group) {
        toast.success("Tạo nhóm thành công!");
        onCreated?.(res.data.group);
        onClose?.();
      }
    } catch (err) {
      toast.error(
        err?.response?.data?.error || "Không thể tạo nhóm. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
          <h3 className="text-lg font-semibold text-gray-900">Tạo nhóm mới</h3>
          <button
            className="p-2 rounded-full hover:bg-[var(--color-surface-50)]"
            onClick={onClose}
            aria-label="Đóng"
          >
            <FiX />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-900 mb-1 block">
              Tên nhóm
            </label>
            <input
              className="w-full border border-[var(--color-border)] rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên nhóm..."
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-900 mb-1 block">
              Thêm thành viên
            </label>
            <div className="relative">
              <FiUserPlus className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
              <input
                className="w-full pl-10 pr-3 py-2 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-brand"
                placeholder="Tìm theo email hoặc slast..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {searching && (
              <p className="text-xs text-gray-600 mt-1">Đang tìm kiếm...</p>
            )}
            {!!results.length && (
              <div className="mt-2 max-h-40 overflow-y-auto border border-[var(--color-border)] rounded-xl divide-y divide-[var(--color-border)]">
                {results.map((user) => (
                  <button
                    key={user._id}
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-[var(--color-surface-50)] flex items-center gap-3"
                    onClick={() => handleSelect(user)}
                  >
                    <Image
                      src={getAvatarUrl(user.avatar)}
                      alt="avatar"
                      className="w-9 h-9 rounded-full object-cover border border-[var(--color-border)]"
                      width={36}
                      height={36}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {user.fullName || user.email || user.slast}
                      </p>
                      <p className="text-xs text-gray-600 truncate">
                        {user.email || user.slast}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          {!!selected.length && (
            <div className="flex flex-wrap gap-2">
              {selected.map((user) => (
                <span
                  key={user._id}
                  className="px-3 py-1 rounded-full bg-[var(--color-brand-50)] text-brand text-sm flex items-center gap-2"
                >
                  {user.fullName || user.email || user.slast}
                  <button
                    type="button"
                    className="text-brand hover:text-brand-700"
                    onClick={() => handleRemove(user._id)}
                  >
                    <FiX />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              className="px-4 py-2 rounded-full border border-[var(--color-border)] text-gray-900 hover:bg-[var(--color-surface-50)]"
              onClick={onClose}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!canSubmit || loading}
              className="px-4 py-2 rounded-full bg-brand text-white font-semibold disabled:opacity-60"
            >
              {loading ? "Đang tạo..." : "Tạo nhóm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
