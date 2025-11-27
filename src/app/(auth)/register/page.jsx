import Register from "@/features/auth/components/Register";
import React from "react";
export const metadata = {
  title: "Đăng ký - D2MBox",
  description:
    "Đăng ký  tài khoản D2MBox để truy cập các tính năng lưu trữ đám mây và công cụ AI",
  robots: {
    index: false,
    follow: false,
  },
};
function page() {
  return <Register />;
}

export default page;
