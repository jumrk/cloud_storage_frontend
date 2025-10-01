import SeparateSubtitles from "@/components/client/tool/subtitle/SeparateSubtitles";
import React from "react";

export async function generateMetadata({ params }) {
  return {
    title: "Tách phụ đề - D2MBox",
    description: "Công cụ tách phụ đề từ video trong khu vực leader D2MBox",
    robots: {
      index: false,
      follow: false,
    },
  };
}

function Page() {
  return <SeparateSubtitles />;
}

export default Page;
