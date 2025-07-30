import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
<<<<<<< HEAD
  // Loại bỏ output: 'export' để cho phép server-side rendering
  // output: 'export',
  trailingSlash: true,
  // Thêm cấu hình này
  experimental: {
    dynamicParams: true,
  },
=======
>>>>>>> b49dd680cbdea0ea433ee43f3ee8de329a56bc32
};

export default withNextIntl(nextConfig);
