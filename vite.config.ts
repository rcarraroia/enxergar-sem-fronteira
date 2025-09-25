import react from "@vitejs/plugin-react-swc";
import { componentTagger } from "lovable-tagger";
import path from "path";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ["xlsx", "file-saver"]
  },
  build: {
    commonjsOptions: {
      include: [/xlsx/, /file-saver/, /node_modules/]
    },
    rollupOptions: {
      onwarn(warning, warn) {
        // Ignorar avisos específicos do TypeScript
        if (warning.code === 'UNUSED_EXTERNAL_IMPORT') return;
        if (warning.message.includes('is declared but its value is never read')) return;
        warn(warning);
      }
    }
  },
  esbuild: {
    logOverride: { 
      'this-is-undefined-in-esm': 'silent',
      'unused-import': 'silent'
    }
  }
}));
