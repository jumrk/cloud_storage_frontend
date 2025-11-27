import axios from "axios";

const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000",
  withCredentials: true,
});

axiosClient.interceptors.request.use(
  (config) => {
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
    if (response.data?.token && typeof window !== "undefined") {
      localStorage.setItem("token", response.data.token);
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        if (window.location.pathname !== "/Login") {
          window.location.href = "/Login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
