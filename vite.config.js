import { readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { defineConfig } from "vite";

const clientRoot = new URL("./client/", import.meta.url).pathname;
function findHtmlEntries(directory, entries = {}) {
  for (const item of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = join(directory, item.name);
    if (item.isDirectory()) findHtmlEntries(fullPath, entries);
    if (item.isFile() && item.name.endsWith(".html")) {
      const entryName = relative(clientRoot, fullPath).replace(/\.html$/, "");
      entries[entryName] = fullPath;
    }
  }
  return entries;
}

export default defineConfig({
  root: "client",
  publicDir: "public",
  build: { outDir: "../dist", emptyOutDir: true, rollupOptions: { input: findHtmlEntries(clientRoot) } },
  server: {
    host: true,
    allowedHosts: ["5173-i6cvno3imv1n0t8lctz96-6455cb04.us4.manus.computer"],
  },
});
