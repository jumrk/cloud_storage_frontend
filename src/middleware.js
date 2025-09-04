import { NextResponse } from "next/server";
import { decodeTokenGetUser } from "./lib/jwt";

export function middleware(request) {
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

  response.cookies.set("NEXT_LOCALE", locale, {
    path: "/",
    httpOnly: false,
  });
  response.headers.set("x-locale", locale);
  if (
    path.startsWith("/api") ||
    path.startsWith("/Login") ||
    path.startsWith("/ForgotPassword") ||
    path.startsWith("/_next") ||
    path.startsWith("/static") ||
    path.startsWith("/favicon.ico") ||
    path.startsWith("/images") ||
    path.startsWith("/about") ||
    path.startsWith("/contact") ||
    path.startsWith("/faq") ||
    path.startsWith("/privacy_policy") ||
    path.startsWith("/terms_of_use") ||
    path.startsWith("/cookie_policy") ||
    path.startsWith("/share")
  ) {
    return response;
  }

  // Nếu không có token và không phải trang public, redirect to login
  if (!token && !path.startsWith("/Login") && path !== "/") {
    url.pathname = "/Login";
    response = NextResponse.redirect(url);
    response.cookies.set("NEXT_LOCALE", locale, { path: "/" });
    response.headers.set("x-locale", locale);
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

  if (role === "member" && !path.startsWith("/member")) {
    url.pathname = "/member";
    response = NextResponse.redirect(url);
    response.cookies.set("NEXT_LOCALE", locale, { path: "/" });
    response.headers.set("x-locale", locale);
    return response;
  }

  if (
    role === "leader" &&
    !path.startsWith(`/${slast}`) &&
    !path.startsWith("/") &&
    path !== "/"
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
