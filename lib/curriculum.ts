// Parses the verified weekly study notes into a curriculum question pool.
// Notes use two layouts inside "Aktif Hatırlama" sections:
//   A) a numbered question list followed by one <details> with numbered answers
//   B) each question followed by its own <details> answer
export interface CurriculumQuestion {
  key: string;
  courseCode: string;
  week: number;
  weekTitle: string;
  index: number;
  prompt: string;
  answer: string;
}

const WEEK_PATTERN = /^## Hafta\s+(\d+)\s*(?:[—–:-]\s*|\s+)(.+)$/gm;
const RECALL_HEADING = /^#{3,4}\s+.*Aktif Hatırlama.*$/m;
const DETAILS_PATTERN = /<details>\s*(?:<summary>[\s\S]*?<\/summary>)?([\s\S]*?)<\/details>/g;
const NUMBERED_ITEM = /^(\d+)\.\s+/;

function cleanPrompt(text: string): string {
  return text
    .trim()
    .replace(/^\d+\.\s+/, "")
    .replace(/^\*\*Soru\s*\d*\s*:?\*\*\s*:?\s*/i, "")
    .replace(/^\*Soru\s*\d*\s*:?\*\s*:?\s*/i, "")
    .replace(/^Soru\s*\d*\s*:\s*/i, "")
    .trim();
}

// Splits text into top-level numbered items; indented continuation lines stay with their item.
function splitNumbered(text: string): string[] {
  const items: string[] = [];
  let current: string[] | null = null;
  for (const line of text.split(/\r?\n/)) {
    if (NUMBERED_ITEM.test(line)) {
      if (current) items.push(current.join("\n").trim());
      current = [line.replace(NUMBERED_ITEM, "")];
    } else if (current) {
      current.push(line);
    }
  }
  if (current) items.push(current.join("\n").trim());
  return items.filter(Boolean);
}

function recallSection(weekMarkdown: string): string | null {
  const heading = RECALL_HEADING.exec(weekMarkdown);
  if (!heading) return null;
  const rest = weekMarkdown.slice(heading.index + heading[0].length);
  const end = rest.search(/^#{2,3}\s+/m);
  const section = end === -1 ? rest : rest.slice(0, end);
  // Drop trailing callouts and separators that follow the answers.
  return section.split(/^---\s*$/m)[0].replace(/^>\s?\[!.*$[\s\S]*/m, "");
}

export function parseRecallSection(section: string): { prompt: string; answer: string }[] {
  const details = [...section.matchAll(DETAILS_PATTERN)];
  if (details.length === 0) return [];

  if (details.length === 1) {
    const before = section.slice(0, details[0].index);
    const questions = splitNumbered(before);
    const answers = splitNumbered(details[0][1]);
    if (questions.length > 1 && questions.length === answers.length) {
      return questions.map((q, i) => ({ prompt: cleanPrompt(q), answer: answers[i] }));
    }
  }

  const pairs: { prompt: string; answer: string }[] = [];
  let cursor = 0;
  for (const match of details) {
    const prompt = cleanPrompt(section.slice(cursor, match.index));
    const answer = match[1].trim();
    cursor = (match.index ?? 0) + match[0].length;
    if (prompt && answer) pairs.push({ prompt, answer });
  }
  return pairs;
}

export function parseCurriculum(courseCode: string, markdown: string): CurriculumQuestion[] {
  const slug = courseCode.split(".")[0].replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  const matches = [...markdown.matchAll(WEEK_PATTERN)];
  const questions: CurriculumQuestion[] = [];

  matches.forEach((match, i) => {
    const week = Number(match[1]);
    const weekTitle = match[2].trim();
    const body = markdown.slice((match.index ?? 0) + match[0].length, matches[i + 1]?.index ?? markdown.length);
    const section = recallSection(body);
    if (!section) return;
    parseRecallSection(section).forEach((pair, index) => {
      questions.push({
        key: `${slug}-w${week}-q${index + 1}`,
        courseCode,
        week,
        weekTitle,
        index: index + 1,
        ...pair,
      });
    });
  });

  return questions;
}
