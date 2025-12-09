/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  basePath: '/nextjs',
  images: {
    unoptimized: true,
  },
  skipTrailingSlashRedirect: true,
};

module.exports = nextConfig;
