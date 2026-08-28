const ARTICLE_RE = /^(der|die|das)\s+/i;

export function splitGerman(sentence: string): string[] {
  return sentence
    .replace(/([.,!?;:])/g, " $1")
    .split(/\s+/)
    .filter(Boolean);
}

export function normalizeAnswer(value: string): string {
  return value
    .toLowerCase()
    .replace(/ß/g, "ss")
    .replace(/["""„«»]/g, "")
    .replace(/[.,!?;:]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function answersMatch(
  given: string,
  expected: string | string[],
): boolean {
  const options = Array.isArray(expected) ? expected : [expected];
  const got = normalizeAnswer(given);
  return options.some((item) => normalizeAnswer(item) === got);
}

export function stripArticle(word: string): string {
  return word.replace(ARTICLE_RE, "").trim();
}

export function getArticle(word: string): "der" | "die" | "das" | null {
  const match = word.match(ARTICLE_RE);
  if (!match) return null;
  return match[1].toLowerCase() as "der" | "die" | "das";
}

export function articleClass(word: string): string {
  const article = getArticle(word);
  if (article === "der") return "art-der";
  if (article === "die") return "art-die";
  if (article === "das") return "art-das";
  return "";
}

export function capitalize(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function seededShuffle<T>(items: T[], seed: string): T[] {
  const copy = [...items];
  let state = hashString(seed) || 1;
  const random = () => {
    state = Math.imul(state, 1664525) + 1013904223;
    return (state >>> 0) / 4294967296;
  };
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function pickDistractors(
  pool: string[],
  answer: string,
  count: number,
  seed: string,
): string[] {
  const unique = [...new Set(pool.filter((item) => item !== answer))];
  return seededShuffle(unique, seed).slice(0, count);
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const rows = a.length + 1;
  const cols = b.length + 1;
  const prev = new Array<number>(cols);
  const curr = new Array<number>(cols);
  for (let j = 0; j < cols; j += 1) prev[j] = j;
  for (let i = 1; i < rows; i += 1) {
    curr[0] = i;
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j < cols; j += 1) prev[j] = curr[j] ?? 0;
  }
  return prev[b.length] ?? b.length;
}

export function isAdjacentTransposition(a: string, b: string): boolean {
  if (a.length !== b.length || a.length < 2) return false;
  let i = 0;
  while (i < a.length && a[i] === b[i]) i += 1;
  if (i >= a.length - 1) return false;
  if (a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2)) {
    return true;
  }
  return false;
}

export function looksGermanTask(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (/[äöüÄÖÜß]/.test(trimmed)) return true;
  return /^(Wo|Was|Wer|Wen|Wem|Wann|Wie|Warum|Wieso|Welche|Welcher|Welches|Wohin|Woher|Womit|Wofür|Worüber|Wozu|Stimmt|Ist |Hat |Haben |Können |Muss |Soll |Darf |Wird |Wurde )/i.test(
    trimmed,
  );
}

export function uniqueWords(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const key = normalizeAnswer(value);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }
  return result;
}
