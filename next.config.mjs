/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Lint chạy riêng qua `npm run lint` trong CI — không chặn build dev.
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
