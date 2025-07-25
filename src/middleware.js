import { NextResponse } from "next/server";
import { decodeTokenGetUser } from "./lib/jwt";

export function middleware(request) {
  // Lấy token từ cookie
  const token = request.cookies.get("token")?.value;
  const locale = request.cookies.get("NEXT_LOCALE")?.value || "vi"; // fallback nếu chưa có

  let role = null;
  let slast = null;
  if (token) {
    const userData = decodeTokenGetUser(token);
    role = userData?.role;
    slast = userData?.slast;
  }
  const url = request.nextUrl.clone();
  const path = url.pathname;
  // Cho phép truy cập API, Login, static, favicon, images
  if (
    path.startsWith("/api") ||
    path.startsWith("/Login") ||
    path.startsWith("/_next") ||
    path.startsWith("/static") ||
    path.startsWith("/favicon.ico") ||
    path.startsWith("/images")
  ) {
    // Truyền locale cho next-intl qua header
    const response = NextResponse.next();
    response.headers.set("x-locale", locale);
    return response;
  }
  // Admin chỉ được vào /admin
  if (role === "admin" && !path.startsWith("/admin")) {
    url.pathname = "/admin";
    const response = NextResponse.redirect(url);
    response.headers.set("x-locale", locale);
    return response;
  }
  // Member chỉ được vào /member_file_management
  if (role === "member" && !path.startsWith("/member_file_management")) {
    url.pathname = "/member_file_management";
    const response = NextResponse.redirect(url);
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
    const response = NextResponse.redirect(url);
    response.headers.set("x-locale", locale);
    return response;
  }
  // Truyền locale cho next-intl qua header cho các request còn lại
  const response = NextResponse.next();
  response.headers.set("x-locale", locale);
  return response;
}

export const config = {
  matcher: ["/((?!_next|static|favicon.ico).*)"],
};
