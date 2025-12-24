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
};

export default withNextIntl(nextConfig);
