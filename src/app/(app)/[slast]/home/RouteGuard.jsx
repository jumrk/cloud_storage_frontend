"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserRole } from "@/shared/hooks/useUserRole";
import { useParams } from "next/navigation";

/**
 * Route Guard Component
 * Protects /home route from member access
 * Redirects member to /file-management
 */
export default function HomeRouteGuard({ children }) {
  const router = useRouter();
  const params = useParams();
  const { isMember, isLoading } = useUserRole();

  useEffect(() => {
    // Wait for user role to load
    if (isLoading) return;

    // If user is member, redirect to file-management
    if (isMember) {
      const slast = params?.slast;
      const redirectPath = slast 
        ? `/${slast}/file-management` 
        : "/file-management";
      router.replace(redirectPath);
    }
  }, [isMember, isLoading, router, params]);

  // Show nothing while loading or redirecting
  if (isLoading || isMember) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[var(--color-brand-500)] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[var(--color-text-muted)]">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Only render children if user is leader
  return <>{children}</>;
}

