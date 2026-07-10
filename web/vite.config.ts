import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Precache species_data.json too, so the dex/compat/tank-builder
      // pages work offline even before the Supabase fetch has ever
      // succeeded (see lib/referenceData.ts's local-JSON fallback).
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png', 'species_data.json'],
      manifest: {
        name: '열대어 도감 & 합사 호환성 체커',
        short_name: '열대어도감',
        description: '열대어 종별 사육 정보와 합사 가능 여부를 확인하는 앱',
        start_url: '/',
        display: 'standalone',
        background_color: '#0b1620',
        theme_color: '#0b1620',
        orientation: 'portrait-primary',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        // SPA fallback: any unmatched navigation (e.g. /compat when
        // offline) serves the cached app shell instead of failing.
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,svg,png,json}'],
      },
    }),
  ],
})
