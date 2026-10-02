/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return {
      beforeFiles: [
        // Servir la interfaz del cliente Discord en las rutas habituales
        {
          source: '/',
          destination: '/app.html',
        },
        {
          source: '/app',
          destination: '/app.html',
        },
        {
          source: '/channels/:path*',
          destination: '/app.html',
        },
        {
          source: '/login',
          destination: '/app.html',
        },
        {
          source: '/register',
          destination: '/app.html',
        },
        {
          source: '/invite/:path*',
          destination: '/app.html',
        },
        // Enrutamiento de versiones de API del cliente (v9, v8, v6, o sin version) hacia la Mock API v10
        {
          source: '/auth/:path*',
          destination: '/api/v10/auth/:path*',
        },
        {
          source: '/api/auth/:path*',
          destination: '/api/v10/auth/:path*',
        },
        {
          source: '/family-center/:path*',
          destination: '/api/v10/family-center/:path*',
        },
        {
          source: '/api/v9/:path*',
          destination: '/api/v10/:path*',
        },
        {
          source: '/api/v8/:path*',
          destination: '/api/v10/:path*',
        },
        {
          source: '/api/v6/:path*',
          destination: '/api/v10/:path*',
        },
      ],
      fallback: [],
    }
  },
}

export default nextConfig
