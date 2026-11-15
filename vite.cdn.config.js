import { resolve } from "node:path"
import { defineConfig } from "vite"

export default defineConfig({
  // The browser runtime never validates; see src/cdn-zod-stub.ts.
  resolve: { alias: { zod: resolve(import.meta.dirname, "src/cdn-zod-stub.ts") } },
  build: {
    outDir: "dist/cdn",
    emptyOutDir: true,
    lib: {
      entry: resolve(import.meta.dirname, "src/loader.ts"),
      formats: ["es"],
      fileName: () => "loader.js",
    },
    rolldownOptions: {
      output: {
        entryFileNames: "loader.js",
        chunkFileNames: "assets/[name]-[hash].js",
        minify: true,
      },
    },
  },
})
