import axiosClient from "@/shared/lib/axiosClient";

const AI_VOICE_PUBLIC_API = "/api/public/ai-voice-settings";

const aiVoicePublicService = {
  getPublicSettings: async () => {
    const response = await axiosClient.get(AI_VOICE_PUBLIC_API);
    return response.data;
  },
};

export default aiVoicePublicService;

