# STATUS.md – Stand 16.11.2026, Basis main 6166d70 (0.10.2), Branch `chore/cloud-agent-setup`

## Nachtrag 22.11.2026: Audit-Fix und pnpm
Branch `chore/pnpm-audit-fix` (Draft-PR, Basis main 15f2fec, nicht mergen bis Stabschef-Ok und Ja von Patrick). Kein App-Code, kein Versionsbump.
- Mindestalter neuer Paketversionen 4 Tage: `pnpm-workspace.yaml` mit `minimumReleaseAge: 5760`, Regel in `AGENTS.md` und Sicherheitsnotiz, Dependabot-`cooldown` (mindestens 4 Tage). Lockfile geprüft: alle Pakete älter als 4 Tage (jüngstes: minimatch 11.0.9, 5,7 Tage). **Übergangsausnahmen in `minimumReleaseAgeExclude` (Kommentar «Übergang Einführung 4-Tage-Regel, entfernen ab 26.11.2026»): keine, weil kein bestehendes Paket jünger als 4 Tage ist.** Sicherheits-Ausnahmen: keine nötig.

## Nachtrag 16.11.2026: Cloud-Agent-Setup
Branch `chore/cloud-agent-setup` (Draft-PR, Basis jetzt `main` nach Merge von #71 und #72, nicht mergen bis Stabschef und Projektinhaber Ja sagen).
- `.cursor/environment.json` und `.cursor/install-dev-tools.sh`: ripgrep 14.1.1, ast-grep 0.51.2, codebase-memory-mcp 0.12.1, Versionen und SHA-256 gepinnt. Bei `package-lock.json`: `npm ci --ignore-scripts` (Node 22).
- `.cursorignore` für Lockfiles, Build, Audio, Modelle, Index-Ordner und die Wireframe-PNGs unter `docs/architektur/wireframes/` (Markdown und HTML bleiben im Kontext).
- Abschnitt «Cursor Cloud specific instructions» in AGENTS.md ergänzt.
- Der gehostete Graphify-MCP wird unter cursor.com/agents verbunden, nicht durch diesen PR.
- Nachzug CA-1/CA-2: Binaries nur unter `~/.local/bin` (kein `sudo`, kein `/usr/local/bin`); PATH setzt das Skript in `~/.profile` und `~/.bashrc`. `.codebase-memory/` steht in `.gitignore` und `.cursorignore`. corepack schreibt nach `~/.local/bin` und `COREPACK_HOME` im Home-Verzeichnis.

## Aktuelles Ziel
Audit-Fix und pnpm-Umstellung liegen im Draft-PR `chore/pnpm-audit-fix` (22.11.2026). Ab 27.11.2026: Vosk 1.0 mit 5 Sternen, danach der Umbau R1–R4.

## Erledigt
- 0.10.2 live auf GitHub Pages (Changelog 15.10.2026).
- Architektur-Review und Plan R1–R8, G1–G4 (13.11.2026), Issues #59–#70 angelegt.
- AGENTS.md, ARCHITECTURE.md, STATUS.md (PR #71 gemergt, live seit 16.11.2026).
- Architekturplan unter `docs/architektur/` (PR #72 gemergt, live seit 16.11.2026).

## Plan ab 27.11.2026 (Reihenfolge massgebend, Daten Richtwerte)
1. **Audit-Fix auf `main`:** erledigt im PR `chore/pnpm-audit-fix` (22.11.2026): 15 Funde (3 hoch) auf 0, zugleich Umstellung auf pnpm. Bis dieser PR gemergt ist, ist der CI-Job audit auf `main` und auf allen PRs rot.
2. **V1 Vosk 1.0:** Spracherkennung lokal im Browser, 5 Sterne, Bewertung als `useRepeatScore`. Version 1.0.0.
3. **Dependabot und Majors**, je Paket ein PR.
4. **Nur R1–R4** im Kontingent ab 27.11.: R1 #59 Sicherheitsnetz, R2 #60 Domäne und Sprach-Registry, R3 #61 Playback-Hooks, R4 #62 `AppProvider` aufteilen.
5. **Erst ab Januar-Kontingent:** R5 #63, R6 #64, R7 #65, G1 #66, G2 #67, G3 #68, G4 #69, R8 #70.
- Pause 24.12.2026–2.1.2027.
- Ein PR pro Issue, jeder mit Sicherheitsprüfung.

## Entscheide
- **Navigation (Patrick, 16.11.2026):** genau 4 Tabs: Heute, Situationen, Zeigen, Ich. «Nachschlagen» liegt im Tab Situationen. Die Tab-Leiste ist immer sichtbar, auch in Übungen und auf der Phrasen-Seite. Kein Fokus-Modus. Der Navigationsentscheid ist kein Blocker mehr: G2 (#67) kann nach G1 (#66) und R6 (#64) starten.
- **5 Sterne (Patrick, 16.11.2026):** Die Sterne-Bedingungen im GUI-Konzept sind die verbindliche Basis für die 5-Sterne-Kalibrierung in V1.

## Offen / Entscheide nötig (wer?)
- Spanisch als Sprache: nach Vosk 1.0, Umfang offen – Patrick

## Offene PRs (16.11.2026)
- #53 happy-dom 20.14.6 → 21.0.4 (Dependabot, Major): durch `chore/pnpm-audit-fix` überholt, nach dessen Merge schliessen oder neu bauen lassen (npm-Lockfile entfällt).
- `chore/pnpm-audit-fix`: Audit-Fix und pnpm, Draft-PR, Basis `main`
- dieser Draft-PR: Cloud-Agent-Setup (`chore/cloud-agent-setup`), Basis `main`

## Bekannte Probleme / Risiken
- CI auf `main` rot (seit 9.11.2026, nicht durch Docs-PRs verursacht): audit (15 Funde, davon 3 hoch; behoben im PR `chore/pnpm-audit-fix`), dazu overflow (Playwright-Installation auf dem Runner) sowie clips (en) und clips (pt-BR). Lint, Typecheck, Test und Build sind grün. Der PR `chore/pnpm-audit-fix` pinnt clips und overflow versuchsweise auf `ubuntu-24.04`; ob das genügt, zeigt seine CI.
- Die Sätze sind noch nicht muttersprachlich geprüft (steht im UI).

## Genutzte lokale Tools & vermiedene Cloud-Agent-Nutzung
- codebase-memory-mcp: Architektur-Überblick, Aufrufer von `useApp` (12).
- rg und ast-grep: Import-Richtungen zwischen Ordnern (Zyklen), Routen, Dexie-Versionen.
- `pnpm audit` lokal gegen `pnpm-lock.yaml` (bis 22.11.2026 `npm audit` gegen `package-lock.json`).
- Geschätzt 1 kurzer Cloud-Agent-Lauf vermieden (Doku-Paket).
- 16.11. (Merge von main in diesen Branch, CA-1/CA-2): kein Cloud Agent, kein Rebase.
