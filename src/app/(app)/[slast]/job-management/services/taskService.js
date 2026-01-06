import axiosClient from "@/shared/lib/axiosClient";

export default function taskService() {
  const getAssignedCards = (params = {}) =>
    axiosClient.get("/api/job-management/cards/assigned", { params });

  return {
    getAssignedCards,
  };
}


