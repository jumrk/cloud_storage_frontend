"use client";
import React, { useEffect, useState, useMemo } from "react";
import Button from "@/shared/ui/button";
import getAvatarUrl from "@/shared/utils/getAvatarUrl";
import inforUserService from "../services/inforUserService";
import ChangePasswordModal from "./ChangePasswordModal";
import UpdateFieldModal from "./UpdateFieldModal";
import UpdateAvatarModal from "./UpdateAvatarModal";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function ProfileTab() {
  const t = useTranslations();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [showUpdateName, setShowUpdateName] = useState(false);
  const [showUpdatePhone, setShowUpdatePhone] = useState(false);
  const [showUpdateDateOfBirth, setShowUpdateDateOfBirth] = useState(false);
  const [showUpdateAvatar, setShowUpdateAvatar] = useState(false);

  // Initialize service with useMemo to prevent hook order changes
  const { getInforUser, editInforUser, uploadAvatar } = useMemo(
    () => inforUserService(),
    [],
  );

  const fetchUser = async () => {
    try {
      setLoading(true);
      const res = await getInforUser();
      const data = res.data;
      setUser(data);
    } catch (error) {
      console.error("Fetch user error:", error);
      toast.error(t("pages.account_settings.profile.cannot_load_user"));
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // All hooks must be called before any early returns
  const avatarUrl = useMemo(
    () => getAvatarUrl(user?.avatar) || "/images/avatar.jpg",
    [user?.avatar],
  );

  // Tính số ngày còn lại trước khi hết hạn
  const daysUntilExpiry = useMemo(() => {
    if (!user?.planEndDate) return null;
    const now = new Date();
    const endDate = new Date(user.planEndDate);
    if (endDate <= now) return 0;
    const diffTime = endDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [user?.planEndDate]);

  const handleUpdateName = async (newName) => {
    try {
      setLoading(true);
      // Gửi cả dữ liệu hiện tại để đảm bảo không mất field khác
      const res = await editInforUser({
        fullName: newName,
        phone: user?.phone || "",
        dateOfBirth: user?.dateOfBirth || "",
      });
      const data = res.data;
      if (data.success) {
        setUser((prev) => ({ ...prev, fullName: newName }));
        toast.success(t("pages.account_settings.profile.update_success"));
        // Refresh user data để đảm bảo sync với backend
        await fetchUser();
      } else {
        throw new Error(
          data.error || t("pages.account_settings.profile.update_failed"),
        );
      }
    } catch (error) {
      console.error("Update name error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePhone = async (newPhone) => {
    try {
      setLoading(true);
      // Gửi cả dữ liệu hiện tại để đảm bảo không mất field khác
      const res = await editInforUser({
        fullName: user?.fullName || "",
        phone: newPhone,
        dateOfBirth: user?.dateOfBirth || "",
      });
      const data = res.data;
      if (data.success) {
        setUser((prev) => ({ ...prev, phone: newPhone }));
        toast.success(t("pages.account_settings.profile.update_success"));
        // Refresh user data để đảm bảo sync với backend
        await fetchUser();
      } else {
        throw new Error(
          data.error || t("pages.account_settings.profile.update_failed"),
        );
      }
    } catch (error) {
      console.error("Update phone error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDateOfBirth = async (newDate) => {
    try {
      setLoading(true);
      // Gửi cả dữ liệu hiện tại để đảm bảo không mất field khác
      const res = await editInforUser({
        fullName: user?.fullName || "",
        phone: user?.phone || "",
        dateOfBirth: newDate,
      });
      const data = res.data;
      if (data.success) {
        setUser((prev) => ({ ...prev, dateOfBirth: newDate }));
        toast.success(t("pages.account_settings.profile.update_success"));
        // Refresh user data để đảm bảo sync với backend
        await fetchUser();
      } else {
        throw new Error(
          data.error || t("pages.account_settings.profile.update_failed"),
        );
      }
    } catch (error) {
      console.error("Update date of birth error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("avatar", file);
    setAvatarUploading(true);
    try {
      const res = await uploadAvatar(formData);
      const data = res.data;
      if (data?.success) {
        setUser((prev) => ({
          ...prev,
          avatar: data.avatar,
        }));
        toast.success(
          t("pages.account_settings.profile.avatar_update_success"),
        );
      } else {
        throw new Error(
          data?.error ||
            t("pages.account_settings.profile.avatar_update_failed"),
        );
      }
    } catch (error) {
      console.error("Upload avatar error:", error);
      throw error;
    } finally {
      setAvatarUploading(false);
    }
  };

  // Format date of birth for display
  const formattedDateOfBirth = useMemo(() => {
    if (!user?.dateOfBirth) return t("pages.account_settings.profile.no_value");
    try {
      return new Date(user.dateOfBirth).toLocaleDateString("vi-VN");
    } catch {
      return user.dateOfBirth;
    }
  }, [user?.dateOfBirth, t]);

  if (loading && !user) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8 text-center text-red-600">
        {t("pages.account_settings.profile.cannot_load_user")}
      </div>
    );
  }

  return (
    <div className="space-y-3 overflow-y-auto custom-scrollbar">
      {/* Avatar */}
      <div className="bg-white p-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-full overflow-hidden border border-gray-200">
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-0.5">
                {t("pages.account_settings.profile.profile_picture")}
              </h3>
              <p className="text-xs text-gray-600">
                {user.fullName || user.email}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            color="brand"
            className="rounded-sm whitespace-nowrap"
            handleClick={() => setShowUpdateAvatar(true)}
          >
            {t("pages.account_settings.profile.update")}
          </Button>
        </div>
      </div>

      {/* E-Mail Address */}
      <div className="bg-white p-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-0.5">
              {t("pages.account_settings.profile.email_address")}
            </h3>
            <p className="text-xs text-gray-600">{user.email}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              color="brand"
              className="rounded-sm whitespace-nowrap"
              handleClick={() => setShowChangePassword(true)}
            >
              {t("pages.account_settings.profile.change_password")}
            </Button>
          </div>
        </div>
      </div>

      {/* Given Name */}
      <div className="bg-white p-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-900 mb-0.5">
              {t("pages.account_settings.profile.given_name")}
            </h3>
            <p className="text-xs text-gray-600">
              {user.fullName || t("pages.account_settings.profile.no_value")}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            color="brand"
            className="rounded-sm whitespace-nowrap"
            handleClick={() => setShowUpdateName(true)}
          >
            {t("pages.account_settings.profile.update_given_name")}
          </Button>
        </div>
      </div>

      {/* Phone Number */}
      <div className="bg-white p-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-900 mb-0.5">
              {t("pages.account_settings.profile.phone")}
            </h3>
            <p className="text-xs text-gray-600">
              {user.phone || t("pages.account_settings.profile.no_value")}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            color="brand"
            className="rounded-sm whitespace-nowrap"
            handleClick={() => setShowUpdatePhone(true)}
          >
            {t("pages.account_settings.profile.update")}
          </Button>
        </div>
      </div>

      {/* Date of Birth */}
      <div className="bg-white p-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-900 mb-0.5">
              {t("pages.account_settings.profile.date_of_birth")}
            </h3>
            <p className="text-xs text-gray-600">{formattedDateOfBirth}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            color="brand"
            className="rounded-sm whitespace-nowrap"
            handleClick={() => setShowUpdateDateOfBirth(true)}
          >
            {t("pages.account_settings.profile.update")}
          </Button>
        </div>
      </div>

      {/* Current Plan */}
      <div className="bg-white p-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-0.5">
              {t("pages.account_settings.profile.current_plan")}
            </h3>
            <p className="text-xs text-gray-600 capitalize">
              {user?.plan?.name || "Free"}
            </p>
            {daysUntilExpiry !== null && daysUntilExpiry <= 3 && (
              <p className="text-xs text-warning mt-0.5">
                {t("pages.account_settings.profile.days_until_expiry", {
                  days: daysUntilExpiry,
                })}
              </p>
            )}
          </div>
          <Link href={`/${user.slast}/subscription`}>
            <Button
              variant="outline"
              size="sm"
              className="rounded-sm whitespace-nowrap"
              color="brand"
            >
              {t("pages.account_settings.profile.manage_subscription")}
            </Button>
          </Link>
        </div>
      </div>

      {/* Application language */}
      <div className="bg-white p-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-0.5">
              {t("pages.account_settings.profile.application_language")}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xl">🇺🇸</span>
              <span className="text-xs text-gray-900 font-medium">English</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ChangePasswordModal
        open={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />

      <UpdateFieldModal
        open={showUpdateName}
        onClose={() => setShowUpdateName(false)}
        title={t("pages.account_settings.profile.update_given_name_title")}
        description={t("pages.account_settings.profile.update_given_name_desc")}
        label={t("pages.account_settings.profile.update_given_name_label")}
        value={user?.fullName || ""}
        type="text"
        onSubmit={handleUpdateName}
        loading={loading}
        placeholder={t(
          "pages.account_settings.profile.update_given_name_label",
        )}
      />

      <UpdateFieldModal
        open={showUpdatePhone}
        onClose={() => setShowUpdatePhone(false)}
        title={t("pages.account_settings.profile.update_phone_title")}
        description={t("pages.account_settings.profile.update_phone_desc")}
        label={t("pages.account_settings.profile.update_phone_label")}
        value={user?.phone || ""}
        type="tel"
        onSubmit={handleUpdatePhone}
        loading={loading}
        placeholder={t("pages.account_settings.profile.update_phone_label")}
      />

      <UpdateFieldModal
        open={showUpdateDateOfBirth}
        onClose={() => setShowUpdateDateOfBirth(false)}
        title={t("pages.account_settings.profile.update_date_of_birth_title")}
        description={t(
          "pages.account_settings.profile.update_date_of_birth_desc",
        )}
        label={t("pages.account_settings.profile.update_date_of_birth_label")}
        value={user?.dateOfBirth ? user.dateOfBirth.slice(0, 10) : ""}
        type="date"
        onSubmit={handleUpdateDateOfBirth}
        loading={loading}
      />

      <UpdateAvatarModal
        open={showUpdateAvatar}
        onClose={() => setShowUpdateAvatar(false)}
        currentAvatar={avatarUrl}
        onSubmit={handleAvatarUpload}
        loading={avatarUploading}
      />
    </div>
  );
}
