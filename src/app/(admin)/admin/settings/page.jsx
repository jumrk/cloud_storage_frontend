import React from "react";
import SettingsPage from "./components/SettingsPage";

export async function generateMetadata({ params }) {
  return {
    title: "Cài đặt - D2MBox",
    description: "Quản lý cài đặt hệ thống trong khu vực admin D2MBox",
    robots: {
      index: false,
      follow: false,
    },
  };
}

function page() {
  return <SettingsPage />;
}

export default page;

