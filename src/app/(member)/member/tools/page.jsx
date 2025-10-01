import React from "react";

export async function generateMetadata({ params }) {
  return {
    title: "Công cụ thành viên - D2MBox",
    description:
      "Sử dụng các công cụ AI và media trong khu vực thành viên D2MBox",
    robots: {
      index: false,
      follow: false,
    },
  };
}

function page() {
  return <div></div>;
}

export default page;
