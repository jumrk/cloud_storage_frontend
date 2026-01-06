import axiosClient from "@/shared/lib/axiosClient";

export default function checklistService() {
  const createChecklist = (cardId, title) => {
    return axiosClient.post(`/api/job-management/cards/${cardId}/checklists`, {
      title,
    });
  };

  const getChecklists = (cardId) => {
    return axiosClient.get(`/api/job-management/cards/${cardId}/checklists`);
  };
  const updateChecklist = (checklistId, { title, pos } = {}) => {
    return axiosClient.put(`/api/job-management/checklists/${checklistId}`, {
      title,
      pos,
    });
  };

  const deleteChecklist = (checklistId) => {
    return axiosClient.delete(`/api/job-management/checklists/${checklistId}`);
  };

  return {
    createChecklist,
    getChecklists,
    updateChecklist,
    deleteChecklist,
  };
}
