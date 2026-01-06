import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const extraPatterns = [];
const apiBase = process.env.NEXT_PUBLIC_API_BASE || process.env.API_BASE_URL;
if (apiBase) {
  try {
    const url = new URL(apiBase);
    extraPatterns.push({
      protocol: url.protocol.replace(":", ""),
      hostname: url.hostname,
    });
  } catch {
    // ignore invalid URL
  }
}
extraPatterns.push(
  { protocol: "http", hostname: "localhost" },
  { protocol: "https", hostname: "localhost" },
  { protocol: "http", hostname: "127.0.0.1" },
  { protocol: "https", hostname: "127.0.0.1" },
  { protocol: "http", hostname: "::1" },
  { protocol: "https", hostname: "::1" }
);

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
      {
        protocol: "https",
        hostname: "img.vietqr.io",
      },
      ...extraPatterns,
    ],
    // Allow localhost images in development (Next.js 16)
    // This suppresses the warning about private IP resolution
    unoptimized: process.env.NODE_ENV === "development",
  },
  // Add security headers directly in next.config.mjs as fallback
  async headers() {
    // In development, allow all media sources for testing
    if (process.env.NODE_ENV === "development") {
      return [
        {
          source: "/:path*",
          headers: [
            {
              key: "Content-Security-Policy",
              value: [
                "default-src 'self'",
                "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
                "style-src 'self' 'unsafe-inline' https:",
                "font-src 'self' https:",
                "img-src 'self' data: https: http:",
                "media-src *", // Allow all media sources in development
                "connect-src 'self' https: http: ws: wss:",
                "frame-src 'self' https:",
                "object-src 'none'",
                "base-uri 'self'",
              ].join("; "),
            },
          ],
        },
      ];
    }

    // Production CSP
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://fonts.googleapis.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: http:",
              "media-src 'self' https: http: data: blob:",
              "connect-src 'self' https: http: ws: wss:",
              "frame-src 'self' https://drive.google.com https://*.googleusercontent.com https://docs.google.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
