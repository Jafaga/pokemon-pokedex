import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  root: "vercel",
  publicDir: "../public",
  build: {
    outDir: "../vercel-dist",
    emptyOutDir: true,
  },
});
