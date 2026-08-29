const WORD_CHAR = /[\p{L}\p{M}0-9'’\-]/u;
const SKIP_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT", "OPTION", "SCRIPT", "STYLE", "NOSCRIPT"]);

const GERMAN_MARKERS =
  /\b(der|die|das|den|dem|des|ein|eine|einer|einem|einen|ich|nicht|und|oder|aber|mit|von|für|auf|aus|ist|sind|haben|bitte|danke|hallo|tschüss|guten)\b/i;

const GERMAN_SHAPE =
  /[äöüÄÖÜß]|sch|tsch|\bpf|tz|(?:ung|heit|keit|lich|isch|chen|lein|schaft)$/i;

const DISTINCT_GERMAN = new Set(
  [
    "ich",
    "nicht",
    "und",
    "oder",
    "aber",
    "der",
    "die",
    "das",
    "den",
    "dem",
    "des",
    "ein",
    "eine",
    "einer",
    "einem",
    "einen",
    "kein",
    "keine",
    "bitte",
    "danke",
    "hallo",
    "tschüss",
    "guten",
    "morgen",
    "abend",
    "nacht",
    "ja",
    "nein",
    "sehr",
    "auch",
    "noch",
    "schon",
    "heute",
    "gestern",
    "wir",
    "ihr",
    "sie",
    "mein",
    "dein",
    "sein",
    "uns",
    "euch",
    "hier",
    "dort",
    "jetzt",
    "dann",
    "wenn",
    "weil",
    "dass",
    "was",
    "wer",
    "wo",
    "wie",
    "wann",
    "warum",
    "haben",
    "sein",
    "werden",
    "können",
    "müssen",
    "sollen",
    "wollen",
    "dürfen",
    "mögen",
  ].map((item) => item.toLowerCase()),
);

const ENGLISH_UI = new Set(
  [
    "home",
    "courses",
    "practice",
    "progress",
    "profile",
    "grammar",
    "vocabulary",
    "settings",
    "account",
    "listen",
    "continue",
    "previous",
    "next",
    "back",
    "level",
    "start",
    "learn",
    "review",
    "submit",
    "check",
    "lesson",
    "chapter",
    "loading",
    "playing",
    "unavailable",
    "germanlevels",
    "breakthrough",
    "waystage",
    "threshold",
    "vantage",
    "effective",
    "beginner",
    "intermediate",
    "advanced",
    "words",
    "talk",
    "exam",
  ].map((item) => item.toLowerCase()),
);

export function stripSpeakPunctuation(value: string): string {
  return value.replace(/^[„“”"'(]+|[„“”"'.,!?;:)]+$/g, "").trim();
}

export function pointHitsRects(
  x: number,
  y: number,
  rects: Array<Pick<DOMRect, "left" | "right" | "top" | "bottom">>,
  slop = 1,
): boolean {
  return rects.some(
    (rect) => x >= rect.left - slop && x <= rect.right + slop && y >= rect.top - slop && y <= rect.bottom + slop,
  );
}

export function wordAt(text: string, index: number): { start: number; end: number; word: string } | null {
  if (!text || index < 0 || index >= text.length) return null;
  if (!WORD_CHAR.test(text[index] ?? "")) return null;
  let start = index;
  let end = index + 1;
  while (start > 0 && WORD_CHAR.test(text[start - 1] ?? "")) start -= 1;
  while (end < text.length && WORD_CHAR.test(text[end] ?? "")) end += 1;
  const word = stripSpeakPunctuation(text.slice(start, end));
  if (!word) return null;
  return { start, end, word };
}

export function looksGermanWord(word: string): boolean {
  const cleaned = stripSpeakPunctuation(word);
  if (!cleaned) return false;
  const lower = cleaned.toLowerCase();
  if (ENGLISH_UI.has(lower)) return false;
  if (/[äöüÄÖÜß]/.test(cleaned)) return true;
  if (DISTINCT_GERMAN.has(lower)) return true;
  if (GERMAN_SHAPE.test(cleaned) && /[\p{L}]{3,}/u.test(cleaned)) return true;
  return false;
}

export function looksGermanContext(text: string): boolean {
  if (!text.trim()) return false;
  if (/[äöüÄÖÜß]/.test(text)) return true;
  if (GERMAN_MARKERS.test(text)) return true;
  return false;
}

export function inGermanContext(node: Node): boolean {
  const element =
    node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
  if (!element) return false;
  if (element.closest("[data-no-speak]")) return false;
  if (element.closest('[lang="de"], [data-de]')) return true;
  return looksGermanContext(element.textContent ?? node.textContent ?? "");
}

export function blockedSpeakTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  const tag = target.closest("input, textarea, select, option, [contenteditable='true']");
  if (tag) return true;
  if (target.closest("[data-no-speak]")) return true;
  return false;
}

export function speakableFromPoint(
  x: number,
  y: number,
  doc: Document = document,
): { word: string; range: Range; rects: DOMRect[] } | null {
  const target = doc.elementFromPoint(x, y);
  if (blockedSpeakTarget(target)) return null;
  if (target instanceof Element && target.closest("[data-german-word-outline]")) return null;

  const range = rangeFromPoint(x, y, doc);
  if (!range || range.startContainer.nodeType !== Node.TEXT_NODE) return null;
  const textNode = range.startContainer;
  if (SKIP_TAGS.has(textNode.parentElement?.tagName ?? "")) return null;
  const text = textNode.textContent ?? "";
  const germanContext = inGermanContext(textNode);
  const seen = new Set<string>();
  const offsets = [range.startOffset];
  if (range.startOffset > 0) offsets.push(range.startOffset - 1);

  for (const offset of offsets) {
    const found = wordAt(text, offset);
    if (!found) continue;
    const key = `${found.start}:${found.end}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const speak = germanContext ? stripSpeakPunctuation(found.word) : looksGermanWord(found.word) ? found.word : "";
    if (!speak || !/[\p{L}]/u.test(speak)) continue;
    if (!germanContext && speak.length < 2) continue;
    if (germanContext && speak.length < 2 && !/[äöüÄÖÜß]/.test(speak)) continue;
    if (ENGLISH_UI.has(speak.toLowerCase())) continue;

    const wordRange = doc.createRange();
    wordRange.setStart(textNode, found.start);
    wordRange.setEnd(textNode, found.end);
    const rects = [...wordRange.getClientRects()].filter((rect) => rect.width > 0 && rect.height > 0);
    if (!rects.length || !pointHitsRects(x, y, rects)) continue;
    return { word: speak, range: wordRange, rects };
  }
  return null;
}

function rangeFromPoint(x: number, y: number, doc: Document): Range | null {
  const anyDoc = doc as Document & {
    caretRangeFromPoint?: (x: number, y: number) => Range | null;
    caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
  };
  if (typeof anyDoc.caretRangeFromPoint === "function") {
    return anyDoc.caretRangeFromPoint(x, y);
  }
  const pos = anyDoc.caretPositionFromPoint?.(x, y);
  if (!pos) return null;
  const range = doc.createRange();
  range.setStart(pos.offsetNode, pos.offset);
  range.collapse(true);
  return range;
}
