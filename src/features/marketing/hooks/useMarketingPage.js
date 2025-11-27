"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "react-hot-toast";

export default function useMarketingPage() {
  const t = useTranslations();
  const searchParams = useSearchParams();

  // Show toast if redirected from mobile blocked page
  useEffect(() => {
    const mobileBlocked = searchParams.get("mobile_blocked");
    if (mobileBlocked === "video") {
      toast.error(
        "Trình xử lý video chỉ hỗ trợ trên máy tính. Vui lòng sử dụng thiết bị có màn hình lớn hơn.",
        { duration: 5000 }
      );
      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams]);

  return {
    t,
  };
}
