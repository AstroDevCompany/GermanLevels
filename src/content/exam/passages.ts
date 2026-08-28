import type { LevelId, Reading } from "@/content/types";
import { q, reading } from "@/content/helpers";
import { hashString } from "@/lib/german";

const PASSAGES: Record<LevelId, Reading[]> = {
  a1: [
    reading(
      "A small flat in Berlin",
      "Eine kleine Wohnung",
      "Hallo! Ich heiße Mira. Ich wohne in Berlin, in einer kleinen Wohnung. Die Küche ist klein, aber das Zimmer ist hell. Am Morgen trinke ich Kaffee. Dann gehe ich zur Arbeit. Ich arbeite in einem Café in der Stadt. Viele Leute kommen um acht Uhr. Sie bestellen Brot, Tee oder einen Apfelsaft. Am Abend koche ich zu Hause. Heute esse ich Nudeln. Meine Freundin Anna kommt um sieben. Wir sprechen Deutsch und ein bisschen Englisch. Das macht Spaß, und ich bin nicht müde.",
      "Hello! My name is Mira. I live in Berlin, in a small flat. The kitchen is small, but the room is bright. In the morning I drink coffee. Then I go to work. I work in a café in town. Many people come at eight. They order bread, tea or an apple juice. In the evening I cook at home. Today I eat pasta. My friend Anna comes at seven. We speak German and a little English. That is fun, and I am not tired.",
      [
        q("Wo wohnt Mira?", "In Berlin", ["In Hamburg", "In Berlin", "Im Café", "Bei Anna"]),
        q("Wann kommen viele Leute ins Café?", "Um acht Uhr", ["Um sieben Uhr", "Am Abend", "Um acht Uhr", "Nie"]),
        q("Was macht Mira am Abend?", "Sie kocht zu Hause", ["Sie fährt nach Hamburg", "Sie kocht zu Hause", "Sie schläft im Café", "Sie lernt nur Englisch"]),
        q("Wer kommt um sieben?", "Anna", ["Der Chef", "Anna", "Niemand", "Viele Leute"]),
      ],
    ),
    reading(
      "At the doctor",
      "Beim Arzt",
      "Guten Tag, Herr Klein. Ich bin krank. Der Kopf tut weh, und ich habe Husten. Ich arbeite nicht heute. Bitte geben Sie mir eine Tablette. Der Arzt sagt: Trinken Sie Tee und bleiben Sie im Bett. Morgen kommen Sie wieder, wenn es nicht besser ist. Die Praxis ist von neun bis zwölf Uhr offen. Ich nehme den Bus nach Hause und kaufe noch Orangensaft im Supermarkt.",
      "Good day, Mr Klein. I am ill. My head hurts and I have a cough. I am not working today. Please give me a tablet. The doctor says: drink tea and stay in bed. Come again tomorrow if it is not better. The practice is open from nine to twelve. I take the bus home and also buy orange juice at the supermarket.",
      [
        q("Was hat Herr Klein?", "Kopfschmerzen und Husten", ["Nur Hunger", "Kopfschmerzen und Husten", "Keine Zeit", "Eine Prüfung"]),
        q("Was soll er trinken?", "Tee", ["Kaffee", "Tee", "Bier", "Milch nur"]),
        q("Wann ist die Praxis offen?", "Von neun bis zwölf", ["Nur am Abend", "Von neun bis zwölf", "Sonntags", "Um acht im Café"]),
      ],
    ),
    reading(
      "A note on the door",
      "Ein Zettel an der Tür",
      "Liebe Nachbarn, wir machen am Samstag ein Fest in der Wohnung. Es gibt Kuchen und Musik. Bitte klingeln Sie um 18 Uhr. Der Eingang ist hinten, nicht vorne. Parken Sie nicht vor der Tür. Danke und bis bald! Familie Rossi, zweite Etage. Wenn Sie nicht kommen können, schreiben Sie uns eine kurze Nachricht.",
      "Dear neighbours, we are having a party in the flat on Saturday. There is cake and music. Please ring at 6 p.m. The entrance is at the back, not at the front. Do not park in front of the door. Thanks and see you soon! Rossi family, second floor. If you cannot come, write us a short message.",
      [
        q("Wann ist das Fest?", "Am Samstag", ["Am Montag", "Am Samstag", "Um zwölf in der Praxis", "Nie"]),
        q("Wo ist der Eingang?", "Hinten", ["Vorne", "Hinten", "Im Bus", "Im Café"]),
        q("Was sollen Gäste nicht tun?", "Vor der Tür parken", ["Kuchen essen", "Klingeln", "Vor der Tür parken", "Schreiben"]),
      ],
    ),
  ],
  a2: [
    reading(
      "A weekend train trip",
      "Eine Zugfahrt am Wochenende",
      "Am Samstag fahre ich mit dem Regionalzug nach Leipzig. Ich habe schon eine Fahrkarte am Automaten gekauft. Der Zug fährt um 9:14 ab und kommt um 10:50 an. Ich sitze am Fenster und lese. In Leipzig treffe ich meinen Cousin. Wir wollen durch die Altstadt laufen und später in einem kleinen Restaurant essen. Das Wetter soll freundlich sein, aber ich nehme trotzdem eine Jacke mit. Sonntag fahre ich zurück, weil ich am Montag früh arbeiten muss. Wenn der Zug Verspätung hat, schreibe ich dir eine Nachricht.",
      "On Saturday I take the regional train to Leipzig. I already bought a ticket at the machine. The train leaves at 9:14 and arrives at 10:50. I sit by the window and read. In Leipzig I meet my cousin. We want to walk through the old town and later eat in a small restaurant. The weather should be fair, but I still take a jacket. Sunday I travel back because I have to work early on Monday. If the train is late, I will text you.",
      [
        q("Wohin fährt die Person am Samstag?", "Nach Leipzig", ["Nach Berlin", "Nach Leipzig", "Zur Arbeit", "Ins Büro"]),
        q("Warum fährt sie sonntags zurück?", "Weil sie montags arbeiten muss", ["Weil das Wetter schlecht ist", "Weil sie montags arbeiten muss", "Weil der Cousin krank ist", "Weil die Fahrkarte teuer war"]),
        q("Was macht sie bei Verspätung?", "Sie schreibt eine Nachricht", ["Sie bleibt in Leipzig", "Sie schreibt eine Nachricht", "Sie kauft keine Jacke", "Sie nimmt das Auto"]),
      ],
    ),
    reading(
      "A message to the landlord",
      "Eine Nachricht an den Vermieter",
      "Guten Tag, Herr Berger, in der Küche tropft der Wasserhahn seit Dienstag. Ich habe schon ein Handtuch daruntergelegt, aber das hilft nicht lange. Könnten Sie bitte diese Woche einen Klempner schicken? Ich bin nach 17 Uhr zu Hause. Die Heizung im Bad ist auch schwach. Ansonsten ist die Wohnung in Ordnung. Vielen Dank und freundliche Grüße, Lea Hofmann, Wohnung 12.",
      "Good day, Mr Berger, the kitchen tap has been dripping since Tuesday. I have already put a towel underneath but that does not help for long. Could you please send a plumber this week? I am home after 5 p.m. The heating in the bathroom is also weak. Otherwise the flat is fine. Many thanks and kind regards, Lea Hofmann, flat 12.",
      [
        q("Was ist kaputt?", "Der Wasserhahn tropft", ["Das Fenster", "Der Wasserhahn tropft", "Die Tür", "Der Aufzug"]),
        q("Wann ist Lea zu Hause?", "Nach 17 Uhr", ["Morgens nur", "Nach 17 Uhr", "Nie", "Nur sonntags"]),
        q("Was ist noch schwach?", "Die Heizung im Bad", ["Das Licht in der Küche", "Die Heizung im Bad", "Das WLAN", "Der Nachbar"]),
      ],
    ),
    reading(
      "After a cold",
      "Nach einer Erkältung",
      "Gestern war ich noch im Bett. Heute geht es mir besser, aber ich bleibe zu Hause. Der Arzt hat gesagt, ich soll viel trinken und nicht zum Sport gehen. Ich habe Hustentee gekauft und rufe später meine Kollegin an. Wir müssen einen Termin mit einem Kunden verschieben. Zum Glück ist die Präsentation erst nächsten Mittwoch. Wenn ich mich übermorgen gut fühle, komme ich wieder ins Büro. Bitte sag dem Team Bescheid.",
      "Yesterday I was still in bed. Today I feel better but I am staying home. The doctor said I should drink a lot and not go to sport. I bought cough tea and will call my colleague later. We have to postpone an appointment with a client. Luckily the presentation is only next Wednesday. If I feel well the day after tomorrow, I will come back to the office. Please tell the team.",
      [
        q("Warum bleibt die Person zu Hause?", "Nach einer Erkältung, auf Rat des Arztes", ["Urlaub", "Nach einer Erkältung, auf Rat des Arztes", "Kein Zug", "Umzug"]),
        q("Was muss verschoben werden?", "Ein Termin mit einem Kunden", ["Der Sportkurs für immer", "Ein Termin mit einem Kunden", "Der Umzug", "Die Miete"]),
        q("Wann ist die Präsentation?", "Nächsten Mittwoch", ["Heute", "Gestern", "Nächsten Mittwoch", "Übermorgen früh"]),
      ],
    ),
  ],
  b1: [
    reading(
      "Home office or office?",
      "Homeoffice oder Büro?",
      "Viele Firmen erlauben zwei Tage Homeoffice pro Woche. Manche Beschäftigten arbeiten gerne ruhig zu Hause, andere vermissen den kurzen Austausch an der Kaffeemaschine. Eine Umfrage in drei Betrieben zeigt: Wer kleine Kinder hat, spart Wegzeit und ist weniger gestresst. Wer allein lebt, fühlt sich nach drei Tagen am Schreibtisch im Wohnzimmer oft abgeschnitten. Deshalb reicht eine Regel für alle nicht. Besser ist ein Teamplan: Wer wann kommt, steht in einem gemeinsamen Kalender. Wichtig bleibt, dass Meetings klare Ziele haben. Sonst sitzen zwölf Leute in einem Videocall und niemand entscheidet. Ich finde, dass Präsenz sinnvoll ist, wenn man etwas gemeinsam entwickeln muss. Für stilles Schreiben reicht das Homeoffice. Was meint ihr?",
      "Many companies allow two days of home office a week. Some staff like working quietly at home; others miss the short exchange at the coffee machine. A survey in three firms shows: people with small children save commuting time and feel less stressed. People who live alone often feel cut off after three days at a desk in the living room. So one rule for everyone is not enough. A team plan is better: who comes when is in a shared calendar. Meetings still need clear goals. Otherwise twelve people sit in a video call and nobody decides. I think being on site makes sense when you have to develop something together. Quiet writing works from home. What do you think?",
      [
        q("Was zeigt die Umfrage zu Eltern?", "Weniger Stress durch gesparte Wegzeit", ["Mehr Meetings", "Weniger Stress durch gesparte Wegzeit", "Kein Homeoffice", "Längere Wege"]),
        q("Warum reicht eine Regel für alle nicht?", "Alleinlebende und Eltern haben andere Bedürfnisse", ["Der Kalender ist kaputt", "Alleinlebende und Eltern haben andere Bedürfnisse", "Es gibt keine Firmen", "Kaffee ist teuer"]),
        q("Wann ist Präsenz laut Text sinnvoll?", "Wenn man etwas gemeinsam entwickeln muss", ["Immer", "Nie", "Wenn man etwas gemeinsam entwickeln muss", "Nur am Wochenende"]),
        q("Was sollen Meetings haben?", "Klare Ziele", ["Zwölf Personen", "Klare Ziele", "Keine Kamera", "Längere Pausen"]),
      ],
    ),
    reading(
      "A complaint about a course",
      "Eine Beschwerde über einen Kurs",
      "Sehr geehrte Damen und Herren, am 3. März habe ich den Abendkurs „Deutsch am Arbeitsplatz“ gebucht, Kursnummer 8821. In der Werbung stand: maximal 12 Teilnehmende, Unterricht von 18:00 bis 20:30. In der ersten Woche waren 19 Personen im Raum, und wir haben um 18:20 begonnen, weil der Beamer nicht funktionierte. Ich möchte, dass Sie die Gruppengröße einhalten oder mir die Gebühr für zwei Abende erstatten. Als Nachweis lege ich die Anmeldebestätigung bei. Bitte antworten Sie bis zum 20. März. Mit freundlichen Grüßen, S. Krüger.",
      "Dear Sir or Madam, on 3 March I booked the evening course “German at work”, course number 8821. The advert said: max. 12 participants, class from 18:00 to 20:30. In the first week 19 people were in the room, and we started at 18:20 because the projector did not work. I want you to keep the group size or refund the fee for two evenings. I enclose the booking confirmation as proof. Please reply by 20 March. Yours sincerely, S. Krüger.",
      [
        q("Was war in der Werbung versprochen?", "Höchstens 12 Teilnehmende", ["19 Teilnehmende", "Höchstens 12 Teilnehmende", "Unterricht um 18:20", "Kein Beamer"]),
        q("Was fordert S. Krüger?", "Gruppengröße einhalten oder Gebühr erstatten", ["Einen neuen Beamer kaufen", "Gruppengröße einhalten oder Gebühr erstatten", "Den Kurs streichen", "Längere Pausen"]),
        q("Bis wann wird eine Antwort erwartet?", "Bis zum 20. März", ["Sofort heute", "Bis zum 20. März", "Im Sommer", "Nie"]),
      ],
    ),
    reading(
      "Sorting waste at work",
      "Mülltrennung im Büro",
      "Seit Januar stehen auf jeder Etage drei Tonnen: Papier, Verpackung, Restmüll. Trotzdem landet oft eine Brotdose im Papiermüll. Das kostet die Firma extra, weil der Dienstleister falsch sortierte Säcke nicht mitnimmt. Die Hausverwaltung schlägt kurze Schilder direkt über den Tonnen vor, nicht einen langen Text per E-Mail. Ich halte das für sinnvoll, weil niemand in der Pause eine Richtlinie liest. Wer unsicher ist, kann den Restmüll nutzen. Perfekt muss es nicht sein, aber klarer als jetzt. Wenn das nach vier Wochen nicht klappt, sollten wir die Tonnen näher an die Teeküche stellen.",
      "Since January there are three bins on each floor: paper, packaging, residual waste. Still, a lunch box often ends up in the paper bin. That costs the company extra because the contractor will not take wrongly sorted bags. Facilities suggest short signs right above the bins, not a long email. I think that is sensible because nobody reads a policy in the break. If you are unsure, use residual waste. It does not have to be perfect, but clearer than now. If it still fails after four weeks, we should move the bins closer to the kitchenette.",
      [
        q("Warum entstehen Extra-Kosten?", "Falsch sortierte Säcke werden nicht mitgenommen", ["Zu viele E-Mails", "Falsch sortierte Säcke werden nicht mitgenommen", "Keine Tonnen", "Zu kurze Pausen"]),
        q("Was schlägt die Hausverwaltung vor?", "Kurze Schilder über den Tonnen", ["Eine neue Richtlinie per Post", "Kurze Schilder über den Tonnen", "Keine Tonnen mehr", "Längere E-Mails"]),
        q("Was tun, wenn man unsicher ist?", "Restmüll nutzen", ["Alles ins Papier", "Restmüll nutzen", "Nach Hause nehmen", "Den Dienstleister anrufen"]),
      ],
    ),
  ],
  b2: [
    reading(
      "Housing costs and young workers",
      "Wohnkosten und Berufseinsteiger",
      "In mehreren Großstädten übersteigt die Miete für eine Einzimmerwohnung inzwischen ein Drittel eines Einstiegsgehalts. Wer neu in den Beruf kommt, teilt sich deshalb häufiger eine WG, auch jenseits der Studienzeit. Kommunen werben mit Wohnberechtigungsscheinen, doch die Wartelisten sind lang. Arbeitgeber experimentieren mit befristeten Wohnzuschüssen. Das entlastet den Monat, ändert aber nichts an knappen Beständen. Ein Gutachten im Auftrag eines Mietervereins warnt davor, das Problem nur als individuelles Sparversagen zu erzählen. Viele zahlen bereits wenig für Freizeit. Wer Wohnen als Standortfaktor behandelt, muss Flächen und Genehmigungen nennen, nicht nur Appelle an junge Leute, „flexibler“ zu werden. Flexibel ist, wer drei Stunden pendelt — nicht, wer eine Wohnung findet.",
      "In several large cities the rent for a one-room flat now exceeds a third of a starting salary. People entering work therefore share flats more often, even after studying. Cities advertise housing-entitlement certificates, but waiting lists are long. Employers are trying temporary housing allowances. That eases the month but does not change scarce stock. A report for a tenants’ association warns against telling the story only as individual failure to save. Many already spend little on leisure. Anyone who treats housing as a location factor must name land and permits, not just appeals for young people to become “more flexible”. Flexible is the person who commutes three hours — not the one who finds a flat.",
      [
        q("Welchen Anteil am Einstiegsgehalt kann die Miete übersteigen?", "Ein Drittel", ["Ein Zehntel", "Ein Drittel", "Die Hälfte immer", "Nichts"]),
        q("Was leisten Wohnzuschüsse der Arbeitgeber?", "Sie entlasten den Monat, nicht den Bestand", ["Sie bauen Wohnungen", "Sie entlasten den Monat, nicht den Bestand", "Sie verkürzen Wartelisten gesetzlich", "Sie ersetzen WGs"]),
        q("Wovor warnt das Gutachten?", "Das Problem nur als Sparversagen zu erzählen", ["Zu viele WGs", "Das Problem nur als Sparversagen zu erzählen", "Zu hohe Freizeitkosten aller", "Keine Pendler"]),
        q("Was muss genannt werden, wenn Wohnen ein Standortfaktor ist?", "Flächen und Genehmigungen", ["Nur Flexibilität", "Flächen und Genehmigungen", "Längere Arbeitszeiten", "Weniger Gehalt"]),
      ],
    ),
    reading(
      "Health apps and data",
      "Gesundheits-Apps und Daten",
      "Schrittzähler und Schlafprotokolle wirken harmlos. Sobald die App ein Konto verlangt, entsteht ein Datensatz über Rhythmus, Ort und oft Puls. Anbieter versprechen Anonymisierung, bleiben aber vage, welche Partner Zugriff haben. Für Beschäftigte wird das heikel, wenn Firmen „Freiwillige Wellness-Programme“ anbieten und Prämien an Nutzungsdaten knüpfen. Formal ist die Teilnahme frei. Praktisch entsteht Druck, sobald das Team die Rangliste sieht. Datenschützer fordern, Gesundheitsdaten vom direkten Vorgesetzten zu trennen und Widerspruch ohne Nachteile zu garantieren. Technisch ist das lösbar. Organisatorisch fehlt oft der Wille, weil die Zahlen in Präsentationen gut aussehen. Wer die App nutzt, sollte die Berechtigungen prüfen: Standort im Hintergrund ist für Schritte selten nötig.",
      "Step counters and sleep logs look harmless. Once the app requires an account, a dataset of rhythm, place and often pulse appears. Providers promise anonymisation but stay vague about which partners have access. This gets sensitive for staff when firms offer “voluntary wellness programmes” and tie bonuses to usage data. Formally, joining is free. In practice pressure appears as soon as the team sees the ranking. Data-protection officers want health data kept from the direct manager and a right to object without disadvantage. Technically this is solvable. Organisationally the will is often missing because the figures look good in presentations. Anyone using the app should check permissions: background location is rarely needed for steps.",
      [
        q("Wann entsteht ein Datensatz?", "Sobald ein Konto verlangt wird", ["Nur im Krankenhaus", "Sobald ein Konto verlangt wird", "Nie bei Schlafprotokollen", "Erst nach fünf Jahren"]),
        q("Warum ist „freiwillig“ praktisch oft ungenau?", "Weil Ranglisten sozialen Druck erzeugen", ["Weil Apps illegal sind", "Weil Ranglisten sozialen Druck erzeugen", "Weil es keine Prämien gibt", "Weil Schritte unmöglich sind"]),
        q("Was fordern Datenschützer?", "Trennung vom Vorgesetzten und Widerspruch ohne Nachteil", ["Mehr Ranglisten", "Trennung vom Vorgesetzten und Widerspruch ohne Nachteil", "Standort immer an", "Keine Wellness-Angebote gesetzlich"]),
      ],
    ),
    reading(
      "Plastic packaging in supermarkets",
      "Plastikverpackung im Supermarkt",
      "Unverpackt-Regale wachsen, bleiben aber Nischen. Für Familien mit knappem Feierabend ist lose Ware teurer in der Zeit: abwiegen, beschriften, schleppen. Der größere Hebel sitzt bei den Ketten, die Eigenmarken in Mehrweg oder Papier umstellen könnten, ohne den ganzen Einkauf zur Mission zu machen. Eine Studie im Auftrag des Umweltbundesamts legt nahe, dass sichtbare Preise für Einwegplastik das Verhalten stärker ändern als Appelle an „Bewusstsein“. Gegner warnen vor höheren Preisen für Haushalte mit wenig Geld. Der Einwand zählt. Er begründet aber nicht, warum ausgerechnet die teuerste, wegwerfbare Lösung die Voreinstellung bleibt. Wer entlasten will, subventioniert Mehrwegpfand, nicht die Folie um die Gurke.",
      "Unpackaged shelves are growing but remain niches. For families with a tight evening, loose goods cost more in time: weigh, label, carry. The bigger lever sits with chains that could switch own brands to reuse or paper without turning the whole shop into a mission. A study for the environment agency suggests visible prices for single-use plastic change behaviour more than appeals to “awareness”. Opponents warn of higher prices for low-income households. The objection counts. It does not explain why the most expensive, disposable option remains the default. Anyone who wants to ease the load subsidises reuse deposits, not the film around the cucumber.",
      [
        q("Warum bleiben Unverpackt-Regale Nischen?", "Sie kosten Feierabendzeit", ["Sie sind illegal", "Sie kosten Feierabendzeit", "Es gibt keine Gurken", "Ketten verbieten Papier"]),
        q("Was ändert Verhalten laut Studie stärker?", "Sichtbare Preise für Einwegplastik", ["Mehr Appelle", "Sichtbare Preise für Einwegplastik", "Längere Öffnungszeiten", "Keine Eigenmarken"]),
        q("Was soll subventioniert werden, wenn Entlastung das Ziel ist?", "Mehrwegpfand", ["Folie um die Gurke", "Mehrwegpfand", "Längere Werbespots", "Weniger Löhne"]),
      ],
    ),
  ],
  c1: [
    reading(
      "Language in job interviews",
      "Sprache im Vorstellungsgespräch",
      "Bewerberinnen mit nicht deutscher Erstsprache berichten, dass Korrektheit oft höher gewichtet wird als fachliche Passung, sobald das Gespräch vom Skript abweicht. Personalverantwortliche widersprechen: Unklare Antworten seien ein Risiko in regulierten Berufen. Beide Beobachtungen können zugleich zutreffen. Wer nur Grammatikfehler zählt, misst nicht Kommunikationsfähigkeit im Team. Wer jede Abweichung als Diskriminierung rahmt, unterschätzt Dokumentationspflichten. Anschlussfähig wäre eine getrennte Bewertung: Fachinhalt, Verständlichkeit für Kolleginnen, formale Korrektheit in Schriftstücken. Die Reichweite solcher Raster bleibt fallspezifisch — ein Laborprotokoll ist nicht dasselbe wie ein Vertriebstermin. Gleichwohl legt die Forschung nahe, dass ungeschulte Interviewer den Akzent als Proxy für Kompetenz nutzen. Schulung kostet. Unschulung kostet Fehlbesetzungen.",
      "Applicants whose first language is not German report that correctness is often weighted above professional fit once the interview leaves the script. HR officers object: unclear answers are a risk in regulated jobs. Both observations can be true at once. Anyone who only counts grammar errors is not measuring team communication. Anyone who frames every deviation as discrimination underestimates documentation duties. A split score would be connectable: subject matter, intelligibility for colleagues, formal correctness in writing. The scope of such grids stays case-specific — a lab protocol is not a sales meeting. Still, research suggests untrained interviewers use accent as a proxy for competence. Training costs. Not training costs bad hires.",
      [
        q("Was wird laut Bewerberinnen oft übergewichtet?", "Sprachliche Korrektheit gegenüber fachlicher Passung", ["Nur das Gehalt", "Sprachliche Korrektheit gegenüber fachlicher Passung", "Die Pause", "Der Dresscode allein"]),
        q("Warum ist eine einzige Note unscharf?", "Laborprotokoll und Vertrieb verlangen anderes", ["Es gibt keine Interviews", "Laborprotokoll und Vertrieb verlangen anderes", "Akzente sind illegal", "HR darf nicht schulen"]),
        q("Wozu dient der Akzent ungeschult oft?", "Als Proxy für Kompetenz", ["Als Beweis für Studium", "Als Proxy für Kompetenz", "Als Messwert für Gehalt", "Als Ersatz für Zeugnisse"]),
      ],
    ),
    reading(
      "Continuing education at work",
      "Weiterbildung im Betrieb",
      "Betriebliche Weiterbildung wird in Broschüren als Aufstieg versprochen und in Kalendern als Restgröße behandelt. Sobald Auftragsspitzen kommen, fallen Seminare zuerst. Formal bleibt das Angebot bestehen; faktisch lernen diejenigen, deren Vertretung geregelt ist. Das benachteiligt Teilzeit und Schicht. Eine Untersuchung in mittelständischen Betrieben legt nahe, dass Teilnahmequote und Hierarchie korrelieren, nicht Motivation. Wer Weiterbildung als Standortargument nutzt, müsste Vertretung budgetieren, nicht nur Plattformlizenzen. Andernfalls bleibt der Satz „Wir investieren in Menschen“ deskriptiv leer. Ein Einwand lautet, kleine Teams könnten niemanden freistellen. Der Einwand ist ernst. Er begründet jedoch nicht, warum Lernzeit ausschließlich in den Feierabend der Beschäftigten verschoben wird. Anschlussfähig wäre ein Stundenkonto, das Weiterbildung wie Bereitschaft behandelt: planbar, begrenzt, sichtbar.",
      "Company training is promised as advancement in brochures and treated as a leftover in calendars. When order peaks arrive, seminars are cut first. Formally the offer remains; in fact those whose cover is organised are the ones who learn. That disadvantages part-time and shift work. A study in mid-sized firms suggests participation correlates with hierarchy, not motivation. Anyone using training as a location argument would have to budget cover, not just platform licences. Otherwise “we invest in people” stays descriptively empty. An objection is that small teams cannot free anyone. The objection is serious. It does not explain why learning time is shifted only into employees’ evenings. A hours account that treats training like on-call time — planned, capped, visible — would be connectable.",
      [
        q("Wer lernt faktisch?", "Wer eine geregelte Vertretung hat", ["Alle gleich", "Wer eine geregelte Vertretung hat", "Nur Externe", "Niemand in Teilzeit laut Gesetz"]),
        q("Womit korreliert die Teilnahme laut Untersuchung?", "Mit Hierarchie, nicht Motivation", ["Mit Alter allein", "Mit Hierarchie, nicht Motivation", "Mit der Kantine", "Mit der App-Farbe"]),
        q("Was fehlt, wenn nur Lizenzen gekauft werden?", "Budget für Vertretung", ["Broschüren", "Budget für Vertretung", "Mehr Feierabendpflicht", "Weniger Schicht"]),
      ],
    ),
    reading(
      "Public language and panic",
      "Amtssprache und Panik",
      "Behördenentwürfe bevorzugen Nominalgruppen, weil sie Verantwortung in der Syntax verteilen. „Es erfolgt eine Prüfung“ sagt nicht, wer prüft und bis wann. In der Krise wird dieser Stil gefährlich: Bürgerinnen hören Verfahren, wo sie eine Frist brauchen. Journalismus, der den Nominalstil 1:1 übernimmt, verdoppelt die Unschärfe. Umgekehrt erzeugt reißerische Verbalität („Chaos“, „Kollaps“) Aufmerksamkeit ohne handhabbare nächste Handlung. C1-öffentliche Sprache hätte beides zu leisten: Agenten nennen, Zeit nennen, Unsicherheit als Unsicherheit markieren. Das ist keine Stilübung. Es ist die Bedingung dafür, dass Anweisungen befolgt werden können, ohne dass Panik die einzige klare Botschaft bleibt.",
      "Drafts from authorities prefer noun phrases because they spread responsibility through syntax. “An examination will take place” does not say who examines or by when. In a crisis this style becomes dangerous: citizens hear procedure where they need a deadline. Journalism that copies the nominal style one-to-one doubles the blur. Conversely, sensational verbs (“chaos”, “collapse”) get attention without a usable next action. Public language at C1 would have to do both: name agents, name time, mark uncertainty as uncertainty. That is not a style drill. It is the condition for instructions that can be followed without panic remaining the only clear message.",
      [
        q("Was verschweigt „Es erfolgt eine Prüfung“?", "Wer prüft und bis wann", ["Die Sprache", "Wer prüft und bis wann", "Dass geprüft wird", "Das Datum des Briefs immer"]),
        q("Was verdoppelt Unschärfe?", "Journalismus, der den Nominalstil kopiert", ["Zu kurze Sätze", "Journalismus, der den Nominalstil kopiert", "Zu viele Zahlen", "Mündliche Sprache"]),
        q("Was soll öffentliche Sprache in der Krise leisten?", "Agent, Zeit, markierte Unsicherheit", ["Nur mehr Adjektive", "Agent, Zeit, markierte Unsicherheit", "Längere Nominalgruppen", "Keine Fristen"]),
      ],
    ),
  ],
};

export function examPassages(level: LevelId): Reading[] {
  return PASSAGES[level];
}

export function examPassageFor(level: LevelId, seed: string): Reading {
  const list = PASSAGES[level];
  return list[hashString(seed) % list.length] ?? list[0];
}
