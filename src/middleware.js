import { NextResponse } from "next/server";
import { decodeTokenGetUser } from "./lib/jwt";

export function middleware(req) {
  // Lấy token từ cookie
  const token = req.cookies.get("token")?.value;
  let role = null;
  if (token) {
    const userData = decodeTokenGetUser(token);
    role = userData?.role;
  }
  const url = req.nextUrl.clone();
  // Nếu là member và truy cập sai route thì redirect
  if (
    role === "member" &&
    !url.pathname.startsWith("/member_file_management") &&
    !url.pathname.startsWith("/api") &&
    !url.pathname.startsWith("/Login") &&
    !url.pathname.startsWith("/_next") &&
    !url.pathname.startsWith("/static") &&
    !url.pathname.startsWith("/favicon.ico") &&
    !url.pathname.startsWith("/images")
  ) {
    url.pathname = "/member_file_management";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|static|favicon.ico).*)"],
};
