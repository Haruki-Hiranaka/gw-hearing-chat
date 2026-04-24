/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Gemini SDK uses Node APIs; keep route runtime as 'nodejs' (default).
  },
};

export default nextConfig;
