"use client";
import React, { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FiCheckCircle, FiXCircle } from "react-icons/fi";

function ResultContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success") === "true";
  const orderId = searchParams.get("orderId");
  const vnpayTxnNo = searchParams.get("vnpayTxnNo");
  const code = searchParams.get("code");
  const message = searchParams.get("message");

  return (
    <div className="min-h-screen bg-[var(--color-surface-soft)] py-20 px-4 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-card border border-[var(--color-border)] p-8 text-center space-y-6">
        <div className="flex justify-center">
          {success ? (
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <FiCheckCircle className="w-10 h-10" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center text-red-600">
              <FiXCircle className="w-10 h-10" />
            </div>
          )}
        </div>

        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-strong)] mb-2">
            {success ? "Thanh toán thành công!" : "Thanh toán thất bại"}
          </h1>
          <p className="text-[var(--color-text-muted)]">
            {success
              ? "Cảm ơn bạn đã sử dụng dịch vụ. Gói của bạn sẽ được kích hoạt ngay lập tức."
              : message || "Giao dịch không thành công hoặc đã bị hủy."}
          </p>
        </div>

        <div className="bg-[var(--color-surface-50)] rounded-xl p-4 space-y-2 text-sm text-[var(--color-text-muted)] text-left">
          <div className="flex justify-between">
            <span>Mã đơn hàng:</span>
            <span className="font-medium text-[var(--color-text-strong)]">
              {orderId || "—"}
            </span>
          </div>
          {success && (
            <div className="flex justify-between">
              <span>Mã giao dịch VNPay:</span>
              <span className="font-medium text-[var(--color-text-strong)]">
                {vnpayTxnNo || "—"}
              </span>
            </div>
          )}
          {!success && code && (
            <div className="flex justify-between">
              <span>Mã lỗi:</span>
              <span className="font-medium text-red-500">{code}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/admin"
            className="w-full rounded-2xl bg-[var(--color-brand-500)] text-white font-semibold py-3 hover:bg-[var(--color-brand-600)] transition"
          >
            Quay về trang quản trị
          </Link>
          <Link
            href="/pricing"
            className="w-full rounded-2xl border border-[var(--color-border)] text-[var(--color-text-strong)] font-semibold py-3 hover:bg-[var(--color-surface-soft)] transition"
          >
            Xem bảng giá
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PricingResultPage() {
  return (
    <Suspense fallback={<div className="min-h-screen">Loading...</div>}>
      <ResultContent />
    </Suspense>
  );
}
