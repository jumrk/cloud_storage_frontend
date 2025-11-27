import axiosClient from "@/shared/lib/axiosClient";

export default function userService() {
  const getUsers = () =>
    axiosClient.get("/api/admin/users/list").then((r) => r.data);

  const createUser = (data) =>
    axiosClient.post("/api/admin/users", data).then((r) => r.data);

  const updateUserRole = (userId, role) =>
    axiosClient
      .patch(`/api/admin/users/role/${userId}`, { role })
      .then((r) => r.data);

  const checkSlast = (slast) =>
    axiosClient
      .get("/api/user/check-slast", { params: { slast } })
      .then((r) => r.data);

  const getPlans = () =>
    axiosClient.get("/api/admin/plans").then((r) => r.data);

  return {
    getUsers,
    createUser,
    updateUserRole,
    checkSlast,
    getPlans,
  };
}

