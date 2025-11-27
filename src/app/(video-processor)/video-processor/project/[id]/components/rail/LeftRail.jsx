"use client";
import React from "react";
import { FolderOpen, Music, MicVocal, Captions } from "lucide-react";
import { useNavigation } from "../../context";
import { useTranslations } from "next-intl";
import Link from "next/link";

function LeftRail() {
  const t = useTranslations();
  const { activeNav, setActiveNav } = useNavigation();

  const NAV_ITEMS = [
    {
      key: "media",
      label: t("video_processor.inspector.rail.media"),
      Icon: FolderOpen,
    },
    {
      key: "audio",
      label: t("video_processor.inspector.rail.audio"),
      Icon: Music,
    },
    {
      key: "subtitle",
      label: t("video_processor.inspector.rail.subtitle"),
      Icon: Captions,
    },
    {
      key: "voiceover",
      label: t("video_processor.inspector.rail.voiceover"),
      Icon: MicVocal,
    },
  ];
  return (
    <aside
      className="
        h-full w-[clamp(64px,6vw,84px)]
        border-r border-border bg-white
        flex flex-col items-center py-3
      "
    >
      <Link href="/">
        <img src="/images/Logo_1.png" alt="Logo" className="mb-3 h-9 w-9 " />
      </Link>

      <nav className="flex-1 w-full overflow-y-auto">
        <ul className="flex flex-col items-center gap-2 px-2">
          {NAV_ITEMS.map(({ key, label, Icon }) => {
            const isActive = activeNav === key;
            return (
              <li key={key} className="w-full">
                <button
                  type="button"
                  onClick={() => setActiveNav(key)}
                  className={`group w-full rounded-xl px-2 py-2 transition
                    ${
                      isActive
                        ? "bg-brand-50 ring-1 ring-inset ring-brand-200"
                        : "hover:bg-brand-50/60"
                    }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <Icon
                      className={`h-6 w-6
                        ${isActive ? "text-brand-600" : "text-brand-900"}
                      `}
                      aria-hidden="true"
                    />
                    <span
                      className={`text-[11px] leading-none font-medium
                        ${isActive ? "text-brand-700" : "text-brand-900"}
                      `}
                    >
                      {label}
                    </span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

export default LeftRail;
