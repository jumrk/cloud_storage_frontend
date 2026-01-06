"use client";
import React, { useState, useEffect, useMemo } from "react";
import { FiUser, FiUsers } from "react-icons/fi";
import { useTranslations } from "next-intl";
import ProfileTab from "./ProfileTab";
import MemberManagement from "./MemberManagement";
import inforUserService from "../services/inforUserService";

export default function AccountSettings() {
  const t = useTranslations();
  const [activeTab, setActiveTab] = useState("profile");
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const { getInforUser } = useMemo(() => inforUserService(), []);

  useEffect(() => {
    // Get user role from API using axiosClient
    const fetchUserRole = async () => {
      try {
        const res = await getInforUser();
        const data = res.data;
        setUserRole(data?.role || null);
      } catch (error) {
        console.error("Error fetching user role:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserRole();
  }, [getInforUser]);

  const isLeader = userRole === "leader";

  return (
    <div className="w-full px-4 py-4 h-full overflow-y-auto">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-base font-semibold text-gray-900 mb-1">
          {t("pages.account_settings.title")}
        </h1>
        <p className="text-xs text-gray-600">
          {t("pages.account_settings.subtitle")}
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-4">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab("profile")}
            className={`pb-2 px-1 border-b-2 transition text-sm ${
              activeTab === "profile"
                ? "border-brand-500 text-brand-600 font-medium"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <FiUser className="inline mr-1.5 text-xs" />
            {t("pages.account_settings.tabs.profile")}
          </button>
          {isLeader && (
            <button
              onClick={() => setActiveTab("member_management")}
              className={`pb-2 px-1 border-b-2 transition text-sm ${
                activeTab === "member_management"
                  ? "border-brand-500 text-brand-600 font-medium"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <FiUsers className="inline mr-1.5 text-xs" />
              {t("pages.account_settings.tabs.member_management")}
            </button>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "profile" ? (
          <ProfileTab />
        ) : activeTab === "member_management" && isLeader ? (
          <MemberManagement />
        ) : null}
      </div>
    </div>
  );
}
