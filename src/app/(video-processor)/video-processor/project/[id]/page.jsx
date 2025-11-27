import React from "react";
import AppShell from "./components/shell/AppShell";

async function page({ params }) {
  const { id } = await params;
  return <AppShell id={id} />;
}

export default page;
