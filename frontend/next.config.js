/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow the frontend dev server to proxy API calls to the backend
  // when running inside Docker (uses service name "backend")
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
  }
}

module.exports = nextConfig
