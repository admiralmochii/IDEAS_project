import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/screens": {
        target: "http://192.168.1.218:5050",
        changeOrigin: true
      },
      "/lights": {
        target: "http://192.168.1.218:5050",
        changeOrigin: true
      },
      "/projector": {
        target: "http://192.168.1.218:5050",
        changeOrigin: true
      },
      "/computer": {
        target: "http://192.168.1.218:5050",
        changeOrigin: true
      }
    }
  }
});
