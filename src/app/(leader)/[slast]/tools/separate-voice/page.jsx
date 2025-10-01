import Separate_voice from "@/components/client/tool/separate-voice/Page";
import React from "react";

export async function generateMetadata({ params }) {
  return {
    title: "Tách âm thanh - D2MBox",
    description: "Công cụ tách âm thanh khỏi video trong khu vực leader D2MBox",
    robots: {
      index: false,
      follow: false,
    },
  };
}

function Page() {
  return <Separate_voice />;
}

export default Page;
