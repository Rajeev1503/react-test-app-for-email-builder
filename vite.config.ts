import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, extname, join } from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Not in public/: Vite watches that folder, and reloads the page when a file lands.
const UPLOAD_DIR = join(__dirname, ".lab-uploads");

/** A small image host for local testing. Development only, and never built. */
function labUploads(): Plugin {
  return {
    name: "lab-uploads",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/__lab/upload", (req, res) => {
        const chunks: Buffer[] = [];
        req.on("data", (chunk: Buffer) => chunks.push(chunk));
        req.on("end", () => {
          const url = new URL(req.url ?? "", "http://localhost");
          const name = basename(url.searchParams.get("name") ?? "image").replace(/[^\w.-]/g, "_");
          const stored = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${extname(name)}`;
          mkdirSync(UPLOAD_DIR, { recursive: true });
          const body = Buffer.concat(chunks);
          writeFileSync(join(UPLOAD_DIR, stored), body);
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ url: `http://${req.headers.host}/uploads/${stored}`, name, size: body.length }));
        });
      });
      server.middlewares.use("/uploads", (req, res, next) => {
        const file = join(UPLOAD_DIR, basename(new URL(req.url ?? "", "http://localhost").pathname));
        if (!existsSync(file)) return next();
        const types: Record<string, string> = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp" };
        res.setHeader("content-type", types[extname(file).toLowerCase()] ?? "application/octet-stream");
        res.end(readFileSync(file));
      });
      server.middlewares.use("/__lab/uploads", (req, res) => {
        mkdirSync(UPLOAD_DIR, { recursive: true });
        const assets = readdirSync(UPLOAD_DIR).map((file) => ({
          url: `http://${req.headers.host}/uploads/${file}`,
          name: file,
          size: statSync(join(UPLOAD_DIR, file)).size,
        }));
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify(assets));
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        // plugins: [["babel-plugin-react-compiler"]],
      },
    }),
    tailwindcss(),
    labUploads(),
  ],
  server: {
    watch: { ignored: ["**/.lab-uploads/**"] },
  },
  resolve: {
    dedupe: ["react", "react-dom", "zustand"],
  },
});
