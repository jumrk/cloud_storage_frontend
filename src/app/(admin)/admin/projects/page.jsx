import React from "react";
import ProjectsPage from "./components/ProjectsPage";

export async function generateMetadata({ params }) {
  return {
    title: "Quản lý dự án - D2MBox",
    description:
      "Quản lý các dự án trong khu vực admin D2MBox",
    robots: {
      index: false,
      follow: false,
    },
  };
}

function page() {
  return <ProjectsPage />;
}

export default page;

