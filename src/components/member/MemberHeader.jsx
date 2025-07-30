"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiUser } from "react-icons/fi";
import { IoIosLogOut } from "react-icons/io";
import axiosClient from "@/lib/axiosClient";
import { useTranslations } from "next-intl";

export default function MemberHeader() {
  const [email, setEmail] = useState("");
  const router = useRouter();
  const t = useTranslations();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setEmail(payload.email || "");
      } catch {}
    }
  }, []);

  const handleLogout = async () => {
    try {
      await axiosClient.post("/api/auth/logout");
    } catch {}
    localStorage.removeItem("token");
    localStorage.clear();
    router.push("/Login");
  };

  return (
    <header className="w-full flex items-center justify-between px-6 py-3 bg-white rounded-2xl shadow-lg mb-6 mt-2 border border-gray-100">
      <div className="flex items-center gap-3">
        <img src="/images/Logo_2.png" className="w-30" alt="Logo" />
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
          <FiUser className="text-primary" />
          <span className="text-gray-800 font-medium text-sm">{email}</span>
        </div>
        <button onClick={handleLogout} title={t("member.header.logout")}>
          <IoIosLogOut className="cursor-pointer text-2xl" />
        </button>
      </div>
    </header>
  );
}
