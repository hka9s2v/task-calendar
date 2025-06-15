/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma']
  },
  // 本番環境での最適化
  swcMinify: true,
  // 静的ファイルの最適化
  images: {
    domains: [],
    unoptimized: false
  },
  // ビルド時の設定
  output: 'standalone'
}

module.exports = nextConfig 