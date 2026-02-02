import axiosClient from "@/shared/lib/axiosClient";

const PAYMENT_SETTINGS_API = "/api/admin/settings/payment";

const paymentSettingsService = {
  getSettings: async () => {
    const response = await axiosClient.get(PAYMENT_SETTINGS_API);
    return response.data;
  },

  updateSettings: async (data) => {
    const response = await axiosClient.put(PAYMENT_SETTINGS_API, data);
    return response.data;
  },
};

export default paymentSettingsService;
