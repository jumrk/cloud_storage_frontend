import axiosClient from "@/lib/axiosClient";

export default function cardService() {
  const createCard = (listId, title) => {
    return axiosClient.post(`/api/job-management/lists/${listId}/cards`, {
      title,
    });
  };

  const getCardsByList = (listId) => {
    return axiosClient.get(`/api/job-management/lists/${listId}/cards`);
  };

  const getCardById = (cardId) => {
    return axiosClient.get(`/api/job-management/cards/${cardId}`);
  };

  const updateCard = (
    cardId,
    {
      title,
      descFormat,
      descDoc,
      descHtmlCached,
      descText,
      labels,
      dueAt,
      members,
      pos,
      listId,
    } = {}
  ) => {
    return axiosClient.put(`/api/job-management/cards/${cardId}`, {
      title,
      descFormat,
      descDoc,
      descHtmlCached,
      descText,
      labels,
      dueAt,
      members,
      pos,
      listId,
    });
  };

  const deleteCard = (cardId) => {
    return axiosClient.delete(`/api/job-management/cards/${cardId}`);
  };

  const moveCard = (cardId, { toListId, toPos }) => {
    return axiosClient.post(`/api/job-management/cards/${cardId}/move`, {
      toListId,
      toPos,
    });
  };

  const reorderCardsInList = (listId, orderedIds = []) => {
    return axiosClient.post(
      `/api/job-management/lists/${listId}/cards/reorder`,
      {
        orderedIds,
      }
    );
  };

  const archiveCard = (cardId) => {
    return axiosClient.post(`/api/job-management/cards/${cardId}/archive`);
  };

  const unarchiveCard = (cardId) => {
    return axiosClient.post(`/api/job-management/cards/${cardId}/unarchive`);
  };

  return {
    createCard,
    getCardsByList,
    getCardById,
    updateCard,
    deleteCard,
    moveCard,
    reorderCardsInList,
    archiveCard,
    unarchiveCard,
  };
}
