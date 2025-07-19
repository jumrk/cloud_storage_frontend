"use client";
import { decodeTokenGetUser } from "@/lib/jwt";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
export default function RootLayout({ children }) {
  const router = useRouter();
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = decodeTokenGetUser(token);
    if (token) {
      router.push(`${user.slast}/home`);
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
