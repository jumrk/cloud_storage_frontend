import axiosClient from "@/shared/lib/axiosClient";

export default function checklistTemplateService() {
  const getByBoardId = (boardId) => {
    return axiosClient.get(`/api/job-management/boards/${boardId}/checklist-templates`);
  };

  const create = (boardId, { name, title, items } = {}) => {
    return axiosClient.post(`/api/job-management/boards/${boardId}/checklist-templates`, {
      name,
      title: title || name,
      items: items || [],
    });
  };

  const update = (templateId, { name, title, items } = {}) => {
    return axiosClient.put(`/api/job-management/checklist-templates/${templateId}`, {
      name,
      title,
      items,
    });
  };

  const remove = (templateId) => {
    return axiosClient.delete(`/api/job-management/checklist-templates/${templateId}`);
  };

  return {
    getByBoardId,
    create,
    update,
    remove,
  };
}
