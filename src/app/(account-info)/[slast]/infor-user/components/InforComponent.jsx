"use client";
import React, { useEffect } from "react";
import { FiEdit2, FiKey } from "react-icons/fi";
import { formatSize } from "@/shared/utils/driveUtils";
import ChangePasswordModal from "./ChangePasswordModal";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import Image from "next/image";
import useInforComponent from "../hooks/useInforComponent";
import Button from "@/shared/ui/button";
import PlanList from "@/features/plans/components/PlanList";
import getAvatarUrl from "@/shared/utils/getAvatarUrl";

export default function Infor_component() {
  const {
    t,
    editMode,
    user,
    form,
    loading,
    showChangePassword,
    formattedDateOfBirth,
    setShowChangePassword,
    setFormattedDateOfBirth,
    fetchUser,
    handleEdit,
    handleChange,
    handleSave,
    handleCancel,
    handleAvatarUpload,
    avatarUploading,
  } = useInforComponent();
  const fileInputRef = React.useRef(null);

  const avatarUrl = React.useMemo(
    () => getAvatarUrl(user?.avatar) || "/images/avatar.jpg",
    [user?.avatar]
  );

  const handleAvatarButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarInputChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      handleAvatarUpload(file);
      event.target.value = "";
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setFormattedDateOfBirth(
        user?.dateOfBirth
          ? new Date(user.dateOfBirth).toLocaleDateString("vi-VN")
          : ""
      );
    }
  }, [user]);

  // Tính số ngày còn lại trước khi hết hạn
  const daysUntilExpiry = React.useMemo(() => {
    if (!user?.planEndDate) return null;
    const now = new Date();
    const endDate = new Date(user.planEndDate);
    if (endDate <= now) return 0; // Đã hết hạn
    const diffTime = endDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [user?.planEndDate]);

  // Kiểm tra xem có cần cảnh báo không (còn <= 3 ngày)
  const shouldShowExpiryWarning =
    daysUntilExpiry !== null && daysUntilExpiry <= 3 && daysUntilExpiry > 0;

  if (loading) {
    return (
      <div className="w-full mx-auto bg-[var(--color-surface-50)] p-8 border border-[var(--color-border)]">
        <div className="flex flex-col mb-8 items-center">
          <Skeleton circle width={112} height={112} className="mb-3" />
          <Skeleton width={120} height={28} />
          <Skeleton width={180} height={18} className="mt-2" />
        </div>
        <div className="w-full bg-white border border-[var(--color-border)] rounded-lg overflow-hidden">
          <div className="px-6 py-3 border-b border-[var(--color-border)] font-semibold text-text-strong bg-[var(--color-surface-100)]">
            {t("user_info.detail_info")}
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {Array.from({ length: 7 }).map((_, idx) => (
              <div key={idx} className="flex items-center px-6 py-3">
                <div className="w-1/3">
                  <Skeleton width={90} height={16} />
                </div>
                <div className="flex-1">
                  <Skeleton width={160} height={18} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-4 justify-center mt-6">
          <Skeleton width={120} height={40} />
          <Skeleton width={120} height={40} />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8 text-center text-danger">
        {t("user_info.cannot_load_user")}
      </div>
    );
  }

  return (
    <div className="w-full mx-auto bg-[var(--color-surface-50)] p-2 md:p-8  border border-[var(--color-border)] ">
      <div className="flex flex-col mb-8">
        <div className="relative w-28 h-28">
          <Image
            src={avatarUrl}
            alt="avatar user"
            className="w-28 h-28 rounded-full object-cover border border-[var(--color-border)]"
            width={112}
            height={112}
            placeholder="blur"
            blurDataURL="data:image/png;base64,..."
            priority
          />
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            className="hidden"
            onChange={handleAvatarInputChange}
          />
          <button
            type="button"
            onClick={handleAvatarButtonClick}
            disabled={avatarUploading}
            className="absolute bottom-0 right-0 px-3 py-1 text-xs rounded-full bg-white text-text-strong border border-[var(--color-border)] shadow-sm hover:bg-[var(--color-surface-100)] disabled:opacity-60"
          >
            {avatarUploading ? "Đang lưu..." : "Đổi ảnh"}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-text-strong">
            {user.fullName}
          </span>
        </div>
        <div className="text-text-muted text-base mt-1">{user.email}</div>
      </div>

      <div className="w-full bg-white border border-[var(--color-border)] rounded-lg overflow-hidden">
        <div className="px-6 py-3 border-b border-[var(--color-border)] font-semibold text-text-strong bg-[var(--color-surface-100)]">
          {t("user_info.detail_info")}
        </div>
        <div className="divide-y divide-[var(--color-border)]">
          <div className="flex items-center px-6 py-3">
            <div className="w-1/3 text-text-muted font-medium">
              {t("user_info.full_name")}
            </div>
            <div className="flex-1">
              {editMode ? (
                <input
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  className="border border-[var(--color-border)] rounded px-3 py-1 w-full text-text-strong bg-[var(--color-surface-50)]"
                />
              ) : (
                <span className="text-text-strong">{user.fullName}</span>
              )}
            </div>
          </div>

          <div className="flex items-center px-6 py-3">
            <div className="w-1/3 text-text-muted font-medium">
              {t("user_info.date_of_birth")}
            </div>
            <div className="flex-1">
              {editMode ? (
                <input
                  type="date"
                  name="dateOfBirth"
                  value={form.dateOfBirth}
                  onChange={handleChange}
                  className="border border-[var(--color-border)] rounded px-3 py-1 w-full text-text-strong bg-[var(--color-surface-50)]"
                />
              ) : (
                <span className="text-text-strong">{formattedDateOfBirth}</span>
              )}
            </div>
          </div>

          <div className="flex items-center px-6 py-3">
            <div className="w-1/3 text-text-muted font-medium">
              {t("user_info.phone")}
            </div>
            <div className="flex-1">
              {editMode ? (
                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="border border-[var(--color-border)] rounded px-3 py-1 w-full text-text-strong bg-[var(--color-surface-50)]"
                />
              ) : (
                <span className="text-text-strong">{user.phone}</span>
              )}
            </div>
          </div>

          <div className="flex items-center px-6 py-3">
            <div className="w-1/3 text-text-muted font-medium">
              {t("user_info.total_files")}
            </div>
            <div className="flex-1 text-text-strong">{user.totalFiles}</div>
          </div>

          <div className="flex items-center px-6 py-3">
            <div className="w-1/3 text-text-muted font-medium">
              {t("user_info.total_storage")}
            </div>
            <div className="flex-1 text-text-strong">
              {formatSize(user.maxStorage)}
            </div>
          </div>

          <div className="flex items-center px-6 py-3">
            <div className="w-1/3 text-text-muted font-medium">
              {t("user_info.used_storage")}
            </div>
            <div className="flex-1 text-text-strong">
              {formatSize(user.usedStorage)}
            </div>
          </div>

          <div className="flex items-center px-6 py-3">
            <div className="w-1/3 text-text-muted font-medium">
              {t("user_info.sub_accounts")}
            </div>
            <div className="flex-1 text-text-strong font-semibold">
              {user.maxUser ?? 0}
              <span className="ml-2 text-text-muted text-sm">
                {t("user_info.sub_accounts_note")}
              </span>
            </div>
          </div>
        </div>

        {editMode && (
          <div className="flex gap-2 justify-end px-6 py-3 bg-[var(--color-surface-100)] border-t border-[var(--color-border)]">
            <Button
              handleClick={handleCancel}
              type="button"
              disabled={loading}
              variant="outline"
              color="brand"
              children={t("user_info.cancel")}
            />
            <Button
              color="brand"
              handleClick={handleSave}
              loading={loading}
              type="button"
              disabled={loading}
              children={t("user_info.save")}
            />
          </div>
        )}
      </div>

      <div className="flex gap-4 justify-center mt-6">
        <Button
          children={t("change_password.title")}
          leftIcon={<FiKey className="text-lg" />}
          type="button"
          handleClick={() => setShowChangePassword(true)}
          color="brand"
          variant="outline"
        />
        {!editMode && (
          <Button
            type="button"
            handleClick={handleEdit}
            leftIcon={<FiEdit2 className="text-lg" />}
            children={t("user_info.edit")}
            loading={loading}
          />
        )}
      </div>

      <hr className="text-brand my-5" />

      {/* Cảnh báo hết hạn gói */}
      {shouldShowExpiryWarning && (
        <div className="mb-6 p-4 bg-warning/10 border border-warning/30 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg
                className="w-5 h-5 text-warning"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-text-strong mb-1">
                Gói của bạn sắp hết hạn
              </h3>
              <p className="text-sm text-text-muted">
                Gói hiện tại của bạn sẽ hết hạn sau{" "}
                <span className="font-semibold text-warning">
                  {daysUntilExpiry} {daysUntilExpiry === 1 ? "ngày" : "ngày"}
                </span>
                . Vui lòng gia hạn để tiếp tục sử dụng dịch vụ.
              </p>
            </div>
          </div>
        </div>
      )}

      <PlanList
        currentPlanSlug={user?.plan?.slug || ""}
        daysUntilExpiry={daysUntilExpiry}
        userRole={user?.role}
      />
      <ChangePasswordModal
        open={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
    </div>
  );
}
