import axiosClient from "@/shared/lib/axiosClient";

const CREDITS_API = "/api/credits";

const creditsService = {
  /**
   * Get user credits info
   * @returns {Promise<{success: boolean, data: {current: number, planCredits: number, planName: string}}>}
   */
  getCredits: async () => {
    const response = await axiosClient.get(CREDITS_API);
    return response.data;
  },

  /**
   * Purchase credits
   * @param {number} amount - Amount to pay (VND)
   * @param {number} credits - Credits to add
   * @returns {Promise<{success: boolean, data: {credits: number, added: number}}>}
   */
  purchaseCredits: async (amount, credits) => {
    const response = await axiosClient.post(`${CREDITS_API}/purchase`, {
      amount,
      credits,
    });
    return response.data;
  },
};

export default creditsService;

