import TranslateSubtitles from "@/components/client/tool/sub/TranslateSubtitles";
import React from "react";

export async function generateMetadata({ params }) {
  return {
    title: "Dịch phụ đề - D2MBox",
    description:
      "Công cụ dịch phụ đề video sang nhiều ngôn ngữ trong khu vực thành viên D2MBox",
    robots: {
      index: false,
      follow: false,
    },
  };
}

function Page() {
  return <TranslateSubtitles />;
}

export default Page;
