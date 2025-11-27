"use client";
import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import VoiceoverTimeline from "./VoiceoverTimeline";
import { useProject, useSubtitle } from "../../../context";
import { useVoiceover } from "../../../context/VoiceoverContext";
import { useTranslations } from "next-intl";

export default function VoiceoverPanel({ visible = true }) {
  const t = useTranslations();
  const { dataProject, updateDataProject } = useProject();
  const { subtitleStyle } = useSubtitle();
  const {
    setSegments: setContextSegments,
    setSelectedIndex: setContextSelectedIndex,
    voiceOptions: contextVoiceOptions,
    setVoiceOptions: setContextVoiceOptions,
  } = useVoiceover();
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [localSegments, setLocalSegments] = useState(null);
  const [isLoadingSegments, setIsLoadingSegments] = useState(true);
  const lastDataProjectIdRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const isSavingRef = useRef(false);
  const isSyncingRef = useRef(false);
  const lastSyncedSegmentsRef = useRef(null);
  const segmentsRef = useRef(null);

  useEffect(() => {
    setLocalSegments(null);
    setSelectedIndex(null);
    setIsLoadingSegments(true);
    lastSyncedSegmentsRef.current = null;
    isSyncingRef.current = false;
    isSavingRef.current = false;
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    lastDataProjectIdRef.current = null;
  }, []);

  useEffect(() => {
    if (dataProject?.id && dataProject?.timeline?.tracks) {
      const isInitialLoad =
        lastDataProjectIdRef.current === null ||
        lastDataProjectIdRef.current !== dataProject.id;

      if (isInitialLoad) {
        const subtitleTrack = dataProject.timeline.tracks.find(
          (track) => track.kind === "subtitle"
        );

        if (subtitleTrack?.clips) {
          const segmentsFromData = subtitleTrack.clips
            .map((clip) => {
              const segment = {
                id: clip.id,
                text: clip.text || clip.label || "",
                start: clip.start || 0,
                duration: clip.durationSec || 0,
                lang: clip.lang,
                assetId: clip.assetId,
                type: clip.type || "subtitle",
                voiceId: clip.voiceId || null,
                wordTiming: clip.wordTiming || null,
                voiceModelId:
                  clip.voiceModelId ||
                  (clip.voiceId ? "eleven_multilingual_v2" : null),
                voiceSpeed:
                  clip.voiceSpeed !== undefined
                    ? clip.voiceSpeed
                    : clip.voiceId
                    ? 0.75
                    : null,
                voiceStability:
                  clip.voiceStability !== undefined
                    ? clip.voiceStability
                    : clip.voiceId
                    ? 0.6
                    : null,
                voiceSimilarity:
                  clip.voiceSimilarity !== undefined
                    ? clip.voiceSimilarity
                    : clip.voiceId
                    ? 0.8
                    : null,
                voiceStyleExaggeration:
                  clip.voiceStyleExaggeration !== undefined
                    ? clip.voiceStyleExaggeration
                    : clip.voiceId
                    ? 0.1
                    : null,
                voiceSpeakerBoost:
                  clip.voiceSpeakerBoost !== undefined
                    ? clip.voiceSpeakerBoost
                    : clip.voiceId
                    ? true
                    : null,
              };
              return segment;
            })
            .sort((a, b) => a.start - b.start);

          lastDataProjectIdRef.current = dataProject.id;

          setLocalSegments(segmentsFromData);
          setIsLoadingSegments(false);
        } else {
          setLocalSegments([]);
          setIsLoadingSegments(false);
          lastDataProjectIdRef.current = dataProject.id;
        }
      } else if (isSavingRef.current) {
        return;
      }
    }
  }, [dataProject?.id, dataProject?.timeline?.tracks]);

  const segments = useMemo(() => {
    if (localSegments !== null && localSegments.length > 0) {
      const hasMissingWordTiming = localSegments.some(
        (seg) =>
          !seg.wordTiming ||
          (Array.isArray(seg.wordTiming) && seg.wordTiming.length === 0)
      );

      if (hasMissingWordTiming && dataProject?.timeline?.tracks) {
        const subtitleTrack = dataProject.timeline.tracks.find(
          (track) => track.kind === "subtitle"
        );

        if (subtitleTrack?.clips) {
          const clipsMap = new Map();
          subtitleTrack.clips.forEach((clip) => {
            if (clip?.id && clip?.wordTiming) {
              clipsMap.set(String(clip.id), clip.wordTiming);
            }
          });

          const mergedSegments = localSegments.map((seg) => {
            if (
              (!seg.wordTiming ||
                (Array.isArray(seg.wordTiming) &&
                  seg.wordTiming.length === 0)) &&
              seg.id
            ) {
              const wordTiming = clipsMap.get(String(seg.id));
              if (wordTiming) {
                return { ...seg, wordTiming };
              }
            }
            return seg;
          });

          const needsUpdate = mergedSegments.some((seg, idx) => {
            const original = localSegments[idx];
            return (
              original &&
              (!original.wordTiming ||
                (Array.isArray(original.wordTiming) &&
                  original.wordTiming.length === 0)) &&
              seg.wordTiming
            );
          });

          if (needsUpdate) {
            console.log(
              "VoiceoverPanel Debug - Merged wordTiming into localSegments:",
              {
                originalCount: localSegments.length,
                mergedCount: mergedSegments.length,
                firstSegmentHasWordTiming: !!mergedSegments[0]?.wordTiming,
                firstSegmentWordTiming: mergedSegments[0]?.wordTiming,
              }
            );

            setTimeout(() => {
              setLocalSegments(mergedSegments);
            }, 0);
          }

          return mergedSegments;
        }
      }

      return localSegments;
    }

    if (!dataProject?.timeline?.tracks) return [];

    const subtitleTrack = dataProject.timeline.tracks.find(
      (track) => track.kind === "subtitle"
    );

    if (!subtitleTrack?.clips || subtitleTrack.clips.length === 0) {
      return [];
    }

    const segmentsFromData = subtitleTrack.clips
      .map((clip) => {
        const segment = {
          id: clip.id,
          text: clip.text || clip.label || "",
          start: clip.start || 0,
          duration: clip.durationSec || 0,
          lang: clip.lang,
          assetId: clip.assetId,
          type: clip.type || "subtitle",
          voiceId: clip.voiceId || null,
          wordTiming: clip.wordTiming || null,
          voiceModelId:
            clip.voiceModelId ||
            (clip.voiceId ? "eleven_multilingual_v2" : null),
          voiceSpeed:
            clip.voiceSpeed !== undefined
              ? clip.voiceSpeed
              : clip.voiceId
              ? 0.75
              : null,
          voiceStability:
            clip.voiceStability !== undefined
              ? clip.voiceStability
              : clip.voiceId
              ? 0.6
              : null,
          voiceSimilarity:
            clip.voiceSimilarity !== undefined
              ? clip.voiceSimilarity
              : clip.voiceId
              ? 0.8
              : null,
          voiceStyleExaggeration:
            clip.voiceStyleExaggeration !== undefined
              ? clip.voiceStyleExaggeration
              : clip.voiceId
              ? 0.1
              : null,
          voiceSpeakerBoost:
            clip.voiceSpeakerBoost !== undefined
              ? clip.voiceSpeakerBoost
              : clip.voiceId
              ? true
              : null,
        };
        return segment;
      })
      .sort((a, b) => a.start - b.start);

    return segmentsFromData;
  }, [localSegments, dataProject?.timeline?.tracks]);

  useEffect(() => {
    segmentsRef.current = segments;
  }, [segments]);

  const segmentsSyncKey = useMemo(() => {
    if (!segments || segments.length === 0) return null;
    return segments.map((s) => `${s.id}:${s.voiceId || ""}`).join("|");
  }, [
    segments?.length,
    JSON.stringify(
      segments?.map((s) => ({ id: s.id, voiceId: s.voiceId || "" }))
    ),
  ]);

  useEffect(() => {
    if (!dataProject?.id) {
      setIsLoadingSegments(false);
      return;
    }

    if (
      dataProject.id !== lastDataProjectIdRef.current &&
      lastDataProjectIdRef.current !== null
    ) {
      lastDataProjectIdRef.current = dataProject.id;
      setLocalSegments(null);
      setIsLoadingSegments(true);
    }

    if (localSegments === null && dataProject?.timeline?.tracks) {
      setIsLoadingSegments(true);

      requestAnimationFrame(() => {
        const subtitleTrack = dataProject.timeline.tracks.find(
          (track) => track.kind === "subtitle"
        );

        if (subtitleTrack?.clips) {
          const segmentsFromData = subtitleTrack.clips
            .map((clip) => ({
              id: clip.id,
              text: clip.text || clip.label || "",
              start: clip.start || 0,
              duration: clip.durationSec || 0,
              lang: clip.lang,
              assetId: clip.assetId,
              type: clip.type || "subtitle",
              voiceId: clip.voiceId || null,
              wordTiming: clip.wordTiming || null,
              voiceModelId:
                clip.voiceModelId ||
                (clip.voiceId ? "eleven_multilingual_v2" : null),
              voiceSpeed:
                clip.voiceSpeed !== undefined
                  ? clip.voiceSpeed
                  : clip.voiceId
                  ? 0.75
                  : null,
              voiceStability:
                clip.voiceStability !== undefined
                  ? clip.voiceStability
                  : clip.voiceId
                  ? 0.6
                  : null,
              voiceSimilarity:
                clip.voiceSimilarity !== undefined
                  ? clip.voiceSimilarity
                  : clip.voiceId
                  ? 0.8
                  : null,
              voiceStyleExaggeration:
                clip.voiceStyleExaggeration !== undefined
                  ? clip.voiceStyleExaggeration
                  : clip.voiceId
                  ? 0.1
                  : null,
              voiceSpeakerBoost:
                clip.voiceSpeakerBoost !== undefined
                  ? clip.voiceSpeakerBoost
                  : clip.voiceId
                  ? true
                  : null,
            }))
            .sort((a, b) => a.start - b.start);

          setLocalSegments(segmentsFromData);

          if (
            selectedIndex !== null &&
            selectedIndex >= segmentsFromData.length
          ) {
            setSelectedIndex(
              segmentsFromData.length > 0 ? segmentsFromData.length - 1 : null
            );
          }
        } else {
          setLocalSegments([]);
          setSelectedIndex(null);
        }

        setIsLoadingSegments(false);
      });
    } else if (localSegments !== null) {
      setIsLoadingSegments(false);
    } else if (!dataProject?.timeline?.tracks) {
      setIsLoadingSegments(false);
    }
  }, [dataProject?.id]);

  useEffect(() => {
    const handleTimelineUpdate = (e) => {
      if (isSavingRef.current) return;
      
      if (e.detail?.lane === "text") {
        const updatedClips = e.detail.clips || [];
        if (updatedClips.length === 0) return;

        requestAnimationFrame(() => {
          setLocalSegments((prev) => {
            const prevSegmentsMap = new Map();
            if (prev) {
              prev.forEach((seg) => {
                if (seg?.id) {
                  prevSegmentsMap.set(String(seg.id), seg);
                }
              });
            }

            const newSegments = updatedClips
              .map((clip) => {
                const prevSegment = prevSegmentsMap.get(String(clip.id));
                return {
                  id: clip.id,
                  text: clip.text || "",
                  start: clip.start || 0,
                  duration: clip.durationSec || clip.duration || 0,
                  lang: clip.lang,
                  assetId: clip.assetId,
                  type: clip.type || "subtitle",
                  voiceId:
                    clip.voiceId !== undefined &&
                    clip.voiceId !== null &&
                    clip.voiceId !== ""
                      ? clip.voiceId
                      : prevSegment?.voiceId !== undefined &&
                        prevSegment?.voiceId !== null
                      ? prevSegment.voiceId
                      : null,
                  wordTiming:
                    clip.wordTiming || prevSegment?.wordTiming || null,
                  voiceModelId:
                    clip.voiceModelId !== undefined
                      ? clip.voiceModelId
                      : prevSegment?.voiceModelId ||
                        (clip.voiceId || prevSegment?.voiceId
                          ? "eleven_multilingual_v2"
                          : null),
                  voiceSpeed:
                    clip.voiceSpeed !== undefined
                      ? clip.voiceSpeed
                      : prevSegment?.voiceSpeed !== undefined
                      ? prevSegment.voiceSpeed
                      : clip.voiceId || prevSegment?.voiceId
                      ? 0.75
                      : null,
                  voiceStability:
                    clip.voiceStability !== undefined
                      ? clip.voiceStability
                      : prevSegment?.voiceStability !== undefined
                      ? prevSegment.voiceStability
                      : clip.voiceId || prevSegment?.voiceId
                      ? 0.6
                      : null,
                  voiceSimilarity:
                    clip.voiceSimilarity !== undefined
                      ? clip.voiceSimilarity
                      : prevSegment?.voiceSimilarity !== undefined
                      ? prevSegment.voiceSimilarity
                      : clip.voiceId || prevSegment?.voiceId
                      ? 0.8
                      : null,
                  voiceStyleExaggeration:
                    clip.voiceStyleExaggeration !== undefined
                      ? clip.voiceStyleExaggeration
                      : prevSegment?.voiceStyleExaggeration !== undefined
                      ? prevSegment.voiceStyleExaggeration
                      : clip.voiceId || prevSegment?.voiceId
                      ? 0.1
                      : null,
                  voiceSpeakerBoost:
                    clip.voiceSpeakerBoost !== undefined
                      ? clip.voiceSpeakerBoost
                      : prevSegment?.voiceSpeakerBoost !== undefined
                      ? prevSegment.voiceSpeakerBoost
                      : clip.voiceId || prevSegment?.voiceId
                      ? true
                      : null,
                };
              })
              .sort((a, b) => a.start - b.start);

            setTimeout(() => {
              setSelectedIndex((prevIndex) => {
                if (prevIndex !== null && prevIndex >= newSegments.length) {
                  return newSegments.length > 0 ? newSegments.length - 1 : null;
                }
                return prevIndex;
              });
            }, 0);

            return newSegments;
          });
        });
      }
    };

    window.addEventListener("timeline.updateClips", handleTimelineUpdate);
    return () => {
      window.removeEventListener("timeline.updateClips", handleTimelineUpdate);
    };
  }, []);

  const hasTimeline = segments.length > 0;

  const handleSegmentsChange = useCallback(
    async (newSegments) => {
      if (!dataProject?.id || !dataProject?.timeline?.tracks) {
        return;
      }

      const validSegments = newSegments.filter((seg) => seg != null);

      isSyncingRef.current = true;
      setLocalSegments([...validSegments]);
      const segmentsKey = validSegments
        .map((s) => `${s.id}:${s.voiceId || ""}`)
        .join("|");
      lastSyncedSegmentsRef.current = segmentsKey;
      
      if (dataProject?.timeline?.tracks) {
        const subtitleTrackIndex = dataProject.timeline.tracks.findIndex(
          (track) => track.kind === "subtitle"
        );
        if (subtitleTrackIndex >= 0) {
          const updatedClips = validSegments.map((segment) => ({
            id: segment.id || `clip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            text: segment.text || "",
            start: segment.start || 0,
            durationSec: segment.duration || 0,
            duration: segment.duration || 0,
            lang: segment.lang,
            assetId: segment.assetId,
            type: segment.type || "subtitle",
            voiceId: segment.voiceId || null,
            wordTiming: segment.wordTiming || null,
            voiceModelId: segment.voiceModelId || null,
            voiceSpeed: segment.voiceSpeed !== undefined ? segment.voiceSpeed : null,
            voiceStability: segment.voiceStability !== undefined ? segment.voiceStability : null,
            voiceSimilarity: segment.voiceSimilarity !== undefined ? segment.voiceSimilarity : null,
            voiceStyleExaggeration: segment.voiceStyleExaggeration !== undefined ? segment.voiceStyleExaggeration : null,
            voiceSpeakerBoost: segment.voiceSpeakerBoost !== undefined ? segment.voiceSpeakerBoost : null,
          }));
          
          setTimeout(() => {
            const event = new CustomEvent("timeline.updateClips", {
              detail: {
                lane: "text",
                clips: updatedClips,
              },
            });
            window.dispatchEvent(event);
          }, 0);
        }
      }
      
      setTimeout(() => {
        isSyncingRef.current = false;
      }, 50);

      if (isSavingRef.current) {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        const segmentsToSave = [...validSegments];
        saveTimeoutRef.current = setTimeout(async () => {
          if (
            !isSavingRef.current &&
            dataProject?.id &&
            dataProject?.timeline?.tracks
          ) {
            const subtitleTrackIndex = dataProject.timeline.tracks.findIndex(
              (track) => track.kind === "subtitle"
            );
            if (subtitleTrackIndex >= 0) {
              const updatedClips = segmentsToSave.map((segment) => ({
                id:
                  segment.id ||
                  `clip_${Date.now()}_${Math.random()
                    .toString(36)
                    .substr(2, 9)}`,
                text: segment.text || "",
                start: segment.start || 0,
                durationSec: segment.duration || 0,
                duration: segment.duration || 0,
                lang: segment.lang,
                assetId: segment.assetId,
                type: segment.type || "subtitle",
                voiceId: segment.voiceId || null,
                wordTiming: segment.wordTiming || null,
                voiceModelId: segment.voiceModelId || null,
                voiceSpeed:
                  segment.voiceSpeed !== undefined ? segment.voiceSpeed : null,
                voiceStability:
                  segment.voiceStability !== undefined
                    ? segment.voiceStability
                    : null,
                voiceSimilarity:
                  segment.voiceSimilarity !== undefined
                    ? segment.voiceSimilarity
                    : null,
                voiceStyleExaggeration:
                  segment.voiceStyleExaggeration !== undefined
                    ? segment.voiceStyleExaggeration
                    : null,
                voiceSpeakerBoost:
                  segment.voiceSpeakerBoost !== undefined
                    ? segment.voiceSpeakerBoost
                    : null,
              }));
              const updatedTracks = [...dataProject.timeline.tracks];
              updatedTracks[subtitleTrackIndex] = {
                ...updatedTracks[subtitleTrackIndex],
                clips: updatedClips,
              };
              const currentRev = Number(dataProject.timeline?.rev || 0);
              const updatedTimeline = {
                ...dataProject.timeline,
                tracks: updatedTracks,
                rev: currentRev,
              };
              isSavingRef.current = true;
              try {
                const { default: axiosClient } = await import(
                  "@/shared/lib/axiosClient"
                );
                const { data } = await axiosClient.put(
                  `/api/video-processor/project/${dataProject.id}/timeline`,
                  { timeline: updatedTimeline }
                );
                
                if (data?.success && data?.timeline) {
                  if (updateDataProject) {
                    updateDataProject((prev) => {
                      if (!prev) return prev;
                      return {
                        ...prev,
                        timeline: {
                          ...prev.timeline,
                          ...data.timeline,
                        },
                      };
                    });
                  }
                  
                  setTimeout(() => {
                    const event = new CustomEvent("timeline.updateClips", {
                      detail: {
                        lane: "all",
                        timeline: data.timeline,
                      },
                    });
                    window.dispatchEvent(event);
                  }, 50);
                }
                
                isSavingRef.current = false;
              } catch (err) {
                isSavingRef.current = false;
              }
            }
          }
        }, 500);
        return;
      }

      let newSelectedIndex = selectedIndex;
      if (selectedIndex !== null && selectedIndex >= validSegments.length) {
        newSelectedIndex =
          validSegments.length > 0 ? validSegments.length - 1 : null;
        if (newSelectedIndex !== selectedIndex) {
          setSelectedIndex(newSelectedIndex);
        }
      }

      const subtitleTrackIndex = dataProject.timeline.tracks.findIndex(
        (track) => track.kind === "subtitle"
      );

      if (subtitleTrackIndex < 0) return;

      const updatedClips = validSegments.map((segment) => ({
        id:
          segment.id ||
          `clip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        text: segment.text || "",
        start: segment.start || 0,
        durationSec: segment.duration || 0,
        duration: segment.duration || 0,
        lang: segment.lang,
        assetId: segment.assetId,
        type: segment.type || "subtitle",
        voiceId: segment.voiceId || null,
        wordTiming: segment.wordTiming || null,
        voiceModelId: segment.voiceModelId || null,
        voiceSpeed:
          segment.voiceSpeed !== undefined ? segment.voiceSpeed : null,
        voiceStability:
          segment.voiceStability !== undefined ? segment.voiceStability : null,
        voiceSimilarity:
          segment.voiceSimilarity !== undefined
            ? segment.voiceSimilarity
            : null,
        voiceStyleExaggeration:
          segment.voiceStyleExaggeration !== undefined
            ? segment.voiceStyleExaggeration
            : null,
        voiceSpeakerBoost:
          segment.voiceSpeakerBoost !== undefined
            ? segment.voiceSpeakerBoost
            : null,
      }));

      const updatedTracks = [...dataProject.timeline.tracks];
      updatedTracks[subtitleTrackIndex] = {
        ...updatedTracks[subtitleTrackIndex],
        clips: updatedClips,
      };

      let currentRev = Number(dataProject.timeline?.rev || 0);

      const updatedTimeline = {
        ...dataProject.timeline,
        tracks: updatedTracks,
        rev: currentRev,
      };

      isSavingRef.current = true;

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }

      (async () => {
        try {
          const { default: axiosClient } = await import(
            "@/shared/lib/axiosClient"
          );

          const putOnce = async (revToUse) => {
            const { data } = await axiosClient.put(
              `/api/video-processor/project/${dataProject.id}/timeline`,
              { timeline: { ...updatedTimeline, rev: revToUse } }
            );

            return data;
          };

          try {
            const data = await putOnce(currentRev);
            if (data?.success && data?.timeline) {
              if (updateDataProject) {
                updateDataProject((prev) => {
                  if (!prev) return prev;
                  const prevTracks = prev.timeline?.tracks || [];
                  const newTracks = data.timeline.tracks || [];

                  const mergedTracks = newTracks.map((newTrack) => {
                    if (newTrack.kind === "subtitle" && newTrack.clips) {
                      const prevTrack = prevTracks.find(
                        (t) => t.kind === "subtitle"
                      );
                      if (prevTrack?.clips) {
                        const mergedClips = newTrack.clips.map((newClip) => {
                          const prevClip = prevTrack.clips.find(
                            (c) => c.id === newClip.id
                          );
                          const mergedClip = { ...newClip };
                          if (prevClip?.wordTiming && !newClip.wordTiming) {
                            mergedClip.wordTiming = prevClip.wordTiming;
                          }
                          if (
                            prevClip?.voiceId !== undefined &&
                            prevClip?.voiceId !== null &&
                            prevClip?.voiceId !== ""
                          ) {
                            if (
                              !newClip.voiceId ||
                              newClip.voiceId === null ||
                              newClip.voiceId === ""
                            ) {
                              mergedClip.voiceId = prevClip.voiceId;
                            }
                          }
                          if (prevClip?.voiceModelId && !newClip.voiceModelId) {
                            mergedClip.voiceModelId = prevClip.voiceModelId;
                          }
                          if (prevClip?.voiceSpeed !== undefined && newClip.voiceSpeed === undefined) {
                            mergedClip.voiceSpeed = prevClip.voiceSpeed;
                          }
                          if (prevClip?.voiceStability !== undefined && newClip.voiceStability === undefined) {
                            mergedClip.voiceStability = prevClip.voiceStability;
                          }
                          if (prevClip?.voiceSimilarity !== undefined && newClip.voiceSimilarity === undefined) {
                            mergedClip.voiceSimilarity = prevClip.voiceSimilarity;
                          }
                          if (prevClip?.voiceStyleExaggeration !== undefined && newClip.voiceStyleExaggeration === undefined) {
                            mergedClip.voiceStyleExaggeration = prevClip.voiceStyleExaggeration;
                          }
                          if (prevClip?.voiceSpeakerBoost !== undefined && newClip.voiceSpeakerBoost === undefined) {
                            mergedClip.voiceSpeakerBoost = prevClip.voiceSpeakerBoost;
                          }
                          return mergedClip;
                        });
                        return { ...newTrack, clips: mergedClips };
                      }
                    }
                    return newTrack;
                  });

                  return {
                    ...prev,
                    timeline: {
                      ...prev.timeline,
                      ...data.timeline,
                      tracks:
                        mergedTracks.length > 0
                          ? mergedTracks
                          : data.timeline.tracks || prev.timeline?.tracks,
                    },
                  };
                });
                
                setTimeout(() => {
                  const event = new CustomEvent("timeline.updateClips", {
                    detail: {
                      lane: "all",
                      timeline: data.timeline,
                    },
                  });
                  window.dispatchEvent(event);
                  isSavingRef.current = false;
                }, 100);
              } else {
                setTimeout(() => {
                  const event = new CustomEvent("timeline.updateClips", {
                    detail: {
                      lane: "all",
                      timeline: data.timeline,
                    },
                  });
                  window.dispatchEvent(event);
                  isSavingRef.current = false;
                }, 100);
              }
            } else {
              isSavingRef.current = false;
            }
          } catch (err) {
            const status = err?.response?.status;
            if (status === 409) {
              let retryCount = 0;
              const maxRetries = 3;
              let lastError = err;

              while (retryCount < maxRetries) {
                try {
                  const latest = await axiosClient.get(
                    `/api/video-processor/project/${dataProject.id}/timeline`
                  );
                  const serverRev = Number(
                    latest?.data?.timeline?.rev ?? latest?.data?.rev ?? 0
                  );

                  const serverTimeline = latest?.data?.timeline || latest?.data;
                  let finalTracks = [...updatedTracks];

                  if (serverTimeline?.tracks) {
                    const serverSubtitleTrack = serverTimeline.tracks.find(
                      (track) => track.kind === "subtitle"
                    );

                    if (serverSubtitleTrack?.clips) {
                      const serverClips = serverSubtitleTrack.clips;
                      const mergedClipsMap = new Map();

                      serverClips.forEach((serverClip) => {
                        mergedClipsMap.set(String(serverClip.id), {
                          ...serverClip,
                        });
                      });

                      updatedClips.forEach((ourClip) => {
                        mergedClipsMap.set(String(ourClip.id), { ...ourClip });
                      });

                      const mergedClips = Array.from(mergedClipsMap.values());

                      finalTracks[subtitleTrackIndex] = {
                        ...finalTracks[subtitleTrackIndex],
                        clips: mergedClips,
                      };
                    }
                  }

                  const updatedTimelineWithRev = {
                    ...serverTimeline,
                    tracks: finalTracks,
                    rev: serverRev,
                  };

                  const { data: retryData } = await axiosClient.put(
                    `/api/video-processor/project/${dataProject.id}/timeline`,
                    { timeline: updatedTimelineWithRev }
                  );

                  if (retryData?.success && retryData?.timeline) {
                    if (updateDataProject) {
                      updateDataProject((prev) => {
                        if (!prev) return prev;
                        const prevTracks = prev.timeline?.tracks || [];
                        const newTracks = retryData.timeline.tracks || [];

                        const mergedTracks = newTracks.map((newTrack) => {
                          if (newTrack.kind === "subtitle" && newTrack.clips) {
                            const prevTrack = prevTracks.find(
                              (t) => t.kind === "subtitle"
                            );
                            if (prevTrack?.clips) {
                              const mergedClips = newTrack.clips.map(
                                (newClip) => {
                                  const prevClip = prevTrack.clips.find(
                                    (c) => c.id === newClip.id
                                  );
                                  const mergedClip = { ...newClip };
                                  if (
                                    prevClip?.wordTiming &&
                                    !newClip.wordTiming
                                  ) {
                                    mergedClip.wordTiming = prevClip.wordTiming;
                                  }
                                  if (
                                    prevClip?.voiceId !== undefined &&
                                    prevClip?.voiceId !== null &&
                                    prevClip?.voiceId !== ""
                                  ) {
                                    if (
                                      !newClip.voiceId ||
                                      newClip.voiceId === null ||
                                      newClip.voiceId === ""
                                    ) {
                                      mergedClip.voiceId = prevClip.voiceId;
                                    }
                                  }
                                  return mergedClip;
                                }
                              );
                              return { ...newTrack, clips: mergedClips };
                            }
                          }
                          return newTrack;
                        });

                        return {
                          ...prev,
                          timeline: {
                            ...prev.timeline,
                            ...retryData.timeline,
                            tracks:
                              mergedTracks.length > 0
                                ? mergedTracks
                                : retryData.timeline.tracks ||
                                  prev.timeline?.tracks,
                          },
                        };
                      });
                    }

                    setTimeout(() => {
                      const event = new CustomEvent("timeline.updateClips", {
                        detail: {
                          lane: "all",
                          timeline: retryData.timeline,
                        },
                      });
                      window.dispatchEvent(event);
                    }, 50);

                    isSavingRef.current = false;
                    return;
                  }
                } catch (retryErr) {
                  lastError = retryErr;
                  retryCount++;

                  if (
                    retryErr?.response?.status !== 409 ||
                    retryCount >= maxRetries
                  ) {
                    break;
                  }

                  await new Promise((resolve) =>
                    setTimeout(resolve, 100 * retryCount)
                  );
                }
              }

              isSavingRef.current = false;
            }
          }
        } catch (error) {
          isSavingRef.current = false;
        }
      })();
    },
    [dataProject, selectedIndex, updateDataProject]
  );

  const handleSegmentSelect = useCallback(
    (index) => {
      setSelectedIndex(index);
      setContextSelectedIndex(index);
    },
    [setContextSelectedIndex]
  );

  useEffect(() => {
    if (!segmentsSyncKey) {
      if (lastSyncedSegmentsRef.current !== null) {
        lastSyncedSegmentsRef.current = null;
        setContextSegments([]);
      }
      return;
    }

    const lastKey = lastSyncedSegmentsRef.current;

    if (segmentsSyncKey !== lastKey && !isSyncingRef.current) {
      isSyncingRef.current = true;
      lastSyncedSegmentsRef.current = segmentsSyncKey;
      const currentSegments = segmentsRef.current;
      if (currentSegments) {
        setContextSegments(
          currentSegments.map((seg) => ({
            ...seg,
            id: seg.id,
            text: seg.text,
            start: seg.start,
            duration: seg.duration,
            lang: seg.lang,
            assetId: seg.assetId,
            type: seg.type,
            voiceId: seg.voiceId,
            wordTiming: seg.wordTiming,
          }))
        );
      }
      setTimeout(() => {
        isSyncingRef.current = false;
      }, 100);
    }
  }, [segmentsSyncKey, setContextSegments]);

  const { segments: contextSegments } = useVoiceover();
  useEffect(() => {
    if (
      isSyncingRef.current ||
      !contextSegments ||
      !localSegments ||
      contextSegments.length === 0 ||
      localSegments.length === 0
    )
      return;
    if (contextSegments.length !== localSegments.length) return;
    if (isSavingRef.current) return;
    const contextSegmentsMap = new Map();
    contextSegments.forEach((seg) => {
      if (seg?.id) {
        contextSegmentsMap.set(String(seg.id), seg);
      }
    });

    const hasChanges = localSegments.some((localSeg) => {
      if (!localSeg?.id) return false;
      const ctxSeg = contextSegmentsMap.get(String(localSeg.id));
      if (!ctxSeg) return false;
      return (
        ctxSeg.voiceId !== localSeg.voiceId ||
        ctxSeg.voiceModelId !== localSeg.voiceModelId ||
        ctxSeg.voiceSpeed !== localSeg.voiceSpeed ||
        ctxSeg.voiceStability !== localSeg.voiceStability ||
        ctxSeg.voiceSimilarity !== localSeg.voiceSimilarity ||
        ctxSeg.voiceStyleExaggeration !== localSeg.voiceStyleExaggeration ||
        ctxSeg.voiceSpeakerBoost !== localSeg.voiceSpeakerBoost
      );
    });

    if (hasChanges) {
      const updatedSegments = localSegments.map((localSeg) => {
        if (!localSeg?.id) return localSeg;
        const ctxSeg = contextSegmentsMap.get(String(localSeg.id));
        if (ctxSeg) {
          return {
            ...localSeg,
            voiceId:
              ctxSeg.voiceId !== undefined ? ctxSeg.voiceId : localSeg.voiceId,
            voiceModelId:
              ctxSeg.voiceModelId !== undefined
                ? ctxSeg.voiceModelId
                : localSeg.voiceModelId,
            voiceSpeed:
              ctxSeg.voiceSpeed !== undefined
                ? ctxSeg.voiceSpeed
                : localSeg.voiceSpeed,
            voiceStability:
              ctxSeg.voiceStability !== undefined
                ? ctxSeg.voiceStability
                : localSeg.voiceStability,
            voiceSimilarity:
              ctxSeg.voiceSimilarity !== undefined
                ? ctxSeg.voiceSimilarity
                : localSeg.voiceSimilarity,
            voiceStyleExaggeration:
              ctxSeg.voiceStyleExaggeration !== undefined
                ? ctxSeg.voiceStyleExaggeration
                : localSeg.voiceStyleExaggeration,
            voiceSpeakerBoost:
              ctxSeg.voiceSpeakerBoost !== undefined
                ? ctxSeg.voiceSpeakerBoost
                : localSeg.voiceSpeakerBoost,
          };
        }
        return localSeg;
      });

      handleSegmentsChange(updatedSegments);
    }
  }, [contextSegments, localSegments, handleSegmentsChange]);

  if (!visible) return null;

  return (
    <aside className="relative w-full max-w-full shrink-0 bg-white h-full flex flex-col">
      <header className="h-14 border-b border-border px-3 sm:px-4 flex items-center">
        <div className="text-sm sm:text-base font-semibold text-text-strong">
          {t("video_processor.inspector.panel.subtitle.edit_subtitle")}
        </div>
      </header>

      <div className="flex-1 overflow-auto scrollbar-hide">
        <div className="p-2 sm:p-3">
          {isLoadingSegments ? (
            <section aria-label={t("video_processor.inspector.panel.subtitle.loading_subtitle")}>
              <VoiceoverTimeline
                segments={[]}
                onSegmentsChange={handleSegmentsChange}
                onSegmentSelect={handleSegmentSelect}
                selectedIndex={null}
                karaokeEnabled={true}
                karaokeColor={subtitleStyle?.karaokeColor || "#ffff00"}
                isLoading={true}
              />
            </section>
          ) : hasTimeline ? (
            <section aria-label={t("video_processor.inspector.panel.subtitle.subtitle_timeline")}>
              {(() => {
                return null;
              })()}
              <VoiceoverTimeline
                segments={segments}
                onSegmentsChange={handleSegmentsChange}
                onSegmentSelect={handleSegmentSelect}
                selectedIndex={selectedIndex}
                karaokeEnabled={true}
                karaokeColor={subtitleStyle?.karaokeColor || "#ffff00"}
                isLoading={false}
                voiceOptions={contextVoiceOptions || []}
              />
            </section>
          ) : (
            <section aria-label={t("video_processor.inspector.panel.subtitle.no_timeline")}>
              <div className="rounded-lg border border-dashed border-border bg-surface-50 px-4 py-8 text-center">
                <p className="text-sm text-text-muted mb-2">{t("video_processor.inspector.panel.subtitle.no_subtitle")}</p>
                <p className="text-xs text-text-muted">
                  {t("video_processor.inspector.panel.subtitle.add_subtitle_to_timeline")}
                </p>
              </div>
            </section>
          )}
        </div>
      </div>
    </aside>
  );
}
