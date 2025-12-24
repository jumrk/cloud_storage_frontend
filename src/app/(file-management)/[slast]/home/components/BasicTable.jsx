"use client";

import { formatSize } from "@/shared/utils/driveUtils";
import { useTranslations } from "next-intl";
import Skeleton from "react-loading-skeleton";
import { FiChevronUp, FiChevronDown } from "react-icons/fi";
import { Pagination } from "./Pagination";
import EmptyState from "@/shared/ui/EmptyState";

export function BasicTable({
  rows,
  loading,
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  selectedRows,
  onSelectRow,
  onSelectAll,
  isAllSelected,
  isIndeterminate,
  onBulkAction,
  sortColumn,
  sortOrder,
  onSort,
}) {
  const t = useTranslations();
  const columns = ["account", "file", "date", "size"];

  const getSortIcon = (columnKey) => {
    if (sortColumn !== columnKey) {
      return (
        <div className="flex flex-col -space-y-1 ml-2">
          <FiChevronUp className="text-gray-300" size={10} />
          <FiChevronDown className="text-gray-300" size={10} />
        </div>
      );
    }
    return sortOrder === "asc" ? (
      <FiChevronUp className="text-brand ml-2" size={14} />
    ) : (
      <FiChevronDown className="text-brand ml-2" size={14} />
    );
  };

  const handleSortClick = (columnKey) => {
    if (onSort) {
      onSort(columnKey);
    }
  };

  if (!loading && rows.length === 0) {
    return (
      <div className="mx-5 mt-2">
        <div className="bg-white rounded-xl border border-border p-8">
          <EmptyState
            message="Chưa có thông tin nào để hiển thị. Dữ liệu sẽ xuất hiện khi có thành viên và thư mục được chia sẻ."
            height={180}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="ml-5 mr-2 md:block hidden">
      <div className="bg-white overflow-x-auto rounded-xl border border-border">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-surface-50 text-text-strong">
              {columns.map((key) => (
                <th
                  key={key}
                  className="px-5 py-3 font-semibold text-left border-b border-border cursor-pointer hover:bg-surface-100 transition-colors"
                  onClick={() => handleSortClick(key)}
                >
                  <div className="flex items-center">
                    <span>{t(`home.table.${key}`)}</span>
                    {getSortIcon(key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="border-b border-border">
                    {columns.map((_, i) => (
                      <td key={i} className="px-5 py-3">
                        <Skeleton width={100} height={16} />
                      </td>
                    ))}
                  </tr>
                ))
              : rows.map((row, i) => (
                  <tr
                    key={i}
                    className="hover:bg-surface-50 border-b border-border transition"
                  >
                    <td className="px-5 py-3 whitespace-nowrap font-medium text-text-strong">
                      {row.account}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-text-strong">
                      {row.file}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-text-muted">
                      {row.dateIso
                        ? new Date(row.dateIso).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-text-muted">
                      {typeof row.sizeBytes === "number"
                        ? formatSize(row.sizeBytes)
                        : "-"}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
