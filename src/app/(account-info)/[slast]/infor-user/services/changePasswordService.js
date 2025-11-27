import axiosClient from "@/shared/lib/axiosClient";

export default function changePasswordService() {
  const editPassword = (form) => {
    return axiosClient.patch("/api/user/edit/password", {
      oldPassword: form.oldPassword,
      newPassword: form.newPassword,
    });
  };

  return { editPassword };
}

