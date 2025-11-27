import axiosClient from "@/shared/lib/axiosClient";

const notificationService = () => {
  const getNotifications = async (page = 1, limit = 20) => {
    return axiosClient.get("/api/notification", {
      params: { page, limit },
    });
  };

  const markAsRead = async (notificationId) => {
    return axiosClient.post("/api/notification/read", { notificationId });
  };

  const markAllAsRead = async () => {
    return axiosClient.post("/api/notification/read-all");
  };

  const deleteNotification = async (notificationId) => {
    return axiosClient.delete("/api/notification/delete", {
      data: { notificationId },
    });
  };

  return {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
};

export default notificationService;

