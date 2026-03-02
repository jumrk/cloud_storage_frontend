"use client";
import { FaUserPlus } from "react-icons/fa";
import {
  IoBarChartOutline,
  IoCalendarOutline,
  IoPersonOutline,
  IoChevronDown,
  IoClose,
  IoFilter,
} from "react-icons/io5";
import ModalShareBoard from "./modals/ModalShareBoard";
import useShareBoard from "../../hooks/useShareBoard";
import { useEffect, useState, useRef, useCallback } from "react";
import { IoMdArrowRoundBack } from "react-icons/io";
import { useRouter, useParams } from "next/navigation";
import {
  useBoardContext,
  FILTER_PERIOD_ALL,
  FILTER_PERIOD_DAY,
  FILTER_PERIOD_WEEK,
  FILTER_PERIOD_MONTH,
  FILTER_PERIOD_YEAR,
} from "./context/BoardContext";
import { useTranslations } from "next-intl";
import boardService from "../../services/boardService";
import { createPortal } from "react-dom";
import getAvatarUrl from "@/shared/utils/getAvatarUrl";

const PERIOD_LABELS = {
  [FILTER_PERIOD_ALL]: "Tất cả",
  [FILTER_PERIOD_DAY]: "Hôm nay",
  [FILTER_PERIOD_WEEK]: "Tuần này",
  [FILTER_PERIOD_MONTH]: "Tháng này",
  [FILTER_PERIOD_YEAR]: "Năm nay",
};

const PERIOD_OPTIONS = [
  FILTER_PERIOD_ALL,
  FILTER_PERIOD_DAY,
  FILTER_PERIOD_WEEK,
  FILTER_PERIOD_MONTH,
  FILTER_PERIOD_YEAR,
];

function FilterDropdown({
  open,
  onClose,
  triggerRect,
  width = 220,
  children,
  className = "",
}) {
  useEffect(() => {
    if (!open) return;
    const onEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;
  const top = (triggerRect?.bottom ?? 0) + 6;
  const left = triggerRect?.left ?? 0;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[45]"
        onClick={onClose}
        aria-hidden
      />
      <div
        className={`fixed z-[50] rounded-xl border border-gray-200 bg-white shadow-xl py-1.5 min-w-[180px] max-h-[320px] overflow-hidden flex flex-col ${className}`}
        style={{
          top: `${top}px`,
          left: `${left}px`,
          width: `${width}px`,
        }}
      >
        {children}
      </div>
    </>,
    document.body
  );
}

export default function HeaderDetailBoard() {
  const {
    boardId,
    filterPeriod,
    filterMemberId,
    setFilterPeriod,
    setFilterMemberId,
  } = useBoardContext();
  const t = useTranslations();
  const [periodOpen, setPeriodOpen] = useState(false);
  const [memberOpen, setMemberOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const periodBtnRef = useRef(null);
  const memberBtnRef = useRef(null);
  const [periodRect, setPeriodRect] = useState({});
  const [memberRect, setMemberRect] = useState({});

  const {
    members,
    link,
    open,
    title,
    copyLink,
    genLink,
    loading,
    handelAddMember,
    handleRemoveMember,
    setOpen,
    FetchMember,
  } = useShareBoard(boardId);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    FetchMember();
    checkOwner();
  }, [boardId]);

  const checkOwner = async () => {
    try {
      const res = await boardService().getBoardById(boardId);
      if (res.data?.success && res.data.data?.isOwner !== undefined) {
        setIsOwner(Boolean(res.data.data.isOwner));
      }
    } catch (error) {
      console.error("Error checking owner:", error);
    }
  };

  const updatePeriodRect = useCallback(() => {
    if (periodBtnRef.current) {
      setPeriodRect(periodBtnRef.current.getBoundingClientRect());
    }
  }, []);
  const updateMemberRect = useCallback(() => {
    if (memberBtnRef.current) {
      setMemberRect(memberBtnRef.current.getBoundingClientRect());
    }
  }, []);

  const openPeriod = () => {
    setPeriodOpen(true);
    setMemberOpen(false);
    setTimeout(updatePeriodRect, 0);
  };
  const openMember = () => {
    setMemberOpen(true);
    setPeriodOpen(false);
    setMemberSearch("");
    setTimeout(updateMemberRect, 0);
  };

  const router = useRouter();
  const params = useParams();
  const slast = params?.slast;

  const selectedMember = members.find((m) => m.id === filterMemberId);
  const hasActiveFilters =
    filterPeriod !== FILTER_PERIOD_ALL || filterMemberId != null;

  const clearAllFilters = () => {
    setFilterPeriod(FILTER_PERIOD_ALL);
    setFilterMemberId(null);
    setPeriodOpen(false);
    setMemberOpen(false);
  };

  const filteredMembers = memberSearch.trim()
    ? members.filter((m) => {
        const q = memberSearch.trim().toLowerCase();
        return (
          (m.name || "").toLowerCase().includes(q) ||
          (m.email || "").toLowerCase().includes(q)
        );
      })
    : members;

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex justify-between w-full min-h-[60px] items-center flex-wrap gap-3">
        <button
          onClick={() => router.back()}
          className="flex gap-1.5 p-2 rounded-xl border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition shrink-0"
          aria-label={t("job_management.board.back")}
        >
          <IoMdArrowRoundBack size={20} />
        </button>

        {/* Bộ lọc */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-gray-500">
            <IoFilter size={18} className="shrink-0" />
            <span className="text-sm font-medium hidden sm:inline">Bộ lọc</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <button
                ref={periodBtnRef}
                type="button"
                onClick={openPeriod}
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                  filterPeriod !== FILTER_PERIOD_ALL
                    ? "border-brand-300 bg-brand-50 text-brand-700"
                    : "border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <IoCalendarOutline size={18} className="shrink-0" />
                <span>{PERIOD_LABELS[filterPeriod] || "Tất cả"}</span>
                <IoChevronDown
                  size={16}
                  className={`shrink-0 transition-transform ${periodOpen ? "rotate-180" : ""}`}
                />
              </button>
              <FilterDropdown
                open={periodOpen}
                onClose={() => setPeriodOpen(false)}
                triggerRect={periodRect}
                width={200}
              >
                <div className="overflow-y-auto max-h-[280px]">
                  {PERIOD_OPTIONS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setFilterPeriod(p);
                        setPeriodOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 text-sm flex items-center gap-2 ${
                        filterPeriod === p
                          ? "bg-brand-50 text-brand-700 font-medium"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <IoCalendarOutline
                        size={16}
                        className={filterPeriod === p ? "text-brand-500" : "text-gray-400"}
                      />
                      {PERIOD_LABELS[p]}
                    </button>
                  ))}
                </div>
              </FilterDropdown>
            </div>

            <div className="relative">
              <button
                ref={memberBtnRef}
                type="button"
                onClick={openMember}
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition min-w-[140px] ${
                  filterMemberId
                    ? "border-brand-300 bg-brand-50 text-brand-700"
                    : "border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {selectedMember?.avatar ? (
                  <img
                    src={getAvatarUrl(selectedMember.avatar)}
                    alt=""
                    className="w-5 h-5 rounded-full object-cover shrink-0"
                  />
                ) : selectedMember ? (
                  <span className="w-5 h-5 rounded-full bg-brand-200 text-brand-700 flex items-center justify-center text-xs font-semibold shrink-0">
                    {(selectedMember.name || "U").slice(0, 1).toUpperCase()}
                  </span>
                ) : (
                  <IoPersonOutline size={18} className="shrink-0" />
                )}
                <span className="truncate flex-1 text-left">
                  {selectedMember
                    ? selectedMember.name || selectedMember.email
                    : "Tất cả thành viên"}
                </span>
                <IoChevronDown
                  size={16}
                  className={`shrink-0 transition-transform ${memberOpen ? "rotate-180" : ""}`}
                />
              </button>
              <FilterDropdown
                open={memberOpen}
                onClose={() => setMemberOpen(false)}
                triggerRect={memberRect}
                width={280}
              >
                <div className="px-2 pb-2 border-b border-gray-100">
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Tìm theo tên hoặc email..."
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-300"
                  />
                </div>
                <div className="overflow-y-auto max-h-[240px] py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setFilterMemberId(null);
                      setMemberOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 text-sm flex items-center gap-3 ${
                      !filterMemberId
                        ? "bg-brand-50 text-brand-700 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                      <IoPersonOutline size={16} />
                    </span>
                    <span>Tất cả thành viên</span>
                  </button>
                  {filteredMembers.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setFilterMemberId(m.id);
                        setMemberOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 text-sm flex items-center gap-3 ${
                        filterMemberId === m.id
                          ? "bg-brand-50 text-brand-700 font-medium"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {m.avatar ? (
                        <img
                          src={getAvatarUrl(m.avatar)}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <span className="w-8 h-8 rounded-full bg-brand-200 text-brand-700 flex items-center justify-center text-sm font-semibold shrink-0">
                          {(m.name || "U").slice(0, 1).toUpperCase()}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <span className="block truncate font-medium">
                          {m.name || m.email || m.id}
                        </span>
                        {m.email && (
                          <span className="block text-xs text-gray-500 truncate">
                            {m.email}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                  {filteredMembers.length === 0 && (
                    <div className="px-3 py-4 text-center text-sm text-gray-500">
                      Không tìm thấy thành viên
                    </div>
                  )}
                </div>
              </FilterDropdown>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition"
              >
                <IoClose size={14} />
                Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        {/* Right: title, report, share */}
        <div className="flex gap-2 justify-end items-center flex-wrap">
          <p className="box-content px-4 py-2 rounded-2xl border border-gray-200 bg-gray-50/80 text-gray-900 font-medium text-sm">
            {title}
          </p>
          {isOwner && (
            <button
              onClick={() => {
                const reportPath = slast
                  ? `/${slast}/job-management/workspace/board/${boardId}/report`
                  : `/job-management/workspace/board/${boardId}/report`;
                router.push(reportPath);
              }}
              className="flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-white hover:border-gray-300 transition"
              title="Báo cáo tổng kết (chỉ chủ board)"
            >
              <IoBarChartOutline size={18} />
              <span>Báo cáo</span>
            </button>
          )}
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 rounded-2xl border-2 border-brand-500 px-4 py-2 text-sm font-medium text-brand-600 bg-brand-50 hover:bg-brand-500 hover:text-white transition"
          >
            <span>Chia sẻ</span>
            <FaUserPlus size={18} />
          </button>
        </div>
      </div>

      {/* Filter chips: hiển thị khi có lọc */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {filterPeriod !== FILTER_PERIOD_ALL && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 text-brand-800 px-3 py-1.5 text-sm font-medium">
              <IoCalendarOutline size={14} />
              {PERIOD_LABELS[filterPeriod]}
              <button
                type="button"
                onClick={() => setFilterPeriod(FILTER_PERIOD_ALL)}
                className="p-0.5 rounded-full hover:bg-brand-200/50 transition"
                aria-label="Bỏ lọc thời gian"
              >
                <IoClose size={14} />
              </button>
            </span>
          )}
          {selectedMember && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 text-brand-800 px-3 py-1.5 text-sm font-medium">
              {selectedMember.avatar ? (
                <img
                  src={getAvatarUrl(selectedMember.avatar)}
                  alt=""
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : (
                <span className="w-5 h-5 rounded-full bg-brand-200 text-brand-700 flex items-center justify-center text-xs font-semibold">
                  {(selectedMember.name || "U").slice(0, 1).toUpperCase()}
                </span>
              )}
              <span className="truncate max-w-[140px]">
                {selectedMember.name || selectedMember.email}
              </span>
              <button
                type="button"
                onClick={() => setFilterMemberId(null)}
                className="p-0.5 rounded-full hover:bg-brand-200/50 transition"
                aria-label="Bỏ lọc thành viên"
              >
                <IoClose size={14} />
              </button>
            </span>
          )}
        </div>
      )}

      <ModalShareBoard
        loading={loading}
        open={open}
        onClose={() => setOpen(false)}
        members={members}
        onAdd={handelAddMember}
        onRemove={handleRemoveMember}
        link={link}
        onGenLink={genLink}
        onCopy={copyLink}
      />
    </div>
  );
}
