import axiosClient from "@/lib/axiosClient";

export default function commentService() {
  const createComment = (cardId, text) => {
    return axiosClient.post(`/api/job-management/cards/${cardId}/comments`, {
      text,
    });
  };

  const getCommentsByCard = (cardId) => {
    return axiosClient.get(`/api/job-management/cards/${cardId}/comments`);
  };

  const updateComment = (commentId, { text }) => {
    return axiosClient.put(`/api/job-management/comments/${commentId}`, {
      text,
    });
  };

  const deleteComment = (commentId) => {
    return axiosClient.delete(`/api/job-management/comments/${commentId}`);
  };

  return {
    createComment,
    getCommentsByCard,
    updateComment,
    deleteComment,
  };
}
