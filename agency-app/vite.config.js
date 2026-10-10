import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/agency/",

  plugins: [react()],

  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    allowedHosts: true,

    proxy: {
      "/backend-api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        secure: false,

        rewrite: (path) =>
          path.replace(/^\/backend-api/, ""),
      },

      "/public": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});