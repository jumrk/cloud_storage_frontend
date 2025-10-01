import usePermissionModal from "@/hooks/leader/FileManagement/usePermissionModal";
import { useEffect } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const PermissionModal = ({ isOpen, onClose, folder, onPermissionChange }) => {
  const {
    members,
    loading,
    fetchMembers,
    fetchCurrentPermissions,
    handleGrantPermission,
    handleRevokePermission,
    getMemberPermission,
    isFolder,
    isLoadingList,
    t,
  } = usePermissionModal(onPermissionChange, folder);

  useEffect(() => {
    if (isOpen && folder) {
      fetchMembers();
      fetchCurrentPermissions();
    }
  }, [isOpen, folder]);
  if (!isOpen || !folder) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-2xl border border-gray-100 relative animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-primary text-2xl font-bold transition-all"
          title={t("permission.close")}
        >
          ✕
        </button>
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-primary mb-1">
            {t("permission.manage_access_permissions")}
          </h2>
          <div className="text-gray-600 text-base">
            {t("permission.folder")}:{" "}
            <span className="text-primary font-semibold">{folder.name}</span>
          </div>
        </div>
        <div className="mb-2">
          <h4 className="font-semibold mb-3 text-gray-800 text-lg text-left">
            {t("permission.member_list")}
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
                {t("permission.no_members")}
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
                          {t("permission.permission_open")}
                        </span>
                      )}
                      {locked === true && (
                        <span className="px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-semibold">
                          {t("permission.permission_locked")}
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
                            {t("permission.lock_permission")}
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              handleGrantPermission(member._id, false)
                            }
                            disabled={loading}
                            className="ml-2 px-3 py-1 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-blue-600 transition disabled:opacity-50 shadow"
                          >
                            {t("permission.open_permission")}
                          </button>
                        ))}
                      {isFolder && locked !== null && (
                        <button
                          onClick={() => handleRevokePermission(member._id)}
                          disabled={loading}
                          className="ml-2 px-2 py-1 rounded-lg bg-gray-200 text-gray-700 text-xs hover:bg-gray-300 transition disabled:opacity-50 shadow"
                          title={t("permission.revoke_permission_title")}
                        >
                          {t("permission.revoke")}
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
