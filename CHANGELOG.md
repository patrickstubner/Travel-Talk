# Changelog

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
