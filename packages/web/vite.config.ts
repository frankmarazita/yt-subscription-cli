import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

const workspaceRoot = path.resolve(__dirname, "../..");

// Resolve .js extension imports that point to .ts files in workspace packages
const workspaceTsResolve: Plugin = {
  name: "workspace-ts-resolve",
  resolveId(id, importer) {
    if (
      id.endsWith(".js") &&
      importer?.startsWith(workspaceRoot + "/packages")
    ) {
      return this.resolve(id.slice(0, -3), importer, { skipSelf: true });
    }
  },
};

export default defineConfig({
  plugins: [
    react(),
    workspaceTsResolve,
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "icon.svg",
        "pwa-64x64.png",
        "pwa-192x192.png",
        "pwa-512x512.png",
        "maskable-icon-512x512.png",
      ],
      manifest: {
        name: "Subs",
        short_name: "Subs",
        description: "YouTube subscription video viewer",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "pwa-64x64.png",
            sizes: "64x64",
            type: "image/png",
          },
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/api/"),
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              networkTimeoutSeconds: 10,
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
});
