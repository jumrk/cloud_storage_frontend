import { NextResponse } from "next/server";
import { decodeTokenGetUser } from "@/shared/lib/jwt";

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
    return applyLocale(NextResponse.redirect(redirectUrl));
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

  if (path.startsWith("/video-processor")) {
    // Block mobile devices from accessing video processor
    const userAgent = request.headers.get("user-agent") || "";
    if (isMobileDevice(userAgent)) {
      // Redirect to landing page with a query param to show toast
      return redirectWithLocale("/?mobile_blocked=video");
    }

    const profile = await loadProfile();
    if (role === "member") {
      // Members: check if their leader has a paid plan
      const leaderPlanSlug = (
        profile?.leaderPlan?.slug || "free"
      ).toLowerCase();
      const leaderIsFreePlan = !leaderPlanSlug || leaderPlanSlug === "free";
      if (leaderIsFreePlan) {
        return redirectWithLocale(memberHomePath);
      }
      // Leader has paid plan, allow member access
      return response;
    } else {
      // Leaders: check their own plan
      const planSlug = profile?.plan?.slug || "free";
      const isFreePlan = !planSlug || planSlug === "free";
      if (isFreePlan) {
        return redirectWithLocale(leaderHomePath);
      }
      return response;
    }
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
    if (!path.startsWith(leaderBase)) {
      return redirectWithLocale(`${leaderBase}/home`);
    }
    return response;
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next|static|favicon.ico).*)"],
};
