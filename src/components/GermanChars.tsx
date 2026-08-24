"use client";

const CHARS = ["ä", "ö", "ü", "ß", "Ä", "Ö", "Ü"] as const;

export function insertChar(
  value: string,
  char: string,
  input: HTMLInputElement | null,
): string {
  const start = input?.selectionStart ?? value.length;
  const end = input?.selectionEnd ?? value.length;
  const next = `${value.slice(0, start)}${char}${value.slice(end)}`;
  const caret = start + char.length;
  requestAnimationFrame(() => {
    if (!input) return;
    input.focus();
    input.setSelectionRange(caret, caret);
  });
  return next;
}

export function GermanChars({
  onInsert,
  disabled,
}: {
  onInsert: (char: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="mt-3">
      <p className="text-xs text-[var(--muted)]">German characters</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {CHARS.map((char) => (
          <button
            key={char}
            type="button"
            disabled={disabled}
            className="chip min-w-11 justify-center px-0 text-base font-medium"
            onClick={() => onInsert(char)}
            aria-label={`Insert ${char}`}
          >
            {char}
          </button>
        ))}
      </div>
    </div>
  );
}
