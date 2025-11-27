import axiosClient from "@/shared/lib/axiosClient";
import sleep from "@/shared/utils/sleep";

export default function projectByIdService() {
  const updateProject = async ({ id, title, aspect }) => {
    await sleep();
    return axiosClient
      .put(`/api/video-processor/project/${id}`, { title, aspect })
      .then((r) => r.data);
  };
  return { updateProject };
}
