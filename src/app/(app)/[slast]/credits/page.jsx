import React from "react";
import CreditsPage from "./components/CreditsPage";

export async function generateMetadata({ params }) {
  return {
    title: "Mua Credits - D2MBox",
    description: "Mua credits để sử dụng các công cụ video",
    robots: {
      index: false,
      follow: false,
    },
  };
}

function page() {
  return <CreditsPage />;
}

export default page;

