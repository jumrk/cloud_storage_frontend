import axios from "axios";

const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000",
  withCredentials: true, // ✅ Automatically send cookies with requests
});

// ✅ No need for request interceptor - cookies are sent automatically
// ✅ No need to manually add Authorization header

axiosClient.interceptors.response.use(
  (response) => {
    // ✅ Token is set via httpOnly cookie by backend, no need to save to localStorage
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        const requestUrl = error?.config?.url || "";
        const currentPath = window.location.pathname || "";
        
        // Public paths that should not redirect to login on 401
        const publicPaths = [
          "/",
          "/login",
          "/register",
          "/forgot-password",
          "/about",
          "/contact",
          "/faq",
          "/pricing",
          "/privacy_policy",
          "/terms_of_use",
          "/cookie_policy",
        ];
        
        const isPublicPath = publicPaths.some(
          (p) => currentPath === p || currentPath.startsWith(p + "/")
        );
        const isShareRequest =
          requestUrl.includes("/api/share/") || currentPath.startsWith("/share/");

        // Do not force redirect for public pages or share pages
        if (!isShareRequest && !isPublicPath) {
          if (currentPath !== "/login") {
            window.location.href = "/login";
          }
        }
      }
    }
    return Promise.reject(error);
  },
);

export default axiosClient;
