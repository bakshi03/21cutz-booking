/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['googleapis', 'google-auth-library', 'gcp-metadata', 'gtoken'],
  },
}

module.exports = nextConfig
