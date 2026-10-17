// Verifies every course note yields a curriculum question pool with paired answers.
import { readFileSync } from "node:fs";
import { parseCurriculum } from "../lib/curriculum.ts";

const courses = {
  "EBLG215.1": "eblg215", "EBLG341.1": "eblg341", "EBLG351.1": "eblg351",
  "EBLG359.1": "eblg359", "EINS335.1": "eins335", "GET05011.1": "get05011",
};
let failed = false;
for (const [code, file] of Object.entries(courses)) {
  const md = readFileSync(new URL(`../content/notes/${file}.md`, import.meta.url), "utf8");
  const qs = parseCurriculum(code, md);
  const weeks = new Set(qs.map((q) => q.week));
  const keys = new Set(qs.map((q) => q.key));
  const bad = qs.filter((q) => q.prompt.length < 10 || q.answer.length < 5 || /<\/?details|<summary/.test(q.prompt + q.answer));
  console.log(`${code}: ${qs.length} soru, ${weeks.size} hafta, bozuk ${bad.length}`);
  if (qs.length < 10 || keys.size !== qs.length || bad.length) {
    failed = true;
    for (const q of bad.slice(0, 3)) console.log("  BOZUK", q.key, JSON.stringify(q.prompt.slice(0, 80)), JSON.stringify(q.answer.slice(0, 60)));
  }
}
process.exit(failed ? 1 : 0);
