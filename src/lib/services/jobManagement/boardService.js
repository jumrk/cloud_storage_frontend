import axiosClient from "@/lib/axiosClient";

export default function boardService() {
  const getBoard = () => {
    return axiosClient.get("/api/job-management/boards");
  };
  const getGuestBoard = () => {
    return axiosClient.get("/api/job-management/boards/Guest");
  };
  const postBoard = (title) => {
    return axiosClient.post("/api/job-management/boards", { title: title });
  };
  const getBoardById = (boardId) => {
    return axiosClient.get(`/api/job-management/boards/${boardId}`);
  };
  const updateBoard = (boardId) => {
    return axiosClient.put(`/api/job-management/boards/${boardId}`);
  };
  const deleteBoard = (boardId) => {
    return axiosClient.delete(`/api/job-management/boards/${boardId}`);
  };
  const addMember = (email, boardId) => {
    return axiosClient.post(
      `/api/job-management/boards/${boardId}/add-member`,
      { email }
    );
  };
  const removeMember = (boardId, memberId) => {
    return axiosClient.delete(
      `/api/job-management/boards/${boardId}/remove-member/${memberId}`
    );
  };
  return {
    getBoard,
    postBoard,
    getBoardById,
    updateBoard,
    deleteBoard,
    addMember,
    removeMember,
    getGuestBoard,
  };
}
