import { useCallback, useEffect, useRef, useState } from "react";

const RTC_CONFIGURATION = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

const defaultState = {
  status: "idle",
  type: null,
  callId: null,
  peerUser: null,
  direction: null,
  localStream: null,
  remoteStream: null,
  error: null,
};

export default function useCallManager({
  socketRef,
  myId,
  getUserById,
} = {}) {
  const [callState, setCallState] = useState(defaultState);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const pendingOfferRef = useRef(null);
  const targetUserRef = useRef(null);

  const socket = socketRef?.current || null;

  const cleanupStreams = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => track.stop());
      remoteStreamRef.current = null;
    }
  }, []);

  const resetCallState = useCallback(
    (next = defaultState) => {
      peerRef.current?.close();
      peerRef.current = null;
      pendingOfferRef.current = null;
      targetUserRef.current = null;
      cleanupStreams();
      setCallState(next);
    },
    [cleanupStreams]
  );

  const ensureUserMedia = useCallback(async (type) => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      throw new Error("Thiết bị không hỗ trợ gọi trực tuyến.");
    }
    const constraints =
      type === "video"
        ? { audio: true, video: { facingMode: "user" } }
        : { audio: true, video: false };
    return navigator.mediaDevices.getUserMedia(constraints);
  }, []);

  const attachLocalStream = useCallback((stream) => {
    localStreamRef.current = stream;
    setCallState((prev) => ({ ...prev, localStream: stream }));
  }, []);

  const attachRemoteTrack = useCallback((event) => {
    if (!remoteStreamRef.current) {
      remoteStreamRef.current = new MediaStream();
    }
    remoteStreamRef.current.addTrack(event.track);
    const mediaStream = remoteStreamRef.current;
    setCallState((prev) => ({ ...prev, remoteStream: mediaStream }));
  }, []);

  const createPeerConnection = useCallback(
    ({ callId, toUserId }) => {
      const peer = new RTCPeerConnection(RTC_CONFIGURATION);
      peerRef.current = peer;

      peer.onicecandidate = (event) => {
        if (event.candidate && socketRef?.current && toUserId) {
          socketRef.current.emit("call:ice", {
            callId,
            to: toUserId,
            candidate: event.candidate,
          });
        }
      };

      peer.ontrack = attachRemoteTrack;

      peer.onconnectionstatechange = () => {
        if (
          ["disconnected", "failed", "closed"].includes(peer.connectionState)
        ) {
          resetCallState(defaultState);
        }
      };

      return peer;
    },
    [attachRemoteTrack, resetCallState, socketRef]
  );

  const startCall = useCallback(
    async (type = "audio", targetUserId) => {
      if (!socketRef?.current || !targetUserId || !myId) {
        return;
      }
      if (callState.status !== "idle") {
        setCallState((prev) => ({
          ...prev,
          error: "Đang có cuộc gọi khác.",
        }));
        return;
      }
      try {
        const callId =
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        const peerUser = getUserById
          ? getUserById(targetUserId)
          : { _id: targetUserId };
        targetUserRef.current = targetUserId;

        setCallState({
          status: "outgoing",
          type,
          callId,
          peerUser,
          direction: "outgoing",
          localStream: null,
          remoteStream: null,
          error: null,
        });

        const localStream = await ensureUserMedia(type);
        attachLocalStream(localStream);

        const peer = createPeerConnection({ callId, toUserId: targetUserId });
        localStream.getTracks().forEach((track) => {
          peer.addTrack(track, localStream);
        });

        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);

        socketRef.current.emit("call:offer", {
          to: targetUserId,
          callId,
          type,
          sdp: offer,
        });
      } catch (err) {
        resetCallState({
          ...defaultState,
          error: err?.message || "Không thể bắt đầu cuộc gọi.",
        });
      }
    },
    [
      attachLocalStream,
      callState.status,
      createPeerConnection,
      ensureUserMedia,
      getUserById,
      myId,
      resetCallState,
      socketRef,
    ]
  );

  const acceptCall = useCallback(async () => {
    if (!pendingOfferRef.current || !socketRef?.current) return;
    try {
      const { callId, from, type, offer } = pendingOfferRef.current;
      targetUserRef.current = from;

      setCallState((prev) => ({
        ...prev,
        status: "connecting",
        error: null,
      }));

      const localStream = await ensureUserMedia(type);
      attachLocalStream(localStream);

      const peer = createPeerConnection({ callId, toUserId: from });
      localStream.getTracks().forEach((track) => {
        peer.addTrack(track, localStream);
      });

      await peer.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      socketRef.current.emit("call:answer", {
        to: from,
        callId,
        sdp: answer,
      });

      setCallState((prev) => ({
        ...prev,
        status: "connected",
      }));
    } catch (err) {
      resetCallState({
        ...defaultState,
        error: err?.message || "Không thể tham gia cuộc gọi.",
      });
    }
  }, [
    attachLocalStream,
    createPeerConnection,
    ensureUserMedia,
    resetCallState,
    socketRef,
  ]);

  const rejectCall = useCallback(() => {
    if (!pendingOfferRef.current || !socketRef?.current) {
      resetCallState(defaultState);
      return;
    }
    const { callId, from } = pendingOfferRef.current;
    socketRef.current.emit("call:reject", { to: from, callId });
    resetCallState(defaultState);
  }, [resetCallState, socketRef]);

  const endCall = useCallback(
    (reason = "ended") => {
      if (!socketRef?.current) {
        resetCallState(defaultState);
        return;
      }
      const { callId } = callState;
      const targetId = targetUserRef.current;
      if (callId && targetId) {
        socketRef.current.emit("call:end", { to: targetId, callId, reason });
      }
      resetCallState(defaultState);
    },
    [callState, resetCallState, socketRef]
  );

  const handleIncomingOffer = useCallback(
    ({ callId, from, type, sdp }) => {
      if (!from || !callId || !sdp) return;
      if (callState.status && callState.status !== "idle") {
        socketRef?.current?.emit("call:reject", { callId, to: from });
        return;
      }
      const peerUser = getUserById ? getUserById(from) : { _id: from };
      pendingOfferRef.current = {
        callId,
        from,
        type,
        offer: new RTCSessionDescription(sdp),
      };
      setCallState({
        status: "incoming",
        type,
        callId,
        peerUser,
        direction: "incoming",
        localStream: null,
        remoteStream: null,
        error: null,
      });
    },
    [callState.status, getUserById, socketRef]
  );

  const handleAnswer = useCallback(
    async ({ callId, sdp }) => {
      const peer = peerRef.current;
      if (
        !peer ||
        !callId ||
        !sdp ||
        peer.signalingState !== "have-local-offer"
      ) {
        return;
      }
      try {
        await peer.setRemoteDescription(new RTCSessionDescription(sdp));
        setCallState((prev) => ({
          ...prev,
          status: "connected",
        }));
      } catch (err) {
        resetCallState({
          ...defaultState,
          error: err?.message || "Không thể kết nối cuộc gọi.",
        });
      }
    },
    [resetCallState]
  );

  const handleRemoteIce = useCallback(
    async ({ candidate }) => {
      if (!peerRef.current || !candidate) return;
      try {
        await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        setCallState((prev) => ({
          ...prev,
          error: err?.message || "Không thể thiết lập kết nối ICE.",
        }));
      }
    },
    []
  );

  const handleCallEnded = useCallback(
    ({ reason }) => {
      resetCallState({
        ...defaultState,
        error:
          reason && reason !== "ended"
            ? "Cuộc gọi đã kết thúc: " + reason
            : null,
      });
    },
    [resetCallState]
  );

  useEffect(() => {
    if (!socket) return;

    const offerListener = (payload) => handleIncomingOffer(payload);
    const answerListener = (payload) => handleAnswer(payload);
    const iceListener = (payload) => handleRemoteIce(payload);
    const rejectListener = () =>
      resetCallState({
        ...defaultState,
        error: "Cuộc gọi đã bị từ chối.",
      });
    const endListener = (payload) => handleCallEnded(payload);
    const errorListener = (payload) =>
      resetCallState({
        ...defaultState,
        error: payload?.error || "Không thể kết nối cuộc gọi.",
      });

    socket.on("call:offer", offerListener);
    socket.on("call:answer", answerListener);
    socket.on("call:ice", iceListener);
    socket.on("call:reject", rejectListener);
    socket.on("call:end", endListener);
    socket.on("call:error", errorListener);

    return () => {
      socket.off("call:offer", offerListener);
      socket.off("call:answer", answerListener);
      socket.off("call:ice", iceListener);
      socket.off("call:reject", rejectListener);
      socket.off("call:end", endListener);
      socket.off("call:error", errorListener);
    };
  }, [
    handleAnswer,
    handleCallEnded,
    handleIncomingOffer,
    handleRemoteIce,
    resetCallState,
    socket,
  ]);

  return {
    callState,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
  };
}


