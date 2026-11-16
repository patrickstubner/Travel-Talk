# Bausteine: API-Skizzen

- **Stand:** 13.11.2026, Commit `8ae1686`
- **Bezug:** ADR-001 bis ADR-004
- **Hinweis:** Das sind Entwürfe der Signaturen, kein fertiger Code. Die Namen dürfen sich bei der Umsetzung noch ändern, die Verantwortungen nicht.

**Schichten** (ADR-001):
- `src/domain` ← `storage`, `audio`, `pitch`, `srs`, `content`
- ← `src/hooks` und `src/app` (Provider)
- ← `src/exercises` (Plug-ins)
- ← `components` und `pages`

---

## 1. `src/domain`: Typen und Registries

```ts
// src/domain/languages.ts   (ADR-003)
export type LanguageDef = { code; short; roles; dir; script; fontStack?; regions?; tonal?; melody; fallback; options?; fillers?; status }
export const LANGUAGES: readonly LanguageDef[]
export type Lang = (typeof LANGUAGES)[number]['code']
export const APP_LANGS: readonly Lang[]; export const TARGET_LANGS: readonly Lang[]
export function isLang(v: unknown): v is Lang
export function languageDef(lang: Lang): LanguageDef
export function shortLang(lang: Lang): string

/** Erste unterstützte App-Sprache aus navigator.languages: exakt, dann Basis (pt-BR→pt, de-CH→de); sonst 'en'. Reine Funktion. */
export type Dir = 'ltr' | 'rtl'                                   // Pflichtfeld in LanguageDef, kein Default
export function dirOf(lang: Lang): Dir
export const PSEUDO_RTL: Lang /* 'ar-XB', hidden, nur Dev/Test, nie in der Browser-Erkennung */
export function resolveInitialUiLang(browserLangs: readonly string[], langs?: readonly LanguageDef[]): Lang
/** Manuelle Wahl gewinnt, sonst Browser-Erkennung. */
export function effectiveUiLang(settings: Pick<Settings,'appLang'|'appLangSource'>, browserLangs: readonly string[]): Lang

// src/domain/direction.ts  (bleibt, liest aus der Registry)
export function directionId(app: Lang, target: Lang): string | null
export function directionLangs(id: string): { app: Lang; target: Lang } | null
export function allDirectionIds(): string[]
export function legacyDirection(pairId?: string | null): { app: Lang; target: Lang } | null

// src/domain/speed.ts
export const SPEED_STEPS = [0.7, 0.85, 1] as const
export type SpeedStep = (typeof SPEED_STEPS)[number]
export type SpeedChoice = 'auto' | SpeedStep
export function isSpeedStep(v: unknown): v is SpeedStep
export function speedPercent(s: SpeedStep): 70 | 85 | 100

// src/domain/settings.ts
export type Settings = { appLang; targetLang; voices?; highlightWords?; retention; personalNote;
  speed: SpeedChoice; learnTempo?: SpeedStep; wordSpeed?: SpeedStep; skipWords?; moreTargets?; onboarded?;
  langOptions: Partial<Record<Lang, Record<string, string>>>    // ersetzt addressVi/Pt/De, ptSpeaker, viContact, viRegion
  appLangSource?: 'detected' | 'manual' }                       // 'manual' überschreibt die Browser-Erkennung
export const defaultSettings: Settings
export function completeSettings(s: Settings): Settings          // ersetzt withDefaultVoices, ohne Audio-Import
export function isOnboarded(s: Settings): boolean

// src/domain/profile.ts   (ADR-002, Sprachen pro Profil)
export type TargetPrefs = { voice?; region?; speed: SpeedChoice; learnTempo?: SpeedStep; langOptions?: Record<string,string>; onboarded?: boolean }
export type ProfileLangs = { uiLang: Lang; uiLangSource: 'detected' | 'manual'; targets: Lang[]; activeTarget: Lang; perTarget: Partial<Record<Lang, TargetPrefs>> }
export function newProfileLangs(browserLangs: readonly string[]): Omit<ProfileLangs,'targets'|'activeTarget'>  // uiLang erkannt, sonst 'en'
export function migrateProgressKey(directionId: string): { target: Lang }   // Fortschritt neu pro (Profil, Zielsprache)

// src/domain/voices.ts   (nur Daten)
export type CatalogVoice = { id; lang: Lang; gender: 'male'|'female'; provider: 'piper'|'xtts'|'azure'; bundled; legacy; defaultNew; order }
export const VOICES: readonly CatalogVoice[]
export function isBundledVoiceId(lang: Lang, id: string): boolean

// src/domain/schema.ts   (wird dynamisch aus LANGUAGES gebaut)
export const textAll: z.ZodType<Record<Lang, string>>
export const catalogSchema   // + words, wordSounds, langOptions, dialogs (ADR-004)
export function validateCatalog(raw: unknown, langs: readonly LanguageDef[]): { ok: true; catalog: Catalog; warnings: string[] } | { ok: false; errors: string[] }
```

| Ersetzt oder verschiebt | Wohin |
|---|---|
| `LANGS`/`Lang` (content/phrase.ts) | `domain/languages.ts` |
| `APP_LANGS`, `LONG`, `isLang`, `shortLang` (domain/direction.ts) | `domain/languages.ts` |
| `Settings`, `VoiceMap`, `defaultSettings`, `isOnboarded` (storage/types.ts) | `domain/settings.ts` |
| `SPEED_STEPS`, `SpeedStep`, `SpeedChoice`, `isSpeedStep`, `speedPercent` (audio/speed.ts) | `domain/speed.ts` |
| `VOICES`, `CatalogVoice`, `isBundledVoiceId` (audio/voices.ts) | `domain/voices.ts` |
| `withDefaultVoices` (audio/voices.ts) | `completeSettings` |
| `MELODY_LIMITS`, `SPECTRAL_DISTANCE_MAX` (pitch/feedback.ts) | Felder in `LanguageDef` |
| `LANG_LABEL` (app/labels.ts) | `LanguageDef.label` oder Dictionary |
| `z.enum([...4])`, `text4` (domain/schema.ts) | `textAll` aus der Registry |

---

## 2. Katalog-Abfragen: `src/content/queries.ts`

Die einzige Schnittstelle der UI zu den Inhalten. Alles sind reine Funktionen über dem validierten `Catalog`, als Hook `useCatalog()`.

```ts
export type CatalogQueries = {
  situations(): Situation[]                                   // sortiert nach order
  situation(id: string): Situation | undefined
  conceptsForSituation(id: string): Concept[]                 // heute content/resolve.ts
  concept(id: string): Concept | undefined
  usableConcepts(app: Lang, target: Lang, region?: string): Concept[]   // heute srs/session.ts
  playback(concept: Concept, target: Lang, prefs: PlaybackPrefs): Playback | null  // heute resolvePlayback
  words(): WordEntry[]; word(id: string): WordEntry | undefined           // heute content/words.ts WORDS/wordById
  wordAudioFile(id: string, lang: Lang): string | null                    // heute content/words.ts
  wordSound(id: string, lang: Lang): FormSound | undefined                // heute content/word-sounds.ts
  linksFor(concept: Concept, lang: Lang): WordLink[]                      // heute content/word-links.ts
  culture(id?: string): CultureNote[]; cultureForSituation(id: string): CultureNote[]
  langOptions(lang: Lang): LanguageOptionDef[]                            // heute content/address.ts (VI_/PT_/DE_ADDRESS)
  dialogs(situationId?: string): Dialog[]                                 // ADR-004
  splitWords(text: string, lang: Lang): string[]                          // heute content/gloss.ts, Segmentierer pro Sprache
  completeness(): Record<Lang, { missingTexts: number; missingRealizations: number; missingClips: number }>
}
export function createQueries(catalog: Catalog): CatalogQueries
```

**Ersetzt die direkten Importe:**
- `Home` → `WORDS`
- `Practice` → `wordById`, `wordAudioFile`, `spokenCitation`, `wordSound`, `Concept`
- `Settings` → `DE_/PT_/VI_ADDRESS`, `wordIds`
- `RepeatFeedback` → `splitWords`
- `srs/day.ts` → `content/words`

---

## 3. `usePlaybackPrefs()`

```ts
export type PlaybackPrefs = {
  appLang: Lang; target: Lang; region?: string
  voice: CatalogVoice                 // selectedVoice(settings, target)
  speed: SpeedChoice                  // gemerkte Wahl pro Person. Default 1 (100 %). 'auto' bleibt wählbar (Entscheid 13.11.2026)
  wordSpeed: SpeedStep
  highlightWords: boolean
  setSpeed(s: SpeedChoice): void      // speichert sofort über useSaveSettings
}
export function usePlaybackPrefs(): PlaybackPrefs
```

**Ersetzt:**
- 5× `prefsFromSettings(useSettings())` in Lookup L22, Phrase L77, Practice L155, Show L45 und Situation L29,
- die Wahl von `selectedVoice` und `spokenFile` in den Seiten.

---

## 4. `usePhrasePlayback(concept, opts?)`

```ts
export type PhrasePlaybackApi = {
  status: 'idle' | 'loading' | 'playing' | 'missing' | 'error'
  play(opts?: { speed?: SpeedStep; from?: number }): Promise<void>
  stop(): void
  speed: SpeedStep                    // effectiveSpeed(prefs.speed, card)
  words: string[]                     // splitWords der Zielsprache
  times: WordTime[] | null            // loadAlignment + alignmentScale + alignmentFitsDuration
  activeWord: number | null           // currentWordIndex(times, seconds)
  duration: number | null
  offline: boolean                    // Clip nicht im Cache
}
export function usePhrasePlayback(concept: Concept | undefined, opts?: { card?: StoredCard; variant?: string }): PhrasePlaybackApi
```

- **Verantwortung:** Clip auflösen (`playback()` → `tempoFile` → `spokenFile`), Alignment laden und prüfen, abspielen, Fortschritt für die Karaoke-Anzeige liefern und beim Unmount stoppen (`stopClip`, `stopSlices`).
- **Ersetzt** die duplizierte Logik in `PhrasePage` (`loadAlignment` L122), `PracticePage` (L209, `playClip` L171) und `ShowPage` (L63, `playClip` L148), dazu deren `useState`s `playing`, `seconds`, `times`, `clipDuration` und `offlineAudio`.

---

## 5. `useRepeatTake()`

```ts
export type RepeatTakeApi = {
  state: 'idle' | 'starting' | 'recording' | 'done' | 'denied' | 'unsupported'
  start(): Promise<void>              // stoppt laufendes Audio, startMicrophone(), Limit RECORD_LIMIT_MS (15 s)
  stop(): void
  take: Recording | null              // { url, samples, sampleRate }
  reset(): void                       // gibt die Object-URL frei (URL.revokeObjectURL)
  playBack(): Promise<void>           // eigene Aufnahme anhören
}
export function useRepeatTake(): RepeatTakeApi
```

- **Ersetzt** in `PracticePage` die `useState`s `recording`, `micStarting`, `micNote` und `take` sowie den Aufruf von `startMicrophone` (L791). In `PhrasePage` ersetzt er den Import von `startMicrophone` und `CaptureSession`.
- **Sicherheit:** Das Mikrofon startet nur nach einer Nutzeraktion. Aufnahmen bleiben im Speicher, es gibt keinen Upload.

---

## 6. `useRepeatScore(model, take)`: ab 27.11. für Vosk und 5 Sterne

```ts
export type Stars = 1 | 2 | 3 | 4 | 5
export type RepeatScoreApi = {
  status: 'idle' | 'analysing' | 'ready' | 'model-missing' | 'error'
  stars: Stars | null
  bars: { melody: BarState | null; rhythm: BarState | null; words?: BarState | null }   // words: Vosk-Erkennung
  words: FeedbackWord[]               // pro Wort Farbe, Ton
  curves: { model: Contour; user: Contour } | null   // nur Daten, Zeichnen macht die Komponente
  tone?: ToneSentence | null          // tonale Sprachen (LanguageDef.tonal)
  hint: string | null                 // ein kurzer Tipp, übersetzt
}
export function useRepeatScore(input: {
  lang: Lang; region?: string; speech: string; words: WordTime[] | null
  model: { samples: Float32Array; sampleRate: number } | null
  take: Recording | null
  analyzer?: PitchAnalyzer            // injiziert. Default: Worker. Tests: synchron. Ersetzt testsAreRunning()
  recognizer?: SpeechRecognizer       // Vosk, lokal, optional injiziert
}): RepeatScoreApi
```

- **Verantwortung:** Modell und Aufnahme analysieren (`analyzeModelCached`, `analyzeUserOnce`), bewerten (`scoreRepeat`, `starsFromVerdict` und neu die 5-Stufen-Abbildung), optional mit Vosk die Wörter erkennen. Gezeichnet wird hier nichts.
- **Ersetzt:**
  - Logik in `RepeatFeedback` L114–L317: Aufrufe von `pitchWorker`, `analyze*`, `scoreRepeat` und `starsFromVerdict`.
  - In `PracticePage` die `useState`s `modelTake`, `modelMissing`, `feedbackTimes` und `timingsPending`.
  - `testsAreRunning()` in `pitch/analyze-client.ts`.
- **Anzeige:** Die heutige Darstellung (`TakeStars` 0–3, `ScoreBar`, `Curve`, `ToneSheet`) wird zu reinen Komponenten `Stars`, `ScoreBars`, `PitchCurve` und `ToneSheet`.

---

## 7. `useStudySession()`: generische Übungs-Engine (ADR-004)

```ts
export type StudySession = {
  status: 'loading' | 'running' | 'finished' | 'empty'
  kind: SessionKind                   // 'mix' | 'review' | 'new'
  item: ExerciseItem | null
  module: ExerciseModule | null       // aus EXERCISES nach item.exerciseType
  progress: { done: number; total: number }
  ctx: ExerciseContext                // playback/take/score/prefs/catalog/copy für module.View
  complete(result: ExerciseResult): Promise<void>   // SRS: reviewCard → toStored → saveCard, dann nächstes Item
  restart(kind?: SessionKind): void
}
export function useStudySession(kind: SessionKind): StudySession

// rein und testbar, ohne React:
export function planDay(input: { modules: readonly ExerciseModule[]; catalog: CatalogQueries; cards: readonly StoredCard[];
  direction: string; now: Date; settings: Settings }): ExerciseItem[]
```

- **Ersetzt:**
  - die Ablauf-Logik in `PracticePage` (L54–935): `run`, `queue`, `index`, `stepIndex`, `answered`, `picked`, `choices`, `finished`, `readyFor`, `wordOptions`,
  - die direkten Aufrufe von `buildDay`, `newSentenceIds`, `newlyOpenSentences`, `meaningChoices`, `reviewCard`, `emptyCard`, `toStored`, `fromStored`, `previewDue`, `stepsFor` und `wordSteps`.
- `srs/day.ts` und `srs/session.ts` bleiben als reine Funktionen bestehen und werden von den `plan()`-Funktionen der Module `phrase` und `word` genutzt.

---

## 8. Übungs-Plug-ins: `src/exercises`

```ts
export type ExerciseModule<Data = unknown> = {
  type: string; version: 1; label(copy): string; icon: string
  dataSchema: z.ZodType<Data>
  available(ctx): boolean
  plan(input): ExerciseItem[]
  View: React.ComponentType<{ item: ExerciseItem; ctx: ExerciseContext; onDone(r: ExerciseResult): void }>
  actions?(state): BottomAction[]     // max. 3, für die fixe Leiste unten
}
export const EXERCISES: readonly ExerciseModule[]   // phrase, word, dialog
```

| Modul | Ersetzt heute | Neu |
|---|---|---|
| `phrase` | Schritte `slow`/`repeat`/`understand`/`recall`/`rate` in `PracticePage`, `stepsFor` | intern als Unter-Schritte |
| `word` | `word-steps.ts`, Wortblock in `PracticePage` | eigenes Modul |
| `dialog` | (neu) | Rollenspiel mit `content/dialogs/*.ts` |

---

## 9. Provider-Hooks (ADR-002)

```ts
useCatalog(): CatalogQueries; useCatalogStatus(): { ok: boolean; warnings: string[] }
useProfiles(): { people; activePersonId; storageError; add; rename; remove; switchTo; importPerson; importAll; everyone; replaceAll }
useActivePerson(): PersonRecord | null
useActiveTarget(): { target: Lang; targets: Lang[]; switchTarget(l: Lang): void; addTarget(l: Lang): void }  // nur im aktiven Profil, stoppt Audio
// switchTo(personId) schaltet uiLang + <html lang dir> + activeTarget + Settings + Karten gemeinsam um
useSettings(): Settings; useSaveSettings(): (patch: Partial<Settings>) => Promise<void>
useCards(): readonly StoredCard[]; useCard(id: string): StoredCard | undefined; useSaveCard(): (c: StoredCard) => Promise<void>
useCopy(): Dictionary                 // bleibt, liest aus useSettings
```

## 10. UI-Grundbausteine für den GUI-Umbau

```ts
<Screen title back? actions={<BottomActions>…</BottomActions>}>…scrollender Inhalt…</Screen>
<BottomActions primary={{label,onClick}} secondary?={…} tertiary?={…} />   // 1–3, immer unten fixiert, safe-area
<SpeedSwitch value={SpeedChoice} onChange />
<LangChip />  <LangSheet />   // Flagge + Kürzel im Header (Heute, Situationen) → Bottom-Sheet: Lernsprachen des Profils, Lernstand, «+ Sprache hinzufügen»
<ProfileSheet />              // Profil wechseln: zeigt pro Profil App-Sprache und Lernsprachen                                  // 70 | 85 | 100 | Automatisch, Default 100, gemerkt
<PhraseCard concept playback />  <KaraokeLine words times activeWord />  <Stars value />
```

### RTL-Bausteine (ADR-003 §6)

```ts
useDirection(): Dir                                   // aus der GUI-Sprache des aktiven Profils; Shell setzt <html lang dir>
<TargetText lang={target} as="bdi"|"p">…</TargetText> // setzt lang + dir der Zielsprache, bidi-isoliert
<AutoText>{freitext}</AutoText>                       // <bdi dir="auto"> für Namen, Übersetzungen, Suchbegriffe
<DirIcon name="back"|"next"|"chevron" />              // spiegelt per [dir=rtl] .dir-icon { transform: scaleX(-1) }
useSwipe({ onNext, onPrev })                          // vertauscht links/rechts, wenn useDirection() === 'rtl'
formatCount(n, total, uiLang): string                 // Intl.NumberFormat, in <bdi> gerendert
```

Ersetzt: feste `‹`/`›`-Zeichen und physische `left/right`-Styles in Seiten, das fest verdrahtete `lang="de-CH"` in `index.html`.

Damit ist die fixe Aktionsleiste ein einziger Baustein und nicht mehr Sache jeder Seite. Heute löst `e2e/word-continue.spec.ts` das Problem «Replay und Weiter überlappen» noch pro Seite.
