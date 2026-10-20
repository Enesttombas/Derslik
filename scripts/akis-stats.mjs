// Prints the Akış question-bank composition as JSON (course -> card type -> count).
import { readdirSync, readFileSync } from "node:fs";
const out = { courses: {}, total: 0 };
for (const [code, dir] of [["EBLG351", "eblg351"], ["EBLG359", "eblg359"]]) {
  const t = {};
  for (const f of readdirSync(new URL(`../content/akis/${dir}/`, import.meta.url))) {
    const j = JSON.parse(readFileSync(new URL(`../content/akis/${dir}/${f}`, import.meta.url), "utf8"));
    for (const k of j.kartlar) { t[k.tur] = (t[k.tur] || 0) + 1; out.total++; }
  }
  out.courses[code] = t;
}
console.log(JSON.stringify(out, null, 2));
