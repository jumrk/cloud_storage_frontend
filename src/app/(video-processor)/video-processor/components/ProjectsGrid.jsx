"use client";
import ProjectCard from "./ProjectCard";
import { useTranslations } from "next-intl";

export default function ProjectsGrid({
  items,
  onOpen,
  onRename,
  onShowMore,
  onDelete,
  showMore,
}) {
  const t = useTranslations();
  if (!items?.length) {
    return (
      <div className="py-16 text-center text-gray-500">
        {t("video_processor.no_projects")}
      </div>
    );
  }
  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {items.map((it) => (
          <ProjectCard
            key={it.id}
            onDelete={onDelete}
            item={it}
            onOpen={onOpen}
            onRename={onRename}
          />
        ))}
      </div>
      {showMore && (
        <div className="flex justify-center mt-6">
          <button
            onClick={onShowMore}
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
          >
            {t("video_processor.show_more")}
          </button>
        </div>
      )}
    </>
  );
}
