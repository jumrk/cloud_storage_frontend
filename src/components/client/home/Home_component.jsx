"use client";
import React from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useState, useEffect } from "react";
import { formatSize } from "@/utils/driveUtils";
import axiosClient from "@/lib/axiosClient";
import EmptyState from "@/components/ui/EmptyState";

function FilterBar({ sortColumn, sortOrder, onSort }) {
  // Helper để render mũi tên
  const renderArrow = (col) => {
    if (sortColumn !== col) return <span className="ml-1">▼</span>;
    return <span className="ml-1">{sortOrder === "asc" ? "▲" : "▼"}</span>;
  };
  return (
    <div className="flex gap-3 items-center mx-5 mb-6 mt-4 md:flex">
      <button
        className={`${
          sortColumn === "account"
            ? "bg-[#189df2] text-white"
            : "bg-white text-gray-700"
        } font-semibold rounded-full px-4 py-1.5 text-sm border ${
          sortColumn === "account"
            ? "border-white"
            : "border-dotted border-gray-400"
        }`}
        onClick={() => onSort("account")}
      >
        Tài khoản {renderArrow("account")}
      </button>
      <button
        className={`${
          sortColumn === "file"
            ? "bg-[#189df2] text-white"
            : "bg-white text-gray-700"
        } rounded-full px-4 py-1.5 text-sm border ${
          sortColumn === "file"
            ? "border-white"
            : "border-dotted border-gray-400"
        }`}
        onClick={() => onSort("file")}
      >
        Loại tệp {renderArrow("file")}
      </button>
      <button
        className={`${
          sortColumn === "date"
            ? "bg-[#189df2] text-white"
            : "bg-white text-gray-700"
        } rounded-full px-4 py-1.5 text-sm border ${
          sortColumn === "date"
            ? "border-white"
            : "border-dotted border-gray-400"
        }`}
        onClick={() => onSort("date")}
      >
        Ngày đăng {renderArrow("date")}
      </button>
      <button
        className={`${
          sortColumn === "size"
            ? "bg-[#189df2] text-white"
            : "bg-white text-gray-700"
        } rounded-full px-4 py-1.5 text-sm border ${
          sortColumn === "size"
            ? "border-white"
            : "border-dotted border-gray-400"
        }`}
        onClick={() => onSort("size")}
      >
        Dung lượng {renderArrow("size")}
      </button>
    </div>
  );
}

// Bảng basic
const columns = [
  { key: "account", label: "Tài khoản" },
  { key: "file", label: "Tệp & Thư mục" },
  { key: "date", label: "Ngày đăng" },
  { key: "size", label: "Dung lượng" },
];

function BasicTable({ sortColumn, sortOrder, onSort }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortedData, setSortedData] = useState([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      // Fetch members, folders, files
      const [membersRes, uploadRes] = await Promise.all([
        axiosClient.get("/api/user/members").then((r) => r.data),
        axiosClient
          .get("/api/upload", { params: { page: 1, limit: 1000 } })
          .then((r) => r.data),
      ]);
      const members = membersRes.members || [];
      const folders = uploadRes.folders || [];
      const files = uploadRes.files || [];
      // Build rows
      let rows = [];
      for (const member of members) {
        // Tìm các folder mà member này có quyền
        const managedFolders = folders.filter((folder) =>
          (folder.permissions || []).some(
            (p) => p.memberId === member._id || p.memberId === member.id
          )
        );
        if (managedFolders.length === 0) {
          rows.push({
            account: member.fullName || member.email,
            file: "-",
            date: "-",
            size: "-",
          });
        } else {
          for (const folder of managedFolders) {
            // Tính tổng dung lượng file trong folder này
            const filesInFolder = files.filter(
              (f) => f.folderId === String(folder._id)
            );
            const totalSize = filesInFolder.reduce(
              (sum, f) => sum + (f.size || 0),
              0
            );
            rows.push({
              account: member.fullName || member.email,
              file: folder.name,
              date: folder.createdAt
                ? new Date(folder.createdAt).toLocaleDateString()
                : "-",
              size: formatSize(totalSize),
            });
          }
        }
      }
      setData(rows);
      setLoading(false);
    }
    fetchData();
  }, []);

  useEffect(() => {
    // Sắp xếp data theo sortColumn/sortOrder
    if (!sortColumn) {
      setSortedData(data);
      return;
    }
    const sorted = [...data].sort((a, b) => {
      let v1 = a[sortColumn] || "";
      let v2 = b[sortColumn] || "";
      // Nếu là ngày thì convert về Date
      if (sortColumn === "date") {
        v1 = v1 === "-" ? 0 : new Date(v1).getTime();
        v2 = v2 === "-" ? 0 : new Date(v2).getTime();
      }
      // Nếu là size thì convert về số
      if (sortColumn === "size") {
        v1 = v1 === "-" ? 0 : Number(v1.replace(/[^\d.]/g, ""));
        v2 = v2 === "-" ? 0 : Number(v2.replace(/[^\d.]/g, ""));
      }
      if (v1 < v2) return sortOrder === "asc" ? -1 : 1;
      if (v1 > v2) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    setSortedData(sorted);
  }, [data, sortColumn, sortOrder]);

  if (!loading && sortedData.length === 0) {
    return <EmptyState message="Không có dữ liệu để hiển thị" />;
  }

  return (
    <div className="bg-white overflow-x-auto ml-5 md:block hidden">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-[#f7f8fa] text-gray-700">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-5 py-3 font-semibold text-left border-b border-gray-200"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="border-b border-gray-100">
                  {columns.map((col, i) => (
                    <td key={i} className="px-5 py-3">
                      <Skeleton width={100} height={16} />
                    </td>
                  ))}
                </tr>
              ))
            : sortedData.map((row, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-gray-50 border-b border-gray-100"
                >
                  <td className="px-5 py-3 whitespace-nowrap font-medium text-gray-800">
                    {row.account}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-gray-700">
                    {row.file}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-gray-600">
                    {row.date}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-gray-600">
                    {row.size}
                  </td>
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}

// Sidebar phải giữ nguyên như trước
function StoragePieChart({ used, total }) {
  const percent = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  return (
    <div className="flex flex-col items-center justify-center my-4">
      <svg viewBox="0 0 100 100" className="w-28 h-28">
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="10"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#1cadd9"
          strokeWidth="10"
          strokeDasharray={2 * Math.PI * 45}
          strokeDashoffset={2 * Math.PI * 45 * (1 - percent / 100)}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.5s" }}
        />
        <text
          x="50"
          y="54"
          textAnchor="middle"
          fontSize="20"
          fontWeight="bold"
          fill="#222"
        >
          {percent.toFixed(0)}%
        </text>
      </svg>
      <div className="text-xs text-gray-500 mt-1">
        {used} / {total} đã dùng
      </div>
    </div>
  );
}

function FileTypeRatio({ types }) {
  const total = types.reduce((sum, t) => sum + t.count, 0);
  return (
    <div className="flex flex-col gap-2 mt-2">
      {types.map((t) => (
        <div key={t.ext} className="flex items-center gap-2 text-sm">
          <span className="w-8 text-right font-medium uppercase text-gray-600">
            {t.ext}
          </span>
          <div className="flex-1 h-3 bg-gray-200 rounded-full relative overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-[#1cadd9]"
              style={{ width: `${total ? (t.count / total) * 100 : 0}%` }}
            />
          </div>
          <span className="ml-2 text-xs text-gray-500">{t.count} file</span>
        </div>
      ))}
    </div>
  );
}

function RightSidebar() {
  const [loading, setLoading] = useState(true);
  const [leader, setLeader] = useState(null);
  const [members, setMembers] = useState([]);
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  // Sidebar data
  const [fileTypes, setFileTypes] = useState([]);
  const [overview, setOverview] = useState({});

  useEffect(() => {
    async function fetchSidebar() {
      setLoading(true);
      const [userRes, membersRes, uploadRes] = await Promise.all([
        axiosClient.get("/api/user").then((r) => r.data),
        axiosClient.get("/api/user/members").then((r) => r.data),
        axiosClient
          .get("/api/upload", { params: { page: 1, limit: 1000 } })
          .then((r) => r.data),
      ]);
      setLeader(userRes);
      setMembers(membersRes.members || []);
      setFiles(uploadRes.files || []);
      setFolders(uploadRes.folders || []);
      // Tính tỉ lệ loại file
      const typeCount = {};
      (uploadRes.files || []).forEach((f) => {
        const ext = (f.originalName || "").split(".").pop().toLowerCase();
        if (ext) typeCount[ext] = (typeCount[ext] || 0) + 1;
      });
      setFileTypes(
        Object.entries(typeCount).map(([ext, count]) => ({ ext, count }))
      );
      // Overview
      const used = userRes.usedStorage || 0;
      const total = userRes.maxStorage || 1;
      const remainNum = Math.max(0, total - used);
      setOverview({
        totalFiles: uploadRes.files?.length || 0,
        used: formatSize(used),
        subAccounts: (membersRes.members || []).length,
        remain: formatSize(remainNum),
        plan: userRes.plan?.name || "-",
        usedNum: used,
        totalNum: total,
      });
      setLoading(false);
    }
    fetchSidebar();
  }, []);

  if (loading) {
    return (
      <aside className="bg-white border-l border-gray-100 px-4 md:px-6 py-8 h-screen sticky top-0 flex flex-col overflow-y-auto w-full md:max-w-[300px] md:min-w-[220px] md:block">
        {/* Skeleton giữ nguyên */}
        {/* Tổng quan + biểu đồ */}
        <div className="mb-6 p-5 rounded-xl bg-[#f7f8fa] border border-gray-100 shadow-sm">
          <Skeleton width={100} height={24} className="mb-3" />
          <div className="flex justify-center">
            <Skeleton circle width={112} height={112} />
          </div>
        </div>
        {/* Tổng dung lượng & đã sử dụng */}
        <div className="mb-6 p-5 rounded-xl bg-white border border-gray-100 shadow-sm">
          <Skeleton width={100} height={20} className="mb-3" />
          <Skeleton width={180} height={16} className="mb-2" />
          <Skeleton width={180} height={16} />
        </div>
        {/* Tỉ lệ file */}
        <div className="mb-6 p-5 rounded-xl bg-white border border-gray-100 shadow-sm">
          <Skeleton width={100} height={20} className="mb-3" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 text-sm mb-2">
              <Skeleton width={32} height={16} />
              <Skeleton width={120} height={12} />
              <Skeleton width={40} height={12} />
            </div>
          ))}
        </div>
        {/* Thông tin tài khoản */}
        <div className="mb-2 p-5 rounded-xl bg-white border border-gray-100 shadow-sm">
          <Skeleton width={120} height={20} className="mb-3" />
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-0.5">
                <Skeleton width={60} height={12} />
                <Skeleton width={40} height={18} />
              </div>
            ))}
            <div className="col-span-2 flex flex-col gap-0.5 mt-2">
              <Skeleton width={80} height={12} />
              <Skeleton width={100} height={18} />
            </div>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="bg-white border-l border-gray-100 px-4 md:px-6 py-8 h-screen sticky top-0 flex flex-col overflow-y-auto w-full md:max-w-[300px] md:min-w-[220px] md:block">
      {/* Tổng quan + biểu đồ */}
      <div className="mb-6 p-5 rounded-xl bg-[#f7f8fa] border border-gray-100 shadow-sm">
        <div className="font-semibold text-gray-700 mb-3 text-lg tracking-wide">
          Tổng quan
        </div>
        <StoragePieChart used={overview.usedNum} total={overview.totalNum} />
      </div>
      {/* Tổng dung lượng & đã sử dụng */}
      <div className="mb-6 p-5 rounded-xl bg-white border border-gray-100 shadow-sm">
        <div className="font-semibold text-gray-700 mb-3 text-base tracking-wide">
          Tổng dung lượng
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between items-center py-1">
            <span className="text-gray-500">Đã sử dụng</span>
            <span className="font-semibold text-[#1cadd9]">
              {overview.used}
            </span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-gray-500">Tổng dung lượng</span>
            <span className="font-semibold">
              {formatSize(overview.totalNum)}
            </span>
          </div>
        </div>
      </div>
      {/* Tỉ lệ file */}
      <div className="mb-6 p-5 rounded-xl bg-white border border-gray-100 shadow-sm">
        <div className="font-semibold text-gray-700 mb-3 text-base tracking-wide">
          Tỉ lệ file
        </div>
        <FileTypeRatio types={fileTypes} />
      </div>
      {/* Tổng quan mới */}
      <div className="mb-2 p-5 rounded-xl bg-white border border-gray-100 shadow-sm">
        <div className="font-semibold text-gray-700 mb-3 text-base tracking-wide">
          Thông tin tài khoản
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div className="flex flex-col gap-0.5">
            <span className="text-gray-400">Tổng số file</span>
            <span className="font-bold text-base text-gray-800">
              {overview.totalFiles}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-gray-400">Đã sử dụng</span>
            <span className="font-bold text-base text-gray-800">
              {overview.used}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-gray-400">Tài khoản con</span>
            <span className="font-bold text-base text-gray-800">
              {overview.subAccounts}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-gray-400">Còn lại</span>
            <span className="font-bold text-base text-gray-800">
              {overview.remain}
            </span>
          </div>
          <div className="col-span-2 flex flex-col gap-0.5 mt-2">
            <span className="text-gray-400">Gói đăng ký</span>
            <span className="font-bold text-base text-gray-800">
              {overview.plan}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default function Home() {
  const [sortColumn, setSortColumn] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");

  const handleSort = (col) => {
    if (sortColumn === col) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(col);
      setSortOrder("asc");
    }
  };

  return (
    <div className="w-full min-h-screen flex bg-white">
      {/* Main content left: chỉ hiện trên md trở lên */}
      <div className="flex-1 flex-col pt-8 pb-8 hidden md:flex">
        <FilterBar
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={handleSort}
        />
        <div className="mt-2">
          <BasicTable
            sortColumn={sortColumn}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
        </div>
      </div>
      {/* Sidebar phải: ở mobile chiếm full width, ở desktop là sidebar */}
      <div className="w-full md:w-auto">
        <RightSidebar />
      </div>
    </div>
  );
}
