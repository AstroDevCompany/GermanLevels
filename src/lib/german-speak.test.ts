import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  looksGermanContext,
  looksGermanWord,
  pointHitsRects,
  stripSpeakPunctuation,
  wordAt,
} from "./german-speak";

describe("wordAt", () => {
  it("finds a word under the caret", () => {
    const found = wordAt("Guten Morgen!", 7);
    assert.equal(found?.word, "Morgen");
  });

  it("keeps hyphenated compounds together", () => {
    const found = wordAt("Online-Shop hier", 3);
    assert.equal(found?.word, "Online-Shop");
  });

  it("does not treat spaces or trailing padding as the neighbouring word", () => {
    assert.equal(wordAt("Guten Morgen", 5), null);
    assert.equal(wordAt("Guten Morgen", 12), null);
  });
});

describe("pointHitsRects", () => {
  it("requires the point to sit on the glyph box", () => {
    const rect = { left: 10, right: 40, top: 10, bottom: 24 };
    assert.equal(pointHitsRects(20, 16, [rect]), true);
    assert.equal(pointHitsRects(80, 16, [rect]), false);
    assert.equal(pointHitsRects(20, 40, [rect]), false);
  });
});

describe("looksGermanWord", () => {
  it("accepts umlauts, articles, and German shapes", () => {
    assert.equal(looksGermanWord("Übung"), true);
    assert.equal(looksGermanWord("nicht"), true);
    assert.equal(looksGermanWord("Freundschaft"), true);
  });

  it("rejects English chrome", () => {
    assert.equal(looksGermanWord("Courses"), false);
    assert.equal(looksGermanWord("Continue"), false);
  });
});

describe("looksGermanContext", () => {
  it("treats a German sentence as context", () => {
    assert.equal(looksGermanContext("Der Hund ist groß."), true);
    assert.equal(looksGermanContext("Start with sounds, then write."), false);
  });
});

describe("stripSpeakPunctuation", () => {
  it("drops wrapping quotes and commas", () => {
    assert.equal(stripSpeakPunctuation("„Hallo“"), "Hallo");
    assert.equal(stripSpeakPunctuation("Tisch,"), "Tisch");
  });
});
