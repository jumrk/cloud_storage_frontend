"use client";
import { FaUserPlus } from "react-icons/fa";
import ModalShareBoard from "./ModalShareBoard";
import useShareBoard from "@/hooks/jobManagement/useShareBoard";
import { useEffect } from "react";
import { IoMdArrowRoundBack } from "react-icons/io";
import { useRouter } from "next/navigation";

export default function HeaderDetailBoard({ boardId }) {
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

  useEffect(() => {
    FetchMember();
  }, [boardId]);

  const router = useRouter();
  return (
    <div className="flex justify-between w-full h-[60px] items-center">
      <div
        onClick={() => router.back()}
        className="flex gap-1 cursor-pointer p-1 border-2 rounded-xl border-black/50 items-center text-black/40 hover:text-black hover:scale-105 transition-all "
      >
        <IoMdArrowRoundBack size={20} />
      </div>
      <div className="flex gap-2 justify-end items-center ">
        <p className="box-content p-2 border-2 border-black/30 rounded-2xl">
          {title}
        </p>
        <button
          onClick={() => setOpen(true)}
          className="flex cursor-pointer hover:bg-blue-500 hover:text-white font-semibold transition-all duration-200 justify-center items-center p-2 gap-2 border-2 border-blue-500 text-blue-500 rounded-2xl"
        >
          <p>Chia sẻ</p>
          <FaUserPlus size={18} />
        </button>

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
    </div>
  );
}
