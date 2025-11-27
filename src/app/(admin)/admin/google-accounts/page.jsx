import React from "react";
import GoogleAccountsPage from "./components/GoogleAccountsPage";

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
  return <GoogleAccountsPage />;
}

export default page;

