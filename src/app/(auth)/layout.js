"use client";
import { Toaster } from "react-hot-toast";
export default function RootLayout({ children }) {
  return (
    <>
      {children}
      <Toaster position="top-center" />
    </>
  );
}
