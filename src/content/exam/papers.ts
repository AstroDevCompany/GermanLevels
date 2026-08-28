import type { Exercise, Lesson, LevelId } from "@/content/types";
import { examPassages } from "@/content/exam/passages";
import { conversationsFor } from "@/content/conversations";
import { connectedListening, germanReadingItems, rubricFor } from "@/content/buildTasks";
import { writingTargets } from "@/lib/writing-rubric";
import { LEVEL_ORDER } from "@/lib/levels";

export const EXAM_SECTIONS = ["lesen", "hoeren", "schreiben", "sprechen"] as const;
export type ExamSectionId = (typeof EXAM_SECTIONS)[number];

export function isExamSection(value: string): value is ExamSectionId {
  return (EXAM_SECTIONS as readonly string[]).includes(value);
}

const SECTION_META: Record<
  ExamSectionId,
  { titleDe: string; title: string; minutes: Record<LevelId, number> }
> = {
  lesen: {
    titleDe: "Lesen",
    title: "Reading",
    minutes: { a1: 12, a2: 14, b1: 18, b2: 20, c1: 22 },
  },
  hoeren: {
    titleDe: "Hören",
    title: "Listening",
    minutes: { a1: 10, a2: 12, b1: 14, b2: 16, c1: 16 },
  },
  schreiben: {
    titleDe: "Schreiben",
    title: "Writing",
    minutes: { a1: 12, a2: 14, b1: 18, b2: 22, c1: 24 },
  },
  sprechen: {
    titleDe: "Sprechen",
    title: "Speaking",
    minutes: { a1: 8, a2: 8, b1: 10, b2: 12, c1: 12 },
  },
};

const WRITING_TASK: Record<LevelId, { prompt: string; promptDe: string; sample: string; hints: string[] }> = {
  a1: {
    prompt: "Write a short message: your name, where you live, and a greeting.",
    promptDe: "Schreib eine kurze Nachricht: Name, Wohnort, Gruß.",
    sample:
      "Hallo Anna! Ich heiße Mira. Ich wohne in Berlin in einer kleinen Wohnung. Am Morgen trinke ich Kaffee und gehe zur Arbeit. Bis bald!",
    hints: ["Hallo", "heiße", "wohne"],
  },
  a2: {
    prompt: "Write an email to postpone an appointment. Give a reason and a new time.",
    promptDe: "Schreib eine Mail: Termin verschieben, Grund, neue Zeit.",
    sample:
      "Guten Tag Frau Klein, ich schreibe, weil ich krank bin und morgen nicht kommen kann. Können wir den Termin bitte auf Donnerstag um 15 Uhr legen? Wenn das nicht geht, rufe ich Sie am Nachmittag an. Vielen Dank und viele Grüße, Lea Hofmann.",
    hints: ["Termin", "weil", "Uhr", "Grüße"],
  },
  b1: {
    prompt: "Write a complaint about a course or order: facts, demand, deadline.",
    promptDe: "Schreib eine Reklamation: Fakten, Forderung, Frist.",
    sample:
      "Betreff: Reklamation Kurs 8821. Sehr geehrte Damen und Herren, am 3. März habe ich den Abendkurs „Deutsch am Arbeitsplatz“ gebucht. In der Werbung standen höchstens 12 Plätze und Unterricht von 18:00 bis 20:30. In der ersten Woche waren 19 Personen im Raum, und wir begannen um 18:20, weil der Beamer nicht funktionierte. Ich bitte Sie, die Gruppengröße einzuhalten oder mir die Gebühr für zwei Abende zu erstatten. Als Nachweis lege ich die Anmeldebestätigung bei. Bitte antworten Sie bis zum 20. März. Mit freundlichen Grüßen, S. Krüger.",
    hints: ["Betreff", "bitte", "Frist", "Grüßen"],
  },
  b2: {
    prompt: "Forum: Should employers pay a housing allowance? Argue with one concession.",
    promptDe: "Forum: Soll der Arbeitgeber Wohnzuschuss zahlen? Ein Zugeständnis, dann These.",
    sample:
      "Ein befristeter Wohnzuschuss entlastet den Monat, ändert aber nichts am knappen Bestand. Trotzdem ist er fair, weil Berufseinsteiger sonst drei Stunden pendeln und Freizeit fast streichen. Gegner sagen, der Staat müsse bauen, nicht die Firma. Der Einwand zählt. Er begründet jedoch nicht, warum junge Leute die Lücke allein tragen. Wer Wohnen als Standortfaktor behandelt, muss Flächen und Genehmigungen nennen; die Firma kann nur den Monat überbrücken. Flexible ist, wer weit fährt — nicht, wer eine Wohnung findet. Deshalb: Zuschuss ja, aber als Brücke, nicht als Lösung.",
    hints: ["trotzdem", "weil", "Bestand", "fair"],
  },
  c1: {
    prompt: "Write a short statement: training at work fails when cover is not budgeted. Hedge and name a limit.",
    promptDe: "Statement: Weiterbildung scheitert ohne Vertretung. Absichern und eine Grenze nennen.",
    sample:
      "Der Beitrag legt nahe, dass Teilnahme an betrieblicher Weiterbildung mit Hierarchie korreliert, nicht mit Motivation. Formal bleibt das Angebot bestehen; faktisch lernen diejenigen, deren Vertretung geregelt ist. Gleichwohl ist die Reichweite mittelständisch und urban begrenzt. Ein Einwand lautet, kleine Teams könnten niemanden freistellen. Der Einwand ist ernst. Er begründet jedoch nicht, warum Lernzeit ausschließlich in den Feierabend der Beschäftigten verschoben wird. Wer Weiterbildung als Standortargument nutzt, müsste Vertretung budgetieren, nicht nur Plattformlizenzen. Anschlussfähig wäre ein Stundenkonto, das Weiterbildung wie Bereitschaft behandelt: planbar, begrenzt, sichtbar. Ein Desiderat bleibt der Vergleich mit Konzernen.",
    hints: ["legen nahe", "Gleichwohl", "Reichweite", "Desiderat"],
  },
};

export function examMinutes(level: LevelId): number {
  return EXAM_SECTIONS.reduce((sum, id) => sum + SECTION_META[id].minutes[level], 0);
}

export function examSectionMeta(level: LevelId, section: ExamSectionId) {
  const meta = SECTION_META[section];
  return { ...meta, minutes: meta.minutes[level] };
}

function lessonShell(
  level: LevelId,
  section: ExamSectionId,
  exercises: Exercise[],
  passage?: Lesson["passage"],
): Lesson {
  const meta = examSectionMeta(level, section);
  return {
    id: section,
    number: EXAM_SECTIONS.indexOf(section) + 1,
    title: `${meta.title} · mock paper`,
    titleDe: `${meta.titleDe} · Übungsprüfung`,
    skill:
      section === "lesen"
        ? "reading"
        : section === "hoeren"
          ? "listening"
          : section === "schreiben"
            ? "writing"
            : "speaking",
    role: "review",
    summary: `${meta.titleDe} in exam conditions. Shorter than the official paper; same skills.`,
    estimatedMinutes: meta.minutes,
    conceptIds: [],
    newVocab: [],
    recycledVocab: [],
    passage,
    teaching: [
      {
        id: "briefing",
        kind: "situation",
        eyebrow: "Prüfungsmodus",
        phase: "review",
        title: meta.titleDe,
        titleDe: `About ${meta.minutes} minutes · German questions`,
        body: "This is a practice paper in the shape of Goethe/telc, not an official exam. The clock is on the page. Listening plays twice. Writing is marked on four criteria.",
        points: [
          "Instructions stay in German first.",
          "No dictionary — like the room on exam day.",
          "Finish the section, then the next paper.",
        ],
      },
    ],
    exercises,
  };
}

export function getExamLesson(level: LevelId, section: ExamSectionId): Lesson {
  const passages = examPassages(level);
  const first = passages[0];
  const second = passages[1] ?? passages[0];
  if (section === "lesen") {
    const exercises = [
      ...germanReadingItems(first, `${level}-ex-r1`, 4),
      ...germanReadingItems(second, `${level}-ex-r2`, 3),
    ];
    return lessonShell(level, section, exercises, {
      title: first.title,
      titleDe: `${first.titleDe} · ${second.titleDe}`,
      text: `${first.text}\n\n---\n\n${second.text}`,
      translation: `${first.translation}\n\n${second.translation}`,
    });
  }
  if (section === "hoeren") {
    const script = (() => {
      const slice = first.text.slice(0, 520);
      const cut = slice.lastIndexOf(".");
      return cut > 80 ? slice.slice(0, cut + 1) : slice;
    })();
    return lessonShell(level, section, connectedListening(script, first, `${level}-ex-h`, 5));
  }
  if (section === "schreiben") {
    const task = WRITING_TASK[level];
    const targets = writingTargets(level);
    return lessonShell(level, section, [
      {
        type: "free-production",
        id: "exam-write",
        prompt: task.prompt,
        promptDe: task.promptDe,
        sample: task.sample,
        keywords: task.hints,
        minSentences: level === "a1" ? 2 : 4,
        hints: task.hints,
        rubric: {
          ...rubricFor(level, level === "a1" ? "first-writing" : level === "c1" ? "academic-language" : "formal-writing"),
          minWords: targets.minWords,
          targetWords: targets.targetWords,
          keywords: task.hints,
        },
        modality: "production",
        phase: "application",
      },
    ]);
  }
  const mission = conversationsFor(level)[0];
  const exercises: Exercise[] = [
    {
      type: "speak-response",
      id: "exam-speak-1",
      prompt: "Introduce yourself in 20–30 seconds.",
      promptDe: "Stell dich in 20–30 Sekunden vor.",
      sample: "Guten Tag, ich heiße Mira. Ich wohne in Berlin und lerne Deutsch, weil ich hier arbeiten will.",
      keywords: ["heiße", "wohne", "Deutsch"],
      situation: "The examiner has just asked you to start.",
      situationDe: "Die Prüfung beginnt. Du bist dran.",
      minSeconds: 8,
      modality: "production",
      phase: "application",
    },
  ];
  if (mission) {
    exercises.push({
      type: "dialogue",
      id: "exam-speak-2",
      prompt: mission.goal,
      promptDe: mission.goalDe,
      setting: mission.setting,
      settingDe: mission.settingDe,
      turns: mission.turns,
      modality: "production",
      phase: "application",
    });
  }
  return lessonShell(level, section, exercises);
}

export function examLevels(): LevelId[] {
  return [...LEVEL_ORDER];
}
