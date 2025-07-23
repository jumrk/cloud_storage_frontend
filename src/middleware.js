import { NextResponse } from "next/server";
import { decodeTokenGetUser } from "./lib/jwt";

export function middleware(req) {
  // Lấy token từ cookie
  const token = req.cookies.get("token")?.value;
  let role = null;
  let slast = null;
  if (token) {
    const userData = decodeTokenGetUser(token);
    role = userData?.role;
    slast = userData?.slast;
  }
  const url = req.nextUrl.clone();
  const path = url.pathname;
  // Cho phép truy cập API, Login, static, favicon, images
  if (
    path.startsWith("/api") ||
    path === "/" ||
    path.startsWith("/Login") ||
    path.startsWith("/_next") ||
    path.startsWith("/static") ||
    path.startsWith("/favicon.ico") ||
    path.startsWith("/images")
  ) {
    return NextResponse.next();
  }
  // Admin chỉ được vào /admin
  if (role === "admin" && !path.startsWith("/admin")) {
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }
  // Member chỉ được vào /member_file_management
  if (role === "member" && !path.startsWith("/member_file_management")) {
    url.pathname = "/member_file_management";
    return NextResponse.redirect(url);
  }
  // Leader chỉ được vào /[slast] (hoặc /leader)
  if (
    role === "leader" &&
    !path.startsWith(`/${slast}`) &&
    !path.startsWith("/")
  ) {
    url.pathname = `/${slast}/home`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|static|favicon.ico).*)"],
};
