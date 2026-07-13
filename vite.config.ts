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
  build: {
    target: "es2022",
    cssMinify: true,
    modulePreload: {
      resolveDependencies: (_filename, deps) =>
        // Avoid flooding the network with every lazy route on first paint.
        deps.filter((dep) => !dep.includes("pages/") && !dep.includes("Admin")),
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("react-dom") || id.includes("/react/") || id.includes("scheduler")) {
            return "react-vendor";
          }
          if (id.includes("@supabase")) return "supabase";
          if (id.includes("@tanstack")) return "query";
          if (id.includes("framer-motion")) return "motion";
          if (id.includes("recharts") || id.includes("d3-") || id.includes("victory")) return "charts";
          if (id.includes("lightweight-charts")) return "trading-charts";
          if (id.includes("i18next") || id.includes("i18n-iso-countries")) return "i18n";
          if (id.includes("@fortawesome")) return "icons";
          if (id.includes("react-router")) return "router";
          if (id.includes("@radix-ui")) return "radix";
          if (id.includes("zod") || id.includes("react-hook-form") || id.includes("@hookform")) {
            return "forms";
          }
        },
      },
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
