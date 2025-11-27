import Login from "@/features/auth/components/Login";
export const metadata = {
  title: "Đăng nhập - D2MBox",
  description:
    "Đăng nhập vào tài khoản D2MBox để truy cập các tính năng lưu trữ đám mây và công cụ AI",
  robots: {
    index: false,
    follow: false,
  },
};
export default async function Page() {
  return <Login />;
}
