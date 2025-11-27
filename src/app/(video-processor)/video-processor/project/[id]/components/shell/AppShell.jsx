"use client";
import { useEffect, useMemo, useState } from "react";
import LeftRail from "../rail/LeftRail";
import PanelSwitch from "../panel/PanelSwitch";
import PreviewStage from "../stage/PreviewStage";
import Timeline from "../timeline/Timeline";
import EditVideoPanel from "../inspector/EditVideoPanel";
import EditAudioPanel from "../inspector/EditAudioPanel";
import VoiceoverAudioPanel from "../inspector/VoiceoverAudioPanel";
import useAudioExtract from "../../hooks/tools/useAudioExtract";
import { useSubtitleTools } from "../../context";
import TourGuide from "@/shared/components/TourGuide";
import { useTranslations } from "next-intl";
import {
  ProjectProvider,
  useProject,
  MediaProvider,
  SelectionProvider,
  useSelection,
  NavigationProvider,
  useNavigation,
  StageProvider,
  useStage,
  TimelineProvider,
  SubtitleProvider,
  SubtitleToolsProvider,
  HardsubProvider,
} from "../../context";
import { VoiceoverProvider } from "../../context/VoiceoverContext";
import { VoiceLoadingProvider } from "../../context/VoiceLoadingContext";

function AppShellContent() {
  const t = useTranslations();
  const project = useProject();
  const selection = useSelection();
  const navigation = useNavigation();
  const stage = useStage();
  const subtitleTools = useSubtitleTools();
  const [tourSteps, setTourSteps] = useState([]);

  const { projectId, dataProject, updateTimelineFromData, reloadProjectTimeline, fps, lengthSec } =
    project;
  const { selectedVideoClip, selectedAudioClip } = selection;
  const { activeNav, libWidth, libRef, onStartResizeLib } = navigation;
  const { timelineH, overlay, onStartResizeTimeline } = stage;

  const {
    loading: subLoading,
    loadingAction,
    loadingText,
    progress,
    status,
    phase,
  } = subtitleTools;

  const {
    loading: audioLoading,
    loadingAction: audioLoadingAction,
    loadingText: audioLoadingText,
    progress: audioProgress,
    status: audioStatus,
    phase: audioPhase,
    startTachAudio,
  } = useAudioExtract({
    projectId: projectId,
    selectedClip: selectedVideoClip,
    onReloadProject: () => {
      reloadProjectTimeline?.();
    },
  });

  const panelLoading = subLoading || audioLoading;
  const panelAction = audioLoading ? audioLoadingAction : loadingAction;
  const panelText = audioLoading ? audioLoadingText : loadingText;
  const panelProgress = audioLoading ? audioProgress : progress;
  const panelStatus = audioLoading ? audioStatus : status;
  const panelPhase = audioLoading ? audioPhase : phase;

  const tlRev = dataProject?.timeline?.rev ?? 0;

  const styleVars = useMemo(
    () => ({
      ["--rail-w"]: "clamp(64px, 6vw, 84px)",
      ["--lib-w"]: libWidth,
      ["--timeline-h"]: `${timelineH}px`,
      ["--main-h"]: overlay ? "100svh" : "calc(100svh - var(--timeline-h))",
    }),
    [libWidth, timelineH, overlay]
  );

  const ease = "cubic-bezier(.2,.8,.2,1)";

  useEffect(() => {
    // Wait for DOM to be ready
    const timer = setTimeout(() => {
      const steps = [
        {
          target: '[data-tour="left-rail"]',
          title: t("tour.project.left_rail.title"),
          description: t("tour.project.left_rail.description"),
          placement: "right",
        },
        {
          target: '[data-tour="media-panel"]',
          title: t("tour.project.media_panel.title"),
          description: t("tour.project.media_panel.description"),
          placement: "right",
        },
        {
          target: '[data-tour="preview-stage"]',
          title: t("tour.project.preview_stage.title"),
          description: t("tour.project.preview_stage.description"),
          placement: "left",
        },
        {
          target: '[data-tour="timeline"]',
          title: t("tour.project.timeline.title"),
          description: t("tour.project.timeline.description"),
          placement: "top",
        },
        {
          target: '[data-tour="inspector"]',
          title: t("tour.project.inspector.title"),
          description: t("tour.project.inspector.description"),
          placement: "left",
        },
      ];
      setTourSteps(steps);
    }, 1000);

    return () => clearTimeout(timer);
  }, [t]);

  return (
    <div
      className="h-[100svh] w-full flex overflow-hidden bg-white text-[--color-text-strong]"
      style={styleVars}
    >
      <aside className="w-[var(--rail-w)] h-full border-r border-border bg-white" data-tour="left-rail">
        <LeftRail />
      </aside>

      <VoiceoverProvider>
        <VoiceLoadingProvider>
          <div className="relative flex-1 flex flex-col min-w-0">
          <TimelineProvider
            key={`tlp-${projectId}`}
            fps={fps}
            lengthSec={lengthSec}
            initialPxPerSec={20}
            minClipPx={24}
            absMinPxPerSec={0.2}
            maxPxPerSecBase={200}
            maxPxPerFrame={8}
          >
            <div className="w-full" style={{ height: "var(--main-h)" }}>
              <div className="h-full w-full flex min-h-0">
                <section
                  ref={libRef}
                  data-tour="media-panel"
                  className="h-full min-w-[240px] border-r border-border bg-white"
                  style={{
                    width: "var(--lib-w)",
                    transition: "width 160ms ease",
                  }}
                >
                  <PanelSwitch />
                </section>

                <div
                  onPointerDown={onStartResizeLib}
                  className="w-1.5 cursor-col-resize bg-transparent hover:bg-brand/20 active:bg-brand/30"
                />

                <main className="flex-1 h-full min-w-0 bg-white flex">
                  <div className="flex-1 mr-2 min-w-0" data-tour="preview-stage">
                    <PreviewStage />
                  </div>

                  <div data-tour="inspector">
                    {activeNav === "voiceover" && !selectedVideoClip && !selectedAudioClip ? (
                      <VoiceoverAudioPanel />
                    ) : selectedAudioClip ? (
                      <EditAudioPanel />
                    ) : (
                      <EditVideoPanel
                        loading={panelLoading}
                        loadingAction={panelAction}
                        loadingText={panelText}
                        loadingProgress={panelProgress}
                        loadingStatus={panelStatus}
                        loadingPhase={panelPhase}
                        onTachAudio={() => startTachAudio()}
                      />
                    )}
                  </div>
                </main>
              </div>
            </div>

            {!overlay && (
              <>
                <div
                  onPointerDown={onStartResizeTimeline}
                  className="h-2 cursor-row-resize bg-transparent hover:bg-brand/20 active:bg-brand/30"
                />
                <section
                  data-tour="timeline"
                  className="w-full border-t border-border bg-white"
                  style={{
                    height: "var(--timeline-h)",
                    transition: `height 180ms ${ease}`,
                  }}
                >
                  <Timeline key={`tl-${projectId}`} />
                </section>
              </>
            )}

            {overlay && (
              <div
                className="absolute inset-x-0 bottom-0 z-40 shadow-[0_-12px_28px_rgba(0,0,0,.08)]"
                style={{
                  height: "var(--timeline-h)",
                  transition: `height 180ms ${ease}`,
                }}
              >
                <div
                  onPointerDown={onStartResizeTimeline}
                  className="h-2 cursor-row-resize bg-transparent hover:bg-brand/20 active:bg-brand/30"
                />
                <section data-tour="timeline" className="h-[calc(100%-0.5rem)] w-full border-t border-border bg-white">
                  <Timeline key={`tl-${projectId}`} />
                </section>
              </div>
            )}
          </TimelineProvider>
        </div>
        </VoiceLoadingProvider>
      </VoiceoverProvider>
      <TourGuide
        steps={tourSteps}
        storageKey="video-processor-project"
        onComplete={() => console.log("Project tour completed")}
        onSkip={() => console.log("Project tour skipped")}
      />
    </div>
  );
}

export default function AppShell({ id }) {
  return (
    <ProjectProvider projectId={id}>
      <SubtitleProvider>
        <MediaProvider>
          <SelectionProvider>
            <SubtitleToolsProvider>
              <HardsubProvider>
                <NavigationProvider>
                  <StageProvider>
                    <AppShellContent />
                  </StageProvider>
                </NavigationProvider>
              </HardsubProvider>
            </SubtitleToolsProvider>
          </SelectionProvider>
        </MediaProvider>
      </SubtitleProvider>
    </ProjectProvider>
  );
}
