import ForgotPassword from "@/features/auth/components/ForgotPassword";
import React from "react";
export const metadata = {
  title: "Quên mật khẩu - D2MBox",
  description:
    "Khôi phục mật khẩu tài khoản D2MBox của bạn một cách an toàn và nhanh chóng",
  robots: {
    index: false,
    follow: false,
  },
};
function page() {
  return <ForgotPassword />;
}

export default page;
