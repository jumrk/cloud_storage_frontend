import axiosClient from "@/shared/lib/axiosClient";

const STORAGE_API = "/api/admin/drive/storage";
const DRIVE_LIST_API = "/api/admin/drive/list";
const DELETE_WITH_TRANSFER_API = "/api/admin/drive/delete-with-transfer";

const googleAccountService = {
  getStorageSummary: async () => {
    const res = await axiosClient.get(STORAGE_API);
    return res.data;
  },

  getAccounts: async (params = {}) => {
    const res = await axiosClient.get(DRIVE_LIST_API, { params });
    return res.data;
  },

  deleteAccount: async (accountId) => {
    const res = await axiosClient.post(DELETE_WITH_TRANSFER_API, {
      accountId,
    });
    return res.data;
  },
};

export default googleAccountService;


