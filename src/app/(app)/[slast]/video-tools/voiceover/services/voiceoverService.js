import axiosClient from "@/shared/lib/axiosClient";

const VOICEOVER_API = "/api/tools/voiceover";

const voiceoverService = {
  getVoices: async (provider, model) => {
    const response = await axiosClient.get(`${VOICEOVER_API}/voices`, {
      params: { provider, model },
    });
    return response.data;
  },

  previewVoice: async (provider, model, voiceId, text) => {
    const response = await axiosClient.post(`${VOICEOVER_API}/preview`, {
      provider,
      model,
      voiceId,
      text,
    });
    return response.data;
  },

  generateVoice: async (provider, model, voiceId, text, settings = {}) => {
    const response = await axiosClient.post(`${VOICEOVER_API}/generate`, {
      provider,
      model,
      voiceId,
      text,
      settings, // speed, pitch, volume, stability, clarity, etc.
    });
    return response.data;
  },

  mergeSegments: async (segments) => {
    // segments: Array of { url, duration, order }
    const response = await axiosClient.post(`${VOICEOVER_API}/merge`, {
      segments,
    });
    return response.data;
  },
};

export default voiceoverService;
