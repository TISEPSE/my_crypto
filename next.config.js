/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Optimisations de performance
  compiler: {
    // Supprimer les console.log en production
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Configuration pour Electron
  output: process.env.NODE_ENV === 'production' && process.env.ELECTRON_BUILD ? 'export' : undefined,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
    // Optimiser les re-renders
    optimizePackageImports: ['react', 'react-dom', 'framer-motion'],
    // Améliorer Fast Refresh
    optimizeCss: true,
  },
  
  // Optimiser les imports
  modularizeImports: {
    'react-icons': {
      transform: 'react-icons/{{member}}',
    },
    'framer-motion': {
      transform: 'framer-motion/dist/es/{{member}}',
    },
  },
  
  // Configuration webpack pour le développement
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Optimiser Fast Refresh
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      }
      
      // Réduire les logs de webpack
      config.stats = 'errors-warnings'
      
      // Optimiser les performances de compilation
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        chunkIds: 'deterministic',
      }
    }
    
    return config
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers", 
            value: "Content-Type, Authorization",
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig