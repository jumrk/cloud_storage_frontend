"use client";
import Modal from "@/shared/ui/Modal";
import Button from "@/shared/ui/button";
import Popover from "@/shared/ui/Popover";
import { CiEdit, CiTrash } from "react-icons/ci";
import useProjectCard from "../hooks/useProjectCard";
import { useTranslations } from "next-intl";

function formatDuration(sec = 0) {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return (
    (h ? `${h}:` : "") +
    String(m).padStart(2, "0") +
    ":" +
    String(r).padStart(2, "0")
  );
}
function formatCreated(d) {
  try {
    return new Date(d).toLocaleDateString("vi-VN");
  } catch {
    return "";
  }
}

export default function ProjectCard({ item, onOpen, onRename, onDelete }) {
  const t = useTranslations();
  const {
    openEdit,
    menuOpen,
    title,
    setTitle,
    handleMenuClick,
    handleEditClick,
    handleDeleteClick,
    handleCloseEdit,
    submitRename,
  } = useProjectCard({ item, onRename });
  return (
    <>
      <div className="w-full">
        <div
          onClick={() => onOpen(item)}
          className="relative aspect-[16/10] w-full cursor-pointer overflow-hidden rounded-xl bg-surface-soft shadow-card"
          role="button"
          tabIndex={0}
        >
          {item.coverUrl ? (
            <img
              src={item.coverUrl}
              alt={item.title}
              className="h-full w-full object-cover transition hover:scale-[1.01]"
              draggable={false}
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-text-muted">
              {t("video_processor.no_cover")}
            </div>
          )}
          <div className="absolute left-2 bottom-2 rounded-md bg-black/60 px-2 py-1 text-xs text-white">
            {formatDuration(item.durationSec)}
          </div>
        </div>

        <div className="mt-2 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-text-strong">
              {item.title}
            </div>
            <div className="text-xs text-text-muted">
              {t("video_processor.created_date")} {formatCreated(item.createdAt)}
            </div>
          </div>

          <div className="relative" data-card-menu>
            <button
              onClick={handleMenuClick}
              className="h-8 w-8 rounded-full border border-border bg-white text-text-strong hover:bg-surface-50"
              aria-label={t("video_processor.open_menu")}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                className="m-auto"
              >
                <path
                  d="M5 12a2 2 0 114 0 2 2 0 01-4 0zm5 0a2 2 0 114 0 2 2 0 01-4 0zm5 0a2 2 0 114 0 2 2 0 01-4 0z"
                  fill="currentColor"
                />
              </svg>
            </button>

            <Popover open={menuOpen} className="right-0 w-56 p-0">
              <div className="py-1" data-popover-panel>
                <button
                  className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-surface-50"
                  onClick={handleEditClick}
                >
                  <CiEdit size={20} />
                  <span>{t("video_processor.rename")}</span>
                </button>
                <button
                  className="flex w-full items-center gap-3 px-3 py-2 text-left text-danger-600 hover:bg-surface-50"
                  onClick={() => {
                    handleDeleteClick();
                    onDelete && onDelete(item);
                  }}
                >
                  <CiTrash size={20} />
                  <span>{t("video_processor.delete")}</span>
                </button>
              </div>
            </Popover>
          </div>
        </div>
      </div>

      {openEdit && (
        <Modal onClose={handleCloseEdit}>
          <form onSubmit={submitRename} className="p-4">
            <div className="text-base font-semibold">{t("video_processor.rename_project")}</div>
            <div className="mt-3">
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400"
                placeholder={t("video_processor.enter_new_name")}
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                handleClick={handleCloseEdit}
                variant="outline"
                color="brand"
              >
                {t("video_processor.cancel")}
              </Button>
              <Button type="submit">{t("video_processor.save")}</Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
