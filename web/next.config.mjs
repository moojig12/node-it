/** @type {import('next').NextConfig} */
const nextConfig = {
  // While the API is still served by the Express backend, proxy /api/* to it.
  // Once route handlers under app/api/* land, those will take precedence
  // (rewrites are evaluated after local routes by default).
  async rewrites() {
    const backend = process.env.BACKEND_URL || 'http://backend:8080';
    return [
      { source: '/api/:path*', destination: `${backend}/api/:path*` },
    ];
  },
};

export default nextConfig;
