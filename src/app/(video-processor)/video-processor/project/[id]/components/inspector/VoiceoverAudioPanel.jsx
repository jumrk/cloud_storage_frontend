"use client";
import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { Play, Sparkles } from "lucide-react";
import { useProject } from "../../context";
import VoiceSourceTabs from "./voiceover/VoiceSourceTabs";
import VoiceRecorder from "./voiceover/VoiceRecorder";
import VoiceSelector from "./voiceover/VoiceSelector";
import VoiceSelectorOverlay from "./voiceover/VoiceSelectorOverlay";
import VoiceSettingsOverlay from "./voiceover/VoiceSettingsOverlay";
import { Filter, EyeOff, Eye } from "lucide-react";
import { LuSettings2 } from "react-icons/lu";
import voiceService from "../../services/voiceService";
import toast from "react-hot-toast";
import { useVoiceover } from "../../context/VoiceoverContext";
import { useVoiceLoading } from "../../context/VoiceLoadingContext";
import useVoiceGeneration from "../../hooks/tools/useVoiceGeneration";
import { useTranslations } from "next-intl";

export default function VoiceoverAudioPanel({ segments: propSegments = [] }) {
  const t = useTranslations();
  const { projectId, reloadProjectTimeline, dataProject } = useProject();
  const voiceoverContext = useVoiceover();
  const segments = voiceoverContext?.segments || propSegments;
  const selectedIndex = voiceoverContext?.selectedIndex;
  const updateSegmentVoice = voiceoverContext?.updateSegmentVoice;
  const setContextVoiceOptions = voiceoverContext?.setVoiceOptions;
  const showVoiceIcons = voiceoverContext?.showVoiceIcons ?? true;
  const toggleShowVoiceIcons = voiceoverContext?.toggleShowVoiceIcons;

  const { setClipLoading, setClipProgress, clearClipLoading, loadingClips } =
    useVoiceLoading();

  const {
    loading: voiceGenLoading,
    loadingText: voiceGenLoadingText,
    progress: voiceGenProgress,
    startGenerateVoice,
  } = useVoiceGeneration({
    projectId,
    onReloadProject: reloadProjectTimeline,
    // Update progress for specific clips - allows parallel processing
    onClipProgress: useCallback(
      (clipId, progress) => {
        if (progress === null || progress === undefined) {
          clearClipLoading(clipId);
        } else {
          setClipProgress(clipId, progress);
          if (progress >= 100) {
            // Progress will be cleared when job completes
          }
        }
      },
      [setClipProgress, clearClipLoading]
    ),
  });

  const [voiceSource, setVoiceSource] = useState("default");
  const [globalVoice, setGlobalVoice] = useState("");
  const [modelId, setModelId] = useState("eleven_multilingual_v2");

  const [isVoiceSelectorOpen, setIsVoiceSelectorOpen] = useState(false);

  const [isVoiceSettingsOpen, setIsVoiceSettingsOpen] = useState(false);

  const [speed, setSpeed] = useState(0.75);
  const [stability, setStability] = useState(0.6);
  const [similarity, setSimilarity] = useState(0.8);
  const [styleExaggeration, setStyleExaggeration] = useState(0.1);
  const [speakerBoost, setSpeakerBoost] = useState(true);

  const [recState, setRecState] = useState("idle");
  const [recSecs, setRecSecs] = useState(0);
  const [recIsPlaying, setRecIsPlaying] = useState(false);
  const [uploadingClone, setUploadingClone] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [voiceName, setVoiceName] = useState("");

  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [playingVoiceId, setPlayingVoiceId] = useState(null);

  const audioRef = useRef(null);
  const recAudioURLRef = useRef(null);
  const recStreamRef = useRef(null);
  const fileInputRef = useRef(null);
  const timerRef = useRef(null);
  const previewAudioRef = useRef(null);
  const voiceSettingsSectionRef = useRef(null);
  const contentSectionRef = useRef(null);

  const [defaultVoices, setDefaultVoices] = useState([]);
  const [myVoices, setMyVoices] = useState([]);
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);
  const voicesLoadedRef = useRef(false);

  // Track segments that have been modified (text edited, settings changed, voice changed)
  const modifiedSegmentsRef = useRef(new Set());
  const [modifiedSegments, setModifiedSegments] = useState(new Set());

  // Expose modifiedSegments to VoiceoverContext so VoiceoverTimeline can show indicators
  useEffect(() => {
    if (voiceoverContext?.setModifiedSegments) {
      voiceoverContext.setModifiedSegments(modifiedSegments);
    }
  }, [modifiedSegments, voiceoverContext?.setModifiedSegments]);

  const voice = useMemo(() => voiceService(), []);

  useEffect(() => {
    if (voicesLoadedRef.current) return;
    voicesLoadedRef.current = true;

    const loadVoices = async () => {
      setIsLoadingVoices(true);
      try {
        const [defaultData, myData] = await Promise.all([
          voice.listVoices().catch(() => ({ voices: [] })),
          voice.myVoices().catch(() => ({ voices: [] })),
        ]);
        if (defaultData?.voices) {
          setDefaultVoices(defaultData.voices);
        }
        if (myData?.voices) {
          setMyVoices(myData.voices);
        }
      } catch (error) {
        if (error?.response?.status !== 401) {
          console.error("Failed to load voices:", error);
        }
      } finally {
        setIsLoadingVoices(false);
      }
    };
    loadVoices();
  }, [voice]);

  const voiceOptions = useMemo(() => {
    if (voiceSource === "default") {
      return defaultVoices;
    }
    return myVoices;
  }, [voiceSource, defaultVoices, myVoices]);

  const allVoiceOptions = useMemo(() => {
    return [...defaultVoices, ...myVoices];
  }, [defaultVoices, myVoices]);

  useEffect(() => {
    if (setContextVoiceOptions) {
      setContextVoiceOptions(allVoiceOptions);
    }
  }, [allVoiceOptions, setContextVoiceOptions]);

  const selectedSegment = useMemo(() => {
    if (selectedIndex !== null && segments[selectedIndex]) {
      return segments[selectedIndex];
    }
    return null;
  }, [segments, selectedIndex]);

  const selectedSegmentVoiceId = selectedSegment?.voiceId || null;

  const displayVoiceId = selectedSegmentVoiceId || globalVoice;

  const hasAnySegmentWithVoice = useMemo(() => {
    return segments.some(
      (seg) => seg?.voiceId && seg.voiceId !== null && seg.voiceId !== ""
    );
  }, [segments]);

  const usedVoices = useMemo(() => {
    const voiceIds = new Set();
    segments.forEach((seg) => {
      if (seg.voiceId) {
        voiceIds.add(seg.voiceId);
      }
    });
    return Array.from(voiceIds)
      .map((voiceId) => {
        const voice = allVoiceOptions.find((v) => v.id === voiceId);
        if (!voice) return null;
        const voiceIndex = allVoiceOptions.findIndex((v) => v.id === voiceId);
        const colorPatterns = [
          "from-green-300 via-emerald-400 to-green-600",
          "from-pink-300 via-rose-400 to-pink-600",
          "from-blue-300 via-cyan-400 to-blue-600",
          "from-purple-300 via-violet-400 to-purple-600",
          "from-orange-300 via-amber-400 to-orange-600",
          "from-teal-300 via-cyan-400 to-teal-600",
        ];
        const colorPattern = colorPatterns[voiceIndex % colorPatterns.length];
        return {
          id: voice.id,
          label: voice.label || voice.name || `Voice ${voiceIndex + 1}`,
          colorPattern,
          voiceIndex: voiceIndex + 1,
          voiceSource: myVoices.find((v) => v.id === voiceId)
            ? "my"
            : "default",
        };
      })
      .filter(Boolean);
  }, [segments, allVoiceOptions, myVoices]);

  useEffect(() => {
    if (voiceOptions.length > 0 && !globalVoice && !selectedSegmentVoiceId) {
      setGlobalVoice(voiceOptions[0].id);
    }
  }, [voiceOptions, globalVoice, selectedSegmentVoiceId]);

  // Get audio clips from timeline to check which segments already have audio
  const audioClips = useMemo(() => {
    if (!dataProject?.timeline?.tracks) return [];
    const audioTrack = dataProject.timeline.tracks.find(
      (t) => t?.kind === "audio"
    );
    return audioTrack?.clips || [];
  }, [dataProject]);

  // Listen for text edits from VoiceoverTimeline
  useEffect(() => {
    const handleTextEdit = (event) => {
      const { clipId } = event.detail || {};
      if (clipId) {
        // Check if this segment already has audio (meaning it needs regeneration)
        const hasAudio = audioClips.some(
          (audioClip) =>
            audioClip?.subtitleClipId &&
            String(audioClip.subtitleClipId) === String(clipId)
        );
        if (hasAudio) {
          modifiedSegmentsRef.current.add(String(clipId));
          setModifiedSegments(new Set(modifiedSegmentsRef.current));
        }
      }
    };

    window.addEventListener("voiceover.textEdited", handleTextEdit);
    return () => {
      window.removeEventListener("voiceover.textEdited", handleTextEdit);
    };
  }, [audioClips]);

  // Listen for timeline patch events to track voice/settings changes
  useEffect(() => {
    const handleTimelinePatch = (event) => {
      const { lane, id, patch } = event.detail || {};
      if (lane === "text" && id) {
        // Check if this segment already has audio
        const hasAudio = audioClips.some(
          (audioClip) =>
            audioClip?.subtitleClipId &&
            String(audioClip.subtitleClipId) === String(id)
        );
        // If it has audio and voiceId or settings are being changed, mark as modified
        if (
          hasAudio &&
          (patch.voiceId ||
            patch.voiceModelId ||
            patch.voiceSpeed !== undefined ||
            patch.voiceStability !== undefined ||
            patch.voiceSimilarity !== undefined ||
            patch.voiceStyleExaggeration !== undefined ||
            patch.voiceSpeakerBoost !== undefined)
        ) {
          modifiedSegmentsRef.current.add(String(id));
          setModifiedSegments(new Set(modifiedSegmentsRef.current));
        }
      }
    };

    window.addEventListener("timeline.patchClip", handleTimelinePatch);
    return () => {
      window.removeEventListener("timeline.patchClip", handleTimelinePatch);
    };
  }, [audioClips]);

  // Clear modified flag when voice generation completes
  useEffect(() => {
    const handleVoiceGenerated = (event) => {
      const { clipIds } = event.detail || {};
      if (clipIds && Array.isArray(clipIds)) {
        clipIds.forEach((clipId) => {
          modifiedSegmentsRef.current.delete(String(clipId));
        });
        setModifiedSegments(new Set(modifiedSegmentsRef.current));
      }
    };

    window.addEventListener("voiceover.voiceGenerated", handleVoiceGenerated);
    return () => {
      window.removeEventListener(
        "voiceover.voiceGenerated",
        handleVoiceGenerated
      );
    };
  }, []);

  // Calculate segments that need voice generation (have voiceId but no audio)
  const segmentsNeedingVoice = useMemo(() => {
    return segments.filter((seg) => {
      if (!seg?.voiceId || seg.voiceId === null || seg.voiceId === "") {
        return false;
      }
      // Check if this segment already has an audio clip
      const hasAudio = audioClips.some(
        (audioClip) =>
          audioClip?.subtitleClipId &&
          String(audioClip.subtitleClipId) === String(seg.id)
      );
      return !hasAudio;
    });
  }, [segments, audioClips]);

  // Calculate segments that need voice regeneration (have audio and have been modified)
  const segmentsNeedingRegeneration = useMemo(() => {
    return segments.filter((seg) => {
      if (!seg?.voiceId || seg.voiceId === null || seg.voiceId === "") {
        return false;
      }
      // Check if this segment has an audio clip
      const hasAudio = audioClips.some(
        (ac) =>
          ac?.subtitleClipId && String(ac.subtitleClipId) === String(seg.id)
      );
      // Only include if it has audio AND has been modified
      return hasAudio && modifiedSegments.has(String(seg.id));
    });
  }, [segments, audioClips, modifiedSegments]);

  const hasSegmentsNeedingVoice = segmentsNeedingVoice.length > 0;
  const hasSegmentsNeedingRegeneration = segmentsNeedingRegeneration.length > 0;
  // Show button if there are segments needing voice generation
  const canGenerateVoice = hasSegmentsNeedingVoice;
  // Show "Làm lại giọng" if there are segments that already have audio
  const shouldShowRegenerate = hasSegmentsNeedingRegeneration;

  const handleGenerateAllVoices = useCallback(async () => {
    if (!canGenerateVoice && !shouldShowRegenerate) return;

    // Collect clip IDs based on what action is needed
    let clipIdsToGenerate = [];
    let actionText = "";

    if (shouldShowRegenerate) {
      // If regenerating, use segments that already have audio
      clipIdsToGenerate = segmentsNeedingRegeneration
        .map((seg) => seg.id)
        .filter(Boolean);
      actionText = t("video_processor.inspector.voiceover.regenerate_voice");
    } else if (canGenerateVoice) {
      // If generating new, use segments that don't have audio yet
      clipIdsToGenerate = segmentsNeedingVoice
        .map((seg) => seg.id)
        .filter(Boolean);
      actionText = t("video_processor.inspector.voiceover.generate_voice");
    }

    if (clipIdsToGenerate.length === 0) {
      toast.error(t("video_processor.inspector.voiceover.no_segments_to_generate"));
      return;
    }

    // Set loading state for all clips
    clipIdsToGenerate.forEach((clipId) => {
      setClipLoading(clipId, true);
      setClipProgress(clipId, 0);
    });

    try {
      await startGenerateVoice(clipIdsToGenerate);
      toast.success(
        t("video_processor.inspector.voiceover.started_generating", {
          action: actionText.toLowerCase(),
          count: clipIdsToGenerate.length,
        })
      );
      // Clear modified flags after starting generation
      clipIdsToGenerate.forEach((clipId) => {
        modifiedSegmentsRef.current.delete(String(clipId));
      });
      setModifiedSegments(new Set(modifiedSegmentsRef.current));
    } catch (error) {
      console.error("Failed to start voice generation:", error);
      clipIdsToGenerate.forEach((clipId) => {
        clearClipLoading(clipId);
      });
      toast.error(t("video_processor.inspector.voiceover.cannot_generate_voice"));
    }
  }, [
    canGenerateVoice,
    shouldShowRegenerate,
    segmentsNeedingVoice,
    segmentsNeedingRegeneration,
    startGenerateVoice,
    setClipLoading,
    setClipProgress,
    clearClipLoading,
  ]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recStreamRef.current = stream;
      setRecState("recording");
      setRecSecs(0);

      const mediaRecorder = new MediaRecorder(stream);
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        if (recAudioURLRef.current) URL.revokeObjectURL(recAudioURLRef.current);
        recAudioURLRef.current = URL.createObjectURL(blob);
        setRecState("recorded");
      };

      mediaRecorder.start();

      timerRef.current = setInterval(() => {
        setRecSecs((s) => s + 1);
      }, 1000);

      recStreamRef.current.mediaRecorder = mediaRecorder;
    } catch (err) {
      console.error("Failed to start recording:", err);
    }
  };

  const stopRecording = () => {
    if (recStreamRef.current?.mediaRecorder) {
      recStreamRef.current.mediaRecorder.stop();
    }
    if (recStreamRef.current) {
      recStreamRef.current.getTracks().forEach((t) => t.stop());
      recStreamRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const togglePlayRecorded = () => {
    if (!recAudioURLRef.current) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(recAudioURLRef.current);
    }
    if (recIsPlaying) {
      audioRef.current.pause();
      setRecIsPlaying(false);
    } else {
      audioRef.current.play();
      setRecIsPlaying(true);
      audioRef.current.onended = () => setRecIsPlaying(false);
    }
  };

  const resetRecording = () => {
    setRecState("idle");
    setRecIsPlaying(false);
    if (recAudioURLRef.current) {
      URL.revokeObjectURL(recAudioURLRef.current);
      recAudioURLRef.current = null;
    }
    setRecSecs(0);
  };

  const handleUploadRecorded = async () => {
    if (!recAudioURLRef.current || !voiceName.trim()) return;

    setUploadingClone(true);
    setUploadProgress(0);

    try {
      const response = await fetch(recAudioURLRef.current);
      const blob = await response.blob();

      const audioFile = new File([blob], `recording-${Date.now()}.webm`, {
        type: blob.type || "audio/webm",
      });

      const result = await voice.cloneVoice(audioFile, {
        name: voiceName.trim(),
        description: "",
        onUploadProgress: (progress) => {
          setUploadProgress(progress);
        },
      });

      if (result?.ok && result?.voice) {
        toast.success(t("video_processor.inspector.voiceover.clone_voice_success"));
        const data = await voice.myVoices();
        if (data?.voices) {
          setMyVoices(data.voices);
          if (data.voices.length > 0) {
            setGlobalVoice(data.voices[0].id);
          }
        }
        resetRecording();
        setVoiceName("");
      }
    } catch (error) {
      console.error("Failed to upload recorded voice:", error);
      const errorMessage =
        error?.response?.data?.error ||
        error?.message ||
        t("video_processor.inspector.voiceover.clone_voice_failed");
      toast.error(errorMessage);
    } finally {
      setUploadingClone(false);
      setUploadProgress(0);
    }
  };

  const handleUploadFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!voiceName.trim()) {
      toast.error(t("video_processor.inspector.voiceover.please_enter_voice_name"));
      return;
    }

    setUploadingClone(true);
    setUploadProgress(0);

    try {
      const result = await voice.cloneVoice(file, {
        name: voiceName.trim(),
        description: "",
        onUploadProgress: (progress) => {
          setUploadProgress(progress);
        },
      });

      if (result?.ok && result?.voice) {
        toast.success(t("video_processor.inspector.voiceover.clone_voice_success"));
        const data = await voice.myVoices();
        if (data?.voices) {
          setMyVoices(data.voices);
          if (data.voices.length > 0) {
            setGlobalVoice(data.voices[0].id);
          }
        }
        setVoiceName("");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    } catch (error) {
      console.error("Failed to upload voice file:", error);
      const errorMessage =
        error?.response?.data?.error ||
        error?.message ||
        t("video_processor.inspector.voiceover.clone_voice_failed");
      toast.error(errorMessage);
    } finally {
      setUploadingClone(false);
      setUploadProgress(0);
    }
  };

  const handlePreviewVoice = async (voiceId) => {
    if (!voiceId) return;
    if (
      isPlayingPreview &&
      playingVoiceId === voiceId &&
      previewAudioRef.current
    ) {
      previewAudioRef.current.pause();
      setIsPlayingPreview(false);
      setPlayingVoiceId(null);
      return;
    }

    const selectedVoice = voiceOptions.find((v) => v.id === voiceId);
    const previewUrl = selectedVoice?.preview_url;

    setIsLoadingPreview(true);
    setPlayingVoiceId(voiceId);

    try {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        if (
          previewAudioRef.current.src &&
          previewAudioRef.current.src.startsWith("blob:")
        ) {
          URL.revokeObjectURL(previewAudioRef.current.src);
        }
      }

      let audioUrl;
      let audio;

      if (previewUrl) {
        audioUrl = previewUrl;
        audio = new Audio(audioUrl);
        previewAudioRef.current = audio;
      } else {
        const audioBlob = await voice.previewVoice({
          voiceId,
          modelId,
          voice_settings: {
            stability,
            similarity_boost: similarity,
            use_speaker_boost: speakerBoost,
            speed: speed,
          },
        });

        audioUrl = URL.createObjectURL(audioBlob);
        audio = new Audio(audioUrl);
        previewAudioRef.current = audio;
      }

      audio.onended = () => {
        setIsPlayingPreview(false);
        setPlayingVoiceId(null);
        if (audioUrl && audioUrl.startsWith("blob:")) {
          URL.revokeObjectURL(audioUrl);
        }
      };

      audio.onerror = () => {
        setIsLoadingPreview(false);
        setIsPlayingPreview(false);
        setPlayingVoiceId(null);
        if (audioUrl && audioUrl.startsWith("blob:")) {
          URL.revokeObjectURL(audioUrl);
        }
      };

      await audio.play();
      setIsLoadingPreview(false);
      setIsPlayingPreview(true);
    } catch (error) {
      console.error("Failed to preview voice:", error);
      setIsLoadingPreview(false);
      setIsPlayingPreview(false);
      setPlayingVoiceId(null);
    }
  };

  useEffect(() => {
    return () => {
      if (recStreamRef.current) {
        recStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (recAudioURLRef.current) URL.revokeObjectURL(recAudioURLRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioRef.current) audioRef.current.pause();
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        if (
          previewAudioRef.current.src &&
          previewAudioRef.current.src.startsWith("blob:")
        ) {
          URL.revokeObjectURL(previewAudioRef.current.src);
        }
      }
    };
  }, []);

  return (
    <aside className="w-[320px] shrink-0 border-l border-border bg-white h-full flex flex-col">
      <header className="h-14 border-b border-border px-3 flex items-center justify-between">
        <div className="text-sm font-semibold text-text-strong">
          {t("video_processor.inspector.voiceover.select_audio_for_subtitle")}
        </div>
        {(canGenerateVoice || shouldShowRegenerate) && (
          <button
            type="button"
            onClick={handleGenerateAllVoices}
            disabled={voiceGenLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-brand-500 bg-brand-500 text-white hover:bg-brand-600 hover:border-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={
              shouldShowRegenerate
                ? t("video_processor.inspector.voiceover.regenerate_voice_tooltip")
                : t("video_processor.inspector.voiceover.generate_voice_tooltip")
            }
          >
            <Sparkles className="w-3.5 h-3.5" />
            {shouldShowRegenerate ? t("video_processor.inspector.voiceover.regenerate_voice") : t("video_processor.inspector.voiceover.generate_voice")}
            {voiceGenLoading && (
              <span className="ml-1">
                (
                {shouldShowRegenerate
                  ? segmentsNeedingRegeneration.length
                  : segmentsNeedingVoice.length}
                )
              </span>
            )}
          </button>
        )}
      </header>

      <div
        className="flex-1 overflow-auto scrollbar-hide p-3 space-y-4 relative"
        ref={contentSectionRef}
      >
        <div
          className={`transition-opacity duration-300 ${
            isVoiceSelectorOpen || isVoiceSettingsOpen
              ? "opacity-0 pointer-events-none"
              : "opacity-100"
          }`}
        >
          <div ref={voiceSettingsSectionRef}>
            <VoiceSourceTabs
              voiceSource={voiceSource}
              setVoiceSource={setVoiceSource}
              onFileUpload={handleUploadFile}
              fileInputRef={fileInputRef}
              voiceName={voiceName}
              setVoiceName={setVoiceName}
              uploadingClone={uploadingClone}
              uploadProgress={uploadProgress}
            />

            <div
              className={`overflow-hidden transition-all duration-300 ease-out ${
                voiceSource === "my"
                  ? "max-h-[200px] opacity-100 mt-2"
                  : "max-h-0 opacity-0 mt-0"
              }`}
            >
              <VoiceRecorder
                recState={recState}
                recSecs={recSecs}
                recIsPlaying={recIsPlaying}
                onStartRecording={startRecording}
                onStopRecording={stopRecording}
                onTogglePlay={togglePlayRecorded}
                onReset={resetRecording}
                onUpload={handleUploadRecorded}
                uploadingClone={uploadingClone}
              />
            </div>

            <VoiceSelector
              globalVoice={displayVoiceId}
              setGlobalVoice={setGlobalVoice}
              voiceOptions={voiceOptions}
              onPreview={handlePreviewVoice}
              isLoadingPreview={isLoadingPreview}
              isPlayingPreview={isPlayingPreview}
              playingVoiceId={playingVoiceId}
              voiceSource={voiceSource}
              onOpenSelector={() => setIsVoiceSelectorOpen(true)}
            />

            {usedVoices.length > 0 && (
              <section className="mt-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-text-strong">
                      {t("video_processor.inspector.voiceover.selected_voices")}
                    </span>
                    <Filter className="w-3.5 h-3.5 text-text-muted" />
                    <span className="text-xs text-text-muted">
                      {usedVoices.length}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (toggleShowVoiceIcons) {
                        toggleShowVoiceIcons();
                      }
                    }}
                    className="p-1 rounded hover:bg-surface-50 text-text-muted transition"
                    title={showVoiceIcons ? t("video_processor.inspector.voiceover.hide") : t("video_processor.inspector.voiceover.show")}
                  >
                    {showVoiceIcons ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <div className="space-y-1.5">
                  {usedVoices.map((voice) => (
                    <div
                      key={voice.id}
                      className="rounded-lg border border-border bg-white overflow-hidden"
                    >
                      <div className="flex items-center gap-2.5 p-2.5 bg-surface-50">
                        <div className="relative shrink-0">
                          <div
                            className={`w-10 h-10 rounded-full bg-gradient-to-br ${voice.colorPattern} flex items-center justify-center text-white font-bold text-sm shadow-sm`}
                          >
                            {voice.voiceIndex}
                          </div>
                          {voice.voiceSource === "my" && (
                            <div className="absolute -top-0.5 -left-0.5 w-4 h-4 rounded-full bg-black/80 border border-white/50 flex items-center justify-center">
                              <svg
                                className="w-2.5 h-2.5 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2.5}
                                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-text-strong">
                            {voice.label}
                          </div>
                        </div>
                        <div className="text-xs font-medium text-text-muted">
                          {voice.voiceIndex}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              // Only open settings if a segment is selected
                              if (selectedIndex === null) {
                                toast.error(
                                  t("video_processor.inspector.voiceover.please_select_segment_for_settings")
                                );
                                return;
                              }
                              if (voice.voiceSource === "my") {
                                setVoiceSource("my");
                              } else {
                                setVoiceSource("default");
                              }
                              setGlobalVoice(voice.id);
                              setIsVoiceSettingsOpen(true);
                            }}
                            className={`p-1 rounded hover:bg-surface-100 cursor-pointer text-text-muted transition ${
                              selectedIndex === null
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                            title={
                              selectedIndex === null
                                ? t("video_processor.inspector.voiceover.please_select_segment")
                                : t("video_processor.inspector.options")
                            }
                            disabled={selectedIndex === null}
                          >
                            <LuSettings2 size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (
                                selectedIndex !== null &&
                                updateSegmentVoice &&
                                voiceoverContext?.setSegments
                              ) {
                                const selectedSegment = segments[selectedIndex];
                                const clipId = selectedSegment?.id;

                                updateSegmentVoice(selectedIndex, voice.id);
                                const updatedSegments = segments.map(
                                  (seg, idx) => {
                                    if (idx === selectedIndex) {
                                      return {
                                        ...seg,
                                        voiceId: voice.id,
                                        voiceModelId:
                                          modelId || "eleven_multilingual_v2",
                                        voiceSpeed:
                                          speed !== null && speed !== undefined
                                            ? speed
                                            : 0.75,
                                        voiceStability:
                                          stability !== null &&
                                          stability !== undefined
                                            ? stability
                                            : 0.6,
                                        voiceSimilarity:
                                          similarity !== null &&
                                          similarity !== undefined
                                            ? similarity
                                            : 0.8,
                                        voiceStyleExaggeration:
                                          styleExaggeration !== null &&
                                          styleExaggeration !== undefined
                                            ? styleExaggeration
                                            : 0.1,
                                        voiceSpeakerBoost:
                                          speakerBoost !== null &&
                                          speakerBoost !== undefined
                                            ? speakerBoost
                                            : true,
                                      };
                                    }
                                    return seg;
                                  }
                                );
                                voiceoverContext.setSegments(updatedSegments);

                                // Dispatch event to update timeline and save to database
                                window.dispatchEvent(
                                  new CustomEvent("timeline.patchClip", {
                                    detail: {
                                      lane: "text",
                                      id: clipId,
                                      patch: {
                                        voiceId: voice.id,
                                        voiceModelId:
                                          modelId || "eleven_multilingual_v2",
                                        voiceSpeed:
                                          speed !== null && speed !== undefined
                                            ? speed
                                            : 0.75,
                                        voiceStability:
                                          stability !== null &&
                                          stability !== undefined
                                            ? stability
                                            : 0.6,
                                        voiceSimilarity:
                                          similarity !== null &&
                                          similarity !== undefined
                                            ? similarity
                                            : 0.8,
                                        voiceStyleExaggeration:
                                          styleExaggeration !== null &&
                                          styleExaggeration !== undefined
                                            ? styleExaggeration
                                            : 0.1,
                                        voiceSpeakerBoost:
                                          speakerBoost !== null &&
                                          speakerBoost !== undefined
                                            ? speakerBoost
                                            : true,
                                      },
                                    },
                                  })
                                );

                                toast.success(t("video_processor.inspector.voiceover.assigned_voice_to_segment"));
                              } else {
                                toast.error(
                                  t("video_processor.inspector.voiceover.please_select_segment_first")
                                );
                              }
                            }}
                            className={`p-1 text-xs border cursor-pointer border-border rounded-md transition ${
                              selectedIndex === null
                                ? "text-text-muted/50 cursor-not-allowed"
                                : "hover:bg-surface-100 text-text-muted"
                            }`}
                            title={t("video_processor.inspector.voiceover.apply")}
                            disabled={selectedIndex === null}
                          >
                            {t("video_processor.inspector.voiceover.apply")}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        <VoiceSelectorOverlay
          isOpen={isVoiceSelectorOpen}
          onClose={() => setIsVoiceSelectorOpen(false)}
          voiceOptions={voiceOptions}
          selectedVoiceId={displayVoiceId}
          onSelectVoice={async (voiceId) => {
            if (
              selectedIndex !== null &&
              updateSegmentVoice &&
              voiceoverContext?.setSegments
            ) {
              const selectedSegment = segments[selectedIndex];
              const clipId = selectedSegment?.id;

              updateSegmentVoice(selectedIndex, voiceId);
              const updatedSegments = segments.map((seg, idx) => {
                if (idx === selectedIndex) {
                  return {
                    ...seg,
                    voiceId,
                    voiceModelId: modelId || "eleven_multilingual_v2",
                    voiceSpeed:
                      speed !== null && speed !== undefined ? speed : 0.75,
                    voiceStability:
                      stability !== null && stability !== undefined
                        ? stability
                        : 0.6,
                    voiceSimilarity:
                      similarity !== null && similarity !== undefined
                        ? similarity
                        : 0.8,
                    voiceStyleExaggeration:
                      styleExaggeration !== null &&
                      styleExaggeration !== undefined
                        ? styleExaggeration
                        : 0.1,
                    voiceSpeakerBoost:
                      speakerBoost !== null && speakerBoost !== undefined
                        ? speakerBoost
                        : true,
                  };
                }
                return seg;
              });
              voiceoverContext.setSegments(updatedSegments);

              // Dispatch event to update timeline and save to database
              window.dispatchEvent(
                new CustomEvent("timeline.patchClip", {
                  detail: {
                    lane: "text",
                    id: clipId,
                    patch: {
                      voiceId,
                      voiceModelId: modelId || "eleven_multilingual_v2",
                      voiceSpeed:
                        speed !== null && speed !== undefined ? speed : 0.75,
                      voiceStability:
                        stability !== null && stability !== undefined
                          ? stability
                          : 0.6,
                      voiceSimilarity:
                        similarity !== null && similarity !== undefined
                          ? similarity
                          : 0.8,
                      voiceStyleExaggeration:
                        styleExaggeration !== null &&
                        styleExaggeration !== undefined
                          ? styleExaggeration
                          : 0.1,
                      voiceSpeakerBoost:
                        speakerBoost !== null && speakerBoost !== undefined
                          ? speakerBoost
                          : true,
                    },
                  },
                })
              );

              toast.success(t("video_processor.inspector.voiceover.assigned_voice_to_segment"));
            } else {
              setGlobalVoice(voiceId);
            }
            setIsVoiceSelectorOpen(false);
          }}
          onPreviewVoice={handlePreviewVoice}
          isLoadingPreview={isLoadingPreview}
          isPlayingPreview={isPlayingPreview}
          playingVoiceId={playingVoiceId}
          voiceSource={voiceSource}
          targetRef={contentSectionRef}
          isLoadingVoices={isLoadingVoices}
        />

        <VoiceSettingsOverlay
          isOpen={isVoiceSettingsOpen}
          onClose={() => {
            setIsVoiceSettingsOpen(false);
          }}
          targetRef={contentSectionRef}
          modelId={
            selectedSegment?.voiceModelId || modelId || "eleven_multilingual_v2"
          }
          speed={
            selectedSegment?.voiceSpeed !== null &&
            selectedSegment?.voiceSpeed !== undefined
              ? selectedSegment.voiceSpeed
              : speed !== null && speed !== undefined
              ? speed
              : 0.75
          }
          stability={
            selectedSegment?.voiceStability !== null &&
            selectedSegment?.voiceStability !== undefined
              ? selectedSegment.voiceStability
              : stability !== null && stability !== undefined
              ? stability
              : 0.6
          }
          similarity={
            selectedSegment?.voiceSimilarity !== null &&
            selectedSegment?.voiceSimilarity !== undefined
              ? selectedSegment.voiceSimilarity
              : similarity !== null && similarity !== undefined
              ? similarity
              : 0.8
          }
          styleExaggeration={
            selectedSegment?.voiceStyleExaggeration !== null &&
            selectedSegment?.voiceStyleExaggeration !== undefined
              ? selectedSegment.voiceStyleExaggeration
              : styleExaggeration !== null && styleExaggeration !== undefined
              ? styleExaggeration
              : 0.1
          }
          speakerBoost={
            selectedSegment?.voiceSpeakerBoost !== null &&
            selectedSegment?.voiceSpeakerBoost !== undefined
              ? selectedSegment.voiceSpeakerBoost
              : speakerBoost !== null && speakerBoost !== undefined
              ? speakerBoost
              : true
          }
          onModelChange={setModelId}
          onSpeedChange={setSpeed}
          onStabilityChange={setStability}
          onSimilarityChange={setSimilarity}
          onStyleExaggerationChange={setStyleExaggeration}
          onSpeakerBoostChange={setSpeakerBoost}
          onSave={async (settings) => {
            // Only update and regenerate the currently selected segment
            if (
              voiceoverContext?.setSegments &&
              selectedIndex !== null &&
              selectedSegment
            ) {
              const clipId = selectedSegment.id;
              if (!clipId) {
                toast.error(t("video_processor.inspector.voiceover.cannot_find_segment_id"));
                return;
              }

              // Update only the selected segment with new settings
              const updatedSegments = segments.map((seg, idx) => {
                if (idx === selectedIndex) {
                  return {
                    ...seg,
                    voiceModelId: settings.modelId,
                    voiceSpeed: settings.speed,
                    voiceStability: settings.stability,
                    voiceSimilarity: settings.similarity,
                    voiceStyleExaggeration: settings.styleExaggeration,
                    voiceSpeakerBoost: settings.speakerBoost,
                  };
                }
                return seg;
              });
              voiceoverContext.setSegments(updatedSegments);

              // Dispatch event to update timeline and save to database
              window.dispatchEvent(
                new CustomEvent("timeline.patchClip", {
                  detail: {
                    lane: "text",
                    id: clipId,
                    patch: {
                      voiceModelId: settings.modelId,
                      voiceSpeed: settings.speed,
                      voiceStability: settings.stability,
                      voiceSimilarity: settings.similarity,
                      voiceStyleExaggeration: settings.styleExaggeration,
                      voiceSpeakerBoost: settings.speakerBoost,
                    },
                  },
                })
              );

              toast.success(t("video_processor.inspector.voiceover.voice_config_updated"));
            } else {
              toast.error(t("video_processor.inspector.voiceover.please_select_segment_for_settings"));
            }
          }}
        />
      </div>
    </aside>
  );
}
