# Changelog

## 0.4.0 — 2026-10-11

- Jede Lernsprache hat eine Stimmenwahl, an derselben Stelle wie die Sprachen. Eine neue Installation startet mit einer Männerstimme. Wer die App schon benutzt, behält die bisherige Stimme und sieht einmal den Hinweis, dass Männerstimmen da sind.
- Deutsch thorsten (hoch und mittel), Englisch joe, Portugiesisch cadu und faber: der Datensatz ist CC0, die Stimme nicht. Die Modelle sind von lessac feinjustiert, und lessac gilt nur für Forschung. LJSpeech bleibt gemeinfrei. Vietnamesisch: zwei Sprecher aus vivos (`x_low`, CC BY-NC-SA 4.0, das Material ist verändert), zusätzlich zu vais1000 (Datensatz CC BY 4.0, ebenfalls verändert). Der Akzent der Männerstimmen ist nicht dokumentiert, die Qualität ist niedrig. Links auf die beiden Creative-Commons-Lizenzen stehen in der App und in NOTICE.txt. In beiden vivos-Ordnern liegt eine LICENSE. Die Hörproben haben eine Lizenznotiz.
- Langsam und normal bleiben eigene Dateien (`ffmpeg atempo`), mit derselben Lautstärke-Normalisierung. Piper liefert für diese Modelle keine Wortzeiten. Es gibt keine Zeitstempel-Dateien. `piper-tts` 1.8.0 und die Prüfsummen der vier Modelle stehen im Erzeugungsskript.
- Jede Stimme hat «Für offline laden», mit Fortschritt, «offline bereit», einem erneuten Versuch und einem Hinweis, wenn der Speicher voll ist. Die Startseite bietet das nur für die Lernsprache. Beim Installieren des Service Workers werden vorhandene Audiodateien in den Audio-Cache kopiert, bevor die Aktivierung alte Precache-Einträge löscht. Eine 404 lässt die übrige Stimme durch und sagt, wie viele Dateien fehlen. «Speicher voll» bietet «Erneut versuchen» und «Bisherige Stimme behalten». Der Fortschritt bleibt nach einem Neuladen sichtbar. Ein fehlender Satz sagt «Stimme offline nicht geladen». Es gibt keine Browserstimme.
- Ein Import ohne Stimmenfeld behält die Stimme auf dem Gerät. Eine unbekannte Stimmen-ID wird weggelassen. Nach dem vollständigen Laden löscht der Cache die anderen Stimmen dieser Sprache. Gespeichert wird nur Status 200. Der Cache fasst alle Audiodateien.
- Ein `due` später als `last_review` (oder jetzt) plus 36'500 Tage wird gekürzt, beim Import, beim Lesen aus IndexedDB und bei der Bewertung. `exportedAt` muss ein ISO-Zeitstempel sein. Eine Karte, die beim Lesen ersetzt wird, kann auf der Startseite als «n Karten zurückgesetzt» erscheinen.

## 0.3.1 — 2026-10-11

- Ein `last_review` kurz nach dem Export bleibt in der Datei. Er wird auf den früheren Zeitpunkt von Lernzeit, Export und jetzt gekürzt. Liegt `exportedAt` mehr als einen Tag in der Zukunft, gibt es einen eigenen Satz, die Datei wird nicht importiert.
- Eine Bewertung einer Karte mit `last_review` in der Zukunft speichert den Lernzeitpunkt als jetzt. Die Karte verschwindet nicht für Jahre.
- Karten aus IndexedDB laufen durch dasselbe Schema wie der Import. Eine ungültige Karte, etwa `stability` NaN oder ein kaputter `difficulty`- oder `state`-Wert, wird eine neue Karte und in derselben Fehlerbehandlung gespeichert. Der Planer setzt eine unleserliche Karte auf neu, nicht einen Tag weiter.

## 0.3.0 — 2026-10-11

- Sprache der App und Lernsprache sind getrennt. Dieselbe Wahl steht zu Beginn und in den Einstellungen. Die feste Paarliste und der Schalter für die Oberflächensprache sind weg. Alle zwölf Richtungen laufen aus den vorhandenen Sätzen. Fehlt eine Zeile, wird sie ausgelassen.
- Heute lernen ist eine kurze Sitzung: fällige Wiederholungen und wenige neue Sätze. Unbekannte Sätze sind nicht fällig. Höchstens 15 neue Sätze am Tag, über alle Richtungen zusammen. In einer Sitzung etwa vier, weniger wenn viele Wiederholungen warten.
- Jeder neue Satz: langsam hören, normales Tempo, nachsprechen, Bedeutung wählen, selbst sagen, dann vier Abstände vom Planer. Die Schrift der Lernsprache bleibt bei einem neuen Satz sichtbar und kommt nach der Antwort wieder, wenn sie verdeckt war. Tippen ist nicht Teil des Wegs.
- Am Ende stehen die Anzahl, ein Satz aus der Situation und was morgen kommt. Keine Punkte.
- Die fünf festen Tonbögen sind von der Satzseite weg. Die Tonhöhenkurve kommt nur nach einer Aufnahme. Eine Stimme pro Sprache, ehrlich benannt. Ein optionales `voices`-Feld bleibt für eine spätere Wahl.
- Exportformat 3 speichert `appLang` und `targetLang`. `pairId` und `uiLang` sind keine Felder mehr. Format 1 und 2 werden gelesen. Die App-Sprache wird die bisherige Ausgangssprache, die Lernsprache die bisherige Zielsprache. Karten und Lernstand bleiben. War die Oberfläche Deutsch und die Ausgangssprache eine andere, bleiben die Aufgaben bei dieser Ausgangssprache.
- Das Mikrofon stoppt, wenn der Tab versteckt wird oder die Seite zugeht, in der Übung und auf der Satzseite. «Weiter» wartet, bis die Aufnahme steht. Ein Start, der erst nach dem Schrittwechsel ankommt, gibt die Tracks sofort frei.
- Ein `last_review` in der Zukunft bringt «Heute lernen» nicht mehr zum Absturz. Der Import lehnt eine Karte ab, deren letzter Lernzeitpunkt nach dem Export liegt.
- Export und Sicherung bleiben aus, bis beide Sprachen gewählt sind. Eine Stimmen-ID ist `^[a-z0-9_-]{1,40}$`. Eine Notiz aus IndexedDB verliert Steuerzeichen ausser Zeilenumbruch und Tabulator.

## 0.2.2 — 2026-10-10

- Der Hinweis auf eine neuere Datei erscheint nur, wenn `format` eine sichere ganze Zahl über 2 ist. 2.5, `1e308`, `1e400` und der Text `"3"` bleiben ein normaler Ablehnungsfehler.
- Format 1 bleibt wie bisher. Format 2 verlangt `speed` und lehnt `slow` ab.
- `@types/react` 19.3.0 und `@types/react-dom` 19.3.0.

## 0.2.1 — 2026-10-10

- Der Export schreibt `format` 2. Der Import nimmt 1 und 2 und liest 1 wie bisher. Eine höhere Nummer sagt, die Datei stamme aus einer neueren Version, und bittet darum, die App zu aktualisieren. Unbekannte Felder bei einem bekannten Format lehnen die Datei weiter ab.

## 0.2.0 — 2026-10-10

Tempo fürs Hören, in drei festen Stufen.

- 70 %, 85 % und 100 % direkt am Player jedes Satzes. Die Wahl gilt für alles Audio und bleibt lokal, bis wieder Automatisch gewählt wird. Automatisch startet neue und unsichere Sätze bei 70 % und steigt mit dem FSRS-Zustand bis 100 %. Eine feste Stufe setzt das aus. Ein altes `slow: false` wird Automatisch, nur `slow: true` wird fest 85 %.
- Die Stufen sind eigene Dateien (`ffmpeg atempo`). Die Tonhöhe bleibt erhalten. `playbackRate` wird nicht benutzt, weil sie auf manchen Geräten, besonders iOS, die vietnamesischen Töne verbiegen kann.
- Die Hörübung prüft bekannte Karten bei Automatisch mit 100 %.
- Import: der Dialog sagt, ob die lokale Notiz bleibt oder ersetzt wird. Eine Datei ohne das Feld `personalNote` wird ganz abgelehnt.
- Dependabot prüft npm und GitHub Actions wöchentlich und wartet sieben Tage, bevor eine neue Version einen Pull Request bekommt.

## 0.1.0 — 2026-10-10

Erste Fassung für eine Familie, offline, ohne Konto.

- Sprachpaare: Deutsch nach Vietnamesisch, Portugiesisch (Brasilien) in beide Richtungen mit Deutsch, Englisch und Vietnamesisch.
- Situationen für die ganze Reise. Ausgearbeitet: Notfall und Menschen treffen. Kleinere Sätze: Ankunft und Restaurant. Kurze Anfänge: Visum, Unterkunft, Einkaufen, Sehenswürdigkeiten, Alltag.
- Üben mit FSRS, Hören, Abrufen, eigener Aufnahme und Tonhöhenkurve für Vietnamesisch.
- Zeigen-Modus für den Notfall, grosse Schrift, offline nach dem ersten Laden.
- Kulturhinweise mit Quellen, noch nicht muttersprachlich geprüft.
- Lernstand lokal, Export und Import als geprüftes JSON.
- Audio: Piper-Dateien im Repo, Browserstimme nur als Ausweg. Vietnamesisch ist eine nördliche Stimme.
- Vor dem Merge: Mikrofon stoppt beim Verlassen der Satzseite. Import und Löschen fragen nach. Unbekannte Karten werden ausgelassen. Die Notiz kommt nur mit Haken in den Export. Einstellungen nennen Stimmen und Lizenzen.
- Build mit Rsbuild statt Vite. Offline-Cache über Workbox (`workbox-build`), Scope `/Travel-Talk/`. Tests bleiben bei Vitest.
