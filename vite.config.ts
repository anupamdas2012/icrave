import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Served from https://anupamdas2012.github.io/icrave/ on GitHub Pages, so the
// production build needs that base path. Local dev stays at "/".
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/icrave/" : "/",
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
}));
