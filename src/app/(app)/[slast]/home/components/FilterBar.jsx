import { useTranslations } from "next-intl";

export function FilterBar({ sortColumn, sortOrder, onSort }) {
  const t = useTranslations();

  const arrow = (col) =>
    sortColumn !== col ? "▼" : sortOrder === "asc" ? "▲" : "▼";

  const Btn = ({ col, text }) => (
    <button
      type="button"
      className={`${
        sortColumn === col
          ? "bg-brand text-white border border-brand"
          : "bg-white text-gray-900 border border-dotted border-gray-200"
      } font-semibold rounded-full px-4 py-1.5 text-sm transition-colors hover:bg-white cursor-pointer`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onSort?.(col);
      }}
    >
      {text}
      <span className="ml-1">{arrow(col)}</span>
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
