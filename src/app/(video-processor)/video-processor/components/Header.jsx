"use client";
import Popover from "../../../../shared/ui/Popover";
import RatioBadge from "./RatioBadge";
import { CiFilter, CiSearch, CiVideoOn } from "react-icons/ci";
import useHomeHeader from "../hooks/useHomeHeader";
import { useTranslations } from "next-intl";

export default function HomeHeader({ onCreate, value, onChange }) {
  const t = useTranslations();
  const {
    open,
    q,
    setQ,
    aspectLabel,
    handleCreateClick,
    handleAspectClick,
    handleCreateItemClick,
    handleAspectItemClick,
  } = useHomeHeader({ value, onChange });

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
      <div className="relative" data-popover>
        <button
          onClick={handleCreateClick}
          data-tour="create-video"
          className="flex items-center gap-2 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-text-strong shadow-sm hover:bg-brand-100"
          aria-expanded={open.create}
        >
          <CiVideoOn size={20} />
          <span className="font-medium">{t("video_processor.create_video")}</span>
        </button>

        <Popover open={open.create}>
          <div className="px-2 pb-2 text-sm font-semibold">{t("video_processor.video")}</div>
          <div className="flex w-72 flex-col">
            {[
              { k: "canvas", t: t("video_processor.empty_canvas"), s: "" },
              { k: "16:9", t: "16:9", s: t("video_processor.platforms.youtube_facebook") },
              { k: "9:16", t: "9:16", s: t("video_processor.platforms.tiktok_youtube_instagram") },
              { k: "1:1", t: "1:1", s: t("video_processor.platforms.instagram_linkedin_facebook") },
            ].map((it) => (
              <button
                key={it.k}
                onClick={() => {
                  handleCreateItemClick(it.k);
                  onCreate(it.k);
                }}
                className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-surface-50"
              >
                <RatioBadge value={it.k} />
                <span className="flex-1 text-left">
                  <div className="text-sm">{it.t}</div>
                  {it.s ? (
                    <div className="text-xs text-text-muted">{it.s}</div>
                  ) : null}
                </span>
              </button>
            ))}
          </div>
        </Popover>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative" data-popover>
          <button
            onClick={handleAspectClick}
            data-tour="filter"
            className="flex items-center gap-1 border border-brand-200 rounded-lg px-3 py-2 hover:bg-surface-50"
            aria-expanded={open.aspect}
          >
            <CiFilter />
            <span className="text-sm">{aspectLabel}</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              className="opacity-80"
            >
              <path d="M7 10l5 5 5-5" fill="currentColor" />
            </svg>
          </button>
          <Popover open={open.aspect} className="w-44">
            <div className="flex flex-col">
              {[t("video_processor.all"), "16:9", "9:16", "1:1"].map((label) => {
                const val = label === t("video_processor.all") ? "" : label;
                const active = value.aspect === val;
                return (
                  <button
                    key={label}
                    onClick={() => handleAspectItemClick(val)}
                    className={
                      (active
                        ? "bg-brand-50 text-brand-700 border border-brand-200 "
                        : "hover:bg-surface-50 ") +
                      "rounded-lg px-3 py-2 text-left"
                    }
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </Popover>
        </div>

        <div className="relative">
          <CiSearch
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            size={20}
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            data-tour="search"
            placeholder={t("video_processor.search_placeholder")}
            className="w-64 rounded-lg border border-border bg-white pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 "
          />
        </div>
      </div>
    </div>
  );
}
