import { NextResponse } from "next/server";
import { decodeTokenGetUser } from "@/shared/lib/jwt";

// Security headers to protect against various attacks including crypto mining
function addSecurityHeaders(response) {
  // Content Security Policy - Strict policy to prevent XSS and crypto mining
  // Allow Google Drive iframes for video/file preview
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://fonts.googleapis.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: https: http:; " +
    "connect-src 'self' https: http: ws: wss:; " +
    "frame-src 'self' https://drive.google.com https://*.googleusercontent.com https://docs.google.com; " +
    "object-src 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self'; " +
    "upgrade-insecure-requests;"
  );
  
  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");
  
  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY");
  
  // Enable XSS protection
  response.headers.set("X-XSS-Protection", "1; mode=block");
  
  // Referrer policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  
  // Permissions policy - Block geolocation, microphone, camera
  response.headers.set(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()"
  );
  
  return response;
}

// Detect mobile from User-Agent
function isMobileDevice(userAgent) {
  if (!userAgent) return false;
  const mobileRegex =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i;
  return mobileRegex.test(userAgent);
}

const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/forgotpassword",
  "/about",
  "/contact",
  "/faq",
  "/privacy_policy",
  "/terms_of_use",
  "/cookie_policy",
  "/admin/login",
  "/pricing",
  "/pricing/checkout",
]);

function isPublic(path) {
  if (path === "/") return true;
  if (PUBLIC_PATHS.has(path)) return true;
  if (
    path.startsWith("/api") ||
    path.startsWith("/login") ||
    path.startsWith("/forgot-password") ||
    path.startsWith("/register") ||
    path.startsWith("/_next") ||
    path.startsWith("/static") ||
    path.startsWith("/favicon.ico") ||
    path.startsWith("/images") ||
    path.startsWith("/pricing") ||
    path.startsWith("/about") ||
    path.startsWith("/contact") ||
    path.startsWith("/faq") ||
    path.startsWith("/privacy_policy") ||
    path.startsWith("/terms_of_use") ||
    path.startsWith("/cookie_policy") ||
    path.startsWith("/share") ||
    path.startsWith("/sound")
  )
    return true;
  return false;
}

export async function middleware(request) {
  const url = request.nextUrl.clone();
  const path = (url.pathname || "/").toLowerCase();

  const token = request.cookies.get("token")?.value || null;
  const locale = request.cookies.get("NEXT_LOCALE")?.value || "vi";

  let role = null;
  let slast = null;
  if (token) {
    try {
      const u = decodeTokenGetUser(token);
      role = u?.role ?? null;
      slast = u?.slast ?? null;
    } catch {}
  }

  const applyLocale = (res) => {
    res.cookies.set("NEXT_LOCALE", locale, {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
    });
    res.headers.set("x-locale", locale);
    return res;
  };

  let response = applyLocale(NextResponse.next());
  response = addSecurityHeaders(response);

  let cachedProfile = null;
  const loadProfile = async () => {
    if (cachedProfile || !token) return cachedProfile;
    try {
      const apiBase =
        process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";
      const profileRes = await fetch(`${apiBase}/api/user`, {
        headers: {
          cookie: request.headers.get("cookie") || "",
        },
      });
      if (profileRes.ok) {
        cachedProfile = await profileRes.json();
      }
    } catch {
      cachedProfile = null;
    }
    return cachedProfile;
  };

  const redirectWithLocale = (targetPath) => {
    const redirectUrl = new URL(targetPath, request.url);
    const redirectResponse = applyLocale(NextResponse.redirect(redirectUrl));
    return addSecurityHeaders(redirectResponse);
  };

  const memberHomePath = "/member/file-management";
  const leaderHomePath = slast ? `/${slast}/home` : "/";

  // Public routes
  if (isPublic(path)) {
    const isPricingPath = path === "/pricing" || path.startsWith("/pricing/");
    if (token && role === "member" && isPricingPath) {
      return redirectWithLocale(memberHomePath);
    }
    if (token && (path === "/login" || path === "/forgotpassword")) {
      if (role === "admin") {
        url.pathname = "/admin";
      } else if (role === "member") {
        url.pathname = memberHomePath;
      } else if (role === "leader" && slast) {
        url.pathname = `/${slast}/home`;
      } else {
        url.pathname = "/";
      }
      return redirectWithLocale(url.pathname);
    }
    return response;
  }

  if (!token) {
    return redirectWithLocale("/login");
  }

  if (path.startsWith("/job-management")) {
    return response;
  }

  // Block video-processor routes (removed feature)
  if (path.startsWith("/video-processor")) {
    return redirectWithLocale("/");
  }

  // Block video-tools routes (under development)
  if (path.startsWith("/video-tools")) {
    return redirectWithLocale("/");
  }

  if (role === "admin") {
    if (!path.startsWith("/admin")) {
      return redirectWithLocale("/admin");
    }
    return response;
  }

  if (role === "member") {
    const isAccountInfoPath =
      path.includes("/infor-user") || path.endsWith("/infor-user");
    const isPricingPath = path === "/pricing" || path.startsWith("/pricing/");
    if (isPricingPath || isAccountInfoPath) {
      return redirectWithLocale(memberHomePath);
    }
    // Allow chat access for members (pattern: /{slast}/chat)
    const isChatPath = path.endsWith("/chat") || path.includes("/chat/");
    if (isChatPath) {
      return response;
    }
    if (path === "/member" || path === "/member/") {
      return redirectWithLocale(memberHomePath);
    }
    if (!path.startsWith("/member")) {
      return redirectWithLocale(memberHomePath);
    }
    return response;
  }

  if (role === "leader" && slast) {
    const leaderBase = `/${slast}`.toLowerCase();
    if (path.startsWith("/pricing")) {
      return redirectWithLocale(leaderHomePath);
    }
    // Allow all paths that start with leader base
    const pathLower = path.toLowerCase();
    if (!pathLower.startsWith(leaderBase)) {
      return redirectWithLocale(`${leaderBase}/home`);
    }
    return response;
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next|static|favicon.ico).*)"],
};
