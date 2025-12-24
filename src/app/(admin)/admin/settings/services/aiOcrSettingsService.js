import axiosClient from "@/shared/lib/axiosClient";

const AI_OCR_SETTINGS_API = "/api/admin/ai-ocr-settings";

const aiOcrSettingsService = {
  getSettings: async () => {
    const response = await axiosClient.get(AI_OCR_SETTINGS_API);
    return response.data;
  },

  updateSettings: async (data) => {
    const response = await axiosClient.put(AI_OCR_SETTINGS_API, data);
    return response.data;
  },
};

export default aiOcrSettingsService;

