/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Only rewrite /api in development mode if a local backend server is running
  async rewrites() {
    if (process.env.NODE_ENV === 'production') {
      return [];
    }
    return [
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL
          ? `${process.env.NEXT_PUBLIC_API_URL}/:path*`
          : 'http://localhost:5000/api/:path*'
      }
    ];
  }
};

export default nextConfig;
