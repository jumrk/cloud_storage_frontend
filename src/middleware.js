import { NextResponse } from "next/server";
import { decodeTokenGetUser } from "./lib/jwt";

export function middleware(request) {
  const url = request.nextUrl.clone();
  const path = url.pathname || "/";
  const token = request.cookies.get("token")?.value || null;
  const locale = request.cookies.get("NEXT_LOCALE")?.value || "vi";

  let role = null;
  let slast = null;
  if (token) {
    try {
      const u = decodeTokenGetUser(token);
      role = u?.role ?? null;
      slast = (u?.slast || "").toLowerCase();
    } catch {}
  }

  let response = NextResponse.next();
  response.cookies.set("NEXT_LOCALE", locale, { path: "/", httpOnly: false });
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

  if (!token && path !== "/" && !path.startsWith("/login")) {
    url.pathname = "/login";
    const redirect = NextResponse.redirect(url);
    redirect.cookies.set("NEXT_LOCALE", locale, { path: "/" });
    redirect.headers.set("x-locale", locale);
    return redirect;
  }

  if (path === "/job-management" || path === "/job-management/") {
    url.pathname = "/job-management/workspace";
    const redirect = NextResponse.redirect(url);
    redirect.cookies.set("NEXT_LOCALE", locale, { path: "/" });
    redirect.headers.set("x-locale", locale);
    return redirect;
  }

  if (path.startsWith("/job-management")) {
    return response;
  }

  if (role === "admin" && !path.startsWith("/admin")) {
    url.pathname = "/admin";
    const redirect = NextResponse.redirect(url);
    redirect.cookies.set("NEXT_LOCALE", locale, { path: "/" });
    redirect.headers.set("x-locale", locale);
    return redirect;
  }

  if (role === "member" && !path.startsWith("/member")) {
    url.pathname = "/member";
    const redirect = NextResponse.redirect(url);
    redirect.cookies.set("NEXT_LOCALE", locale, { path: "/" });
    redirect.headers.set("x-locale", locale);
    return redirect;
  }

  if (role === "leader" && slast && !path.startsWith(`/${slast}`)) {
    url.pathname = `/${slast}/home`;
    const redirect = NextResponse.redirect(url);
    redirect.cookies.set("NEXT_LOCALE", locale, { path: "/" });
    redirect.headers.set("x-locale", locale);
    return redirect;
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next|static|favicon.ico).*)"],
};
