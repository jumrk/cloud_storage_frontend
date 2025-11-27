import axiosClient from "@/shared/lib/axiosClient";

export default function voiceService() {
  /**
   * Lấy danh sách giọng mặc định
   * GET /api/video-processor/tools/voices
   */
  const listVoices = async () => {
    return axiosClient
      .get("/api/video-processor/tools/voices")
      .then((r) => r.data);
  };

  /**
   * Nghe thử giọng
   * POST /api/video-processor/tools/voices/preview
   * Body: { voiceId, text?, modelId?, voice_settings? }
   * Returns: Blob of audio data
   */
  const previewVoice = async ({ voiceId, text, modelId, voice_settings }) => {
    return axiosClient
      .post("/api/video-processor/tools/voices/preview", {
        voiceId,
        text,
        modelId,
        voice_settings,
      }, {
        responseType: "blob",
      })
      .then((r) => r.data);
  };

  /**
   * Clone voice từ file audio
   * POST /api/video-processor/tools/voices/clone
   * Body: FormData với file và { name?, description? }
   * Returns: { ok: true, voice: {...} }
   */
  const cloneVoice = async (file, { name, description, onUploadProgress }) => {
    const formData = new FormData();
    formData.append("file", file);
    if (name) formData.append("name", name);
    if (description) formData.append("description", description);

    return axiosClient
      .post("/api/video-processor/tools/voices/clone", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (onUploadProgress && progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onUploadProgress(percentCompleted);
          }
        },
      })
      .then((r) => r.data);
  };

  /**
   * Lấy danh sách giọng đã clone của user
   * GET /api/video-processor/tools/voices/my
   * Returns: { ok: true, voices: [...] }
   */
  const myVoices = async () => {
    return axiosClient
      .get("/api/video-processor/tools/voices/my")
      .then((r) => r.data);
  };

  /**
   * Xóa giọng đã clone
   * DELETE /api/video-processor/tools/voices/:id
   * Returns: { ok: true, deleted: {...} }
   */
  const deleteVoice = async (voiceId) => {
    return axiosClient
      .delete(`/api/video-processor/tools/voices/${voiceId}`)
      .then((r) => r.data);
  };

  return { listVoices, previewVoice, cloneVoice, myVoices, deleteVoice };
}

