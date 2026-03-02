import axiosClient from "@/shared/lib/axiosClient";

const STORAGE_SETTINGS_API = "/api/admin/settings/storage";

const storageSettingsService = {
  getSettings: async () => {
    const response = await axiosClient.get(STORAGE_SETTINGS_API);
    return response.data;
  },

  updateSettings: async (data) => {
    const response = await axiosClient.put(STORAGE_SETTINGS_API, data);
    return response.data;
  },

  checkWritable: async (path) => {
    const response = await axiosClient.post(
      `${STORAGE_SETTINGS_API}/check-writable`,
      { path: path || undefined, localStorageRoot: path || undefined }
    );
    return response.data;
  },
};

export default storageSettingsService;
