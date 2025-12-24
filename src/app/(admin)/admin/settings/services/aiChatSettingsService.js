import axiosClient from "@/shared/lib/axiosClient";

const AI_CHAT_SETTINGS_API = "/api/admin/ai-chat-settings";

const aiChatSettingsService = {
  getSettings: async () => {
    const response = await axiosClient.get(AI_CHAT_SETTINGS_API);
    return response.data;
  },

  updateSettings: async (data) => {
    const response = await axiosClient.put(AI_CHAT_SETTINGS_API, data);
    return response.data;
  },
};

export default aiChatSettingsService;

