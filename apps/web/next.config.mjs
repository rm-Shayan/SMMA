/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@styre/agent-core", "@styre/db"]
};

export default nextConfig;

