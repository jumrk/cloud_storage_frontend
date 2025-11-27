import axiosClient from "../lib/axiosClient";

export default function headerService() {
  const authLogout = () => {
    return axiosClient.post("/api/auth/logout");
  };

  return { authLogout };
}
