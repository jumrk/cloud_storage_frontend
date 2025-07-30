import axios from "axios";

const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000",
  withCredentials: true,
});

axiosClient.interceptors.request.use(
  (config) => {
    // Sử dụng cookie thay vì localStorage
    // Cookie sẽ được gửi tự động với withCredentials: true
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
