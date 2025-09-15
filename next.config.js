/** @type {import('next').NextConfig} */
const nextConfig = {
  // APIルートのタイムアウト時間を延長
  experimental: {
    serverComponentsExternalPackages: [],
  },
  // レスポンスタイムアウトを延長
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
