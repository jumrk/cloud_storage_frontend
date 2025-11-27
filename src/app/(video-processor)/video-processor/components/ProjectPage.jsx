"use client";
import HomeHeader from "./Header";
import ProjectsGrid from "./ProjectsGrid";
import useProjectsPage from "../hooks/useProjectsPage";
import TourGuide from "@/shared/components/TourGuide";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export default function ProjectsPage() {
  const t = useTranslations();
  const { ui, setUi, data, loading, onCreate, onOpen, onRename, onDelete } =
    useProjectsPage();
  const [tourSteps, setTourSteps] = useState([]);

  useEffect(() => {
    // Wait for DOM to be ready
    const timer = setTimeout(() => {
      const steps = [
        {
          target: '[data-tour="create-video"]',
          title: t("tour.home.create_video.title"),
          description: t("tour.home.create_video.description"),
          placement: "bottom",
        },
        {
          target: '[data-tour="filter"]',
          title: t("tour.home.filter.title"),
          description: t("tour.home.filter.description"),
          placement: "bottom",
        },
        {
          target: '[data-tour="search"]',
          title: t("tour.home.search.title"),
          description: t("tour.home.search.description"),
          placement: "bottom",
        },
      ];
      setTourSteps(steps);
    }, 500);

    return () => clearTimeout(timer);
  }, [t]);

  return (
    <div className="px-6 py-5 space-y-6">
      <HomeHeader onCreate={onCreate} value={ui} onChange={setUi} />
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-44 rounded-xl bg-gray-100 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <ProjectsGrid
          items={data}
          onDelete={onDelete}
          onRename={onRename}
          onOpen={onOpen}
        />
      )}
      <TourGuide
        steps={tourSteps}
        storageKey="video-processor-home"
        onComplete={() => console.log("Tour completed")}
        onSkip={() => console.log("Tour skipped")}
      />
    </div>
  );
}
