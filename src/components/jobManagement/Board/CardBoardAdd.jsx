import React from "react";
import { IoMdAdd } from "react-icons/io";

function CardBoardAdd({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="select-none flex justify-center items-center cursor-pointer w-[220px] h-[96px] rounded-2xl border-2 border-neutral-200 bg-white p-3 text-left shadow-sm
                 hover:-translate-y-0.5 hover:shadow-md hover:border-indigo-200 active:translate-y-0 transition"
    >
      <IoMdAdd size={20} />
    </button>
  );
}

export default CardBoardAdd;
