import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
  server: { port: 5173 },
  // The server bundle carries everything it uses, React and the router
  // included, so the image needs no node_modules beyond the small server that
  // runs it (server.mjs, with srvx). That is why package.json lists only srvx
  // under dependencies: everything else is needed to build, not to run. Only
  // for the build: the dev server loads packages from node_modules as they are.
  ssr: command === "build" ? { noExternal: true } : {},
  // Every typeface subset is a file of its own, fetched only by a page that
  // needs it, not folded into the stylesheet as data: (which every page's
  // Content-Security-Policy refuses for fonts; server.mjs).
  build: { assetsInlineLimit: 0 },
  plugins: [tanstackStart(), react()],
}));
