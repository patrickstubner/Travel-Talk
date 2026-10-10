# Changelog

## 0.2.0 — 2026-10-10

Tempo fürs Hören, in drei festen Stufen.

- 70 %, 85 % und 100 % direkt am Player jedes Satzes. Die Wahl gilt für alles Audio der Sitzung und bleibt lokal. Automatisch startet neue und unsichere Sätze bei 70 % und steigt mit dem FSRS-Zustand bis 100 %. Eine feste Stufe setzt das aus.
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
