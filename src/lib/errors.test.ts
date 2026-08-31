import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Exercise, Lesson } from "../content/types";
import { activeErrors, applyAnswer, isResolved } from "./errors";
import { injectTargetedExercises, targetedExercises } from "./targeted";

const missed: Exercise = {
  type: "type-answer",
  id: "miss-hallo",
  prompt: "Type the German for “hello”.",
  answer: "Hallo",
  target: "Hallo",
  modality: "recall",
  phase: "recall",
};

function otherMiss(target: string, id: string): Exercise {
  return {
    type: "type-answer",
    id,
    prompt: `Type the German for “${target}”.`,
    answer: target,
    target,
    modality: "recall",
    phase: "recall",
  };
}

describe("targeted review clears a mistake", () => {
  it("drops the error after one correct targeted answer", () => {
    let errors = applyAnswer({}, { exercise: missed, given: "hello", correct: false });
    assert.equal(activeErrors(errors).length, 1);

    const review = targetedExercises(errors, 1)[0];
    assert.equal(review.targeted, true);
    errors = applyAnswer(errors, { exercise: review, given: "Hallo", correct: true });

    assert.equal(activeErrors(errors).length, 0);
    assert.ok(isResolved(Object.values(errors)[0]));
    assert.equal(targetedExercises(errors, 8).length, 0);
  });

  it("still needs three incidental corrects outside targeted review", () => {
    let errors = applyAnswer({}, { exercise: missed, given: "hello", correct: false });
    errors = applyAnswer(errors, { exercise: missed, given: "Hallo", correct: true });
    assert.equal(activeErrors(errors).length, 1);
    errors = applyAnswer(errors, { exercise: missed, given: "Hallo", correct: true });
    assert.equal(activeErrors(errors).length, 1);
    errors = applyAnswer(errors, { exercise: missed, given: "Hallo", correct: true });
    assert.equal(activeErrors(errors).length, 0);
  });

  it("clears the original record even if the review item uses another category key", () => {
    let errors = applyAnswer({}, { exercise: missed, given: "hello", correct: false });
    const original = activeErrors(errors)[0];
    const review: Exercise = {
      type: "type-answer",
      id: "target-type-0",
      prompt: "Type the German word you missed last time.",
      answer: [original.target, "Hallo"],
      target: original.target,
      errorCategory: "spelling",
      targeted: true,
      modality: "recall",
      phase: "recall",
    };
    errors = applyAnswer(errors, { exercise: review, given: "Hallo", correct: true });
    assert.equal(activeErrors(errors).length, 0);
  });

  it("does not inject a cleared mistake into a later lesson", () => {
    let errors = applyAnswer({}, { exercise: missed, given: "hello", correct: false });
    errors = applyAnswer(errors, { exercise: otherMiss("Danke", "miss-danke"), given: "thanks", correct: false });

    const review = targetedExercises(errors, 8).find((item) => item.target === "Hallo");
    assert.ok(review);
    errors = applyAnswer(errors, { exercise: review!, given: "Hallo", correct: true });

    const lesson = {
      id: "05",
      number: 5,
      title: "Later",
      skill: "mixed",
      role: "practice",
      summary: "",
      estimatedMinutes: 8,
      conceptIds: [],
      newVocab: [],
      recycledVocab: [],
      exercises: [
        {
          type: "type-answer",
          id: "unrelated",
          prompt: "Type ja",
          answer: "ja",
          target: "ja",
        },
      ],
    } as Lesson;

    const injected = injectTargetedExercises(lesson, errors, 2);
    assert.equal(
      injected.some((item) => item.targeted && item.target === "Hallo"),
      false,
    );
    assert.equal(
      injected.some((item) => item.targeted && item.target === "Danke"),
      true,
    );
  });
});
