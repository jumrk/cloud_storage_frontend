import axiosClient from "@/shared/lib/axiosClient";

const AI_ASR_SETTINGS_API = "/api/admin/ai-asr-settings";

const aiAsrSettingsService = {
  getSettings: async () => {
    const response = await axiosClient.get(AI_ASR_SETTINGS_API);
    return response.data;
  },

  updateSettings: async (data) => {
    const response = await axiosClient.put(AI_ASR_SETTINGS_API, data);
    return response.data;
  },
};

export default aiAsrSettingsService;

