import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { chromium } from "playwright-core";

const root = resolve(import.meta.dirname, "..");
const courses = {
  eblg215: "EBLG215.1 · Sayısal Tasarım",
  eblg341: "EBLG341.1 · İşletim Sistemleri",
  eblg351: "EBLG351.1 · Görüntü İşleme",
  eblg359: "EBLG359.1 · Algoritma Analizi",
  eins335: "EINS335.1 · Mesleki Sorumluluk ve Etik",
  get05011: "GET05011.1 · Kariyer Planlaması",
};
const selected = process.argv.slice(2);
const names = selected.length ? selected : Object.keys(courses);
if (names.some((name) => !courses[name])) throw new Error(`Unknown course: ${names.find((name) => !courses[name])}`);

const schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    div: [...(defaultSchema.attributes?.div ?? []), ["className", "math", "math-display"]],
    span: [...(defaultSchema.attributes?.span ?? []), ["className", "math", "math-inline"]],
    details: ["open"],
  },
};
const escapeHtml = (value) => value.replace(/[&<>\"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]);
const components = {
  h2({ children }) {
    const heading = String(children);
    const week = /^Hafta\s+(\d+)/.exec(heading)?.[1];
    return React.createElement("h2", { id: week ? `hafta-${week}` : undefined }, children);
  },
  pre({ children }) {
    if (React.isValidElement(children) && children.props.className === "language-mermaid") {
      return React.createElement("div", { className: "mermaid" }, String(children.props.children).trim());
    }
    return React.createElement("pre", null, children);
  },
  img({ src, alt, title, width, height }) {
    let resolvedSrc = src;
    if (src && src.startsWith("/")) {
      const publicPrefix = pathToFileURL(join(root, "public") + "/").href;
      resolvedSrc = pathToFileURL(join(root, "public", src.slice(1))).href;
      if (!resolvedSrc.startsWith(publicPrefix)) throw new Error(`Image path outside public: ${src}`);
    }
    return React.createElement("img", { src: resolvedSrc, alt, title, width, height });
  },
};

function pageHtml(name, source) {
  const title = courses[name];
  const weeks = [...source.matchAll(/^## Hafta\s+(\d+)\s*[—–:-]\s*(.+)$/gm)];
  if (weeks.length < 10) throw new Error(`${name}: expected weekly headings, found ${weeks.length}`);
  const rawBody = renderToStaticMarkup(React.createElement(ReactMarkdown, {
    remarkPlugins: [remarkGfm, remarkMath],
    rehypePlugins: [rehypeRaw, [rehypeSanitize, schema], rehypeKatex],
    components,
  }, source));
  const preloads = [];
  const body = rawBody.replace(/<link rel="preload"[^>]*>/g, (match) => {
    preloads.push(match);
    return "";
  });
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
${preloads.join("\n")}
<link rel="stylesheet" href="../node_modules/katex/dist/katex.min.css">
<style>
@page { size: A4; margin: 18mm 16mm 18mm; @bottom-right { content: counter(page); color: #78716c; font: 8pt Arial; } }
* { box-sizing: border-box; } body { color:#292524; font:10.5pt/1.55 Arial, sans-serif; margin:0; }
h1,h2,h3,h4 { color:#1c1917; line-height:1.23; break-after:avoid; } h2 { font-size:18pt; margin-top:0; break-before:page; border-bottom:2px solid #d97706; padding-bottom:5mm; } h2:first-of-type { break-before:avoid; } h3 { font-size:13pt; margin:7mm 0 3mm; } h4 { font-size:11pt; margin:5mm 0 2mm; }
p,li { orphans:3; widows:3; } p { margin:2mm 0 3mm; } ul,ol { padding-left:6mm; } li { margin:1mm 0; }
a { color:#92400e; text-decoration:underline; overflow-wrap:anywhere; } blockquote { margin:5mm 0; padding:3mm 4mm; border-left:3px solid #d97706; background:#fffbeb; color:#44403c; }
pre { white-space:pre-wrap; overflow-wrap:anywhere; background:#292524; color:#fafaf9; padding:3mm; border-radius:2mm; font:8pt/1.45 Consolas,monospace; break-inside:avoid; page-break-inside:avoid; }
code { overflow-wrap:anywhere; } :not(pre)>code { background:#f5f5f4; padding:0 1mm; }
table { width:100%; border-collapse:collapse; table-layout:fixed; margin:4mm 0; font-size:8pt; } th,td { border:1px solid #d6d3d1; padding:1.5mm 2mm; overflow-wrap:anywhere; } th { background:#f5f5f4; }
img,svg { max-width:100%; height:auto; } .mermaid { break-inside:avoid; margin:5mm 0; text-align:center; } .mermaid svg { max-height:205mm; }
img { max-height:115mm; object-fit:contain; display:block; margin:3mm auto; break-inside:avoid; page-break-inside:avoid; }
details { display:block; margin:2mm 0 4mm; padding:2mm 3mm; border:1px solid #e7e5e4; break-inside:avoid; } summary { font-weight:bold; }
.katex .overline .overline-line, .katex .underline .underline-line { border-bottom-style:solid; display:inline-block; width:100%; min-height:1px; }
.katex-display { overflow:hidden; font-size:0.95em; }
</style></head><body>
<main>${body}</main>
<script type="module">
import mermaid from "../node_modules/mermaid/dist/mermaid.esm.min.mjs";
mermaid.initialize({startOnLoad:false,securityLevel:"strict",theme:"neutral",fontFamily:"Arial"});
try {
  const diagrams=[...document.querySelectorAll(".mermaid")];
  const failures=[];
  for (const [index, element] of diagrams.entries()) {
    try {
      const {svg}=await mermaid.render("${name}-diagram-"+index, element.textContent);
      element.innerHTML=svg;
    } catch (error) { failures.push({index,message:String(error).slice(0,350)}); }
  }
  await document.fonts.ready;
  await Promise.all([...document.querySelectorAll("img")].map((img) => img.decode().catch(() => undefined)));
  const mathErrors = [...document.querySelectorAll(".katex-error")].map((element) => element.getAttribute("title") || element.textContent || "KaTeX parse error");
  const imageErrors = [];
  const images = [...document.querySelectorAll("img")];
  for (const img of images) {
    if (!img.complete || img.naturalWidth <= 0) {
      imageErrors.push({ src: img.src || img.getAttribute("src"), complete: img.complete, naturalWidth: img.naturalWidth });
    }
  }
  document.querySelectorAll("details").forEach((element)=>{element.open=true});
  window.__pdfStatus={ready:true,diagrams:diagrams.length,failures,mathErrors,imageErrors};
} catch (error) { window.__pdfStatus={error:String(error)}; }
</script></body></html>`;
}

const chrome = process.env.CHROME_PATH ?? (process.platform === "win32"
  ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" : "google-chrome");
const browser = await chromium.launch({ executablePath: chrome, headless: true, args: ["--allow-file-access-from-files"] });
try {
  await mkdir(join(root, "tmp"), { recursive: true });
  await mkdir(join(root, "public", "study-guides"), { recursive: true });
  const failures = [];
  for (const name of names) {
    const page = await browser.newPage();
    try {
      const source = await readFile(join(root, "content", "notes", `${name}.md`), "utf8");
      const htmlPath = join(root, "tmp", `${name}-print.html`);
      const pdfPath = join(root, "public", "study-guides", `${name}.pdf`);
      await writeFile(htmlPath, pageHtml(name, source), "utf8");
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "load" });
      await page.waitForFunction(() => {
        const status = window.__pdfStatus;
        if (!status) return false;
        const imgs = [...document.querySelectorAll("img")];
        return imgs.every((img) => img.complete);
      }, undefined, { timeout: 120000 });
      const status = await page.evaluate(() => window.__pdfStatus);
      if (status.error || status.failures?.length || status.mathErrors?.length || status.imageErrors?.length || errors.length) {
        throw new Error(`${name}: ${status.error ?? JSON.stringify(status.imageErrors?.length ? status.imageErrors : (status.mathErrors?.length ? status.mathErrors : (status.failures ?? errors)))}`);
      }
      await page.pdf({ path: pdfPath, format: "A4", preferCSSPageSize: true, printBackground: true });
      console.log(`${name}: ${status.diagrams} diagrams -> ${pdfPath}`);
    } catch (error) {
      failures.push(String(error));
      console.error(String(error));
    } finally {
      await page.close();
    }
  }
  if (failures.length) process.exitCode = 1;
} finally {
  await browser.close();
}
