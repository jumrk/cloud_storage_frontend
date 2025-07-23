"use client";
import Footer from "@/components/ui/footer";
import Header from "@/components/ui/Header";

export default function OtherLayout({ children }) {
  return (
    <>
      <Header />
      <main className="pt-20 min-h-screen bg-[#f7f8fa]">{children}</main>
      <Footer />
    </>
  );
}
