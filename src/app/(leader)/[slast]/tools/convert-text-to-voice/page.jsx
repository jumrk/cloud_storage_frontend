import Convert_Text_To_Voice from "@/components/client/tool/convert-text/Page";
import React from "react";

export async function generateMetadata({ params }) {
  return {
    title: "Chuyển văn bản thành giọng nói - D2MBox",
    description:
      "Công cụ chuyển đổi văn bản thành giọng nói AI trong khu vực leader D2MBox",
    robots: {
      index: false,
      follow: false,
    },
  };
}

function page() {
  return <Convert_Text_To_Voice />;
}

export default page;
