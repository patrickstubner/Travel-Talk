# AGENTS.md – Travel Talk

## Projekt
- Zweck: Reise-Sprachhilfe als Offline-PWA. Kurze Sätze hören, verstehen, nachsprechen. Mehrere Profile auf einem Gerät, Lernstand nur lokal.
- **Nur Frontend:** kein Backend, kein Konto, kein Tracking, keine Uploads. Mikrofon nur nach Tippen. Neue Server oder Dienste nur mit Patricks Ja.
- Stack: React 19, TypeScript, Rsbuild, React Router (Hash-Router), Dexie (IndexedDB), zod, ts-fsrs, pitchy, Workbox (`workbox-build` nach dem Build). Tests: Vitest (happy-dom, fake-indexeddb), Playwright. ESLint.
- Node 22 (`engines: >=22`, CI mit Node 22).
- Architektur: ARCHITECTURE.md. Stand und Plan: STATUS.md. Audio: docs/audio.md. Sicherheit: docs/SECURITY.md.

## Befehle (aus package.json und .github/workflows/ci.yml)
| Zweck | Befehl |
|---|---|
| Installieren | `npm ci` (CI: `npm ci --ignore-scripts`) |
| Entwickeln | `npm run dev` (http://127.0.0.1:5173/Travel-Talk/) |
| Lint | `npm run lint` |
| Typen | `npm run typecheck` |
| Unit-Tests | `npm test` |
| Audio-Clips | `npm run test:clips` (braucht ffmpeg, in CI je Sprache de/en/pt-BR/vi) |
| Layout (Playwright) | `npx playwright install --with-deps chromium`, `npm run build`, dann `npm run test:overflow` |
| Build | `npm run build` |
| Audit | `npm audit --audit-level=moderate` (CI bricht ab moderate ab) |

Pflicht-Checks auf `main` (Ruleset): lint, typecheck, test, build, audit. CI läuft bei jedem Pull Request, Deploy auf GitHub Pages nur beim Push auf `main`.

## Projektregeln
- Neue Sprache = Inhalt + Audio + Registry-Eintrag, keine neuen Seiten. RTL-fähig bleiben (logische CSS-Eigenschaften).
- Sprache der App und Lernsprache sind zwei Wahlen, pro Profil.
- Tempo: Standard 100 %, Automatik als Option.
- Inhalte (content/) sind Daten: Beispielnamen erfunden, keine echten Personendaten, Kulturhinweise mit `https`-Quelle.
- Testdaten ohne echte Personendaten.

## Arbeitsregeln für Agents

### Vor dem Start
- Vor jedem Cloud-Agent-Start AGENTS.md, ARCHITECTURE.md und STATUS.md lesen. Sie müssen aktuell sein. Fehlt etwas oder ist es unklar: zuerst konkret nachfragen, keinen Cloud Agent starten.
- Zuerst lokal arbeiten, mit den lokalen Tools. Für neue Features oder grössere Umbauten zuerst einen klickbaren Prototyp und eine klare Spezifikation, erst dann einen Cloud Agent.
- Kontext schlank halten: Struktur-Fragen mit den Tools unten beantworten statt ganze Dateien zu lesen. STATUS.md nach jedem Arbeitspaket nachführen.
- Pro grösserem Paket in STATUS.md festhalten: welche lokalen Tools genutzt wurden, wie viel Cloud-Agent-Nutzung das vermieden hat, Rückmeldung zu den Tools.
- Keine Werte erfinden. Was nicht belegt ist, steht als «offen» da.

### Lokale Tools (gemeinsamer Rechner, Anleitung `dev-tools/README.md`)
- codebase-memory-mcp, Standard für «wer ruft X»: `cbm index <pfad>`, dann `cbm callers <projekt> <Symbol> 2`, `cbm get_architecture '{"project":"<projekt>"}'`
- codegraph, wenn Code und Aufrufpfade gebraucht werden: `codegraph explore "<Frage>"`
- Serena für exakte Referenzen (nur eigene Repos): `serena-repl . 's.lsp.find_referencing_symbols("<Symbol>","<Datei>")'`
- ast-grep für Muster: `ast-grep run -p '<Muster>' -l tsx src`
- `rg` für einfache Zeilensuchen
- Graphify: für GitHub-Repos den Connector. Die lokale CLI nur für ungepushten Code und immer mit `--code-only` bzw. `--no-label`, sonst ruft sie ein LLM auf (Kosten, Code verlässt den Rechner).
- Index-Ordner `.codegraph/`, `graphify-out/` und `.serena/` nie committen, sie stehen in `.gitignore`.

### Sicherheit (Dauerregel)
- Nach jeder Code-Erstellung oder -Änderung eine detaillierte Sicherheitsprüfung: Eingabevalidierung, Injection, Geheimnisse und Zugangsdaten, Berechtigungen, Abhängigkeiten inklusive indirekter, CDN und GitHub Actions auf bekannte Schwachstellen, Fehlermeldungen mit sensiblen Daten, Angriffsflächen. Ergebnis mit Schweregrad und Fix-Vorschlag im PR.
- Verwundbare Libraries auf die nächste sichere Version heben. Bei einem grossen oder brechenden Sprung (Major) vorher Patrick fragen.
- Updates und offene Risiken in docs/SECURITY.md nachführen.
- Keine Geheimnisse und keine personenbezogenen Daten ins Repo (das Repo ist öffentlich).

### Prüfung und Merge
- Jede Code-Änderung, jeder Merge und jedes Update (auch grüne Dependabot-PRs) wird von Stabschef unabhängig geprüft (Entscheid Patrick, 16.11.2026).
- Vor jedem Merge oder Push auf `main` den Head-SHA an Stabschef geben und auf das Ok warten. Merge nur mit ausdrücklichem Ok von Patrick.
- Keine bezahlten Dienste und kein On-Demand ohne Patricks Ja.
- Merge immer als Squash-Merge mit `--match-head-commit <SHA>`. Autor und Committer nur mit der GitHub-noreply-Adresse des Repo-Kontos.
- Für Travel Talk gilt zusätzlich die gespeicherte Travel-Talk-Merge-Regel, auch für G1–G4 und R7 (ohne extra Vorschau, Entscheid Patrick 13.11.2026).
