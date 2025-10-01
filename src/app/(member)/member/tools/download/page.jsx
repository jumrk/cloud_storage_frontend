import DownloadTool from "@/components/client/tool/download/Page";
import React from "react";

export async function generateMetadata({ params }) {
  return {
    title: "Tải video - D2MBox",
    description:
      "Công cụ tải video từ YouTube, iQiyi, Tencent và các nền tảng khác trong khu vực thành viên D2MBox",
    robots: {
      index: false,
      follow: false,
    },
  };
}

function page() {
  const logoList = [
    "/images/logo/baidu.png",
    "/images/logo/iqiyi.png",
    "/images/logo/v.qq.png",
    "/images/logo/youtube.png",
  ];
  return <DownloadTool logoList={logoList} />;
}

export default page;
