import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import brotliSize from 'brotli-size';
import * as esbuild from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function ensureDirSync(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
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

async function build(options) {
  options.define = options.define ?? {};
  options.define["process.env.NODE_ENV"] = process.argv.includes("--watch") ? `'development'` : `'production'`;

  const isWatching = process.argv.includes("--watch");

  try {
    if (isWatching) {
      const context = await esbuild.context(options);
      await context.watch();
    } else {
      return await esbuild.build(options);
    }
  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
}

async function main() {
  ensureDirSync(path.join(__dirname, "../dist"));

  const commonOptions = {
    bundle: true,
  };

  await build({
    ...commonOptions,
    entryPoints: ["builds/cdn.js"],
    outfile: "dist/asor.js",
    platform: "browser",
    define: { CDN: '"true"' },
  });

  await build({
    ...commonOptions,
    format: "esm",
    entryPoints: ["builds/module.js"],
    outfile: "dist/asor.module.esm.js",
    platform: "neutral",
    mainFields: ['module', 'main'],
  });

  await build({
    ...commonOptions,
    entryPoints: ["builds/module.js"],
    outfile: `dist/asor.module.cjs.js`,
    target: ['node10.4'],
    platform: 'node',
  });

  await build({
    ...commonOptions,
    entryPoints: ["builds/cdn.js"],
    outfile: "dist/asor.min.js",
    minify: true,
    platform: "browser",
    define: { CDN: '"true"' },
  });

  outputSize("dist/asor.min.js");
}

main().catch(error => {
  console.error('An error occurred:', error);
  process.exit(1);
});