"use client";

import React, { Suspense } from "react";
import MemberFileManager from "./components/MemberFileManager";

function FileManagementLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-[var(--color-brand-500)] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-[var(--color-text-muted)]">Đang tải...</p>
      </div>
    </div>
  );
}

export default function FileManagementPage() {
  return (
    <Suspense fallback={<FileManagementLoading />}>
      <MemberFileManager />
    </Suspense>
  );
}
