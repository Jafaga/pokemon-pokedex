import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// This focused Vite configuration creates the static bundle Vercel publishes.
// Its output folder is separate from the vinext/Sites build artifacts.
export default defineConfig({
  plugins: [react()],
  root: "vercel",
  publicDir: "../public",
  build: {
    outDir: "../vercel-dist",
    emptyOutDir: true,
  },
});
