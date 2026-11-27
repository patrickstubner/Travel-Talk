# ARCHITECTURE.md – Travel Talk

Stand 27.11.2026, current app version 1.0.1. The body below was derived from `main` = `8ae1686` (then 0.10.2) with codebase-memory-mcp, ast-grep and rg.

## Überblick
```
content/ (Daten: Situationen, Sätze, Wörter, Kultur, Glossar)      public/audio/<lang>/ (m4a-Clips, manifest.json)
        │                                                                  │
        ▼                                                                  ▼
src/content (load, resolve, word-links) ──► src/app/state.tsx  AppProvider ◄── src/audio (player, offline, voices, recorder)
src/domain (schema, pairs, direction)         │  useApp / useSettings / useCopy                    │
src/storage (Dexie-Repository, Import)  ◄─────┤                                              src/pitch (Analyse im Worker)
src/srs (FSRS-Planung, Sitzung, Wortschritte)  ▼
                         src/pages (Routen) + src/components (Darstellung)
                         src/pwa (Service Worker, Home-Bildschirm), src/i18n (UI-Texte)
```

## Module (src/)
| Ordner | Inhalt |
|---|---|
| `app/` | `router.tsx` (Hash-Router), `shell.tsx`, `state.tsx` (`AppProvider`, `useApp`), `use-copy.ts` (`useCopy`, `useSettings`), `labels.ts` |
| `pages/` | Home, Lookup, Situation, Phrase, Practice, Show, Culture, Settings |
| `components/` | TopBar, LearnCard, RepeatFeedback, KaraokeLine, TempoSwitch, WordTempo, LanguageChoice, VoiceOffline, AddToHomeScreen u. a. |
| `content/` | Katalog laden und auflösen (`load.ts`, `resolve.ts`, `word-links.ts`) |
| `domain/` | Schema, Sprachpaare, Schreibrichtung (`direction.ts`) |
| `storage/` | `ProgressRepository` mit `DexieProgressRepository` (Dexie-DB `TravelDB`, Schema-Versionen 1–3) und `MemoryProgressRepository`, Import/Migration (`import.ts`), Typen und `coerceSettings` (`types.ts`) |
| `srs/` | Planung mit ts-fsrs, Tagesgrenzen, Sitzung, Wortschritte |
| `audio/` | Wiedergabe, Tempo, Offline-Laden der Stimmen, Aufnahme, Ausrichtung |
| `pitch/` | Tonhöhe und Satzbewertung (Web Worker `analyze.worker.ts`) |
| `speech/` | (1.0.0) On-device speech recognition: Vosk worker client, model download with SHA-256 check and cache, word matching (`text-match.ts`), model status |
| `hooks/` | (1.0.0) `useRepeatScore`: pitch analysis plus speech recognition to bars and five stars |
| `pwa/` | Cache-Regeln, Home-Bildschirm |
| `i18n/` | UI-Wörterbuch |

Ausserhalb von `src/`: `content/` (Inhalte als TS-Daten), `public/audio/` (Clips), `tools/` (Python/TS-Werkzeuge für Audio, nicht im Bundle), `e2e/` (Playwright), `docs/` (audio.md, SECURITY.md, Screenshots).

## Routen (`src/app/router.tsx`)
`/`, `lookup`, `situation/:situationId`, `phrase/:conceptId`, `practice`, `show`, `show/:conceptId`, `culture`, `culture/:noteId`, `settings`.

## Datenfluss
- **Inhalte:** `content/*` → `src/content/load.ts` (`tryLoadCatalog`) → `AppProvider` → Seiten.
- **Lernstand und Einstellungen:** Seiten → `useApp`/`useSettings` → `AppProvider` → `DexieProgressRepository` (IndexedDB). Beim Lesen läuft alles durch `coerceSettings` (Whitelist).
- **Audio:** Seite → `src/audio/player.ts` → `public/audio/<lang>/…` (Tempo 70/85/100 % als eigene Dateien). Stimmen werden mit «Für offline laden» in den Cache geholt, nicht beim Installieren.
- **Nachsprechen:** Mikrofon (nur nach Tippen) → `src/audio/recorder.ts` → `src/pitch` (Worker) → `RepeatFeedback`. Nichts verlässt das Gerät.
- **Offline:** `workbox-build` erzeugt den Service Worker nach dem Build. Er cacht die Oberfläche, Audio nur auf Anforderung.

## Bekannte Strukturprobleme (Grundlage der Issues #59–#70)
- `AppProvider` ist ein Gott-Kontext: 12 direkte Aufrufer von `useApp` (cbm), weitere indirekt über `useSettings`/`useCopy`. Aufteilen in R4 (#62).
- Zyklen zwischen Ordnern: `storage` ↔ `audio`, `audio` → `app` → `audio`. Lösen in R2 (#60).
- Der Grundtyp `Lang` liegt in `content/phrase.ts` und wird von `src/domain` importiert. Registry in R2 (#60), generische Sprachen in R7 (#65).
- `Practice` trägt Sitzungslogik und Übungsarten in einer Seite. Zerlegen in R5 (#63).

## Weitere Doku
- `docs/audio.md` (Audio bauen, Stimmen, Lizenzen), `docs/SECURITY.md` (Abhängigkeiten, Eingaben), `README.md` (Inhalte, Regeln für neue Sätze und Sprachen).
- Architektur-Plan vom 13.11.2026 (ADR-001 Schichtregeln, ADR-002 Zustand aufteilen, ADR-003 neue Sprachen, ADR-004 erweiterbare Inhalte, Bausteine, Testplan, Ablaufplan ab 27.11.) liegt noch nicht im Repo, sondern lokal. Die Issues #59–#70 fassen ihn zusammen.
