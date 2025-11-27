import axiosClient from "@/shared/lib/axiosClient";
import sleep from "@/shared/utils/sleep";

export default function projectsService() {
  const listProjects = async ({
    q = "",
    aspect = "",
    sort = "modified",
    order = "desc",
    limit,
    signal,
  }) => {
    const params = {};
    if (q) params.q = q;
    if (aspect) params.aspect = aspect;
    if (sort) params.sort = sort;
    if (order) params.order = order;
    if (limit) params.limit = limit;
    await sleep();
    return axiosClient
      .get("/api/video-processor/project", { params, signal })
      .then((r) => r.data);
  };

  const createProject = async ({ title, aspect = "9:16", fps = 30 }) => {
    await sleep();
    return axiosClient
      .post("/api/video-processor/project", { title, aspect, fps })
      .then((r) => r.data);
  };
  const updateProject = async ({ id, title }) => {
    await sleep();
    return axiosClient
      .put(`/api/video-processor/project/${id}`, { title })
      .then((r) => r.data);
  };
  const deleteProject = async ({ id }) => {
    await sleep();
    return axiosClient
      .delete(`/api/video-processor/project/${id}`)
      .then((r) => r.data);
  };

  return { listProjects, createProject, updateProject, deleteProject };
}
