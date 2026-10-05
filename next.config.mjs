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
        // Rutas de la SPA del cliente que no son de API (ajustes, tienda, Nitro,
        // boosts, loot, etc.). Sin esto el navegador recibía un 404 de Next al
        // pulsar "Nitro", "Tienda" o "Suscripciones" y no se podía abrir el panel
        // de Nitro, la pestaña de suscripciones ni el flujo de compra de boosts.
        { source: '/settings/:path*', destination: '/app.html' },
        { source: '/store/:path*', destination: '/app.html' },
        { source: '/nitro', destination: '/app.html' },
        { source: '/shop/:path*', destination: '/app.html' },
        { source: '/quests/:path*', destination: '/app.html' },
        { source: '/library/:path*', destination: '/app.html' },
        { source: '/message-requests', destination: '/app.html' },
        { source: '/message-requests/:path*', destination: '/app.html' },
        { source: '/discovery/:path*', destination: '/app.html' },
        { source: '/application-directory/:path*', destination: '/app.html' },
        { source: '/developers/:path*', destination: '/app.html' },
        { source: '/guilds/:path*', destination: '/app.html' },
        { source: '/collectibles/:path*', destination: '/app.html' },
        { source: '/collectibles-shop', destination: '/app.html' },
        { source: '/activities/:path*', destination: '/app.html' },
        { source: '/games/:path*', destination: '/app.html' },
        { source: '/oauth2/:path*', destination: '/app.html' },
        { source: '/gifts/:path*', destination: '/app.html' },
        { source: '/billing/:path*', destination: '/app.html' },
        { source: '/account/:path*', destination: '/app.html' },
        { source: '/new', destination: '/app.html' },
        { source: '/verify', destination: '/app.html' },
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
