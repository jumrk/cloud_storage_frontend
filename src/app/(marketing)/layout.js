"use client";

import Footer from "@/shared/layout/Footer";
import Header from "@/shared/layout/Header";

export default function OtherLayout({ children }) {
  return (
    <>
      <Header />
      <main className="pt-20 min-h-screen bg-[#f7f8fa] overflow-y-auto sidebar-scrollbar">{children}</main>
      <Footer />
    </>
  );
}
