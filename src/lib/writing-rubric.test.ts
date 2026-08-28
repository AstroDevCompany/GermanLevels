import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { germanReadingItems } from "../content/buildTasks";
import { looksGermanTask } from "./german";
import { scoreWriting } from "./writing-rubric";

describe("writing rubric", () => {
  it("fails keyword-only scraps that used to pass", () => {
    const result = scoreWriting("Betreff bitte Grüßen", {
      minWords: 70,
      targetWords: 90,
      keywords: ["Betreff", "bitte", "Grüßen"],
      register: "formal",
    });
    assert.equal(result.passed, false);
    assert.ok(result.wordCount < 70);
  });

  it("passes a short A1 message with task language", () => {
    const result = scoreWriting(
      "Hallo Anna! Ich heiße Mira. Ich wohne in Berlin in einer kleinen Wohnung. Am Morgen trinke ich Kaffee und gehe zur Arbeit. Bis bald!",
      {
        minWords: 12,
        targetWords: 24,
        keywords: ["Hallo", "heiße", "wohne"],
        register: "informal",
        connectors: ["und", "aber", "dann"],
      },
    );
    assert.equal(result.passed, true);
    assert.ok(result.overall >= 55);
    assert.ok(result.wordCount >= 12);
  });
});

describe("German-first reading items", () => {
  it("keeps authored German questions and drops English ones", () => {
    const items = germanReadingItems(
      {
        title: "A note",
        titleDe: "Ein Zettel",
        text: "Liebe Nachbarn, wir machen am Samstag ein Fest. Es gibt Kuchen. Bitte klingeln Sie um 18 Uhr. Parken Sie nicht vor der Tür.",
        translation: "Dear neighbours, we are having a party on Saturday.",
        questions: [
          {
            question: "When is the party?",
            options: ["Monday", "Saturday", "Never"],
            answer: "Saturday",
          },
          {
            question: "Wann ist das Fest?",
            options: ["Am Montag", "Am Samstag", "Nie"],
            answer: "Am Samstag",
          },
        ],
      },
      "test-read",
      2,
    );
    assert.equal(looksGermanTask("When is the party?"), false);
    assert.ok(items.every((item) => looksGermanTask("prompt" in item ? item.prompt : "")));
    const prompts = items.map((item) => ("prompt" in item ? item.prompt : ""));
    assert.ok(prompts.includes("Wann ist das Fest?"));
    assert.ok(!prompts.includes("When is the party?"));
  });
});
