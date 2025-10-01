import { formatSize } from "@/utils/driveUtils";
import { useTranslations } from "next-intl";
import Skeleton from "react-loading-skeleton";

export function BasicTable({ rows, loading }) {
  const t = useTranslations();
  const columns = ["account", "file", "date", "size"];

  if (!loading && rows.length === 0) {
    return (
      <div className="mx-5 mt-6 text-sm text-gray-500">{t("home.empty")}</div>
    );
  }

  return (
    <div className="bg-white overflow-x-auto ml-5 md:block hidden">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-[#f7f8fa] text-gray-700">
            {columns.map((key) => (
              <th
                key={key}
                className="px-5 py-3 font-semibold text-left border-b border-gray-200"
              >
                {t(`home.table.${key}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="border-b border-gray-100">
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
                  className="hover:bg-gray-50 border-b border-gray-100"
                >
                  <td className="px-5 py-3 whitespace-nowrap font-medium text-gray-800">
                    {row.account}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-gray-700">
                    {row.file}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-gray-600">
                    {row.dateIso
                      ? new Date(row.dateIso).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-gray-600">
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
