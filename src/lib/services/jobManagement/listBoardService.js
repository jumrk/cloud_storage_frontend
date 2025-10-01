import axiosClient from "@/lib/axiosClient";

export default function listBoardService() {
  const createList = (boardId, title) => {
    return axiosClient.post(`/api/job-management/boards/${boardId}/lists`, {
      title,
    });
  };

  const getLists = (boardId) => {
    return axiosClient.get(`/api/job-management/boards/${boardId}/lists`);
  };

  const updateList = (listId, { title, pos }) => {
    return axiosClient.put(`/api/job-management/lists/${listId}`, {
      title,
      pos,
    });
  };

  const deleteList = (listId) => {
    return axiosClient.delete(`/api/job-management/lists/${listId}`);
  };

  const reorderListsInBoard = (boardId, updates = []) => {
    return axiosClient.post(
      `/api/job-management/boards/${boardId}/lists/reorder`,
      {
        orderedIds: updates,
      }
    );
  };

  return {
    createList,
    getLists,
    updateList,
    deleteList,
    reorderListsInBoard,
  };
}
