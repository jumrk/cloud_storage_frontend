import React from "react";
import PlansPage from "./components/PlansPage";

export async function generateMetadata({ params }) {
  return {
    title: "Quản lý gói - D2MBox",
    description: "Quản lý các gói dịch vụ và giá cả trong khu vực admin D2MBox",
    robots: {
      index: false,
      follow: false,
    },
  };
}

function page() {
  return <PlansPage />;
}

export default page;

