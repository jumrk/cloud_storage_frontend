import SharePage from "@/components/SharePageComponent";
import React from "react";
export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return [];
}
export async function generateMetadata({ params }) {
  return {
    title: "Chia sẻ file - D2MBox",
    description:
      "Xem và tải xuống file được chia sẻ từ D2MBox. Truy cập an toàn và nhanh chóng.",
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: "File được chia sẻ - D2MBox",
      description: "Truy cập file được chia sẻ từ D2MBox",
      type: "website",
    },
  };
}
function page() {
  return <SharePage />;
}

export default page;
