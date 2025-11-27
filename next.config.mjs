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
  { protocol: "https", hostname: "localhost" }
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
  },
};

export default withNextIntl(nextConfig);
