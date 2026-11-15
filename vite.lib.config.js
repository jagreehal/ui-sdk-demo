import { readdirSync } from "node:fs"
import { resolve } from "node:path"
import { defineConfig } from "vite"

const entriesDir = resolve(import.meta.dirname, "src/entries")
const componentEntries = Object.fromEntries(
  readdirSync(entriesDir)
    .filter((file) => file.endsWith(".ts"))
    .map((file) => [file.replace(/\.ts$/, ""), resolve(entriesDir, file)]),
)

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: true,
    lib: {
      entry: {
        loader: resolve(import.meta.dirname, "src/loader.ts"),
        ...Object.fromEntries(
          ["catalog", "spec-html", "render-spec", "runtime"].map((name) => [name, resolve(import.meta.dirname, `src/${name}.ts`)]),
        ),
        ...componentEntries,
      },
      formats: ["es"],
    },
    rollupOptions: {
      external: [/^@ui-sdk\//, /^@json-render\//, /^zod(\/|$)/],
      output: {
        entryFileNames: (chunk) =>
          chunk.name in componentEntries ? `entries/${chunk.name}.js` : `${chunk.name}.js`,
        chunkFileNames: "assets/[name]-[hash].js",
      },
    },
  },
})
