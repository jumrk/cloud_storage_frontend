import ForgotPassword_component from "@/components/auth/ForgotPasswordComponent";
export const metadata = {
  title: "Quên mật khẩu - D2MBox",
  description:
    "Khôi phục mật khẩu tài khoản D2MBox của bạn một cách an toàn và nhanh chóng",
  robots: {
    index: false,
    follow: false,
  },
};
export default function ForgotPasswordPage() {
  return <ForgotPassword_component />;
}
