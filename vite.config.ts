import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        id: ".",
        name: "Central Hub - Sua operação em um único lugar",
        short_name: "Central Hub",
        description:
          "Plataforma de gestão para centralizar clientes, assinaturas, créditos e receitas de múltiplos servidores.",
        theme_color: "#0B1E3A",
        background_color: "#0B1E3A",
        display: "standalone",
        orientation: "portrait",
        start_url: ".",
        scope: "./",
        lang: "pt-BR",
        icons: [
          {
            src: "favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
          {
            src: "favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest}"],
        navigateFallbackDenylist: [/^\/auth\/callback/],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/rest/v1"),
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-api-cache",
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 },
              networkTimeoutSeconds: 10,
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/storage/v1"),
            handler: "CacheFirst",
            options: {
              cacheName: "supabase-storage-cache",
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  // Na Vercel o site fica na raiz do domínio ("/"). No GitHub Pages (site
  // de projeto) ele fica num subcaminho ("/central-hub/"). O workflow de
  // deploy do GitHub Pages define GH_PAGES=true durante o build; a Vercel
  // não define essa variável, então cai no caminho padrão "/". O React
  // Router lê esse mesmo valor via import.meta.env.BASE_URL (ver main.tsx).
  base: process.env.GH_PAGES === "true" ? "/central-hub/" : "/",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
  build: {
    sourcemap: false,
    target: "es2020",
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-charts": ["recharts"],
          "vendor-ui": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-popover",
            "@radix-ui/react-avatar",
            "@radix-ui/react-label",
            "@radix-ui/react-switch",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-separator",
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-toast",
            "@radix-ui/react-slot",
          ],
        },
      },
    },
  },
});
