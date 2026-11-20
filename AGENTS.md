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

## Cursor Cloud specific instructions

Cloud Agents starten in einer eigenen Ubuntu-VM, ohne den gemeinsamen Rechner. Diese Hinweise gelten nur dort.

### Zuerst lesen
- AGENTS.md, ARCHITECTURE.md und STATUS.md, in dieser Reihenfolge.
- Sind sie unklar oder nicht aktuell: konkret nachfragen, nicht raten.

### Werkzeuge in dieser Umgebung
Das Install-Skript `.cursor/install-dev-tools.sh` legt im Build bereit:
- `rg` (ripgrep 14.1.1) für Zeilensuche
- `ast-grep` (0.51.2) für strukturelle Suche; auf Linux den Befehl `ast-grep` nutzen, nicht `sg`
- `codebase-memory-mcp` (0.12.1) für Aufrufer, Impact und Architektur. Der Index liegt unter `~/.cache/codebase-memory-mcp/` und wird im Build erzeugt.

Die Binaries liegen nur unter `~/.local/bin` (kein Kopieren nach `/usr/local/bin`, kein `sudo`). Das Skript hängt `~/.local/bin` an PATH in `~/.profile` und `~/.bashrc`. Fehlt ein Befehl in einer Sitzung: `export PATH="$HOME/.local/bin:$PATH"`. `environment.json` setzt PATH nicht selbst: das offizielle Schema erlaubt kein `env`-Feld.

Weitere Tools können später im selben Skript ergänzt werden (Version und SHA-256 pinnen, kein `curl|bash`).

Abhängigkeiten: das Skript erkennt `package-lock.json` (`npm ci --ignore-scripts`) oder `pnpm-lock.yaml` (`pnpm install --frozen-lockfile`, pnpm über corepack mit der in `packageManager` gepinnten Version). Node muss die `engines` in `package.json` erfüllen (typisch >= 22); das Skript installiert Node nicht.

### Reihenfolge bei Struktur-Fragen
1. STATUS.md und ARCHITECTURE.md.
2. Index-Tool, bevor ganze Dateien gelesen werden:
   - `codebase-memory-mcp cli --quiet list_projects '{}'`
   - `codebase-memory-mcp cli --quiet trace_path '{"project":"<name>","function_name":"<Symbol>","direction":"inbound","depth":2}'`
   - `codebase-memory-mcp cli --quiet get_architecture '{"project":"<name>"}'`
3. `ast-grep` oder `rg` für Muster und exakte Zeichenketten.
4. Dateien nur gezielt lesen.

### Graphify-MCP (gehostet, falls verbunden)
Wenn unter cursor.com/agents ein HTTP-MCP namens `graphify` auf `https://api.graphify.com/mcp` eingerichtet und per OAuth angemeldet ist, den Graphen für Aufrufer, Impact und Tests nutzen (`list_repositories`, `graphify_find`, `graphify_callers`, `graphify_impact`). Der gehostete Graph zeigt den indexierten GitHub-Stand, keine uncommitteten lokalen Änderungen. Fehlt die Verbindung oder weicht der Stand ab: `codebase-memory-mcp` in dieser VM verwenden.

Nicht `codebase-memory-mcp install` oder `update` ausführen (ändert Agent-Konfigurationen oder lädt Binaries). Index-Ordner `.codegraph/`, `graphify-out/`, `.serena/` und `.codebase-memory/` nicht committen (stehen in `.gitignore` und `.cursorignore`).

### MCP-Liste schlank halten (seit 20.11.2026)
Jeder geladene MCP-Server schickt seine Tool-Beschreibungen bei jeder Anfrage mit und kostet Tokens. Darum lässt `.cursor/environment.json` nur den gehosteten Graphify-MCP zu (`mcpServerAllowlist`, Schema: https://cursor.com/schemas/environment.schema.json). Alle anderen User- und Team-MCP-Server sind für Agents dieser Umgebung gesperrt. Cursor-eigene MCP-Server (z. B. Cursor Cloud MCP) bleiben unberührt.
- `codebase-memory-mcp`, `rg` und `ast-grep` laufen als CLI aus dem Install-Skript und brauchen keinen MCP-Eintrag.
- Einen weiteren MCP-Server nur nach einem Nutzen-Test und nur mit Ok des Projektinhabers in die Allowlist aufnehmen.
- Serena nur nach positivem lokalem Test (Tokenmessung bei Travel Talk, ab 27.11.2026). Dann ersetzt es `codebase-memory-mcp`, es kommt nicht zusätzlich dazu.
- Die Datei wirkt nur, wenn bei der Umgebung auf cursor.com «environment.json location» auf dieses Repo zeigt (https://cursor.com/docs/cloud-agent/setup.md#environment-resolution-order). Sonst denselben Eintrag im Abschnitt «MCP servers» der Umgebung von Hand setzen.
