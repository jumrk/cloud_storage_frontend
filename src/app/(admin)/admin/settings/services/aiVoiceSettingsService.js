import axiosClient from "@/shared/lib/axiosClient";

const AI_VOICE_SETTINGS_API = "/api/admin/ai-voice-settings";

const aiVoiceSettingsService = {
  getSettings: async () => {
    const response = await axiosClient.get(AI_VOICE_SETTINGS_API);
    return response.data;
  },

  updateSettings: async (data) => {
    const response = await axiosClient.put(AI_VOICE_SETTINGS_API, data);
    return response.data;
  },
};

export default aiVoiceSettingsService;

