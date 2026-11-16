# ADR-003: Neue Sprachen mit minimalem Aufwand

- **Status:** vorgeschlagen (13.11.2026). Zentrales Architekturprinzip, Vorgabe des Projektinhabers.
- **Repo-Stand:** Commit `8ae1686`
- **Bezug:** ADR-001 (Schichten), ADR-004 (Inhalte und Übungen)

## Ziel

Für eine neue Sprache, egal ob App-Sprache oder Zielsprache, braucht es nur:

1. Übersetzungs- und Inhaltsdateien,
2. die generierten Audiodateien,
3. **einen** Eintrag in der Sprach-Registry.

Seiten, Komponenten, Hooks und Dienste werden **nicht** geändert. Wenn die Validierung, die Tests und der Build grün sind, ist die Sprache fertig.

## Kontext: wo Sprachen heute fest eingebaut sind

| Stelle | Heute |
|---|---|
| `content/phrase.ts` | `LANGS = ['de','en','pt-BR','vi'] as const`. Der Typ `Lang` ist eine feste Union. |
| `src/domain/direction.ts` | `APP_LANGS`, `LONG`, `shortLang()` mit `pt-BR → pt`, dazu `isLang()` mit 4 festen Vergleichen |
| `src/domain/schema.ts` | `z.enum([...4])` und `text4` mit 4 festen Schlüsseln |
| `src/domain/pairs.ts` | 7 feste Alt-Paare (nur Legacy) |
| `src/app/labels.ts` | `LANG_LABEL: Record<Lang, Record<Lang,string>>`, eine 4×4-Matrix |
| `src/i18n/dictionary.ts` | 1883 Zeilen, `de`, `en`, `pt`, `vi` in einer Datei, `dictionaries = { de, en, 'pt-BR': pt, vi }` |
| `src/audio/voices.ts` | `VOICES` mit festen Stimmen, `PREVIEW: Record<Lang,string>` |
| `src/pitch/feedback.ts` | `MELODY_LIMITS: Record<Lang, …>` |
| `src/storage/types.ts` | Sprachspezifische Felder `addressVi`, `addressPt`, `addressDe`, `ptSpeaker`, `viContact`, `viRegion` |
| `src/pages/Settings.tsx` | eigene `<select>` pro Sprache (`VI_ADDRESS`, `PT_ADDRESS`, `DE_ADDRESS`) |
| `content/address.ts`, `content/words.ts` (`FILLERS`), `content/word-sounds.ts` | `Record<Lang, …>` |
| gesamter `src/` ohne Tests | 29 Dateien mit `'pt-BR'`/`'vi'`-Literalen, rund 30 Vergleiche `lang === '…'` |

Positiv ist: `Record<Lang, string>` in den Inhalten erzwingt schon heute zur Compile-Zeit, dass jede Übersetzung vorhanden ist. Das nutzen wir weiter.

## Entscheid

### 1. Sprach-Registry als einzige Quelle

```ts
// src/domain/languages.ts  (Teil von domain, keine Importe aus src/)
export type LanguageDef = {
  code: string               // BCP 47, z.B. 'de', 'pt-BR', 'vi', künftig 'es', 'th', 'ar'
  short: string              // Datei- und Richtungs-Kürzel: 'pt'
  roles: { app: boolean; target: boolean }   // App-Sprache und/oder Zielsprache
  label: Record<string, string> | 'from-dictionary'  // Eigenname plus Name in anderen Sprachen
  dir: 'ltr' | 'rtl'
  script: 'latin' | 'latin-diacritics' | 'cyrillic' | 'arabic' | 'thai' | 'cjk' | 'devanagari' | string
  fontStack?: string         // optional: zusätzliche System-Schriften, keine Webfont-Pflicht
  regions?: readonly { id: string; label: Record<string,string>; default?: boolean }[]  // vi: south/north
  tonal?: boolean            // steuert die Ton-Ansicht im Feedback
  melody: { green: number; yellow: number }   // heute MELODY_LIMITS
  fallback: string[]         // App-Text-Fallback, z.B. ['pt-BR'] für 'pt-PT', am Ende immer 'en'
  options?: readonly LanguageOptionDef[]      // sprachspezifische Einstellungen (Anrede, Sprecher …)
  fillers?: readonly string[]                 // heute FILLERS
  status: 'live' | 'beta' | 'hidden'          // hidden: im Build, aber nicht wählbar
}

export const LANGUAGES = [de, en, ptBR, vi] as const satisfies readonly LanguageDef[]
export type Lang = (typeof LANGUAGES)[number]['code']  // bleibt eine Union, damit Record<Lang,…> weiter prüft
export const APP_LANGS = LANGUAGES.filter(l => l.roles.app).map(l => l.code)
export const TARGET_LANGS = LANGUAGES.filter(l => l.roles.target).map(l => l.code)
export const isLang = (v: unknown): v is Lang => LANGUAGES.some(l => l.code === v)
export const shortLang = (lang: Lang) => byCode(lang).short
```

Pro Sprache gibt es eine Datei `src/domain/languages/<code>.ts`. Daraus leiten sich ab: `APP_LANGS`, `isLang`, `shortLang`, `LONG`, der Zod-Enum (`z.enum(LANG_CODES)`), `text4`, das zu `textAll = z.strictObject(Object.fromEntries(LANG_CODES.map(c => [c, str])))` wird, `MELODY_LIMITS` und `FILLERS`.

### 2. Sprachspezifische Einstellungen als Daten statt Felder

`addressVi`, `addressPt`, `addressDe`, `ptSpeaker`, `viContact` und `viRegion` werden zu:

```ts
type Settings = { …; langOptions: Partial<Record<Lang, Record<string, string>>> }
type LanguageOptionDef = {
  id: 'address' | 'speaker' | 'contact' | 'region' | string
  label: Record<Lang, string>
  choices: readonly { id: string; label: string; note?: Record<Lang,string>; default?: boolean }[]
}
```

- Die Seite «Einstellungen» rendert generisch `def.options` für die gewählte Zielsprache. Es gibt kein `if (target === 'vi')` mehr.
- **Migration:** Beim Laden werden die alten Felder in `langOptions` übertragen. Das Exportformat 3 bleibt lesbar, Format 4 schreibt `langOptions`.

### 3. Übersetzungen pro Datei

- `src/i18n/dictionary.ts` wird aufgeteilt in `src/i18n/<code>.ts`.
- Der Typ `Dictionary` bleibt die Vollständigkeits-Garantie: Jede Datei muss alle Schlüssel liefern (`satisfies Dictionary`).
- `dictionaries` wird automatisch aus der Registry gebaut.
- Optional später: Lazy Loading pro Sprache mit `import()`, damit das Bundle nicht mit jeder Sprache wächst. Offline bleibt gesichert, weil der Service Worker alle Chunks vorab lädt.

### 4. Stimmen-Zuordnung

- `VOICES` bleibt eine Datenliste in `domain/voices.ts` mit `lang`, `gender`, `provider`, `bundled`, `defaultNew` und `order`.
- `PREVIEW: Record<Lang,string>` fällt weg. Die Hörprobe ist immer `VOICE_SAMPLE` (`voice.sample__any__base.m4a`) pro Stimme. Gemäss Vorgabe des Projektinhabers sind das 1–2 natürliche Sätze, also ein Gruss und eine kurze Vorstellung.
- **Regel:** Jede Zielsprache braucht mindestens eine Stimme mit `defaultNew: true`. Die Validierung (siehe unten) prüft das.
- App-Sprachen ohne Zielrolle brauchen keine Stimme.

### 5. Fallback-Regeln

| Was fehlt | Verhalten |
|---|---|
| App-Text (Dictionary-Schlüssel) | Darf nicht fehlen, der Compiler bricht ab. Nur bei `status: 'beta'`: Laufzeit-Fallback über `fallback[]` bis `en`, sichtbar markiert. |
| Inhaltstext einer Phrase (`context`, `title` …) | Darf für `live` nicht fehlen, die Validierung bricht den Build ab. Für `beta` gilt der Fallback auf `en`, mit Hinweis «noch nicht übersetzt». |
| Realisierung in der Zielsprache | Die Phrase wird für diese Zielsprache ausgeblendet. Das macht `usableConcepts` heute schon so, neu ist sie zusätzlich in der Vollständigkeitsliste sichtbar. |
| Audio-Datei | Text ohne Play-Knopf mit Hinweis «Audio folgt». `tools/check-clips.ts` meldet die Datei im CI als Fehler für `live`. |
| Region (vi north) | Fallback auf die Default-Region der Sprache |

### 6. Schrift und Leserichtung (RTL), verbindlich (Vorgabe des Projektinhabers, 13.11.2026)

RTL-Sprachen (Arabisch, Hebräisch, Persisch, Urdu …) müssen ohne Umbau möglich sein, als App-Sprache und als Lernsprache.

**Registry**
- Jede `LanguageDef` hat `dir: 'ltr' | 'rtl'` als Pflichtfeld, ohne Default. Ein Eintrag ohne `dir` bricht den Typecheck.
- Dazu gibt es eine **Pseudosprache** `ar-XB` (`status: 'hidden'`, `dir: 'rtl'`, `pseudo: true`). Ihre Texte werden aus `de` erzeugt (umgedreht oder mit RTL-Zeichen umrahmt, z.B. `‏[Heute lernen]‏`), damit RTL ohne echte Übersetzung testbar ist. Sie ist nie Teil der Browser-Erkennung und erscheint nur in Dev-Builds und Tests.

**Dokument-Richtung folgt dem aktiven Profil**
- Die `Shell` setzt `<html lang={uiLang} dir={def.dir}>` aus der **GUI-Sprache des aktiven Profils**. Beim Profilwechsel und beim Ändern der App-Sprache wird das sofort aktualisiert. Heute ist `index.html` fest `lang="de-CH"`, ohne `dir`.
- Ein Hook `useDirection()` liefert `'ltr' | 'rtl'` für die wenigen Stellen, die JavaScript brauchen (Swipe, Animationen, Canvas).

**Lerninhalte mit eigener Richtung (gemischte Richtung)**
- Text in der Zielsprache wird immer isoliert gerendert: `<bdi lang={target} dir={targetDef.dir}>` für Inline-Text, `<p lang={target} dir={targetDef.dir}>` für Blöcke. Beispiel: arabische GUI, vietnamesischer Satz → Satz bleibt LTR; deutsche GUI, hebräischer Satz → Satz RTL.
- Freitext aus Daten mit unklarer Richtung (Personennamen, Übersetzungen, Suchbegriffe) bekommt `dir="auto"`, damit Satzzeichen nicht springen (sonst wird aus «Die Speisekarte, bitte.» in RTL «.Die Speisekarte, bitte»).
- Zahlen, Prozente und Zähler (`2 / 6`, `85 %`) werden mit `Intl.NumberFormat(uiLang)` formatiert und in `<bdi>` isoliert.
- Die Karaoke-Markierung (`KaraokeLine`) arbeitet auf Wort-Spans in der Reihenfolge des Textes und nicht auf Pixel-Positionen, das funktioniert auch bei RTL. Der Fortschritt läuft in Leserichtung des Inhalts.

**CSS nur mit logischen Eigenschaften**
- `margin-inline-start` statt `margin-left`, `padding-inline-end` statt `padding-right`, `inset-inline-start` statt `left`, `border-inline-end` statt `border-right`, `text-align: start/end` statt `left/right`, `float: inline-start`.
- Erlaubte Ausnahme: symmetrische Zentrierung (`left: 50%` plus `translateX(-50%)`) und `inset-inline: 0`. Ausnahmen brauchen einen Kommentar `/* rtl-ok: Grund */`.
- **Lint-Regel:** Stylelint mit `stylelint-use-logical` (bzw. `liberty/use-logical-spec`) auf Fehler-Stufe in der CI. Zusätzlich eine ESLint-Regel `no-restricted-syntax` gegen Inline-Styles mit `marginLeft`, `paddingRight`, `left`, `right`, `textAlign: 'left'|'right'` in TSX. Vor dem Einführen der Regel ein einmaliger Umbau (siehe Issue R7).

**Icons, Pfeile und Gesten spiegeln**
- Richtungs-Icons (Zurück ‹, Weiter ›, Chevrons in Listen, «Weiter»-Pfeile, Fortschritt) bekommen die Klasse `.dir-icon` und werden mit `[dir=rtl] .dir-icon { transform: scaleX(-1) }` gespiegelt.
- **Nicht** gespiegelt werden: Play ▶ und Pause, Mikrofon, Häkchen, Sterne, Uhr, Logos, Medien-Zeitachse (internationaler Standard: Play zeigt immer nach rechts).
- Swipe-Gesten (z.B. Karte wischen = weiter) werden über `useDirection()` gespiegelt: In RTL bedeutet Wischen nach rechts «weiter».
- Die Tab-Leiste und die fixe Aktionsleiste spiegeln sich durch Flexbox und logische Eigenschaften automatisch. Die Hauptaktion steht immer am **Ende** (`inline-end`), also in RTL links.

**Schriften**
- Es bleibt beim System-Font-Stack, ohne externe Webfonts (offline, Datenschutz). `fontStack` ergänzt pro Schrift Systemschriften (z.B. `"Noto Sans Arabic", "Geeza Pro"` oder `"Noto Sans Thai", "Thonburi"`).
- Arabische Schrift braucht etwas mehr Zeilenhöhe (`line-height` pro Schrift in `LanguageDef.typography`).
- **Schriften ohne Wortabstände** (Thai, CJK): `gloss.splitWords` braucht pro Sprache einen Segmentierer. Wo der Browser `Intl.Segmenter` hat, wird dieser genutzt. Das ist eine Option in `LanguageDef`, der Default ist «Leerzeichen».

**Tests (siehe [`testplan.md`](../testplan.md))**
- Unit: `direction.test.ts` prüft, dass jede Registry-Sprache `dir` hat und `<html dir>` dem aktiven Profil folgt.
- Visueller Playwright-Test **J9 RTL** mit der Pseudosprache `ar-XB` (Screenshots von Heute, Situation, Üben, Ich; Prüfung, dass Zurück-Pfeil am rechten Rand und Hauptaktion links steht, nichts abgeschnitten ist und Lerninhalt LTR bleibt).

### 7. App-Sprache beim ersten Start (Vorgabe des Projektinhabers, 13.11.2026)

- Beim **ersten Start** wird die App-Sprache aus der Browsersprache bestimmt:
  - `navigator.languages` wird in Reihenfolge durchgegangen. Es gilt die erste Sprache, die in der Registry als App-Sprache (`roles.app`) eingetragen ist und nicht `hidden` ist.
  - **Match-Regeln** (pro Eintrag): zuerst exakt, ohne Gross- und Kleinschreibung (`pt-BR` → `pt-BR`). Dann der Basis-Match: Der Browser-Eintrag wird auf die Basissprache gekürzt (`pt-BR`, `pt-PT` → `pt`), diese wird mit `code` oder `short` der Registry verglichen (`pt` → `pt-BR`, `de-CH` → `de`, `en-GB` → `en`).
  - **Keine Übereinstimmung** → Englisch (`en`).
- Die **Lernsprache** wird nicht automatisch gewählt, sondern im Onboarding (weitere jederzeit über den Sprach-Chip, siehe 7a).
- Beide Sprachen sind jederzeit in den Einstellungen änderbar.
  - Eine manuelle Wahl der App-Sprache wird gespeichert (`Settings.appLang` plus `appLangSource: 'manual'`) und hat ab dann Vorrang vor der Browser-Erkennung.
  - Solange `appLangSource` den Wert `'detected'` hat, darf ein neuer Start mit geänderter Browsersprache neu erkennen. Mit `'manual'` nie.
- Das Onboarding zeigt die erkannte Sprache vorausgewählt an, mit dem Hinweis «erkannt aus deinem Browser» und der Möglichkeit, sie zu ändern.
- Eine neue Sprache in der Registry wird automatisch Teil der Erkennung. Dafür ist kein Code nötig.

### 7a. Sprachen pro Profil und schneller Lernsprachwechsel (Vorgabe des Projektinhabers, 13.11.2026)

- GUI-Sprache und Lernsprachen werden **pro Profil** gespeichert (ADR-002). Die Erkennung oben gilt für den ersten Start **und für jedes neu angelegte Profil**. Ein Profil mit `uiLangSource: 'manual'` behält seine Sprache, egal welcher Browser.
- **Schneller Wechsel der Lernsprache:** Sprach-Chip (Flagge + Kürzel, z.B. «🇻🇳 VI») oben im Header von Heute und Situationen. Ein Tipp öffnet ein Bottom-Sheet mit den Lernsprachen des aktiven Profils (mit Lernstand) und «+ Sprache hinzufügen» (Liste aus der Registry, `roles.target`, nicht `hidden`). Fortschritt und Einstellungen sind pro Lernsprache getrennt.
- Der Chip zeigt nur Lernsprachen des aktiven Profils. Profile wechselt man über den Avatar bzw. «Ich» → «Profil».
- Neue Zielsprachen in der Registry erscheinen automatisch unter «Sprache hinzufügen», ohne Code.

### 8. Katalog-Validierung prüft Vollständigkeit

`validateCatalog(catalog, LANGUAGES)` läuft in drei Stufen:

- im Unit-Test,
- im Build über das Script `npm run check:content`,
- zur Laufzeit wie heute `tryLoadCatalog`.

Sie prüft für jede Sprache mit Status `live` fünf Punkte:

- alle Mehrsprachen-Texte (Situation, Kultur, Phrase, Wörter) haben einen nicht leeren Eintrag,
- jede Phrase hat eine Realisierung pro Zielsprache, oder sie ist ausdrücklich ausgeschlossen (`excludeTargets`),
- jede Zielsprache hat mindestens eine Stimme mit `defaultNew` und dazu eine Hörprobe,
- alle Audio-Dateien aus `allSpeechLines()` existieren im Manifest, bei 3 Tempi (`.r70`, `.r85`, Original),
- `options`-Choices haben Übersetzungen in allen App-Sprachen.

**Ergebnis:** eine lesbare Liste nach dem Muster «vi: 3 Phrasen ohne Realisierung, 12 Clips fehlen». Für `beta` ist die Liste nur eine Warnung.

## Checkliste «Neue Sprache hinzufügen»

1. [ ] Den BCP-47-Code festlegen, z.B. `es`, und dazu das Kürzel (`short`).
2. [ ] `src/domain/languages/es.ts` anlegen: Rollen, Leserichtung, Schrift, Regionen, tonal, Melodie-Grenzen, Fallback, Optionen (Anredeformen), Füllwörter. Start mit `status: 'hidden'`.
3. [ ] Die Sprache in `LANGUAGES` eintragen. Das ist die **einzige** Code-Zeile ausserhalb der neuen Dateien.
4. [ ] Nur wenn sie App-Sprache wird: `src/i18n/es.ts` mit `satisfies Dictionary` anlegen. Der Compiler zeigt jeden fehlenden Schlüssel. Die Browser-Erkennung (`resolveInitialUiLang`) berücksichtigt die Sprache danach automatisch.
5. [ ] Inhalte ergänzen. Der Compiler und `npm run check:content` zeigen jede Lücke.
   - In allen `Record<Lang,…>` in `content/` einen `es:`-Eintrag (Situationen, Kultur, Phrasen-Kontext, Wörter, Anredenotizen).
   - Nur wenn sie Zielsprache wird: Realisierungen in `content/phrases/*.ts` (`es: { text, speech? }`).
6. [ ] Nur wenn sie Zielsprache wird: Stimmen.
   - Eintrag in `domain/voices.ts`.
   - Audio mit `tools/generate_audio.py`, `generate_xtts.py` und `generate_words.py` erzeugen (3 Tempi).
   - Ausrichtung mit `tools/align_clips.py`.
   - Hörprobe mit 1–2 natürlichen Sätzen.
   - `npm run test:clips`.
7. [ ] Wenn nötig, sprachspezifische Anpassungen: Wortsegmentierung für Schriften ohne Leerzeichen, Ton-Darstellung bei tonalen Sprachen.
   - **Bei RTL-Sprachen:** `dir: 'rtl'` in der Registry, `fontStack` und Zeilenhöhe prüfen, J9 (RTL) einmal mit der echten Sprache statt der Pseudosprache laufen lassen und Screenshots von einer Muttersprachlerin oder einem Muttersprachler prüfen lassen. Kein Code in Seiten oder Komponenten nötig.
8. [ ] `npm run typecheck && npm run lint:css && npm test && npm run check:content && npm run test:overflow` müssen grün sein, dazu J9 (RTL). Der Test «jede registrierte Sprache vollständig» steht im [`testplan.md`](../testplan.md).
9. [ ] Status `beta` setzen, die Sprache mit einer Muttersprachlerin oder einem Muttersprachler prüfen (Flag `geprueft`), danach `live`.
10. [ ] Sicherheitsprüfung gemäss Regel des Projektinhabers. Bei reinen Inhalts-PRs heisst das: keine neuen Abhängigkeiten, keine externen URLs ausser bei `source.url` (https-Regex bleibt), Audio-Dateinamen passen zu `AUDIO_FILE`.

**Nicht nötig:** Änderungen an `pages/`, `components/`, `hooks/` oder `app/`. Wenn doch, ist das ein Architekturfehler und wird als eigenes Issue erfasst.

## Folgen

- **Positiv:** Eine Sprache kostet fast nur Inhalt und Audio. Fehler fallen im Build auf, nicht bei Nutzern. RTL- und Schrift-Themen sind einmal gelöst.
- **Negativ:** Es braucht eine einmalige Migration der Einstellungen (`langOptions`) und ein Exportformat 4. Die Registry-Typen sind etwas abstrakter.
- **Sicherheit:** Der Import alter Sicherungen muss beim Format-Wechsel weiter streng validieren (Zod `strictObject`). `langOptions`-Werte werden gegen die Choices der Registry geprüft, damit kein freier Text in Dateinamen oder HTML landet.
