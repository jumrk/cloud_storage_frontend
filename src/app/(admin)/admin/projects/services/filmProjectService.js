import axiosClient from "@/shared/lib/axiosClient";

export default function filmProjectService() {
  const getProjects = (params = {}) => {
    const { page = 1, limit = 10, category, service, search } = params;
    const queryParams = { page, limit };
    if (category) queryParams.category = category;
    if (service) queryParams.service = service;
    if (search) queryParams.search = search;
    
    return axiosClient
      .get("/api/admin/projects", { params: queryParams })
      .then((r) => r.data);
  };

  const getProjectById = (id) =>
    axiosClient.get(`/api/admin/projects/${id}`).then((r) => r.data);

  const createProject = (data) =>
    axiosClient.post("/api/admin/projects", data).then((r) => r.data);

  const updateProject = (id, data) =>
    axiosClient.put(`/api/admin/projects/${id}`, data).then((r) => r.data);

  const deleteProject = (id) =>
    axiosClient.delete(`/api/admin/projects/${id}`).then((r) => r.data);

  return {
    getProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
  };
}

