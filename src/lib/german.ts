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
