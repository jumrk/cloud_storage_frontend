"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { getSharedByMe, getSharedWithMe } from "./services/sharedFilesService";
import ShareModal from "@/features/file-management/components/ShareModal";

export default function SharedPage() {
  const t = useTranslations("file_shared");
  const [tab, setTab] = useState("me");
  const [sharedByMe, setSharedByMe] = useState([]);
  const [sharedWithMe, setSharedWithMe] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareModalItem, setShareModalItem] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const abortController = new AbortController();
        if (tab === "me") {
          const response = await getSharedByMe(abortController.signal);
          if (response.success) {
            setSharedByMe(response.sharedItems || []);
          }
        } else {
          const response = await getSharedWithMe(abortController.signal);
          if (response.success) {
            setSharedWithMe(response.sharedItems || []);
          }
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error fetching shared files:", err);
          setError("Không thể tải dữ liệu");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tab, refreshKey]);

  const handleManageShare = (item) => {
    if (tab !== "me") return;
    if (!item) return;
    const resourceId = item.resourceId || item.id;
    if (!resourceId) return;
    setShareModalItem({
      id: resourceId,
      type: item.type || item.resourceType || "file",
      name: item.name,
      canView: typeof item.canView === "boolean" ? item.canView : true,
      canDownload:
        typeof item.canDownload === "boolean" ? item.canDownload : false,
      shareUrl: item.shareUrl || "",
    });
    setShareModalOpen(true);
  };

  const closeShareModal = (shouldRefresh = false) => {
    setShareModalOpen(false);
    setShareModalItem(null);
    if (shouldRefresh) {
      setRefreshKey((prev) => prev + 1);
    }
  };

  const data = tab === "me" ? sharedByMe : sharedWithMe;

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-strong">
            {t("title")}
          </h1>
          <p className="text-sm text-text-muted">
            {t(`description.${tab}`)}
          </p>
        </div>
        <div className="inline-flex rounded-full border border-border bg-surface-50 p-1">
          <button
            className={`px-4 py-1.5 text-sm rounded-full ${
              tab === "me" ? "bg-brand-500 text-white shadow" : "text-text-strong"
            }`}
            onClick={() => setTab("me")}
          >
            {t("tabs.me")}
          </button>
          <button
            className={`px-4 py-1.5 text-sm rounded-full ${
              tab === "with_me"
                ? "bg-brand-500 text-white shadow"
                : "text-text-strong"
            }`}
            onClick={() => setTab("with_me")}
          >
            {t("tabs.with_me")}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-white shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-text-muted">
            Đang tải...
          </div>
        ) : error ? (
          <div className="py-16 text-center text-danger-500">
            {error}
          </div>
        ) : data.length === 0 ? (
          <div className="py-16 text-center text-text-muted">
            {t("empty")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-surface-50 text-left text-sm font-semibold text-text-muted uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3">{t("table.name")}</th>
                  <th className="px-4 py-3">
                    {tab === "me" ? t("table.recipient") : t("table.owner")}
                  </th>
                  <th className="px-4 py-3">{t("table.date")}</th>
                  <th className="px-4 py-3">{t("table.permission")}</th>
                  <th className="px-4 py-3 text-right">{t("actions.manage")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {data.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-50">
                    <td className="px-4 py-3 font-medium text-text-strong">
                      {item.name}
                    </td>
                    <td className="px-4 py-3">
                      {tab === "me"
                        ? (Array.isArray(item.recipients) ? item.recipients.join(", ") : item.recipients)
                        : item.owner}
                    </td>
                    <td className="px-4 py-3 text-text-muted">
                      {new Date(item.date).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600">
                        {item.permission}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        className={`text-sm font-medium ${
                          tab === "me"
                            ? "text-brand-600 hover:text-brand-500"
                            : "text-text-muted cursor-not-allowed"
                        }`}
                        disabled={tab !== "me"}
                        onClick={() => handleManageShare(item)}
                        title={
                          tab === "me"
                            ? t("actions.manage")
                            : "Chỉ chủ sở hữu mới có quyền quản lý"
                        }
                      >
                        {t("actions.manage")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => closeShareModal(false)}
        item={shareModalItem}
        onSuccess={() => closeShareModal(true)}
      />
    </div>
  );
}

