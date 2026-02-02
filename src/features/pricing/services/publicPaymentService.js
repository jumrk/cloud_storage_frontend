import axiosClient from "@/shared/lib/axiosClient";

const PUBLIC_PAYMENT_SETTINGS_API = "/api/public/payment-settings";

const CREATE_VNPAY_URL_API = "/api/orders/vnpay/create-url";

const publicPaymentService = {
  getPublicSettings: async () => {
    const response = await axiosClient.get(PUBLIC_PAYMENT_SETTINGS_API);
    return response.data;
  },

  createVnpayUrl: async (orderId) => {
    const response = await axiosClient.post(CREATE_VNPAY_URL_API, { orderId });
    return response.data;
  },
};

export default publicPaymentService;
