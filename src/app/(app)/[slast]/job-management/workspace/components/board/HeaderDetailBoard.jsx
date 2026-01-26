"use client";
import { FaUserPlus } from "react-icons/fa";
import { IoBarChartOutline } from "react-icons/io5";
import ModalShareBoard from "./modals/ModalShareBoard";
import useShareBoard from "../../hooks/useShareBoard";
import { useEffect, useState } from "react";
import { IoMdArrowRoundBack } from "react-icons/io";
import { useRouter, useParams } from "next/navigation";
import { useBoardContext } from "./context/BoardContext";
import { useTranslations } from "next-intl";
import boardService from "../../services/boardService";

export default function HeaderDetailBoard() {
  const { boardId } = useBoardContext();
  const t = useTranslations();
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
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    FetchMember();
    checkOwner();
  }, [boardId]);

  const checkOwner = async () => {
    try {
      // ✅ Get current user from API (cookie sent automatically)
      const userRes = await axiosClient.get("/api/user");
      if (!userRes.data) return;

      const userId = userRes.data.id || userRes.data._id;
      let currentUserId = null;
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        currentUserId = String(payload.userId || payload.id || "");
      } catch (e) {
        console.error("Error decoding token:", e);
        return;
      }

      // Get board info to check owner
      const res = await boardService().getBoardById(boardId);
      if (res.data?.success) {
        const board = res.data.data;
        const ownerId = String(board.createdBy?._id || board.createdBy || "");
        setIsOwner(currentUserId === ownerId);
      }
    } catch (error) {
      console.error("Error checking owner:", error);
    }
  };

  const router = useRouter();
  const params = useParams();
  const slast = params?.slast;

  return (
    <div className="flex justify-between w-full h-[60px] items-center">
      <button
        onClick={() => router.back()}
        className="flex gap-1 p-1 rounded-xl border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-white transition"
        aria-label={t("job_management.board.back")}
      >
        <IoMdArrowRoundBack size={20} />
      </button>
      <div className="flex gap-2 justify-end items-center">
        <p className="box-content px-3 py-2 rounded-2xl border border-gray-200 text-gray-900">
          {title}
        </p>
        {isOwner && (
          <button
            onClick={() => {
              const reportPath = slast 
                ? `/${slast}/job-management/workspace/board/${boardId}/report`
                : `/job-management/workspace/board/${boardId}/report`;
              router.push(reportPath);
            }}
            className="flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-white transition"
          >
            <IoBarChartOutline size={18} />
            <span>Báo cáo</span>
          </button>
        )}
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-2xl border border-brand-500 px-4 py-2 text-sm font-medium text-brand-600 hover:bg-brand-500 hover:text-white transition"
        >
          <span>Chia sẻ</span>
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
