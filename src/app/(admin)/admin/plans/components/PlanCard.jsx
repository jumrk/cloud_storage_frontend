"use client";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import {
  PiUsersThree,
  PiCloudArrowUp,
  PiStarFour,
  PiCoins,
} from "react-icons/pi";
import {
  PLAN_COLORS,
  STATUS_LABEL,
  formatSize,
  formatDate,
  formatPrice,
} from "../utils";
const STATUS_BADGE = {
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  inactive: "bg-rose-100 text-rose-700 border-rose-200",
  draft: "bg-slate-100 text-slate-600 border-slate-200",
};
export default function PlanCard({ plan, index, onEdit, onDelete }) {
  const accent = PLAN_COLORS[index % PLAN_COLORS.length];
  const monthlyPrice = plan.isCustom
    ? "Tùy chọn"
    : plan.priceMonth === 0
    ? "Miễn phí"
    : formatPrice(plan.priceMonth);
  const creditsValue =
    typeof plan.credis === "number" ? plan.credis.toLocaleString("vi-VN") : "0";
  const yearlyPrice = plan.isCustom
    ? "Tùy chọn"
    : plan.priceYear === 0
    ? "Miễn phí"
    : formatPrice(plan.priceYear);
  const descriptions = Array.isArray(plan.description) ? plan.description : [];
  const previewDescriptions = descriptions.slice(0, 3);
  const remainingDesc = descriptions.length - previewDescriptions.length;
  return (
    <div className="h-full rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-lg transition p-6 flex flex-col">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
            <span style={{ color: accent }}> # {plan.slug} </span>
            {plan.isCustom && (
              <span className="px-2 py-0.5 rounded-full border border-slate-200 text-slate-600">
                Custom
              </span>
            )}
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mt-1">
            {plan.name}
          </h3>
          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
            <span
              className={`px-3 py-1 rounded-full border ${
                STATUS_BADGE[plan.status] || STATUS_BADGE.draft
              }`}
            >
              {STATUS_LABEL[plan.status]}
            </span>
            {plan.featured && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                <PiStarFour /> Gói nổi bật
              </span>
            )}
            {plan.sale > 0 && !plan.isCustom && (
              <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-100">
                Giảm {plan.sale}%
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(plan)}
            className="p-2 rounded-full text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
            title="Chỉnh sửa"
          >
            <FiEdit2 />
          </button>
          <button
            onClick={() => onDelete(plan._id)}
            className="p-2 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
            title="Xoá"
          >
            <FiTrash2 />
          </button>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <PriceBadge label="Theo tháng" value={monthlyPrice} accent={accent} />
        <PriceBadge
          label="Theo năm"
          value={yearlyPrice}
          accent={accent}
          secondary
        />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <PiUsersThree className="text-slate-400 text-lg" />
          <div>
            <p className="text-xs uppercase text-slate-400">Người dùng</p>
            <p className="font-semibold">
              {plan.isCustom ? "Tuỳ chọn" : `${plan.users} người`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PiCloudArrowUp className="text-slate-400 text-lg" />
          <div>
            <p className="text-xs uppercase text-slate-400">Dung lượng</p>
            <p className="font-semibold">
              {plan.isCustom
                ? "Tuỳ chọn"
                : plan.storage
                ? formatSize(plan.storage)
                : "—"}
            </p>
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
        <PiCoins className="text-slate-400 text-lg" />
        <div>
          <p className="text-xs uppercase text-slate-400">Tín dụng</p>
          <p className="font-semibold">{creditsValue} credis</p>
        </div>
      </div>
      <div className="mt-4 flex-1">
        <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">
          Tính năng chính
        </p>
        {previewDescriptions.length === 0 ? (
          <p className="text-sm text-slate-500">Chưa có mô tả cho gói này.</p>
        ) : (
          <ul className="space-y-2 text-sm text-slate-600">
            {previewDescriptions.map((desc, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span
                  className="mt-1 h-1.5 w-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: accent }}
                />
                <span>{desc}</span>
              </li>
            ))}
          </ul>
        )}
        {remainingDesc > 0 && (
          <p className="text-xs text-slate-500 mt-2">
            +{remainingDesc} mô tả khác
          </p>
        )}
      </div>
      <div className="pt-4 mt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>Ngày tạo: {formatDate(plan.createdAt)}</span>
        <span>ID: {plan._id}</span>
      </div>
    </div>
  );
}
function PriceBadge({ label, value, accent, secondary }) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 ${
        secondary
          ? "bg-slate-50 border-slate-200"
          : "bg-gradient-to-br from-white to-slate-50 border-slate-100"
      }`}
    >
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p
        className="text-lg font-semibold text-slate-900"
        style={{ color: value === "Miễn phí" ? accent : undefined }}
      >
        {value}
      </p>
    </div>
  );
}
