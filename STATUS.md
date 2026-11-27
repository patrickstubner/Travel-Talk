# STATUS.md – Stand 27.11.2026, app version 1.0.1. Older notes below keep their original dates.

## Addendum 27 Nov 2026: open low/info items after 1.0.1
Docs-only list of residual items from the 1.0.0 and 1.0.1 reviews. None of these is blocking. Based on main 14e16013. No cloud agent, no on-demand usage.

- Low: until the service worker controls the page (first visit, a private window, or a browser without a service worker), `vosk-worker.js` has no Content-Security-Policy of its own. The page policy only limits which script may start as a worker. The header is set once the service worker is in control; that path is covered by e2e since 1.0.1.
- Low: `vosk-browser` 0.0.8 is unmaintained since 2022.
- Info: the 1.0.0 CHANGELOG entry still describes the models as 31–45 MB (the upstream list in MiB). The UI shows 32–47 MB. The 1.0.0 CHANGELOG text is left unchanged.
- Info: the Workbox runtime route for `/Travel-Talk/models/vosk-model-small-*.tar.gz` in `rsbuild.config.ts` and the app cache in `src/speech/vosk.ts` share the Cache Storage name `travel-talk-vosk`. The service worker may store the raw download, and the app also writes the SHA-256-checked bytes into the same cache. Functionally harmless: a cached copy is re-hashed before use and dropped on mismatch. Optional follow-up: drop the Workbox route or give it a distinct name.


## Addendum 27 Nov 2026: Travel Talk 1.0.1 (review follow-up L1–L6)
Merged as 1.0.1. No cloud agent, no on-demand usage.
- Version 1.0.1. Fixes the six low findings from the 1.0.0 review: worker without `'unsafe-eval'`, e2e coverage of the worker CSP with an active service worker, download cancel/timeout/size cap, AGENTS.md for the generated worker and model pins, vosk-browser notices in `public/models/NOTICE.txt`, and a corrected explanation of why eval was needed.
- Security review in `docs/SECURITY.md` (section 1.0.1). Residual low/info items are listed in the addendum above.


## Addendum 27 Nov 2026: Travel Talk 1.0.0 (speech recognition)
Branch `feat/speech-1.0`, base `main` `f6b61cb`. Merged as 1.0.0. No cloud agent, no on-demand usage.
- Template from closed draft #43 (`refs/pull/43/head`, `1d6e5bb`) taken over onto current `main`, wired through the new hook `useRepeatScore`.
- Vosk for de, en, pt-BR (pt with word grammar as in #42); five stars after `gui-konzept.md`. Vietnamese: Vosk with words as information only, at most 4 stars. sherpa-onnx was tested in the browser and deferred (needs cross-origin isolation, 512 MB wasm heap); details and measurements in `docs/analysis-speech-recognition.md`.
- Version 1.0.0. Security review in `docs/SECURITY.md` (section 1.0.0).
- Open: tests on real phones and with real learner voices; Vietnamese cross-voice false 1-star rate; German voice `mls-4576` is barely intelligible to recognisers.

## Nachtrag 22.11.2026 (Abend): Korrekturen nach Stabschef-Prüfung an #76
Commit `92057a6`. Draft, nicht mergen. Kein Cloud Agent.
- **M1 (mittel, behoben):** `prototype/**` steht in `eslint.config.js` unter `ignores`. `pnpm run lint` lokal grün.
- **N2 (niedrig, behoben):** Profil-IDs in `data-person` werden mit `esc()` ausgegeben. `learned` (auch in `per.*`) wird beim Laden aus localStorage als Array geprüft, sonst leeres Array.
- **N1** (`'unsafe-inline'`) bleibt für den lokalen Ein-Datei-Prototyp. In README, SECURITY.md und AGENTS.md steht: der Prototyp wird **nicht auf GitHub Pages** veröffentlicht (Pages liefert nur `dist/`).
- Rebase auf `main` nach #75: Produktregeln aus #75 und die Prototyp-Zeile unter `prototype/gui/` stehen beide in `AGENTS.md`. Der frühere Konfliktvermerk («Prototyp liegt nicht im Repo») entfällt.

## Nachtrag 22.11.2026: GUI-Prototyp im Repo
Branch `docs/gui-prototyp` (Draft-PR, nicht mergen bis Stabschef-Ok und Ja des Projektinhabers). Kein App-Code, kein Cloud Agent.
- Neu: `prototype/gui/` – klickbarer GUI-Prototyp (Stand 16.11.2026, 4 Tabs, Tab-Leiste immer sichtbar). Nur Design-Referenz. Quelle war lokal; bereinigt (keine Vornamen, keine lokalen Pfade). Acht Screenshots (ca. 1,2 MB).
- Docs angepasst, die bisher sagten, der Prototyp liege nicht im Repo: `AGENTS.md`, `docs/architektur/README.md`, `ablaufplan.md`, `gui-konzept.md`.
- `.cursorignore`: Screenshots des Prototyps (HTML und README bleiben lesbar).

## Nachtrag 22.11.2026 (Abend): Korrekturen nach Stabschef-Prüfung
Commit `facb7ba`. Nur Doku, kein App-Code, kein Cloud Agent.
- Abschnitt «Zusammenarbeit mehrerer Agents»: vor dem Merge geht der Head-SHA an Stabschef, auf dessen Ok warten, Merge erst nach dem Ja des Projektinhabers.
- Vornamen in `AGENTS.md` und `STATUS.md` durch «Projektinhaber» ersetzt.
- Dieser PR (#75) soll erst nach #74 (MCP-Allowlist) gemergt werden.
- Rebase auf `main` nach #77: pnpm-Regeln in `AGENTS.md` und `README.md` bleiben. Die frühere Formulierung, der GUI-Prototyp liege bewusst nicht im Repo, ist gestrichen (der Prototyp kommt in PR #76 unter `prototype/gui/`). Stabschef-Befund N1: Vorname durch «Projektinhaber» ersetzt.

## Nachtrag 22.11.2026: Vorbereitung für lokale Arbeit mit Google Antigravity
Branch `docs/antigravity-setup` (PR offen, nicht mergen bis Stabschef-Ok und Ja des Projektinhabers). Nur Doku, kein App-Code, kein Cloud Agent. Von der Doku-Änderung unberührt: `.cursor/`, `.cursorignore`, Code, `package*.json`.
- `AGENTS.md`: neuer Abschnitt «Zusammenarbeit mehrerer Agents» (ein Branch pro Aufgabe und Agent, nur PRs, Sicherheitsprüfung nach jeder Änderung, STATUS.md mit Commit, keine Secrets, keine Kosten ohne Ja, empfohlene lokale MCP-Server) und ergänzte Projektregeln (nur Frontend, Profile und Sprachen, GUI-Ziel; TTS-Stimmen/Rohdaten bleiben lokal). Antigravity liest `AGENTS.md` automatisch; keine zweite Regel-Datei.
- `README.md`: Abschnitt «Mit Agents arbeiten»; der lokale Start (`corepack enable`, `pnpm install --frozen-lockfile`, `pnpm run dev`, `pnpm test`) steht in der README. `.gitignore`: `.agents/mcp_config.json`.
- Nicht im Repo, bewusst: die TTS-Stimmen und Rohdaten (`tools/voices/`), nur bei Bedarf lokal beim Projektinhaber. Ein klickbarer GUI-Prototyp unter `prototype/gui/` folgt in PR #76.
- Audit: seit #77 (`pnpm audit`) 0 Funde. Nicht Teil dieses PRs.
- PR #74 (MCP-Allowlist) ändert ebenfalls `STATUS.md` und `AGENTS.md` und soll zuerst gemergt werden; danach kann ein kurzer Rebase von #75 nötig sein.

## Nachtrag 22.11.2026: Audit-Fix und pnpm
Branch `chore/pnpm-audit-fix` (PR #77, gemergt, Basis war main 15f2fec). Kein App-Code, kein Versionsbump.
- Mindestalter neuer Paketversionen 4 Tage: `pnpm-workspace.yaml` mit `minimumReleaseAge: 5760`, Regel in `AGENTS.md` und Sicherheitsnotiz, Dependabot-`cooldown` (mindestens 4 Tage). Lockfile geprüft: alle Pakete älter als 4 Tage (jüngstes: minimatch 11.0.9, 5,7 Tage). **Übergangsausnahmen in `minimumReleaseAgeExclude` (Kommentar «Übergang Einführung 4-Tage-Regel, entfernen ab 26.11.2026»): keine, weil kein bestehendes Paket jünger als 4 Tage ist.** Sicherheits-Ausnahmen: keine nötig.

## Nachtrag 20.11.2026: MCP-Allowlist für Cloud-Agent-Umgebung
Branch `chore/mcp-allowlist` (PR #74, Basis `main` nach #77, nicht mergen bis Stabschef-Ok und Ja des Projektinhabers). Kein Versionsbump.
- `.cursor/environment.json`: neu `mcpServerAllowlist` mit genau einem Eintrag, dem gehosteten Graphify-MCP (`https://api.graphify.com/mcp`). Alle anderen User- und Team-MCP-Server sind für Agents dieser Umgebung gesperrt, Cursor-eigene MCP-Server nicht. Feldnamen laut https://cursor.com/schemas/environment.schema.json; die Datei wurde gegen das Schema geprüft.
- AGENTS.md (Cloud-Abschnitt): Regel «MCP-Liste schlank halten; Serena nur nach positivem lokalem Test, dann ersetzt es codebase-memory-mcp».
- Die Datei wirkt nur, wenn «environment.json location» der Umgebung auf cursor.com auf dieses Repo zeigt. Sonst gleichen Eintrag im Dashboard von Hand setzen (Abschnitt «MCP servers» der Umgebung). Ungetestet: kein Cloud Agent gestartet (Kontingent bis 27.11.2026 erschöpft).
- Stabschef-Befund N1: Vorname durch «Projektinhaber» ersetzt.

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
- **Navigation (Projektinhaber, 16.11.2026):** genau 4 Tabs: Heute, Situationen, Zeigen, Ich. «Nachschlagen» liegt im Tab Situationen. Die Tab-Leiste ist immer sichtbar, auch in Übungen und auf der Phrasen-Seite. Kein Fokus-Modus. Der Navigationsentscheid ist kein Blocker mehr: G2 (#67) kann nach G1 (#66) und R6 (#64) starten.
- **5 Sterne (Projektinhaber, 16.11.2026):** Die Sterne-Bedingungen im GUI-Konzept sind die verbindliche Basis für die 5-Sterne-Kalibrierung in V1.

## Offen / Entscheide nötig (wer?)
- Spanisch als Sprache: nach Vosk 1.0, Umfang offen – Projektinhaber

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
