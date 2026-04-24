/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb'
    }
  },
  images: {
    domains: ['localhost']
  },
  typescript: {
    ignoreBuildErrors: true
  }
}

export default nextConfig
