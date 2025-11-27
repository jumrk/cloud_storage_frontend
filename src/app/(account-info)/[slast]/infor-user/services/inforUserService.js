import axiosClient from "@/shared/lib/axiosClient";
import sleep from "@/shared/utils/sleep";

export default function inforUserService() {
  const getInforUser = async () => {
    await sleep();
    return axiosClient.get("/api/user");
  };
  const editInforUser = async (form) => {
    await sleep();
    return axiosClient.patch("/api/user/edit", form);
  };
  const uploadAvatar = async (formData) => {
    return axiosClient.post("/api/user/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  };

  return { getInforUser, editInforUser, uploadAvatar };
}

