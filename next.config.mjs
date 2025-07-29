import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  // Thêm cấu hình này
  experimental: {
    dynamicParams: true
  }
};

export default withNextIntl(nextConfig);
