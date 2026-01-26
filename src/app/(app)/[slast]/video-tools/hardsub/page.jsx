"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import HardsubPage from "./components/HardsubPage";
import { decodeTokenGetUser } from "@/shared/lib/jwt";
import { hasVideoToolsAccess } from "@/shared/utils/videoToolsAccess";
import axiosClient from "@/shared/lib/axiosClient";

function page() {
  const router = useRouter();
  const [hasAccess, setHasAccess] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        // ✅ Check access via API call (cookie sent automatically)
        const res = await axiosClient.get("/api/user");
        if (!res.data) {
          router.push("/login");
          return;
        }

        if (hasVideoToolsAccess(res.data)) {
          setHasAccess(true);
          setIsChecking(false);
          return;
        }

        // Try to get full user data from API
        try {
          const res = await axiosClient.get("/api/user");
          if (res?.data && hasVideoToolsAccess(res.data)) {
            setHasAccess(true);
            setIsChecking(false);
            return;
          }
        } catch (err) {
          // Ignore API error, use token data
        }

        // No access - redirect to home
        router.push("/");
      } catch (err) {
        console.error("Error checking video tools access:", err);
        router.push("/");
      } finally {
        setIsChecking(false);
      }
    };

    checkAccess();
  }, [router]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">Đang kiểm tra quyền truy cập...</div>
      </div>
    );
  }

  if (!hasAccess) {
    return null; // Will redirect
  }

  return <HardsubPage />;
}

export default page;

