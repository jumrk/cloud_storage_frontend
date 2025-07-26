import { NextResponse } from "next/server";
import { decodeTokenGetUser } from "./lib/jwt";

export function middleware(request) {
  // Lấy token từ cookie
  const token = request.cookies.get("token")?.value;
  const locale = request.cookies.get("NEXT_LOCALE")?.value || "vi"; // fallback

  let role = null;
  let slast = null;
  if (token) {
    const userData = decodeTokenGetUser(token);
    role = userData?.role;
    slast = userData?.slast;
  }

  const url = request.nextUrl.clone();
  const path = url.pathname;

  // Tạo sẵn response mặc định
  let response = NextResponse.next();

  // ✅ Set lại cookie NEXT_LOCALE (cho chắc chắn SSR luôn đọc được)
  response.cookies.set("NEXT_LOCALE", locale, {
    path: "/",
    httpOnly: false, // Cho phép client đọc nếu cần
  });

  // ✅ Set header x-locale để request.js có thể đọc được
  response.headers.set("x-locale", locale);

  // Các điều kiện kiểm tra quyền truy cập
  if (
    path.startsWith("/api") ||
    path.startsWith("/Login") ||
    path.startsWith("/_next") ||
    path.startsWith("/static") ||
    path.startsWith("/favicon.ico") ||
    path.startsWith("/images")
  ) {
    return response;
  }

  // Admin chỉ được vào /admin
  if (role === "admin" && !path.startsWith("/admin")) {
    url.pathname = "/admin";
    response = NextResponse.redirect(url);
    response.cookies.set("NEXT_LOCALE", locale, { path: "/" });
    response.headers.set("x-locale", locale);
    return response;
  }

  // Member chỉ được vào /member_file_management
  if (role === "member" && !path.startsWith("/member_file_management")) {
    url.pathname = "/member_file_management";
    response = NextResponse.redirect(url);
    response.cookies.set("NEXT_LOCALE", locale, { path: "/" });
    response.headers.set("x-locale", locale);
    return response;
  }

  // Leader chỉ được vào /[slast] (hoặc /leader)
  if (
    role === "leader" &&
    !path.startsWith(`/${slast}`) &&
    !path.startsWith("/")
  ) {
    url.pathname = `/${slast}/home`;
    response = NextResponse.redirect(url);
    response.cookies.set("NEXT_LOCALE", locale, { path: "/" });
    response.headers.set("x-locale", locale);
    return response;
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next|static|favicon.ico).*)"],
};
