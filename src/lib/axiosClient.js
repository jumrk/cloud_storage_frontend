import axios from "axios";

const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000",
  withCredentials: true,
});

axiosClient.interceptors.request.use(
  (config) => {
    // Ưu tiên token truyền vào config.headers.Authorization
    // Nếu không có, thử lấy từ localStorage (nếu có window)
    if (!config.headers.Authorization) {
      let token = null;
      if (typeof window !== "undefined") {
        token = localStorage.getItem("token");
      }
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    // Nếu không có token, vẫn gửi request bình thường
    return config;
  },
  (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosClient;
