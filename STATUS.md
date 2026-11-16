# STATUS.md – Stand 16.11.2026, Commit 8ae1686, Version 0.10.2

## Aktuelles Ziel
Ab 27.11.2026: Audit auf `main` beheben, Vosk 1.0 mit 5 Sternen, danach der Umbau R1–R4.

## Erledigt
- 0.10.2 live auf GitHub Pages (Changelog 15.10.2026).
- Architektur-Review und Plan R1–R8, G1–G4 (13.11.2026), Issues #59–#70 angelegt.
- AGENTS.md, ARCHITECTURE.md, STATUS.md (dieser PR, lokal ohne Cloud Agent).

## Plan ab 27.11.2026 (Reihenfolge massgebend, Daten Richtwerte)
1. **Audit-Fix auf `main`:** `npm audit` zeigt am 16.11.2026 18 Funde, davon 3 hoch (happy-dom, zod, undici), 12 moderat, 3 niedrig. Deshalb ist der CI-Job audit auf `main` und auf allen PRs rot.
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
- Architektur-Plan vom 13.11. (ADRs, Bausteine, Testplan) als `docs/architektur/` ins Repo? – Patrick

## Offene PRs (16.11.2026)
- #53 happy-dom 20.14.6 → 21.0.4 (Dependabot, Major) – wartet bis 27.11.
- dieser Docs-PR

## Bekannte Probleme / Risiken
- CI auf `main` rot (seit 9.11.2026, nicht durch Docs-PRs verursacht): audit (18 Funde, davon 3 hoch), dazu overflow (Playwright-Installation auf dem Runner) sowie clips (en) und clips (pt-BR). Lint, Typecheck, Test und Build sind grün. Behebung im Audit-/CI-Block ab 27.11.
- Die Sätze sind noch nicht muttersprachlich geprüft (steht im UI).

## Genutzte lokale Tools & vermiedene Cloud-Agent-Nutzung
- codebase-memory-mcp: Architektur-Überblick, Aufrufer von `useApp` (12).
- rg und ast-grep: Import-Richtungen zwischen Ordnern (Zyklen), Routen, Dexie-Versionen.
- `npm audit` lokal gegen `package-lock.json`.
- Geschätzt 1 kurzer Cloud-Agent-Lauf vermieden (Doku-Paket).
