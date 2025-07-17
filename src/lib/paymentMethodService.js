import axiosClient from "./axiosClient";

const PAYMENT_METHODS_API = "/api/admin/payment-methods";

export const paymentMethodService = {
  // Lấy danh sách payment methods
  getPaymentMethods: async (params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append("page", params.page);
    if (params.limit) queryParams.append("limit", params.limit);
    if (params.search) queryParams.append("search", params.search);
    if (params.type) queryParams.append("type", params.type);
    if (params.isActive !== undefined)
      queryParams.append("isActive", params.isActive);

    const response = await axiosClient.get(
      `${PAYMENT_METHODS_API}?${queryParams.toString()}`
    );
    return response.data;
  },

  // Lấy chi tiết payment method
  getPaymentMethod: async (id) => {
    const response = await axiosClient.get(`${PAYMENT_METHODS_API}/${id}`);
    return response.data;
  },

  // Tạo payment method mới
  createPaymentMethod: async (data) => {
    const response = await axiosClient.post(PAYMENT_METHODS_API, data);
    return response.data;
  },

  // Cập nhật payment method
  updatePaymentMethod: async (id, data) => {
    const response = await axiosClient.put(
      `${PAYMENT_METHODS_API}/${id}`,
      data
    );
    return response.data;
  },

  // Xóa payment method
  deletePaymentMethod: async (id) => {
    const response = await axiosClient.delete(`${PAYMENT_METHODS_API}/${id}`);
    return response.data;
  },

  // Toggle trạng thái active/inactive
  togglePaymentMethodStatus: async (id) => {
    const response = await axiosClient.patch(
      `${PAYMENT_METHODS_API}/${id}/toggle`
    );
    return response.data;
  },

  // Lấy thống kê payment methods
  getPaymentMethodStats: async () => {
    const response = await axiosClient.get(`${PAYMENT_METHODS_API}/stats`);
    return response.data;
  },
};

export default paymentMethodService;
