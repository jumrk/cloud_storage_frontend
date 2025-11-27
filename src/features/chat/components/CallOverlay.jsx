import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { FiPhoneOff, FiPhoneCall, FiVideo, FiAlertCircle } from "react-icons/fi";

const STATUS_TEXT = {
  incoming: "incoming",
  outgoing: "outgoing",
  connecting: "connecting",
  connected: "connected",
};

export default function CallOverlay({
  state,
  onAccept,
  onReject,
  onEnd,
}) {
  const t = useTranslations();
  const localRef = useRef(null);
  const remoteRef = useRef(null);

  useEffect(() => {
    if (localRef.current && state?.localStream) {
      localRef.current.srcObject = state.localStream;
    }
  }, [state?.localStream]);

  useEffect(() => {
    if (remoteRef.current && state?.remoteStream) {
      remoteRef.current.srcObject = state.remoteStream;
    }
  }, [state?.remoteStream]);

  if (!state || state.status === "idle") return null;

  const isVideo = state.type === "video";
  const statusKey = STATUS_TEXT[state.status] || state.status;

  const renderControls = () => {
    if (state.status === "incoming") {
      return (
        <div className="flex gap-3">
          <button
            className="px-4 py-2 rounded-full bg-[var(--color-danger-500)] text-white flex items-center gap-2 shadow"
            onClick={onReject}
          >
            <FiPhoneOff />
            {t("chat.conversation.reject")}
          </button>
          <button
            className="px-4 py-2 rounded-full bg-brand text-white flex items-center gap-2 shadow"
            onClick={onAccept}
          >
            <FiPhoneCall />
            {t("chat.conversation.accept")}
          </button>
        </div>
      );
    }
    if (state.status === "outgoing" || state.status === "connecting") {
      return (
        <button
          className="px-4 py-2 rounded-full bg-[var(--color-danger-500)] text-white flex items-center gap-2 shadow"
          onClick={() => onEnd()}
        >
          <FiPhoneOff />
          {t("chat.conversation.cancel")}
        </button>
      );
    }
    return (
      <button
        className="px-4 py-2 rounded-full bg-[var(--color-danger-500)] text-white flex items-center gap-2 shadow"
        onClick={() => onEnd()}
      >
        <FiPhoneOff />
        {t("chat.conversation.end_call")}
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col md:flex-row">
        <div className="flex-1 relative bg-black text-white flex items-center justify-center">
          {isVideo && state.remoteStream ? (
            <video
              ref={remoteRef}
              autoPlay
              playsInline
              muted={false}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-4 p-8">
              <div className="w-24 h-24 rounded-full bg-brand flex items-center justify-center text-4xl font-semibold">
                {state.peerUser?.fullName
                  ? state.peerUser.fullName[0]?.toUpperCase()
                  : "?"}
              </div>
              <FiVideo className="text-4xl opacity-60" />
            </div>
          )}
          {state.localStream && (
            <video
              ref={localRef}
              autoPlay
              playsInline
              muted
              className="absolute bottom-4 right-4 w-40 h-28 rounded-2xl border-2 border-white shadow-lg object-cover"
            />
          )}
        </div>
        <div className="w-full md:w-80 p-6 flex flex-col gap-4 justify-between">
          <div className="space-y-2">
            <p className="text-sm uppercase text-text-muted tracking-wide">
              {t(`chat.conversation.${statusKey}`, statusKey)}
            </p>
            <h3 className="text-2xl font-semibold text-text-strong">
              {state.peerUser?.fullName ||
                state.peerUser?.name ||
                state.peerUser?._id ||
                t("chat.conversation.unknown_user")}
            </h3>
            {state.error && (
              <p className="text-sm text-[var(--color-danger-500)] flex items-center gap-2">
                <FiAlertCircle />
                {state.error}
              </p>
            )}
            <p className="text-sm text-text-muted">
              {state.type === "video"
                ? t("chat.conversation.video_call")
                : t("chat.conversation.audio_call")}
            </p>
          </div>
          {renderControls()}
        </div>
      </div>
    </div>
  );
}


