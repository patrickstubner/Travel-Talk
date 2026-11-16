# Testplan: Sicherheitsnetz vor dem Umbau

- **Stand:** 13.11.2026, Commit `8ae1686`
- **Ziel:** Die Tests prüfen, was Nutzer tun, nicht wie es aussieht. Dann bleiben sie beim Refactoring und beim GUI-Umbau grün.
- **Werkzeuge:** Vitest, Testing Library, Playwright. Es kommt nichts Neues dazu, ausser optional `dependency-cruiser` (ADR-001).

## Heute (aus Graphify und dem Repo)

- **Gut abgedeckt:**
  - Practice: 13 Tests
  - `audio/player`: 14 Testdateien
  - `storage/types`: 21 Testdateien
  - srs: `session`, `scheduler`, `day`, `progress`
  - pitch: `feedback`, `analyze`, `contour`, `spectrum`
- **Ohne verknüpften Test:**
  - `src/domain/direction.ts` (7 abhängige Dateien im Produktivcode)
  - `src/register-sw.ts`
  - `src/app/router.tsx`
  - die Seiten `Situation`, `Lookup` und `Culture`
- **E2E:** nur 3 Layout-Specs (`phrase-overflow`, `practice-landscape`, `word-continue`), 375 × 812, Fake-Mikrofon über `e2e/fake-mic.ts`.
- **Kopplung:** 16 Testdateien haben je einen eigenen `Ready*`-Wrapper. Rund 28 rendern die echte `AppProvider` mit `fake-indexeddb` und `DexieProgressRepository`, oft mit `vi.mock('../audio/player')`.

## Regeln für neue Tests

1. **Selektoren:** nur Rolle, Name oder Text (`getByRole('button', { name: … })`), Labels oder `data-testid` für fachliche Bereiche (z.B. `practice-item`). Keine CSS-Klassen, keine Pixel, keine DOM-Struktur.
2. **Texte** kommen aus dem Dictionary (`de.startLearning`) statt als Literal. Dann bleibt ein Test bei Textänderungen grün.
3. **Layout-Specs** wie overflow und landscape sind erlaubt, aber getrennt (`e2e/layout/`) und dürfen beim GUI-Umbau neu geschrieben werden.
4. **Kein echtes Netz:** Der Service Worker bleibt in E2E blockiert (wie heute), Audio kommt aus dem Build.

## Playwright-Journeys (layoutunabhängig), Ordner `e2e/journeys/`

| # | Journey | Schritte | Erwartung |
|---|---|---|---|
| J1 | **Erster Start** | Browser-Kontext mit `locale: 'de-CH'` → `#/` öffnen → Name → App-Sprache ist «Deutsch» vorausgewählt (erkannt) → Zielsprache Vietnamesisch → Stimme mit Hörprobe wählen → Weiter. Variante: `locale: 'fr-FR'` → Englisch vorausgewählt. | Die Startseite zeigt die Hauptaktion «Heute lernen». Nach einem Reload sind Person und Sprachen noch da (IndexedDB). |
| J2 | **Situation → Phrase → Anhören** | Situationen → «Notfall» → erste Phrase → Anhören → Tempo 70 % → Anhören | Das Audio-Element spielt (`playing` beziehungsweise das Ereignis `ended`), das Tempo wird gemerkt (nach Reload weiter 70 %). Ein neuer Nutzer startet mit 100 %. |
| J3 | **Tagesübung mit Mikrofon** | Heute lernen → Verstehen-Aufgabe beantworten → Nachsprechen mit Fake-Mikrofon (`day.numbers`) → Weiter bis zum Ende | Es erscheinen 1–5 Sterne, die Seite «Sitzung fertig» kommt, und auf Home ist eine Karte fällig (SRS gespeichert). |
| J4 | **Personen** | Ich → Person hinzufügen «B» → wechseln → Sprache ändern → zurück zu «A» | Die Lernstände sind getrennt, beim Wechsel stoppt das Audio, und A hat seine Einstellungen behalten. |
| J5 | **Export und Import** | Export herunterladen → alle Daten löschen → Import der Datei | Lernstand und Personen sind wieder da. Eine fehlerhafte Datei wird mit einer Meldung abgelehnt (keine Teilübernahme). |
| J6 | **Offline** | Build mit aktivem Service Worker (eigenes Projekt `offline`, `serviceWorkers: 'allow'`) → laden → `context.setOffline(true)` → Reload → Phrase anhören | Die App startet offline, und gecachtes Audio spielt. |

Später kommt dazu: **J7 Rollenspiel** (sobald `dialog` existiert). Ablauf: Situation → Rollenspiel → Zeile der Gegenrolle wird abgespielt → eine Antwort wählen und mit Fake-Mikrofon sprechen → Ende mit Sternen.

**J8 Profile und Sprachen (Vorgabe des Projektinhabers):**
- *Teil a, schneller Lernsprachwechsel:* Profil A lernt vi, 2 Sätze als gelernt markieren → Sprach-Chip → «+ Sprache hinzufügen» → pt-BR → Chip zeigt PT, Lernstand 0 → Chip → zurück zu VI → Lernstand wieder 2, Tempo/Stimme von vi unverändert. Reload → aktive Lernsprache bleibt VI.
- *Teil b, zwei Profile mit verschiedenen Sprachen:* Browser-Kontext `locale: 'de-CH'`. Profil A (App Deutsch, lernt vi) und Profil B (App manuell English, lernt pt-BR). Wechsel A→B: `<html lang="en">`, Tab-Beschriftungen englisch (über `data-testid`, Text aus `en`-Dictionary), Chip zeigt PT. Wechsel B→A: wieder Deutsch und VI, Fortschritt von A unverändert. Neues Profil C startet mit erkannter Browsersprache (`de`), bei `locale: 'ja-JP'` mit Englisch.

**J9 RTL (visuell, verbindlich):** Profil mit GUI-Pseudosprache `ar-XB` (RTL, aus `de` erzeugt) anlegen → Heute, Situation, Phrase, Üben (Nachsprechen mit Fake-Mikrofon), Ich und Profil-Sheet besuchen. Prüft:
- `document.documentElement.dir === 'rtl'` und `lang === 'ar-XB'`; nach Wechsel auf ein LTR-Profil sofort wieder `ltr`/`de`.
- Zurück-Knopf liegt am rechten Rand (`boundingBox().x` > halbe Breite), die Hauptaktion in `BottomActions` liegt links von der Nebenaktion, die Tab-Leiste ist gespiegelt.
- Lerninhalt (vi) hat `dir="ltr"` und `lang="vi"` innerhalb eines `bdi`/Elements mit eigener Richtung; Play ▶ ist nicht gespiegelt (`transform` = `none`).
- Kein horizontales Überlaufen (`scrollWidth <= clientWidth`) bei 360 × 640.
- `toHaveScreenshot()` pro Screen (Projekt `rtl`, eigene Baselines, Toleranz `maxDiffPixelRatio: 0.01`). Bei einer echten RTL-Sprache läuft dieselbe Journey zusätzlich mit ihr.

**Projekte in `playwright.config.ts`:**
- `journeys` (375 × 812, Mikrofon wie heute über `micArgs`)
- `layout` (die bestehenden Specs)
- `offline`

## Unit-Tests (Vitest)

### Neu, Lücken schliessen

| Datei | Tests |
|---|---|
| `src/domain/direction.ts` | `directionId`: gleiche Sprache → `null`, `pt-BR` → `pt`. `directionLangs`: Rundlauf für alle `allDirectionIds()`, ungültige IDs → `null` (`'xx-de'`, `'de'`, `'de-de'`, `'de-vi-x'`). `allDirectionIds().length === n·(n−1)` für n registrierte App- und Zielsprachen. `legacyDirection` für alle 7 Alt-Paare, `null` und `undefined`. `isLang` lehnt `'pt'`, `''` und Zahlen ab. |
| `src/app/router.tsx` | Smoke-Test: Jede Route rendert ohne Fehler mit `renderWithApp` und `createMemoryRouter(routes, { initialEntries })`. Geprüft werden `/`, `/lookup`, `/situation/<erste>`, `/phrase/<erste>`, `/practice`, `/show`, `/show/<id>`, `/culture`, `/culture/<id>` und `/settings`. Unbekannte IDs zeigen eine «nicht gefunden»-Meldung statt eines Absturzes. |
| `src/register-sw.ts` | Ohne `PROD` wird nicht registriert. Ohne `navigator.serviceWorker` gibt es keinen Fehler. In `PROD` wird mit `publicUrl('sw.js')` und `scope: publicUrl('')` registriert. Ein Fehler bei der Registrierung wird geloggt und nicht geworfen. Dafür `import.meta.env` per `vi.stubEnv` setzen und `navigator.serviceWorker.register` mocken. |

### Neu, Sprachen und Inhalte (ADR-003/004)

| Test | Prüft |
|---|---|
| `languages.registry.test.ts` | Codes und `short` eindeutig, `fallback` endet bei `en` und hat keine Zyklen. Jede Zielsprache hat ≥ 1 Stimme mit `defaultNew` und dazu eine Hörprobe. `dir` ist gesetzt. `options`-Choices haben Labels in allen App-Sprachen. |
| **`languages.complete.test.ts`** (Pflicht) | **Für jede registrierte Sprache mit Status `live`:** Das Dictionary hat alle Schlüssel und keine leeren Werte. Alle Mehrsprachen-Texte im Katalog (Situationen, Kultur, Phrasen-Kontext, Wörter, Optionen) sind nicht leer. Jede Phrase hat eine Realisierung pro Zielsprache (oder `excludeTargets`). Alle Clips aus `allSpeechLines()` sind im Manifest vorhanden, in 3 Tempi (über `test:clips`). Der Test läuft über `LANGUAGES`, eine neue Sprache wird also automatisch mitgeprüft. Bei `beta` gibt es nur Warnungen. |
| `catalog.refs.test.ts` | IDs eindeutig. Alle `situationIds`, Wort-`sentences` und Dialog-`phraseId`/`choices` zeigen auf existierende Einträge. Keine verwaisten Audio-Dateien (Warnung). |
| `content-index.test.ts` | `content/index.generated.ts` ist aktuell: Das Script erzeugt im Test-Lauf dieselbe Ausgabe. |
| `direction.test.ts` (RTL) | Jede Registry-Sprache hat `dir`; `dirOf('ar-XB') === 'rtl'`; `resolveInitialUiLang` liefert nie eine `pseudo`-Sprache; die Shell setzt `<html dir lang>` beim Profilwechsel neu (zwei Profile, eines RTL). |
| `lint:css` (CI-Schritt) | Stylelint `use-logical` meldet jede physische `left/right`-Eigenschaft ohne `/* rtl-ok */`; ESLint verbietet `marginLeft`/`paddingRight`/`textAlign:'left'` in TSX. Kein Test im engeren Sinn, aber ein Pflicht-Check im PR. |
| `ui-lang.test.ts` | `resolveInitialUiLang`: `['de-CH','en']` → `de`. `['pt-BR']` → `pt-BR`. `['pt-PT']` → `pt-BR` (Basis-Match). `['PT-br']` → `pt-BR` (Gross- und Kleinschreibung egal). `['fr-FR','vi-VN']` → `vi` (erste *unterstützte*). `['fr','ja']` → `en` (Fallback). `[]` → `en`. Sprachen mit Status `hidden` oder ohne App-Rolle werden übersprungen. Eine zusätzlich registrierte Testsprache wird ohne Code-Änderung erkannt. `effectiveUiLang`: `appLangSource: 'manual'` gewinnt immer, bei `'detected'` wird neu erkannt. |
| `settings.migration.test.ts` | Alte Felder (`addressVi`, `addressPt`, `addressDe`, `ptSpeaker`, `viContact`, `viRegion`) werden zu `langOptions`. Export Format 3 bleibt importierbar, Format 4 macht einen Rundlauf. |

### Neu, Bausteine und Plug-ins

| Test | Prüft |
|---|---|
| `exercises.contract.test.ts` | **Für jedes Modul in `EXERCISES`:** `type` ist eindeutig, `label` ist in allen App-Sprachen nicht leer. `dataSchema` akzeptiert die Beispieldaten des Moduls. `plan()` ist rein: gleicher Input ergibt gleichen Output und überschreitet das Budget nicht. `View` rendert mit Mock-`ctx` ohne Fehler, und `actions` liefert höchstens 3 Einträge. |
| `plan-day.test.ts` | Die Budgetverteilung über die Module stimmt (heutige Regeln aus `day.test.ts` und `session.test.ts` bleiben gültig). |
| `use-phrase-playback.test.tsx` | Ablauf laden → spielen → stoppen. Das Alignment wird verworfen, wenn die Dauer nicht passt. Beim Unmount wird gestoppt. |
| `use-repeat-take.test.tsx` | Erlaubnis verweigert ergibt `denied`. Das 15-s-Limit greift, `reset` gibt die URL frei. |
| `use-repeat-score.test.tsx` | Mit synchronem Analyzer (Injektion statt `testsAreRunning`): Sterne von 1 bis 5 für Referenz-Aufnahmen, `model-missing`. |
| `providers.test.tsx` | `saveCard` rendert `TopBar` nicht neu. Bei `switchTo` wird `AudioLifecycle.stop` aufgerufen. |

## Gemeinsamer Test-Helfer

```ts
// src/test/render-with-app.tsx
export function renderWithApp(ui: ReactElement | null, opts?: {
  route?: string                         // '#/practice' oder '/practice'
  routes?: RouteObject[]                 // Default: die echten Routen
  repository?: ProgressRepository        // Default: new MemoryProgressRepository()
  people?: Array<{ name: string; settings?: Partial<Settings>; cards?: StoredCard[] }>  // Vorbelegung
  catalog?: Catalog                      // Default: echter, validierter Katalog
  audio?: Partial<AudioFake>             // Default: fakeAudio() – zeichnet play/stop auf, kein vi.mock nötig
  analyzer?: PitchAnalyzer               // Default: synchroner Analyzer
  now?: Date                             // feste Zeit für SRS
}): RenderResult & { repository: ProgressRepository; audio: AudioFake; user: UserEvent }

export function fakeAudio(): AudioFake   // { played: string[]; stopped: number; failNext(): void }
export function card(cardId: string, patch?: Partial<StoredCard>): StoredCard   // ersetzt due() und ähnliche Helfer
```

- **Ersetzt:**
  - die 16 `Ready*`-Wrapper,
  - `freshIndexedDb()` und `fake-indexeddb` in Seitentests (bleibt nur in `dexie-repository.test.ts`),
  - die wiederholten `vi.mock('../audio/player')` und `vi.mock('../audio/align')`.
- **Voraussetzung:** Repository- und Audio-Injektion (ADR-002 Schritt 2 und `AudioLifecycle`). Bis dahin baut der Helfer intern die heutige `AppProvider`.

## Reihenfolge

1. In PR R1 (siehe [`issues-entwuerfe.md`](issues-entwuerfe.md)): `renderWithApp` (vorerst auf `AppProvider`), J1–J6, Unit-Tests für `direction`, `router` und `register-sw`.
2. In R2: `languages.registry`, `languages.complete`, `catalog.refs`, `content-index`.
3. Zusammen mit dem jeweiligen Baustein: die Hook-Tests und der Vertragstest für Übungen.

**Fertig, wenn:** Alle Journeys sind in der CI grün, die neuen Unit-Tests ebenfalls. `graphify_tests_for` zeigt für `direction.ts`, `router.tsx` und `register-sw.ts` mindestens einen Test.
