import { cpSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");
const srcDir = resolve(rootDir, "node_modules", "pdfjs-dist");
const targetDir = resolve(rootDir, "public", "pdfjs");

export function preparePdfWorker() {
  if (!existsSync(srcDir)) {
    return;
  }
  mkdirSync(targetDir, { recursive: true });

  // 1. Worker script
  const workerSrc = resolve(srcDir, "build", "pdf.worker.min.mjs");
  if (existsSync(workerSrc)) {
    cpSync(workerSrc, resolve(targetDir, "pdf.worker.min.mjs"));
  }

  // 2. cmaps
  const cmapsSrc = resolve(srcDir, "cmaps");
  if (existsSync(cmapsSrc)) {
    cpSync(cmapsSrc, resolve(targetDir, "cmaps"), { recursive: true });
  }

  // 3. standard_fonts
  const fontsSrc = resolve(srcDir, "standard_fonts");
  if (existsSync(fontsSrc)) {
    cpSync(fontsSrc, resolve(targetDir, "standard_fonts"), { recursive: true });
  }

  // 4. wasm if exists
  const wasmSrc = resolve(srcDir, "wasm");
  if (existsSync(wasmSrc)) {
    cpSync(wasmSrc, resolve(targetDir, "wasm"), { recursive: true });
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  preparePdfWorker();
}
