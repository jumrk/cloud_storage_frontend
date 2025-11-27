import axiosClient from "@/shared/lib/axiosClient";

export default function chatServices() {
  const buildBeforeParam = (firstMsg) =>
    firstMsg && firstMsg._id ? `&before=${firstMsg._id}` : "";

  const getConversationMessages = (selected, firstMsg) => {
    return axiosClient.get(
      `/api/message?withUser=${selected}${buildBeforeParam(
        firstMsg
      )}&limit=20`
    );
  };

  const getGroupMessages = (groupId, firstMsg) => {
    return axiosClient.get(
      `/api/message/group/${groupId}/messages?limit=20${buildBeforeParam(
        firstMsg
      )}`
    );
  };

  const markConversationAsRead = (chat) => {
    return axiosClient.patch("/api/message/read", { partnerId: chat.id });
  };

  return { getConversationMessages, getGroupMessages, markConversationAsRead };
}
