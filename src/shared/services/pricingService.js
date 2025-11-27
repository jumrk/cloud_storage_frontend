import axiosClient from "../lib/axiosClient";

const PRICING_API = "/api/pricing";

const pricingService = {
  getPlans: async () => {
    const res = await axiosClient.get(`${PRICING_API}/plans`);
    return res.data?.data || [];
  },
  getPlan: async (slug) => {
    const res = await axiosClient.get(`${PRICING_API}/plans/${slug}`);
    return res.data?.data || null;
  },
  previewCheckout: async (payload) => {
    const res = await axiosClient.post(
      `${PRICING_API}/checkout/summary`,
      payload
    );
    return res.data;
  },
};

export default pricingService;

