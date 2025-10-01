import AdminGoogleAccounts from "@/components/admin/google_account/GoogleAccountPage";
import React from "react";

export async function generateMetadata({ params }) {
  return {
    title: "Quản lý tài khoản Google - D2MBox",
    description: "Quản lý tài khoản Google Drive trong khu vực admin D2MBox",
    robots: {
      index: false,
      follow: false,
    },
  };
}

function page() {
  return <AdminGoogleAccounts />;
}

export default page;
