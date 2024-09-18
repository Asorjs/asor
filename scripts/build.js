const fs = require("fs");
const path = require("path");
const brotliSize = require("brotli-size");
const crypto = require("crypto");
const esbuild = require("esbuild");

// Function to ensure a directory exists
function ensureDirSync(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function build(options) {
  options.define || (options.define = {});
  options.define["process.env.NODE_ENV"] = process.argv.includes("--watch")
    ? `'production'`
    : `'development'`;

  return esbuild
    .build({
      watch: process.argv.includes("--watch"),
      ...options,
    })
    .catch(() => process.exit(1));
}

function outputSize(file) {
  const size = bytesToSize(brotliSize.sync(fs.readFileSync(file)));
  console.log("\x1b[32m", `Bundle size: ${size}`);
}

function bytesToSize(bytes) {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes === 0) return "n/a";
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10);
  if (i === 0) return `${bytes} ${sizes[i]}`;
  return `${(bytes / 1024 ** i).toFixed(1)} ${sizes[i]}`;
}

// Ensure the dist directory exists
ensureDirSync(path.join(__dirname, "../dist"));

build({
  entryPoints: ["builds/cdn.js"],
  outfile: "dist/asor.js",
  bundle: true,
  platform: "browser",
  define: { CDN: true },
});

build({
  format: "esm",
  entryPoints: ["builds/module.js"],
  outfile: "dist/asor.module.esm.js",
  bundle: true,
  platform: "node",
  define: { CDN: true },
});

build({
  entryPoints: ["builds/cdn.js"],
  outfile: "dist/asor.min.js",
  bundle: true,
  minify: true,
  platform: "browser",
  define: { CDN: true },
}).then(() => {
  outputSize("dist/asor.min.js");
});
