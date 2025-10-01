import DetailBoard from "@/components/jobManagement/Board/DetailBoard";

import React from "react";

async function page({ params }) {
  const { id } = await params;
  return <DetailBoard boardId={id} />;
}

export default page;
