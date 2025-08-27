import axiosClient from "@/lib/axiosClient";

/**
 * Tạo audio 1 loa (single).
 * @param {Object} p
 * @param {"gemini"|"elevenlabs"} p.provider
 * @param {string} p.voiceId
 * @param {string} p.text
 * @param {string} [p.style]
 * @param {number} [p.rate=1.0]
 * @param {number} [p.pitch=0]
 * @param {number} [p.volume=0]
 * @param {"wav"|"mp3"} [p.format="wav"]
 * @param {number} [p.sampleRate=24000]
 * @returns {Promise<Blob>}
 */
export async function generateSingleAudio(p) {
  const payload = {
    mode: "single",
    provider: p.provider,
    voiceId: p.voiceId,
    text: p.text,
    style: p.style || "",
    rate: p.rate ?? 1.0,
    pitch: p.pitch ?? 0,
    volume: p.volume ?? 0,
    format: p.format || "wav",
    sampleRate: p.sampleRate ?? 24000,
  };

  const res = await axiosClient.post(
    "/api/tools/convert-text/generate-single",
    payload,
    { responseType: "blob" }
  );
  return res.data; // Blob
}
