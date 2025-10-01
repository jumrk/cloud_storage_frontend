// service convert
import axiosClient from "../axiosClient";

export function getVoicesMy() {
  return axiosClient.get("/api/tools/convert-text/voices/my");
}
export function getVoiceDefault() {
  return axiosClient.get("/api/tools/convert-text/voices", {
    params: { provider: "elevenlabs" },
  });
}
export function startGenerateTimeline(payload) {
  return axiosClient.post(
    "/api/tools/convert-text/generate-timeline/start",
    payload
  );
}

export function resultGenerate(jobId) {
  return axiosClient.get(
    `/api/tools/convert-text/generate-timeline/result/${jobId}`,
    {
      responseType: "blob",
    }
  );
}

export function getVoiceElevenlabs(
  globalVoice,
  modelId,
  stability,
  similarity,
  controller
) {
  return axiosClient.post(
    "/api/tools/convert-text/get-voice-elevenlabs",
    {
      id: globalVoice,
      model_id: modelId,
      voice_settings: {
        stability: Number(stability),
        similarity_boost: Number(similarity),
      },
    },
    { responseType: "blob", signal: controller.signal }
  );
}

export function deleteMyVoice(globalVoice) {
  return axiosClient.delete(
    `/api/tools/convert-text/voices/${encodeURIComponent(globalVoice)}`
  );
}
export function createCloneVoice(form, setUploadProgress) {
  return axiosClient.post("/api/tools/convert-text/clone-voice", form, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => {
      if (e.total) setUploadProgress(Math.round((e.loaded / e.total) * 100));
    },
  });
}

// service download

export function AnalyzeDownload(link) {
  return axiosClient.post("/api/tools/download/analyze", {
    url: link,
  });
}

export function HandleDownload(url, format) {
  return axiosClient.post("/api/tools/download/download", {
    url,
    format,
  });
}
