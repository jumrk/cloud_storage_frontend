import React, { useState, useEffect } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import axiosClient from "@/lib/axiosClient";
import toast from "react-hot-toast";

const PermissionModal = ({ isOpen, onClose, folder, onPermissionChange }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPermissions, setCurrentPermissions] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingPerms, setLoadingPerms] = useState(false);

  useEffect(() => {
    if (isOpen && folder) {
      fetchMembers();
      fetchCurrentPermissions();
    }
    // eslint-disable-next-line
  }, [isOpen, folder]);

  const fetchMembers = async () => {
    setLoadingMembers(true);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await axiosClient.get("/api/user/members", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = res.data;
      if (Array.isArray(data.members)) {
        setMembers(data.members);
      }
    } catch (error) {
      setMembers([]);
      console.error("Error fetching members:", error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const fetchCurrentPermissions = async () => {
    setLoadingPerms(true);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await axiosClient.get(
        `/api/folders/${folder._id}/permissions`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      const data = res.data;
      if (data.success) {
        setCurrentPermissions(data.permissions || []);
      }
    } catch (error) {
      setCurrentPermissions([]);
      console.error("Error fetching permissions:", error);
    } finally {
      setLoadingPerms(false);
    }
  };

  const handleGrantPermission = async (memberId, locked) => {
    setLoading(true);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      await axiosClient.post(
        "/api/folders/permissions",
        {
          folderId: folder._id,
          memberId,
          locked,
        },
        {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      await fetchCurrentPermissions();
      if (onPermissionChange) {
        onPermissionChange();
      }
    } catch (error) {
      const msg = error?.response?.data?.error || "Có lỗi xảy ra khi cấp quyền";
      toast.error(msg);
      console.error("Error granting permissions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokePermission = async (memberId) => {
    setLoading(true);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      await axiosClient.delete("/api/folders/permissions", {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        data: {
          folderId: folder._id,
          memberId,
        },
      });
      await fetchCurrentPermissions();
      if (onPermissionChange) {
        onPermissionChange();
      }
    } catch (error) {
      const msg =
        error?.response?.data?.error || "Có lỗi xảy ra khi thu hồi quyền";
      toast.error(msg);
      console.error("Error revoking permission:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper: lấy trạng thái locked của member (true/false/null)
  const getMemberPermission = (memberId) => {
    const p = currentPermissions.find(
      (perm) =>
        perm.memberId &&
        (perm.memberId._id === memberId || perm.memberId === memberId)
    );
    return p ? p.locked : null;
  };

  // Helper: kiểm tra chỉ cho phép cấp quyền folder
  const isFolder = folder && (!folder.type || folder.type === "folder");

  if (!isOpen || !folder) return null;

  const isLoadingList = loadingMembers || loadingPerms;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-2xl border border-gray-100 relative animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-primary text-2xl font-bold transition-all"
          title="Đóng"
        >
          ✕
        </button>
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-primary mb-1">
            Quản lý quyền truy cập
          </h2>
          <div className="text-gray-600 text-base">
            Thư mục:{" "}
            <span className="text-primary font-semibold">{folder.name}</span>
          </div>
        </div>
        <div className="mb-2">
          <h4 className="font-semibold mb-3 text-gray-800 text-lg text-left">
            Danh sách thành viên
          </h4>
          <div className="divide-y divide-gray-100 border rounded-xl overflow-hidden bg-[#f7f8fa]">
            {isLoadingList ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between px-4 py-4 bg-white"
                >
                  <div className="flex flex-col gap-1">
                    <Skeleton width={120} height={18} />
                    <Skeleton width={180} height={14} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton width={70} height={28} />
                    <Skeleton width={70} height={28} />
                  </div>
                </div>
              ))
            ) : members.length === 0 ? (
              <div className="p-6 text-gray-500 text-center bg-white">
                Không có thành viên nào
              </div>
            ) : (
              members.map((member) => {
                const locked = getMemberPermission(member._id);
                return (
                  <div
                    key={member._id}
                    className="flex items-center justify-between px-4 py-4 bg-white hover:bg-gray-50 transition-all"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-gray-900 text-base">
                        {member.fullName}
                      </span>
                      <span className="text-gray-500 text-sm">
                        {member.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {locked === false && (
                        <span className="px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-semibold">
                          Đang mở quyền
                        </span>
                      )}
                      {locked === true && (
                        <span className="px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-semibold">
                          Đang bị khóa
                        </span>
                      )}
                      {isFolder &&
                        (locked === false ? (
                          <button
                            onClick={() =>
                              handleGrantPermission(member._id, true)
                            }
                            disabled={loading}
                            className="ml-2 px-3 py-1 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition disabled:opacity-50 shadow"
                          >
                            Khóa quyền
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              handleGrantPermission(member._id, false)
                            }
                            disabled={loading}
                            className="ml-2 px-3 py-1 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-blue-600 transition disabled:opacity-50 shadow"
                          >
                            Mở quyền
                          </button>
                        ))}
                      {isFolder && locked !== null && (
                        <button
                          onClick={() => handleRevokePermission(member._id)}
                          disabled={loading}
                          className="ml-2 px-2 py-1 rounded-lg bg-gray-200 text-gray-700 text-xs hover:bg-gray-300 transition disabled:opacity-50 shadow"
                          title="Thu hồi hoàn toàn quyền"
                        >
                          Xóa
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionModal;
