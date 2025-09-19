/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['react-icons', 'framer-motion'],
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },

  // Bundle analysis and optimization
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Bundle analyzer in development
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          // Separate vendor chunks
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            reuseExistingChunk: true,
          },
          // React-specific chunk
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: 'react',
            priority: 20,
            reuseExistingChunk: true,
          },
          // Chart libraries
          charts: {
            test: /[\\/]node_modules[\\/](chart\.js|react-chartjs-2|recharts)[\\/]/,
            name: 'charts',
            priority: 15,
            reuseExistingChunk: true,
          },
          // Icons
          icons: {
            test: /[\\/]node_modules[\\/]react-icons[\\/]/,
            name: 'icons',
            priority: 15,
            reuseExistingChunk: true,
          },
          // Crypto components
          crypto: {
            test: /[\\/]src[\\/]app[\\/]components[\\/]Crypto[\\/]/,
            name: 'crypto-components',
            priority: 5,
            minChunks: 2,
            reuseExistingChunk: true,
          },
        },
      }
    }

    // Optimize imports
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve('./src'),
      '@components': path.resolve('./src/app/components'),
      '@context': path.resolve('./src/app/context'),
      '@hooks': path.resolve('./src/app/hooks'),
      '@utils': path.resolve('./src/app/utils'),
    }

    // Tree shaking improvements
    config.optimization.usedExports = true
    config.optimization.sideEffects = false

    return config
  },

  // Compression and caching
  compress: true,
  poweredByHeader: false,

  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  // Static optimization
  generateEtags: true,

  // For Electron compatibility
  output: process.env.ELECTRON_BUILD === 'true' ? 'export' : undefined,
  trailingSlash: process.env.ELECTRON_BUILD === 'true',
  assetPrefix: process.env.ELECTRON_BUILD === 'true' ? './' : undefined,

  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Headers for better caching
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, stale-while-revalidate=300',
          },
        ],
      },
    ]
  },
}

export default nextConfig