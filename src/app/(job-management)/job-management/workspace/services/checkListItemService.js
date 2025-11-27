import axiosClient from "@/shared/lib/axiosClient";

export default function checklistItemService() {
  const createItem = (checklistId, { text, assignee, dueAt } = {}) => {
    return axiosClient.post(
      `/api/job-management/checklists/${checklistId}/items`,
      {
        text,
        assignee,
        dueAt,
      }
    );
  };

  const getItemsByChecklist = (checklistId) => {
    return axiosClient.get(
      `/api/job-management/checklists/${checklistId}/items`
    );
  };

  const updateItem = (itemId, { text, isDone, assignee, dueAt, pos } = {}) => {
    return axiosClient.put(`/api/job-management/items/${itemId}`, {
      text,
      isDone,
      assignee,
      dueAt,
      pos,
    });
  };

  const deleteItem = (itemId) => {
    return axiosClient.delete(`/api/job-management/items/${itemId}`);
  };

  return {
    createItem,
    getItemsByChecklist,
    updateItem,
    deleteItem,
  };
}
