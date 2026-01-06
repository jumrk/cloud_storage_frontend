import axiosClient from "@/shared/lib/axiosClient";

const orderService = {
  /**
   * Lấy danh sách orders của user hiện tại
   * @param {Object} params - Query params (status, etc.)
   * @returns {Promise} Response data
   */
  getOrders: async (params = {}) => {
    const response = await axiosClient.get("/api/orders", { params });
    return response.data;
  },
};

export default orderService;
