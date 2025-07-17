"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
export default function RootLayout({ children }) {
  const router = useRouter();
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/home");
    } else {
      router.push("/Login");
    }
  }, [router]);

  return (
    <>
      {children}
      <Toaster position="top-center" />
    </>
  );
}
