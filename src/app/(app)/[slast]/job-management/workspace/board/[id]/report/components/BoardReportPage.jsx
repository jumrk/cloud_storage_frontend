"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import timeTrackingService from "../../../../services/timeTrackingService";
import { IoArrowBack, IoCalendarOutline, IoChevronDown } from "react-icons/io5";
import toast from "react-hot-toast";
import Popover from "@/shared/ui/Popover";
import { createPortal } from "react-dom";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import * as XLSX from "xlsx";

export default function BoardReportPage({ boardId }) {
  const router = useRouter();
  const t = useTranslations();
  const service = useMemo(() => timeTrackingService(), []);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [dateMode, setDateMode] = useState("month"); // month | custom
  const today = useMemo(() => new Date(), []);
  const defaultStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d;
  }, []);
  const formatDateInput = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toISOString().split("T")[0];
  };
  const [customStartDate, setCustomStartDate] = useState(
    formatDateInput(defaultStart)
  );
  const [customEndDate, setCustomEndDate] = useState(formatDateInput(today));
  const [selectedEntities, setSelectedEntities] = useState([]);
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const [filterType, setFilterType] = useState("members"); // "members" or "tasks"
  const [hoveredCell, setHoveredCell] = useState(null);
  const hoverTimeoutRef = useRef(null);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });
  const entityOptions = useMemo(
    () =>
      (data?.rows || []).map((row) => ({
        value: String(row.id),
        label: row.name,
      })),
    [data]
  );

  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: `Tháng ${i + 1}`,
  }));

  const yearOptions = Array.from({ length: 11 }, (_, i) => {
    const year = new Date().getFullYear() - 5 + i;
    return { value: year, label: `${year}` };
  });

  const filterOptions = [
    { value: "members", label: "Thành viên" },
    { value: "tasks", label: "Công việc" },
  ];

  function SelectField({ label, value, options, onSelect }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
      const handler = (e) => {
        if (ref.current && !ref.current.contains(e.target)) {
          setOpen(false);
        }
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, []);

    const selected = options.find((opt) => opt.value === value);

    return (
      <div className="relative flex flex-col gap-1 custom-scrollbar " ref={ref}>
        <label className="text-sm font-medium text-text-strong">{label}</label>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="inline-flex w-40 items-center justify-between rounded-xl border border-border bg-white px-4 py-2 text-sm font-medium text-text-strong shadow-sm transition hover:border-brand-300 hover:bg-surface-50 focus:outline-none focus:ring-2 focus:ring-brand-200"
        >
          <span>{selected?.label}</span>
          <IoChevronDown className={`transition ${open ? "rotate-180" : ""}`} />
        </button>
        <Popover
          open={open}
          className="left-0 top-full mt-2 w-40 max-h-56 overflow-y-auto scrollbar-hide rounded-xl bg-white p-0"
        >
          <ul className="py-1 text-sm text-text-strong">
            {options.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(option.value);
                    setOpen(false);
                  }}
                  className={`w-full px-4 py-2 text-left transition ${
                    option.value === value
                      ? "bg-brand-50 text-brand-600 font-semibold"
                      : "hover:bg-surface-50"
                  }`}
                >
                  {option.label}
                </button>
              </li>
            ))}
          </ul>
        </Popover>
      </div>
    );
  }

  function MultiSelectField({
    label,
    options,
    selectedValues,
    onChange,
    placeholder = "Chọn...",
  }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
      const handler = (e) => {
        if (ref.current && !ref.current.contains(e.target)) {
          setOpen(false);
        }
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, []);

    const toggleValue = (value) => {
      if (selectedValues.includes(value)) {
        onChange(selectedValues.filter((v) => v !== value));
      } else {
        onChange([...selectedValues, value]);
      }
    };

    const summary =
      selectedValues.length === 0
        ? placeholder
        : `${selectedValues.length} đã chọn`;

    return (
      <div className="relative flex flex-col gap-1 min-w-[200px]" ref={ref}>
        <label className="text-sm font-medium text-text-strong">{label}</label>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="inline-flex items-center justify-between rounded-xl border border-border bg-white px-4 py-2 text-sm font-medium text-text-strong shadow-sm transition hover:border-brand-300 hover:bg-surface-50 focus:outline-none focus:ring-2 focus:ring-brand-200"
        >
          <span className="truncate">{summary}</span>
          <IoChevronDown className={`transition ${open ? "rotate-180" : ""}`} />
        </button>
        <Popover
          open={open}
          className="left-0 top-full mt-2 w-56 max-h-60 overflow-y-auto scrollbar-hide rounded-xl bg-white p-0"
        >
          <ul className="py-1 text-sm text-text-strong">
            {options.map((option) => (
              <li key={option.value}>
                <label className="flex items-center gap-2 px-4 py-2 hover:bg-surface-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(option.value)}
                    onChange={() => toggleValue(option.value)}
                  />
                  <span className="truncate">{option.label}</span>
                </label>
              </li>
            ))}
            {options.length === 0 && (
              <li className="px-4 py-2 text-text-muted">Không có dữ liệu</li>
            )}
          </ul>
          {selectedValues.length > 0 && (
            <div className="border-t border-border px-4 py-2 text-right">
              <button
                className="text-xs text-brand-600 hover:underline"
                onClick={() => onChange([])}
              >
                Bỏ chọn
              </button>
            </div>
          )}
        </Popover>
      </div>
    );
  }

  useEffect(() => {
    fetchReport();
  }, [
    boardId,
    selectedMonth,
    selectedYear,
    filterType,
    dateMode,
    customStartDate,
    customEndDate,
  ]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      if (dateMode === "custom") {
        if (!customStartDate || !customEndDate) {
          toast.error("Vui lòng chọn đầy đủ khoảng ngày");
          setLoading(false);
          return;
        }
      }
      const params = {
        boardId,
        filterType,
      };
      if (dateMode === "month") {
        params.month = selectedMonth;
        params.year = selectedYear;
      } else {
        params.startDate = customStartDate;
        params.endDate = customEndDate;
      }

      const response = await service.getBoardReport(params);

      await new Promise((resolve) => setTimeout(resolve, 2000));

      if (response.data?.success) {
        setData(response.data.data);
      } else {
        toast.error(response.data?.message || "Không thể tải báo cáo");
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      if (error.response?.status === 403) {
        toast.error("Chỉ chủ board mới xem được báo cáo");
        router.back();
      } else {
        toast.error("Có lỗi xảy ra khi tải báo cáo");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDayName = (dayOfWeek) => {
    const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    return days[dayOfWeek];
  };

  const cancelHoverTimeout = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    setSelectedEntities([]);
  }, [filterType]);

  const handleCellMouseEnter = (e, row, day, cellData) => {
    cancelHoverTimeout();
    const rect = e.currentTarget.getBoundingClientRect();
    setPopoverPosition({
      x: rect.left + rect.width / 2,
      y: rect.bottom + window.scrollY,
    });
    setHoveredCell({ row, day, data: cellData });
  };

  const handleCellMouseLeave = () => {
    // Delay để có thể di chuyển vào popover
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredCell(null);
    }, 200);
  };

  const renderHoverPopover = () => {
    if (loading || !hoveredCell || !hoveredCell.data) return null;
    const { row, day, data: cellData } = hoveredCell;
    const top = popoverPosition.y + 8;
    const left = popoverPosition.x;

    const content =
      filterType === "members"
        ? cellData.map((session, idx) => (
            <div
              key={idx}
              className="text-xs border-b border-border  pb-2 last:border-b-0"
            >
              <div className="font-medium text-text-strong mb-1">
                {session.cardTitle}
              </div>
              <div className="text-text-muted space-y-0.5">
                <div>Thời gian: {formatDuration(session.duration)}</div>
                {session.startTime && (
                  <div className="text-[11px]">
                    {formatDate(session.startTime)}
                    {session.endTime && ` - ${formatDate(session.endTime)}`}
                  </div>
                )}
              </div>
            </div>
          ))
        : cellData.map((item, idx) => (
            <div
              key={idx}
              className="text-xs border-b border-border pb-2 last:border-b-0"
            >
              <div className="font-medium text-text-strong mb-1 flex items-center gap-1">
                <span className="text-green-500">✓</span>
                {item.text}
              </div>
              <div className="text-text-muted space-y-0.5">
                <div className="text-[11px]">
                  Hoàn thành: {formatDate(item.completedAt)}
                </div>
                {item.assignee && (
                  <div className="text-[11px]">
                    Người làm: {item.assignee.fullName || item.assignee.email}
                  </div>
                )}
              </div>
            </div>
          ));

    return createPortal(
      <div
        onMouseEnter={cancelHoverTimeout}
        onMouseLeave={handleCellMouseLeave}
        className="fixed z-50 pointer-events-auto"
        style={{
          top,
          left,
          transform: "translate(-50%, 0)",
        }}
      >
        <div className="rounded-2xl border border-border bg-white shadow-xl px-4 py-3 min-w-[320px] max-w-[420px]">
          <div className="text-sm font-semibold text-text-strong border-b border-border pb-2 mb-2">
            {row.name} - Ngày {day}
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-hide">
            {content}
          </div>
        </div>
      </div>,
      document.body
    );
  };

  const hasTableStructure = Boolean(data?.days?.length);
  const filteredRows = useMemo(() => {
    if (!data?.rows) return [];
    let rows = data.rows;
    if (selectedEntities.length) {
      rows = rows.filter((row) => selectedEntities.includes(String(row.id)));
    }
    if (showOnlyActive) {
      rows = rows.filter((row) =>
        data.days.some(({ day }) => row[`day_${day}`]?.length)
      );
    }
    return rows;
  }, [data, selectedEntities, showOnlyActive]);

  const hasRows = filteredRows.length > 0;

  const renderTableSkeleton = () => (
    <div className="px-4 py-6 space-y-3">
      <Skeleton height={28} width={200} />
      {[...Array(5)].map((_, idx) => (
        <Skeleton key={idx} height={32} />
      ))}
    </div>
  );

  const handleExportExcel = () => {
    if (!data || !hasTableStructure) {
      toast.error("Không có dữ liệu để xuất");
      return;
    }

    const filterLabel = filterType === "members" ? "Thành viên" : "Công việc";
    const headerRow = [
      "STT",
      filterLabel,
      ...data.days.map(
        ({ day, dayOfWeek }) => `Ngày ${day} (${getDayName(dayOfWeek)})`
      ),
      "Tổng ngày có hoạt động",
      filterType === "members" ? "Tổng thời gian (phút)" : "Tổng nhiệm vụ",
      filterType === "members" ? "Chi tiết phiên" : "Chi tiết nhiệm vụ",
    ];

    const sourceRows = hasRows ? filteredRows : data.rows;
    const rows = sourceRows.map((row, idx) => {
      const rowData = [idx + 1, row.name];
      let totalActiveDays = 0;
      let totalMinutes = 0;
      let detailSummary = [];

      data.days.forEach(({ day }) => {
        const cellData = row[`day_${day}`];
        if (!cellData || cellData.length === 0) {
          rowData.push("");
        } else if (filterType === "members") {
          totalActiveDays += 1;
          const minutes = cellData.reduce(
            (sum, session) => sum + (session.duration || 0),
            0
          );
          totalMinutes += minutes;

          const detailText = cellData
            .map(
              (session, idx) =>
                `${idx + 1}. ${session.cardTitle || "Task"} (${
                  formatDuration(session.duration || 0).minutes
                }m)`
            )
            .join("\n");

          detailSummary.push(
            `Ngày ${day}: ${cellData.length} phiên\n${detailText}`
          );
          rowData.push(`${cellData.length} phiên - ${minutes} phút`);
        } else {
          totalActiveDays += 1;
          detailSummary.push(
            `Ngày ${day}: ${cellData.length} mục\n${cellData
              .map(
                (item, idx) =>
                  `${idx + 1}. ${item.text} (${
                    item.assignee?.fullName || "ẩn danh"
                  })`
              )
              .join("\n")}`
          );
          rowData.push(`${cellData.length} mục hoàn thành`);
        }
      });

      rowData.push(totalActiveDays);
      rowData.push(
        filterType === "members" ? totalMinutes : detailSummary.length
      );
      rowData.push(detailSummary.join("\n\n"));

      return rowData;
    });

    const worksheet = XLSX.utils.aoa_to_sheet([headerRow, ...rows]);
    worksheet["!cols"] = [
      { wch: 6 },
      { wch: 30 },
      ...data.days.map(() => ({ wch: 20 })),
      { wch: 16 },
      { wch: 22 },
      { wch: 60 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bao-cao-board-${data.month || "thang"}-${
      data.year || "nam"
    }.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Đã xuất Excel");
  };

  const rowsToRender = hasRows ? filteredRows : data?.rows || [];

  return (
    <div className="mx-auto w-full max-w-[95vw] px-4 py-6 sm:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full border border-border bg-white hover:bg-surface-50"
          >
            <IoArrowBack size={20} />
          </button>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl md:text-3xl font-bold text-text-strong leading-tight">
              Báo cáo tổng kết
            </h1>
            <p className="text-sm text-text-muted">
              {dateMode === "month" && data?.month && data?.year
                ? `Tháng ${data.month}/${data.year}`
                : dateMode === "custom"
                ? `Từ ${customStartDate || "..."} đến ${customEndDate || "..."}`
                : "Đang tải dữ liệu..."}
            </p>
          </div>
        </div>
        {hasRows && (
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-text-strong hover:bg-surface-50 transition"
          >
            Xuất Excel
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4 rounded-2xl border border-border bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-text-strong">
              Khoảng thời gian
            </span>
            <div className="inline-flex rounded-full border border-border bg-surface-50 p-1">
              <button
                className={`px-4 py-1.5 text-sm rounded-full ${
                  dateMode === "month"
                    ? "bg-brand-500 text-white shadow"
                    : "text-text-strong"
                }`}
                onClick={() => setDateMode("month")}
              >
                Theo tháng
              </button>
              <button
                className={`px-4 py-1.5 text-sm rounded-full ${
                  dateMode === "custom"
                    ? "bg-brand-500 text-white shadow"
                    : "text-text-strong"
                }`}
                onClick={() => setDateMode("custom")}
              >
                Tùy chỉnh
              </button>
            </div>
          </div>
          {dateMode === "month" && (
            <>
              <SelectField
                label="Tháng"
                value={selectedMonth}
                options={monthOptions}
                onSelect={(val) => setSelectedMonth(val)}
              />
              <SelectField
                label="Năm"
                value={selectedYear}
                options={yearOptions}
                onSelect={(val) => setSelectedYear(val)}
              />
            </>
          )}
          {dateMode === "custom" && (
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-text-strong">
                  Từ ngày
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="rounded-xl border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-text-strong">
                  Đến ngày
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="rounded-xl border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                />
              </div>
            </div>
          )}
        </div>
        <div className="grid gap-4 lg:grid-cols-[auto_auto_auto] items-start">
          <SelectField
            label="Chế độ xem"
            value={filterType}
            options={filterOptions}
            onSelect={(val) => setFilterType(val)}
          />
          {hasTableStructure && (
            <MultiSelectField
              label={
                filterType === "members" ? "Chọn thành viên" : "Chọn công việc"
              }
              options={entityOptions}
              selectedValues={selectedEntities}
              onChange={setSelectedEntities}
              placeholder="Tất cả"
            />
          )}
          <label className="flex items-center gap-2 text-sm font-medium text-text-strong">
            <input
              type="checkbox"
              checked={showOnlyActive}
              onChange={(e) => setShowOnlyActive(e.target.checked)}
            />
            Chỉ hiển thị có hoạt động
          </label>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-white">
        <div className="overflow-x-auto">
          {loading ? (
            renderTableSkeleton()
          ) : hasTableStructure ? (
            hasRows ? (
              <table className="w-full border-collapse">
                <thead className="bg-surface-50 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-text-strong sticky left-0 bg-surface-50 z-10 border-r border-border min-w-[150px]">
                      STT
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-text-strong sticky left-[150px] bg-surface-50 z-10 border-r border-border min-w-[200px]">
                      {filterType === "members" ? "Thành viên" : "Công việc"}
                    </th>
                    {data.days.map(({ day, dayOfWeek }) => (
                      <th
                        key={day}
                        className="px-2 py-3 text-center text-xs font-semibold text-text-strong min-w-[60px] border-r border-border last:border-r-0"
                      >
                        <div>{day}</div>
                        <div className="text-text-muted text-[10px]">
                          {getDayName(dayOfWeek)}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rowsToRender.map((row, index) => (
                    <tr key={row.id} className="hover:bg-surface-50">
                      <td className="px-4 py-3 text-sm text-text-strong sticky left-0 bg-white z-10 border-r border-border">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-text-strong sticky left-[150px] bg-white z-10 border-r border-border">
                        {row.name}
                      </td>
                      {data.days.map(({ day }) => {
                        const cellData = row[`day_${day}`];
                        const hasCellData = cellData && cellData.length > 0;
                        return (
                          <td
                            key={day}
                            className={`px-2 py-3 text-center text-xs border-r border-border last:border-r-0 relative ${
                              hasCellData ? "bg-green-100 cursor-pointer" : ""
                            }`}
                            onMouseEnter={(e) => {
                              if (hasCellData) {
                                handleCellMouseEnter(e, row, day, cellData);
                              }
                            }}
                            onMouseLeave={handleCellMouseLeave}
                          >
                            {hasCellData && (
                              <span className="inline-block w-4 h-4 rounded-full bg-green-500"></span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-16 text-center text-text-muted">
                Không có dữ liệu
              </div>
            )
          ) : (
            <div className="py-16 text-center text-text-muted">
              Không có dữ liệu
            </div>
          )}
        </div>
      </div>
      {hasRows && renderHoverPopover()}
    </div>
  );
}
