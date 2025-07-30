import axios from "axios";

const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000",
  withCredentials: true,
});

axiosClient.interceptors.request.use(
  (config) => {
    // Ưu tiên token từ localStorage cho cross-domain
    if (!config.headers.Authorization) {
      let token = null;
      if (typeof window !== "undefined") {
        token = localStorage.getItem("token");
      }
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
  (response) => {
    // Lưu token vào localStorage nếu có trong response
    if (response.data?.token && typeof window !== "undefined") {
      localStorage.setItem("token", response.data.token);
    }
    return response;
  },
  (error) => {
    // Xử lý lỗi authentication
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        // Redirect to login nếu cần
        if (window.location.pathname !== "/Login") {
          window.location.href = "/Login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
