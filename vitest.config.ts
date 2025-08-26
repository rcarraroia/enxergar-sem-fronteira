import react from "@vitejs/plugin-react-swc";
import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts", "./src/test/integration/setup.ts"],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/e2e-disabled/**",
      "**/.{idea,git,cache,output,temp}/**",
      "**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*"
    ],
    // Configurações específicas para diferentes tipos de teste
    testTimeout: 10000, // 10 segundos para testes de integração
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
