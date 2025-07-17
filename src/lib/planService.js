import axiosClient from "./axiosClient";

const PLANS_API = "/api/admin/plans";

export const planService = {
  // Lấy danh sách plans
  getPlans: async (params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append("page", params.page);
    if (params.limit) queryParams.append("limit", params.limit);
    if (params.search) queryParams.append("search", params.search);
    if (params.status) queryParams.append("status", params.status);

    const response = await axiosClient.get(
      `${PLANS_API}?${queryParams.toString()}`
    );
    return response.data;
  },

  // Lấy chi tiết plan
  getPlan: async (id) => {
    const response = await axiosClient.get(`${PLANS_API}/${id}`);
    return response.data;
  },

  // Tạo plan mới
  createPlan: async (data) => {
    const response = await axiosClient.post(PLANS_API, data);
    return response.data;
  },

  // Cập nhật plan
  updatePlan: async (id, data) => {
    const response = await axiosClient.put(`${PLANS_API}/${id}`, data);
    return response.data;
  },

  // Xóa plan
  deletePlan: async (id) => {
    const response = await axiosClient.delete(`${PLANS_API}/${id}`);
    return response.data;
  },

  // Toggle trạng thái active/inactive
  togglePlanStatus: async (id) => {
    const response = await axiosClient.patch(`${PLANS_API}/${id}/toggle`);
    return response.data;
  },

  // Lấy thống kê plans
  getPlanStats: async () => {
    const response = await axiosClient.get(`${PLANS_API}/stats`);
    return response.data;
  },
};

export default planService;
