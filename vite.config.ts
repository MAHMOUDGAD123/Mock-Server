import path from "path";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig, type UserConfig } from "vite";
import { vitePluginNode } from "./plugins/vite-plugin-node";
import { viteMockServerPlugin } from "./plugins/vite-mock-server-plugin";
import { restartServerOnChange } from "./plugins/vite-dev-server-restart";

const PORT = 5555;

export default defineConfig(
  (config) =>
    ({
      base: "./",
      publicDir: false,
      resolve: {
        alias: {
          "@": path.resolve(import.meta.dirname, "src"),
          "~": path.resolve(import.meta.dirname),
        },
      },
      esbuild: {
        format: "esm",
        minifyIdentifiers: true,
        minifySyntax: true,
        minifyWhitespace: true,
        drop:
          (config.mode as Globals.EnvironmentMode) === "development"
            ? []
            : ["console"],
      },
      build: {
        minify: "esbuild",
        outDir: "./api",
      },
      preview: {
        port: PORT,
        host: true,
      },
      server: {
        hmr: true,
        port: PORT,
        host: true,
        proxy: {
          "*/api": `http://localhost:${PORT}`,
        },
      },
      plugins: [
        ...vitePluginNode(),
        viteMockServerPlugin(),
        tsconfigPaths(),
        restartServerOnChange([
          path.resolve("vite.config.ts"),
          path.resolve("plugins"),
        ]),
      ],
    }) satisfies UserConfig,
);
