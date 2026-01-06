"use client";

import React from "react";
import { IoCheckmarkCircle, IoPause } from "react-icons/io5";

export default function StatusBadge({ status, t }) {
  switch (status) {
    case "active":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-100 text-green-700 text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
          {t("working")}
        </span>
      );
    case "paused":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-yellow-100 text-yellow-700 text-xs font-medium">
          <IoPause size={12} />
          {t("paused")}
        </span>
      );
    case "completed":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-100 text-blue-700 text-xs font-medium">
          <IoCheckmarkCircle size={12} />
          {t("completed")}
        </span>
      );
    default:
      return null;
  }
}

