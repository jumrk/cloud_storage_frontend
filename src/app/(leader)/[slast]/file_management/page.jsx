import YourFolder from "@/components/client/file_management/FileManagemant";
import React from "react";

export async function generateMetadata({ params }) {
  return {
    title: "Quản lý tệp - D2MBox",
    description: "Quản lý file và folder trong khu vực leader D2MBox",
    robots: {
      index: false,
      follow: false,
    },
  };
}

function page() {
  return <YourFolder />;
}

export default page;
