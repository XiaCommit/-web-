import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";



export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/playlist': {
        target: 'http://localhost:3004',
        changeOrigin: true
      },
      '/everyday': {
        target: 'http://localhost:3004',
        changeOrigin: true
      },
      '/search': {
        target: 'http://localhost:3004',
        changeOrigin: true
      },
      '/song/url/new': {
        target: 'http://localhost:3004',
        changeOrigin: true
      },
      '/top/playlist': {
        target: 'http://localhost:3004',
        changeOrigin: true
      }
    }
  }
});