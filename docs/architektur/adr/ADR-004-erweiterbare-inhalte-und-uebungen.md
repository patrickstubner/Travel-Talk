# ADR-004: Erweiterbare Inhalte und Übungsarten als Plug-ins

- **Status:** vorgeschlagen (13.11.2026). Vorgabe des Projektinhabers.
- **Repo-Stand:** Commit `8ae1686`
- **Bezug:** ADR-001, ADR-003, Review-Befunde 2 und 5

## Ziel

1. **Mehr Inhalt in bestehenden Sprachen:** Mehr Wörter, Phrasen, Beispiele und Situationen erfordern **nur** Inhaltsdateien und Audio, keinen Code.
2. **Neue Übungsarten** (zum Beispiel Rollenspiel oder Dialog) sind ein **Plug-in-Modul** mit klarer Schnittstelle. Die Übungs-Engine bleibt generisch, und die Seite «Üben» muss für eine neue Übungsart nicht angepasst werden.

## Kontext

- **Zwei Zugriffswege auf Inhalte:** Phrasen, Situationen und Kultur laufen über `rawCatalog` (`content/index.ts`) und das Zod-Schema (`domain/schema.ts`). Wörter (`content/words.ts`), Wortklänge (`content/word-sounds.ts`), Anredeformen (`content/address.ts`) und Glossen umgehen das Schema und werden direkt von Seiten importiert (Graphify: Home, Practice, Settings, RepeatFeedback, srs/day).
- **Neue Phrasengruppe braucht Code:** Sie muss in `content/index.ts` von Hand importiert werden (`emergencyPhrases`, `meetingPhrases` …).
- **Übungsschritte sind fest verdrahtet:**
  - `LearnStep = 'slow' | 'normal' | 'repeat' | 'understand' | 'recall' | 'rate' | 'word'` in `srs/session.ts`.
  - `stepsFor(isNew)` liefert feste Folgen.
  - `PracticePage` (935 Zeilen, 25 `useState`) rendert jeden Schritt mit eigener Logik.
  - Eine neue Übungsart heisst heute: `Practice.tsx` umbauen.

## Entscheid A: Inhalte rein datengetrieben

### Struktur

```
content/
  situations/<id>.ts        eine Datei pro Situation (Metadaten)
  phrases/<situation>.ts    Phrasen (wie heute)
  words/<gruppe>.ts         Wörter (heute words.ts)
  dialogs/<id>.ts           neu: Dialoge für Rollenspiele
  culture/<id>.ts
  options/address-<lang>.ts Anredeformen (Teil von ADR-003)
  index.generated.ts        wird vom Script erzeugt, nicht von Hand gepflegt
```

- `content/index.generated.ts` wird von `tools/gen-content-index.ts` erzeugt. Das Script läuft bei `prebuild`, `pretest` und in der CI. Eine neue Datei braucht dann keinen Import-Eintrag von Hand.
- Warum ein generierter Index statt `import.meta.webpackContext` (Rsbuild) oder `import.meta.glob` (Vitest/Vite): Rsbuild und Vitest verstehen nicht dieselbe Glob-Syntax, der erzeugte Index funktioniert in beiden. In der CI schlägt `git diff --exit-code` fehl, wenn der Index veraltet ist.
- **Alles läuft durch ein Schema:** `catalogSchema` wird erweitert um `words`, `wordSounds`, `addressForms` (beziehungsweise `langOptions`), `dialogs` und `exercises`.
- **Referenzen werden geprüft:**
  - `situationIds` der Phrasen und Dialoge existieren.
  - Wörter in `sentences` zeigen auf existierende Phrasen.
  - Dialogzeilen zeigen auf existierende Phrasen oder bringen eigene Realisierungen mit.
- **IDs sind stabil und eindeutig.** Die Validierung meldet Duplikate. Lernstände (`cardIdFor(direction, id)`) hängen an diesen IDs, deshalb werden IDs nie umbenannt, nur ergänzt.
- **UI-Zugriff nur über Abfragen** in `src/content/queries.ts` (siehe [`bausteine.md`](../bausteine.md)), nie direkt auf `content/*`.

### Checkliste «Neue Inhalte hinzufügen»

**Neue Phrase oder neues Beispiel**
1. [ ] Mit `phrase({ id, situationIds, context, de, en, pt, vi })` in `content/phrases/<situation>.ts` anlegen. Die ID nach dem Muster `situation.kurzname` wählen, sie bleibt für immer.
2. [ ] Ein Eintrag pro Zielsprache, Varianten optional. `geprueft: false`, bis eine Muttersprachlerin oder ein Muttersprachler geprüft hat.
3. [ ] Audio erzeugen und ausrichten: `tools/generate_audio.py` (3 Tempi 70/85/100 %) und `tools/align_clips.py`.
4. [ ] `npm run check:content && npm run test:clips` müssen grün sein.

**Neues Wort**
1. [ ] In `content/words/<gruppe>.ts`: `id: 'w.<englisch>'`, `citation` pro Sprache, `sentences` mit Phrasen-IDs.
2. [ ] `tools/generate_words.py` laufen lassen, dann `check:content`.

**Neue Situation**
1. [ ] `content/situations/<id>.ts` mit `order`, `depth`, `title`, `summary` und `canDo` in allen Sprachen anlegen.
2. [ ] Mindestens 4 Phrasen anlegen, optional einen Kulturhinweis und einen Dialog.
3. [ ] Die Situation erscheint automatisch auf Home und unter Situationen. Kein Code nötig.

**Für alle drei gilt:** keine Änderung in `src/`. Die Sicherheitsprüfung beschränkt sich auf Inhalt: keine Skripte oder HTML in Texten (`RichText` erlaubt nur das definierte Markup), Quellen nur als `https`-Links, Dateinamen passen zu `AUDIO_FILE`.

## Entscheid B: Übungsarten als Plug-ins

### Schnittstelle

```ts
// src/exercises/types.ts
export type ExerciseContext = {
  catalog: CatalogQueries          // nur lesend
  app: Lang; target: Lang; region?: string
  prefs: PlaybackPrefs             // Tempo, Stimme, Wortmarkierung
  playback: PhrasePlaybackApi      // aus usePhrasePlayback
  take: RepeatTakeApi              // Mikrofon: aus useRepeatTake
  score: RepeatScoreApi            // Bewertung, 5 Sterne: aus useRepeatScore
  copy: Dictionary
}

export type ExerciseItem = { exerciseType: string; id: string; isNew: boolean }   // ersetzt DayItem.kind

export type ExerciseResult =
  | { kind: 'graded'; cardIds: string[]; grade: Grade }      // geht ins SRS
  | { kind: 'practised'; cardIds: string[]; stars?: 1|2|3|4|5 }  // nur Statistik
  | { kind: 'skipped' }

export type ExerciseModule<Data = unknown> = {
  type: string                                   // 'phrase', 'word', 'dialog' …
  version: 1
  label: (copy: Dictionary) => string            // für Home und Übungsauswahl
  icon: string                                   // Name aus dem Icon-Set, keine externe Datei
  dataSchema: z.ZodType<Data>                    // validiert Inhalte dieses Typs im Katalog
  available: (ctx: Pick<ExerciseContext,'catalog'|'app'|'target'>) => boolean
  plan: (input: { catalog: CatalogQueries; cards: readonly StoredCard[]; direction: string; now: Date; budget: number }) => ExerciseItem[]
  View: React.ComponentType<{ item: ExerciseItem; ctx: ExerciseContext; onDone: (r: ExerciseResult) => void }>
  actions?: (state: unknown) => BottomAction[]   // 1–3 Knöpfe für die fixe Leiste unten
}

// src/exercises/registry.ts
export const EXERCISES = [phraseExercise, wordExercise, dialogExercise] as const satisfies readonly ExerciseModule[]
```

### Generische Engine

- **`useStudySession()`** (siehe [`bausteine.md`](../bausteine.md)) verteilt das Tagesbudget auf die Module, die `available` sind. Dafür ruft sie `plan()` jedes Moduls auf, mischt die Elemente und führt durch die Liste.
  - Die heutige Logik aus `srs/day.ts` (`buildDay`, `WORD_BLOCK`, `newCardBudget`) wandert in die `plan()`-Funktionen von `phrase` und `word`.
- **`PracticePage`** rendert nur noch:
  - Fortschritt oben,
  - `module.View` in der Mitte,
  - die fixe Aktionsleiste unten mit den Aktionen des Moduls.
- **SRS-Anbindung zentral:** Nur die Engine schreibt Karten (`reviewCard` → `toStored` → `saveCard`). Module liefern bloss `ExerciseResult`.
- **Heutige Schritte werden Teil des Moduls `phrase`:** `slow`, `repeat`, `understand`, `recall` und `rate` sind dann interne Unter-Schritte. Das Wort-Training (`word-steps.ts`) wird das Modul `word`.

### Beispiel: Übungsart «Rollenspiel/Dialog»

```ts
// content/dialogs/cafe-order.ts
export default dialog({
  id: 'dialog.cafe-order',
  situationIds: ['restaurant'],
  title: { de: 'Im Café bestellen', en: 'Ordering at a café', 'pt-BR': 'Pedindo no café', vi: 'Gọi món ở quán cà phê' },
  roles: [
    { id: 'guest', label: { de: 'Gast', en: 'Guest', 'pt-BR': 'Cliente', vi: 'Khách' }, learner: true },
    { id: 'staff', label: { de: 'Bedienung', en: 'Staff', 'pt-BR': 'Atendente', vi: 'Nhân viên' } },
  ],
  lines: [
    { role: 'staff', phraseId: 'restaurant.what-would-you-like' },          // bestehende Phrase
    { role: 'guest', phraseId: 'restaurant.coffee-please', expect: 'say' }, // Lernende sprechen
    { role: 'staff', text: { /* eigene Realisierung pro Sprache */ }, audio: true },
    { role: 'guest', choices: ['restaurant.with-milk', 'restaurant.without-sugar'], expect: 'choose-and-say' },
  ],
})
```

- **`dialogExercise.dataSchema`** validiert:
  - Rollen sind eindeutig, genau eine davon `learner`.
  - Jede Zeile hat entweder `phraseId` oder `text` in allen Sprachen.
  - `choices` zeigt auf existierende Phrasen.
  - Für jede Zeile existiert Audio.
- **Ablauf in `View`:**
  - Zeilen der Gegenrolle werden abgespielt (`playback`).
  - Bei `say` nimmt `take` auf, und `score` vergibt 1–5 Sterne.
  - Bei `choose-and-say` wählt man zuerst eine Antwort und spricht sie dann.
  - Am Ende kommt `practised` mit den Sternen. Die enthaltenen Phrasen-Karten werden mit `graded` bewertet, wenn alle Zeilen mindestens 3 Sterne haben.
- **Aktionsleiste:** [Nochmals hören] [Sprechen] [Weiter], immer unten fixiert.

### Checkliste «Neue Übungsart hinzufügen»

1. [ ] Ordner `src/exercises/<typ>/` mit `index.ts` (das `ExerciseModule`), `View.tsx` und `schema.ts` anlegen.
2. [ ] Das Datenformat als Zod-Schema definieren, die Daten liegen unter `content/<typ>s/`.
3. [ ] `plan()` als reine Funktion schreiben, mit Unit-Test.
4. [ ] `View` nutzt nur `ctx`, also kein direkter Import aus `audio/`, `storage/` oder `pitch/`. ADR-001 und dependency-cruiser prüfen das.
5. [ ] Das Modul in `EXERCISES` eintragen. Das ist die **einzige** Änderung ausserhalb des Ordners.
6. [ ] Texte für Label und Hilfe in allen `src/i18n/<code>.ts` ergänzen, der Compiler prüft die Vollständigkeit.
7. [ ] Tests:
   - Unit-Tests für `plan` und `schema`.
   - Komponententest mit `renderWithApp`.
   - Der generische Vertragstest «jedes Modul erfüllt die Schnittstelle» läuft automatisch (siehe [`testplan.md`](../testplan.md)).
8. [ ] Eine Playwright-Journey nur, wenn die Übung einen neuen Hauptfluss bringt.
9. [ ] Sicherheitsprüfung: Mikrofon nur nach Nutzeraktion, Aufnahmen bleiben lokal (kein Upload, frontend-only), keine neuen Abhängigkeiten ohne Prüfung.

**Nicht nötig:** Änderungen an `PracticePage`, `useStudySession`, den Providern oder der Navigation.

## Folgen

- **Positiv:** Inhalt wächst ohne Code. Neue Übungsarten bleiben isoliert und testbar, und die Übungsseite wird klein. Das Rollenspiel kommt ohne Umbau dazu.
- **Negativ:**
  - Die Migration von `Practice.tsx` ist der grösste einzelne Umbau und hängt an R3 bis R5.
  - Für die Wort-Daten braucht es eine einmalige Schema-Erweiterung.
  - `DayItem.kind` wird zu `exerciseType`. Bestehende Lernstände bleiben unverändert, weil die Karten-IDs gleich bleiben.
- **Sicherheit:** Dialogtexte laufen durch dieselbe `RichText`-Whitelist. Aufnahmen bleiben wie heute im Speicher und werden nicht persistiert, ausser es wird ausdrücklich anders entschieden.
