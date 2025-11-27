import React from "react";
import PaymentsPage from "./components/PaymentsPage";

export async function generateMetadata({ params }) {
  return {
    title: "Quản lý thanh toán - D2MBox",
    description: "Quản lý thanh toán và giao dịch trong khu vực admin D2MBox",
    robots: {
      index: false,
      follow: false,
    },
  };
}

function page() {
  return <PaymentsPage />;
}

export default page;
