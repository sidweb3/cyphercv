import { vlyPlugin } from "@vly-ai/integrations";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vlyPlugin(), react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "react": path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
    },
  },
  worker: {
    format: "es",
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 1000,
    target: 'esnext',
    minify: 'esbuild',
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router',
      '@convex-dev/auth/react',
      'wagmi',
      'viem',
      '@rainbow-me/rainbowkit',
      '@tanstack/react-query',
      'iframe-shared-storage',
      'tweetnacl',
    ],
    exclude: ['three', '@react-three/fiber', '@react-three/drei', '@cofhe/sdk', '@cofhe/sdk/adapters', '@cofhe/sdk/chains'],
  },
  server: {
    hmr: true,
  },
});