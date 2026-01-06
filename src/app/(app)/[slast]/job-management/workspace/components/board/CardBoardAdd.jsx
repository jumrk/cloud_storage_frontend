import React from "react";
import { IoMdAdd } from "react-icons/io";
import { useTranslations } from "next-intl";
function CardBoardAdd({ onClick }) {
  const t = useTranslations();
  return (
    <button
      type="button"
      onClick={onClick}
      className="select-none flex justify-center items-center cursor-pointer w-[220px] h-[96px] rounded-2xl border-2 border-gray-200 bg-white p-3 text-left shadow-sm hover:-translate-y-0.5 hover:shadow-md hover:border-brand-200 active:translate-y-0 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 text-brand-600"
      aria-label={t("job_management.board.create_board")}
      title={t("job_management.board.create_board")}
    >
      <IoMdAdd size={20} />
    </button>
  );
}
export default CardBoardAdd;
