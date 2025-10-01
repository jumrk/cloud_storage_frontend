"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

function Layout({ children }) {
  const pathname = usePathname();

  const base = "/member/tools";
  const nav = [
    { href: `${base}/download`, label: "Tải Video" },
    { href: `${base}/separate-voice`, label: "Tách Voice" },
    { href: `${base}/subtitle`, label: "Tách Subtitle" },
    { href: `${base}/sub`, label: "Dịch văn bản" },
    { href: `${base}/merge`, label: "Ghép Video" },
    { href: `${base}/convert-text-to-voice`, label: "Chuyển đổi văn bản" },
  ];

  const isToolsHome = pathname === base || pathname === `${base}/`;
  const current = nav.find((item) => pathname.startsWith(item.href));

  return (
    <div>
      <div className="container w-full mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-gradient-to-br from-pink-50 via-white to-blue-50 p-6">
          {isToolsHome ? (
            <>
              <h1 className="text-xl md:text-2xl font-semibold text-slate-800">
                Danh sách công cụ
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Chọn công cụ bạn cần bên dưới. Mục đang mở sẽ được làm nổi bật.
              </p>
            </>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h1 className="text-xl md:text-2xl font-semibold text-slate-800">
                {current?.label || "Công cụ"}
              </h1>
              <Link
                href={base}
                className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-pink-300 hover:text-pink-700 hover:shadow-sm transition-colors"
                aria-label="Quay lại danh sách công cụ"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="-ml-0.5"
                >
                  <path
                    d="M15 19l-7-7 7-7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Quay lại danh sách
              </Link>
            </div>
          )}
        </div>

        {/* Grid tools: CHỈ hiển thị ở trang danh sách */}
        {isToolsHome && (
          <nav className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {nav.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              const initials = item.label
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();

              return (
                <Link
                  key={item.href}
                  href={active ? "#" : item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={(e) => active && e.preventDefault()}
                  className={[
                    "group relative block rounded-2xl border bg-white p-4 transition-all",
                    "hover:-translate-y-0.5 hover:shadow-md",
                    active
                      ? "border-pink-300 ring-2 ring-pink-200"
                      : "border-slate-200",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={[
                        "flex h-12 w-12 items-center justify-center rounded-xl",
                        active
                          ? "bg-pink-100 text-pink-700"
                          : "bg-slate-50 text-slate-600 group-hover:bg-pink-50 group-hover:text-pink-600",
                      ].join(" ")}
                      aria-hidden
                    >
                      <span className="font-semibold">{initials}</span>
                    </div>
                    <div className="min-w-0">
                      <h3
                        className={[
                          "truncate text-base font-medium",
                          active ? "text-pink-700" : "text-slate-800",
                        ].join(" ")}
                      >
                        {item.label}
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Mở công cụ &rarr;
                      </p>
                    </div>
                  </div>

                  <span
                    className={[
                      "pointer-events-none absolute inset-x-0 -bottom-[1px] h-[3px] rounded-b-2xl",
                      active
                        ? "bg-gradient-to-r from-pink-400 via-fuchsia-400 to-blue-400"
                        : "opacity-0 group-hover:opacity-100 bg-gradient-to-r from-pink-300 via-fuchsia-300 to-blue-300",
                      "transition-opacity",
                    ].join(" ")}
                  />
                </Link>
              );
            })}
          </nav>
        )}

        {/* Nội dung trang con */}
        <div className={isToolsHome ? "mt-10" : "mt-2"}>{children}</div>
      </div>
    </div>
  );
}

export default Layout;
