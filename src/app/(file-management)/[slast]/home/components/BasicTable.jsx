import { formatSize } from "@/shared/utils/driveUtils";
import { useTranslations } from "next-intl";
import Skeleton from "react-loading-skeleton";

export function BasicTable({ rows, loading }) {
  const t = useTranslations();
  const columns = ["account", "file", "date", "size"];

  if (!loading && rows.length === 0) {
    return (
      <div className="mx-5 mt-6 text-sm text-text-muted">{t("home.empty")}</div>
    );
  }

  return (
    <div className="bg-white overflow-x-auto ml-5 mr-2 md:block hidden rounded-xl border border-border">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-surface-50 text-text-strong">
            {columns.map((key) => (
              <th
                key={key}
                className="px-5 py-3 font-semibold text-left border-b border-border"
              >
                {t(`home.table.${key}`)}
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
                  className="hover:bg-surface-50 border-b border-border"
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
  );
}
