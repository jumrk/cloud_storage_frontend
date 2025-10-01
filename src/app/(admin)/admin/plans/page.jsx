import AdminPlansPage from "@/components/admin/plans/PlansPage";
import React from "react";

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
  return <AdminPlansPage />;
}

export default page;
