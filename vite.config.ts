import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

/** Route the assigned loopback port and hot reload through the shared HTTPS proxy. */
const localhostServer = process.env.PORTLESS_URL
  ? {
      port: Number(process.env.PORT),
      host: "127.0.0.1",
      strictPort: true,
      allowedHosts: [new URL(process.env.PORTLESS_URL).hostname],
      hmr: {
        protocol: "wss" as const,
        host: new URL(process.env.PORTLESS_URL).hostname,
        clientPort: 443,
      },
    }
  : {};

export default defineConfig({
  ...(process.env.PORTLESS_URL
    ? { cacheDir: `node_modules/.cache/localhost-dev/${process.env.PORT}` }
    : {}),
  server: { ...localhostServer },
  // Handle SPA routing - serve index.html for all routes
  appType: "spa",
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "VOSEflix",
        short_name: "VOSEflix",
        start_url: "/",
        display: "standalone",
        background_color: "#0f0f0f",
        theme_color: "#e50914",
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
