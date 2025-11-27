import AdminLogin from "@/features/auth/components/AdminLogin";

export const metadata = {
  title: "Đăng nhập Admin - D2MBox",
  description:
    "Truy cập bảng điều khiển quản trị D2MBox để quản lý người dùng, gói dịch vụ và hệ thống.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return <AdminLogin />;
}
