import MemberFileManager from "@/components/member/MemberPage";
import React from "react";

export async function generateMetadata({ params }) {
  return {
    title: "Quản lý file thành viên - D2MBox",
    description: "Quản lý file và folder trong khu vực thành viên D2MBox",
    robots: {
      index: false,
      follow: false,
    },
  };
}

function page() {
  return <MemberFileManager />;
}

export default page;
