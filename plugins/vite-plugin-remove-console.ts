import type { Plugin } from "vite";

export const removeConsolePlugin = (): Plugin => ({
  name: "vite-plugin-remove-console", // Plugin name
  enforce: "pre", // Run this before other plugins
  transform(code, id) {
    // Only transform JavaScript/TypeScript files
    if (process.env.NODE_ENV !== "production") {
      return null;
    }

    if (/\.(?:js|ts)$/.test(id)) {
      // Remove console.log statements
      const transformedCode = code.replace(
        /console\.(?:log|debug|info|warn|error)\((?:.*)\);?/g,
        ""
      );
      return {
        code: transformedCode,
        map: null, // Let Vite handle source maps
      };
    }
    return null; // Return null for non-JS/TS files
  },
});
