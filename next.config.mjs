import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Loại bỏ output: 'export' để cho phép server-side rendering
  // output: 'export',
  trailingSlash: true,
  // Thêm cấu hình này
  experimental: {
    dynamicParams: true,
  },
};

export default withNextIntl(nextConfig);
