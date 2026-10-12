import { execSync } from "node:child_process";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function gitSha(): string {
  try {
    return execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

export default defineConfig({
  plugins: [react()],
  define: {
    __SAVERNAKE_GIT_SHA__: JSON.stringify(gitSha()),
  },
  server: {
    host: true,
    port: 5173,
    // Cloudflare quick tunnels use *.trycloudflare.com
    allowedHosts: true,
    proxy: {
      "/api": "http://localhost:3001",
      "/socket.io": {
        target: "http://localhost:3001",
        ws: true,
      },
    },
  },
});
