"use client";
import { decodeTokenGetUser } from "@/lib/jwt";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
function Layout({ children }) {
  const [slast, setSlast] = useState("");
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        const user = decodeTokenGetUser(token);
        setSlast(user?.slast || "");
      }
    }
  }, []);
  const nav = [
    {
      href: `/${slast}/tools/download`,
      label: "Tải Video",
    },
    {
      href: `/${slast}/tools/separate-voice`,
      label: "Tách Voice",
    },
    {
      href: `/${slast}/tools/subtitle`,
      label: "Tách Subtitle",
    },
    {
      href: `/${slast}/tools/sub`,
      label: "Dịch văn bản",
    },
    {
      href: `/${slast}/tools/merge`,
      label: "Ghép Video",
    },
    {
      href: `/${slast}/tools/convert-text-to-voice`,
      label: "Chuyển đổi văn bản",
    },
  ];
  return (
    <div>
      <div className="container w-full mx-auto px-4 py-12">
        <p className="text-xl md:text-2xl font-semibold mb-4">
          Danh sách công cụ
        </p>
        <div>
          <nav className="flex w-full gap-5 items-center flex-wrap">
            {nav.map((e) => {
              const active = pathname.startsWith(e.href);
              return (
                <div key={e.href}>
                  <Link
                    href={e.href}
                    className={`px-6 py-2 hover:bg-primary hover:text-white transition-all duration-500 border border-primary rounded-2xl ${
                      active && "bg-primary text-white "
                    }`}
                  >
                    <span className="text-sm">{e.label}</span>
                  </Link>
                </div>
              );
            })}
          </nav>
        </div>
        <div className="mt-10">{children}</div>
      </div>
    </div>
  );
}

export default Layout;
