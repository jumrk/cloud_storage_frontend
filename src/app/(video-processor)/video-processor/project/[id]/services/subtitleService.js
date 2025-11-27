import axiosClient from "@/shared/lib/axiosClient";
import sleep from "@/shared/utils/sleep";

export default function subtitleService() {
  const updateSubtitleStyle = async ({ projectId, subtitleStyle }) => {
    await sleep();
    return axiosClient
      .put(`/api/video-processor/project/${projectId}`, { subtitleStyle })
      .then((r) => r.data);
  };

  return { updateSubtitleStyle };
}

