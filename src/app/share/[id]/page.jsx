import SharePage from "@/components/share_page_component";
import React from "react";
export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return [];
}

function page() {
  return <SharePage />;
}

export default page;
