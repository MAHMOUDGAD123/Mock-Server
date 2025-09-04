import path from "path";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig, type CorsOptions, type UserConfig } from "vite";
import { vitePluginNode } from "./plugins/vite-plugin-node";
import { viteMockServerPlugin } from "./plugins/vite-mock-server-plugin";
import { removeConsolePlugin } from "./plugins/vite-plugin-remove-console";

export default defineConfig({
  base: "./",
  publicDir: false,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  esbuild: {
    format: "esm",
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true,
  },
  build: {
    minify: "esbuild",
    outDir: "./api",
  },
  preview: {
    port: 3000,
  },
  server: {
    hmr: true,
    port: 3000,
  },
  plugins: [
    ...vitePluginNode(),
    viteMockServerPlugin(),
    tsconfigPaths(),
    removeConsolePlugin(),
  ],
} satisfies UserConfig);
