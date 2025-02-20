import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { nodePolyfills } from 'vite-plugin-node-polyfills';

const conditionalPlugins: [string, Record<string, any>][] = [];

export default defineConfig({
  base: process.env.VITE_BASE_PATH || "/",
  optimizeDeps: {
    entries: ["src/main.tsx",],
  },
  plugins: [
    react({
      plugins: conditionalPlugins,
    }),
    nodePolyfills({
      protocolImports: true,
    }),
  ],
  resolve: {
    preserveSymlinks: true,
    alias: {
      "@": path.resolve(__dirname, "./src"),
      crypto: 'crypto-browserify',
    },
  },
  build: {
    rollupOptions: {
      output:{
          manualChunks(id) {
              if (id.includes('node_modules')) {
                  return id.toString().split('node_modules/')[1].split('/')[0].toString();
              }
          }
      }
    }
  },
  server: {
    host: true,
    port: 80
  }
});