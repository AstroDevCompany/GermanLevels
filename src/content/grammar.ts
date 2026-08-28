export type GrammarTopic = {
  slug: string;
  title: string;
  level: string;
  summary: string;
  points: string[];
  examples: { de: string; en: string }[];
};

export const GRAMMAR_TOPICS: GrammarTopic[] = [
  {
    slug: "articles-gender",
    title: "Articles & gender",
    level: "A1",
    summary: "Every noun has der, die or das. Learn the word with its article.",
    points: [
      "der = masculine, die = feminine, das = neuter. Plural nominative is always die.",
      "ein/eine for a/an; kein/keine for not a / no.",
      "Never learn Tisch without der Tisch.",
    ],
    examples: [
      { de: "der Tisch, die Lampe, das Fenster", en: "the table, the lamp, the window" },
      { de: "Ich habe eine Tasche. Ich habe kein Handy.", en: "I have a bag. I don't have a phone." },
    ],
  },
  {
    slug: "verb-second",
    title: "Verb-second word order",
    level: "A1",
    summary: "In a main clause the conjugated verb is in position two.",
    points: [
      "Heute bleibe ich zu Hause — time can come first, the verb still follows.",
      "Yes/no questions put the verb first: Bleibst du zu Hause?",
      "Separable verbs split: Ich stehe um sieben auf.",
    ],
    examples: [
      { de: "Ich lerne Deutsch.", en: "I am learning German." },
      { de: "Heute lerne ich Deutsch.", en: "Today I am learning German." },
    ],
  },
  {
    slug: "accusative",
    title: "Accusative (den / einen)",
    level: "A2",
    summary: "Direct objects: masculine changes, feminine and neuter look like nominative.",
    points: [
      "Ich möchte einen Kaffee. Ich kaufe den Pullover.",
      "die/eine and das/ein stay the same in accusative singular.",
      "Learn the article with the noun — gender decides the ending.",
    ],
    examples: [
      { de: "Ich möchte einen Kaffee, bitte.", en: "I would like a coffee, please." },
      { de: "Sie kauft die Tüte.", en: "She is buying the bag." },
    ],
  },
  {
    slug: "separable-verbs",
    title: "Separable verbs",
    level: "A2",
    summary: "In a main clause the prefix goes last: Ich stehe um sieben auf.",
    points: [
      "Present: prefix at the end. Perfekt: aufgestanden, angekommen.",
      "Modal + separable: Ich muss um sieben aufstehen — prefix stays on the infinitive.",
    ],
    examples: [
      { de: "Ich stehe um sieben auf.", en: "I get up at seven." },
      { de: "Der Zug kommt um zehn an.", en: "The train arrives at ten." },
    ],
  },
  {
    slug: "perfekt",
    title: "Perfekt (spoken past)",
    level: "A2",
    summary: "haben/sein + participle at the end. Movement often takes sein.",
    points: [
      "Ich habe Pizza gegessen. Ich bin nach Hause gegangen.",
      "Weak verbs: ge- + stem + -t (gemacht). Strong: often -en (gesehen).",
      "Written stories also use Präteritum: war, hatte, ging.",
    ],
    examples: [
      { de: "Gestern bin ich früh aufgestanden.", en: "Yesterday I got up early." },
      { de: "Wir haben einen Film gesehen.", en: "We watched a film." },
    ],
  },
  {
    slug: "modals",
    title: "Modal verbs",
    level: "A2",
    summary: "können, müssen, wollen, sollen, dürfen, möchten + infinitive at the end.",
    points: [
      "Ich muss morgen arbeiten. Kannst du helfen?",
      "dürfen = permission; müssen = necessity; sollen = ought to / is supposed to.",
      "möchten is the polite wish form of mögen.",
    ],
    examples: [
      { de: "Hier darf man nicht rauchen.", en: "You are not allowed to smoke here." },
      { de: "Ich möchte einen Termin.", en: "I would like an appointment." },
    ],
  },
  {
    slug: "weil",
    title: "weil vs deshalb",
    level: "A2",
    summary: "weil parks the verb at the end. deshalb starts a new main clause.",
    points: [
      "Ich bleibe zu Hause, weil ich krank bin — comma, then verb last.",
      "Es regnet. Deshalb bleibe ich zu Hause — new sentence, verb second.",
      "This pair is everyday speech and an A2 writing favourite.",
    ],
    examples: [
      { de: "Ich schreibe, weil der Kurs wichtig ist.", en: "I am writing because the course matters." },
      { de: "Der Kurs ist wichtig. Deshalb schreibe ich.", en: "The course matters. That is why I am writing." },
    ],
  },
  {
    slug: "cases",
    title: "Accusative, dative & two-way prepositions",
    level: "B1",
    summary: "Case marks the role of the noun. Two-way prepositions change with movement vs location.",
    points: [
      "Direct object: accusative. Indirect object and mit/nach/bei/von/zu: dative.",
      "in, an, auf … accusative = movement, dative = location.",
      "Ich stelle die Lampe auf den Tisch. Die Lampe steht auf dem Tisch.",
    ],
    examples: [
      { de: "Ich gebe dem Kind einen Apfel.", en: "I give the child an apple." },
      { de: "Wir gehen in die Küche. Wir sitzen in der Küche.", en: "We go into the kitchen. We sit in the kitchen." },
    ],
  },
  {
    slug: "subclauses",
    title: "Subordinate clauses",
    level: "B1",
    summary: "weil, dass, wenn, obwohl send the conjugated verb to the end.",
    points: [
      "Comma before the conjunction. Verb last in the Nebensatz.",
      "wenn = if/when; als = once in the past; wann = when?",
      "weil vs deshalb: deshalb starts a new main clause.",
    ],
    examples: [
      { de: "Ich bleibe, weil ich krank bin.", en: "I am staying because I am ill." },
      { de: "Ich hoffe, dass du kommst.", en: "I hope that you are coming." },
    ],
  },
  {
    slug: "passive",
    title: "Passive voice",
    level: "B2",
    summary: "werden + participle for a process; sein + participle for a resulting state.",
    points: [
      "Die Brücke wird eröffnet. Die Tür ist geschlossen.",
      "von + agent only when needed. Often omitted.",
      "Das muss repariert werden. Es wird empfohlen, früh zu kommen.",
    ],
    examples: [
      { de: "Hier wird gebaut.", en: "Construction is going on here." },
      { de: "Der Termin musste verschoben werden.", en: "The appointment had to be postponed." },
    ],
  },
  {
    slug: "konjunktiv-ii",
    title: "Konjunktiv II",
    level: "B2",
    summary: "Wishes, hypotheticals, and politeness: würde, wäre, hätte, könnte.",
    points: [
      "würde + infinitive for most verbs. sein → wäre, haben → hätte.",
      "Wenn ich Zeit hätte, käme ich. Könnten Sie das Fenster schließen?",
      "Hätte ich das gewusst, wäre ich früher gekommen.",
    ],
    examples: [
      { de: "Wenn das Wetter besser wäre, würden wir wandern.", en: "If the weather were better, we would hike." },
      { de: "Ich hätte gern Tee.", en: "I would like tea." },
    ],
  },
  {
    slug: "relatives",
    title: "Relative clauses",
    level: "B2",
    summary: "der/die/das agree with the noun; case follows the role inside the clause.",
    points: [
      "Das Büro, in dem wir sitzen. Alles, was du gesagt hast.",
      "dessen/deren for whose. Preposition + relative pronoun.",
      "Do not stack three relatives; split the sentence.",
    ],
    examples: [
      { de: "Das ist die Kollegin, die den Kurs leitet.", en: "That is the colleague who runs the course." },
      { de: "Wer zu spät kommt, findet keinen Platz.", en: "Whoever comes late finds no seat." },
    ],
  },
  {
    slug: "nominal-style",
    title: "Nominal style & academic caution",
    level: "C1",
    summary: "Official and academic German packs verbs into nouns. Unpack when you need to persuade.",
    points: [
      "zur Durchführung bringen → durchführen. zeitnah → a real date.",
      "Hedges: legen nahe, geht einher mit — not beweisen unless earned.",
      "Mark normative claims; keep descriptive claims descriptive.",
    ],
    examples: [
      { de: "Die Ergebnisse legen nahe, dass …", en: "The results suggest that …" },
      { de: "Eine Prüfung wird zeitnah durchgeführt. → Wir prüfen bis zum 15.04.", en: "We will examine by 15 April." },
    ],
  },
];
