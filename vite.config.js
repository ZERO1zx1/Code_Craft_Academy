import { defineConfig } from "vite";

export default defineConfig({
  root: "client",
  publicDir: "public",
  build: { outDir: "../dist", emptyOutDir: true },
  server: {
    host: true,
    allowedHosts: ["5173-i6cvno3imv1n0t8lctz96-6455cb04.us4.manus.computer"],
  },
});
