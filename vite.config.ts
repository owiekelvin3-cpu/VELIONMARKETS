import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api/market": {
        target: "https://data-api.binance.vision/api/v3",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/market/, ""),
      },
    },
  },
});
