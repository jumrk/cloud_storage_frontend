import MergePage from "@/components/client/tool/merge/Page";
import React from "react";

export async function generateMetadata({ params }) {
  return {
    title: "Ghép video - D2MBox",
    description:
      "Công cụ ghép nhiều video thành một file duy nhất trong khu vực thành viên D2MBox",
    robots: {
      index: false,
      follow: false,
    },
  };
}

function page() {
  return <MergePage />;
}

export default page;
