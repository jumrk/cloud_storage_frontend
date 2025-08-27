import DownloadTool from "@/components/client/tool/download/Page";
import React from "react";
export const metadata = { title: "Tải video" };
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
