import axiosClient from "@/shared/lib/axiosClient";

const ORDERS_API = "/api/admin/orders";
const DISCOUNT_CODES_API = "/api/admin/discount-codes";

const paymentService = {
  getOrders: async (params = {}) => {
    const response = await axiosClient.get(ORDERS_API, { params });
    return response.data;
  },

  updateOrderStatus: async (payload = {}, token) => {
    const headers =
      token && token.length > 0 ? { Authorization: `Bearer ${token}` } : {};
    const response = await axiosClient.patch(ORDERS_API, payload, {
      headers,
    });
    return response.data;
  },

  getDiscountCodes: async () => {
    const response = await axiosClient.get(DISCOUNT_CODES_API);
    return response.data;
  },

  createDiscountCode: async (data) => {
    const response = await axiosClient.post(DISCOUNT_CODES_API, data);
    return response.data;
  },

  deleteDiscountCode: async (id) => {
    const response = await axiosClient.delete(DISCOUNT_CODES_API, {
      params: { id },
    });
    return response.data;
  },
};

export default paymentService;


