import { useTranslations } from "next-intl";

export function FilterBar({ sortColumn, sortOrder, onSort }) {
  const t = useTranslations();
  const arrow = (col) =>
    sortColumn !== col ? "▼" : sortOrder === "asc" ? "▲" : "▼";

  const Btn = ({ col, text }) => (
    <button
      className={`${
        sortColumn === col
          ? "bg-[#189df2] text-white"
          : "bg-white text-gray-700"
      } font-semibold rounded-full px-4 py-1.5 text-sm border ${
        sortColumn === col ? "border-white" : "border-dotted border-gray-400"
      }`}
      onClick={() => onSort(col)}
    >
      {text} <span className="ml-1">{arrow(col)}</span>
    </button>
  );

  return (
    <div className="flex gap-3 items-center mx-5 mb-6 mt-4">
      <Btn col="account" text={t("home.filter.account")} />
      <Btn col="file" text={t("home.filter.file")} />
      <Btn col="date" text={t("home.filter.date")} />
      <Btn col="size" text={t("home.filter.size")} />
    </div>
  );
}
