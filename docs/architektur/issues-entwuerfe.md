# GitHub-Issue-Entwürfe (angelegt am 13.11.2026 als #59–#70)

- **Stand:** 16.11.2026
- **Repo:** patrickstubner/Travel-Talk
- **Hinweis:** Die Issues können so eingefügt werden. Angelegt werden sie erst nach Okay des Projektinhabers.
- **Sicherheitsprüfung (gilt für alle Issues):** Nach jeder Code-Änderung macht der Entwickler-Bot eine detaillierte Sicherheits- und Schwachstellenprüfung, inklusive verwundbarer Libraries (`npm audit`). Er nennt die Schweregrade und schlägt Fixes vor. Das Ergebnis steht als Abschnitt «Sicherheitsprüfung» im PR.
- **Rahmen:** Travel Talk bleibt **reines Frontend**: kein Backend, keine Server-Calls, Daten bleiben lokal.
- **Labels:** Es werden nur Labels verwendet, die im Repo existieren (Stand 13.11.: `enhancement`, `accessibility`, `documentation` und weitere Standard-Labels). Zugeordnet: R1–R7 ohne Label, G1–G4 `enhancement` (G1 zusätzlich `accessibility`), R8 `enhancement`.
- **Entscheide vom 13.11.2026:** Tempo-Standard 100 % mit wählbarer Automatik. Rollenspiel nach dem GUI-Umbau. Die Merge-Regel für Travel-Talk reicht, keine extra Vorschau.
- **Entscheide vom 16.11.2026 (Projektinhaber):** 4 Tabs (Heute, Situationen, Zeigen, Ich), «Nachschlagen» im Tab Situationen. Kein Fokus-Modus: Tab-Leiste auch in Übungen und auf der Phrasen-Seite sichtbar. Die Sterne-Bedingungen in [`gui-konzept.md`](gui-konzept.md) sind die verbindliche Basis für die Kalibrierung am 27.11.

---

## R1 · Sicherheitsnetz: Journeys, Lücken-Tests, gemeinsamer Test-Helfer

**Kontext**
- Vor dem Umbau braucht es Tests, die unabhängig vom Layout sind (Review-Befund 7, [`testplan.md`](testplan.md)).
- Heute fehlen Tests für `domain/direction.ts`, `register-sw.ts`, `router.tsx` und die Seiten Situation, Lookup und Culture. 16 Seitentests haben eigene `Ready*`-Wrapper.

**Umfang**
- `src/test/render-with-app.tsx` (`renderWithApp`, `fakeAudio`, `card`), vorerst über der bestehenden `AppProvider`
- `e2e/journeys/` mit J1–J6 ([`testplan.md`](testplan.md)), Playwright-Projekte `journeys`, `layout` und `offline`
- Unit-Tests für `direction.ts`, Router-Smoke und `register-sw.ts`
- 3–4 bestehende `Ready*`-Tests als Muster auf `renderWithApp` umstellen

**Akzeptanzkriterien**
- [ ] J1–J6 laufen grün in der CI, 2× hintereinander ohne Flackern
- [ ] Selektoren nur über Rolle, Name, Label oder fachliche `data-testid`
- [ ] Neue Unit-Tests grün, `npm test`, `typecheck` und `lint` grün
- [ ] Kein Produktivcode geändert, ausser fehlenden `aria-label`s oder `data-testid`s

**Abhängigkeiten:** Audit-Fix und Majors vom 27.11. sind gemergt.
**Aufwand:** ca. 1–1,5 Agent-Tage

---

## R2 · Domänentypen und Sprach-Registry, Zyklus auflösen, Schichtregeln in die CI

**Kontext**
- Zyklus `storage/types.ts` ↔ `audio/voices.ts`.
- `Lang` liegt in `content/phrase.ts`, die Sprachen sind an rund 29 Stellen fest eingebaut (ADR-001, ADR-003).

**Umfang**
- `src/domain/languages.ts` plus `languages/<code>.ts` für de, en, pt-BR und vi. Daraus werden abgeleitet: `Lang`, `APP_LANGS`, `isLang`, `shortLang`, der Zod-Enum und `textAll`.
- `domain/settings.ts`, `domain/speed.ts`, `domain/voices.ts` (Daten), `domain/clip-revision.ts`
- `completeSettings` statt `withDefaultVoices`
- `MELODY_LIMITS` und `SPECTRAL_DISTANCE_MAX` wandern in die Registry
- Re-Exporte an den alten Orten für einen Release
- `.dependency-cruiser.cjs`: `no-circular`, `domain-is-leaf` und `storage-no-audio` als `error`, der Rest als `warn`. Script `depcheck` in der CI.
- Tests `languages.registry.test.ts`, **`languages.complete.test.ts`**, `catalog.refs.test.ts`

**Akzeptanzkriterien**
- [ ] `depcruise` meldet 0 Zyklen und 0 Fehler
- [ ] `src/domain` importiert nichts aus `src/` oder `content/`
- [ ] Das Verhalten bleibt unverändert: Journeys J1–J6 grün, das Datenformat in IndexedDB ist gleich
- [ ] Der Vollständigkeitstest läuft über alle registrierten Sprachen

**Abhängigkeiten:** R1
**Sicherheit:** neue devDependency `dependency-cruiser` mit `npm audit` und Lizenzcheck prüfen
**Aufwand:** ca. 1–1,5 Agent-Tage

---

## R3 · `usePlaybackPrefs`, `usePhrasePlayback` und `useRepeatTake` einführen

**Kontext**
- Die Logik für Abspielen, Alignment und Karaoke steht dreifach in `Phrase.tsx` (`loadAlignment` L122), `Practice.tsx` (L209, `playClip` L171) und `Show.tsx` (L63, L148).
- `prefsFromSettings` kommt 5× vor (Review-Befund 3, [`bausteine.md`](bausteine.md) §3–5).

**Umfang**
- Hooks unter `src/hooks/` mit Tests
- Phrase, Show und Situation sowie Lookup (nur `usePlaybackPrefs`) umstellen
- Practice nutzt die Hooks für das Abspielen und das Mikrofon. Die Ablauf-Logik bleibt vorerst.
- Den `BottomActions`-Baustein **noch nicht** einführen (das kommt mit G1)

**Akzeptanzkriterien**
- [ ] Keine Seite importiert mehr `audio/align`, `audio/player`, `audio/recorder` oder `audio/speed` direkt (dependency-cruiser-Regel `pages-use-hooks` auf `error`, ausser für Practice bis R5)
- [ ] `use-phrase-playback.test.tsx` und `use-repeat-take.test.tsx` grün
- [ ] J2 und J3 grün

**Abhängigkeiten:** R2
**Aufwand:** ca. 1–1,5 Agent-Tage

---

## R4 · `AppProvider` aufteilen (Catalog, Profiles, Settings, Progress) mit Repository-Injektion

**Kontext:** ADR-002. `useApp()` hat 28 Aufrufer. Audio-Seiteneffekte (`stopClip`, `forgetVoiceIfUnused`) stecken im Zustand.

**Umfang**
- Die Migrationsschritte 2–7 aus ADR-002, auf Wunsch als 2–3 PRs
- `AudioLifecycle`
- **Sprachen pro Profil (ADR-002, Vorgabe des Projektinhabers):** `uiLang`/`uiLangSource`, `targets`, `activeTarget`, `perTarget` pro Profil; Fortschritt pro (Profil, Zielsprache) mit Migration vom Richtungs-Schlüssel; `switchTo` schaltet GUI-Sprache und Lernsprache mit um; `switchTarget`/`addTarget` im aktiven Profil
- `renderWithApp` auf die neuen Provider umstellen und alle `Ready*`-Wrapper entfernen

**Akzeptanzkriterien**
- [ ] Kein Import von `app/state` mehr, `useApp` ist gelöscht
- [ ] `rg "stopClip|forgetVoiceIfUnused" src/app` findet nur `audio-lifecycle.tsx`
- [ ] `providers.test.tsx`: `saveCard` rendert die `TopBar` nicht neu
- [ ] J1–J6 grün, insbesondere J4 (Personen) und J5 (Import)
- [ ] J8 (Profile und Sprachen) grün; Migrationstest: alter Fortschritt pro Richtung erscheint nach dem Update unter der richtigen Zielsprache

**Abhängigkeiten:** R1, R2 (R3 empfohlen)
**Sicherheit:**
- Import und Export validieren weiter streng (Zod `strictObject`)
- `everyone()` nur dort verfügbar, wo es gebraucht wird
- Personendaten werden nicht geloggt

**Aufwand:** ca. 1,5–2 Agent-Tage

---

## R5 · Practice zerlegen: `useStudySession` und Übungs-Plug-ins (phrase, word)

**Kontext:**
- `Practice.tsx` hat 935 Zeilen, 25 `useState` und 90 Import-Kanten.
- Für neue Übungsarten braucht es eine generische Engine (ADR-004, [`bausteine.md`](bausteine.md) §7–8).

**Umfang**
- `src/exercises/types.ts` und `registry.ts`
- Module `phrase` (Schritte `slow`, `repeat`, `understand`, `recall`, `rate`) und `word` (`word-steps`)
- `useStudySession` und `planDay` als reine Funktion. Die Regeln aus `srs/day.ts` und `session.ts` bleiben.
- `PracticePage` wird dünn: Fortschritt, `module.View` und die Aktionen
- Vertragstest `exercises.contract.test.ts`
- Die bestehenden Practice-Tests auf `renderWithApp` umstellen

**Akzeptanzkriterien**
- [ ] `PracticePage` hat weniger als 120 Zeilen und keine direkten Importe aus `srs`, `audio`, `pitch` oder `content`
- [ ] Eine neue Übungsart braucht nur einen neuen Ordner und einen Eintrag in `EXERCISES` (Beweis: ein Dummy-Modul im Test)
- [ ] Bestehende Lernstände bleiben gültig (Karten-IDs unverändert), J3 grün
- [ ] Die 5-Sterne-Bewertung aus V1 läuft unverändert über `useRepeatScore`

**Abhängigkeiten:** R3, R4
**Aufwand:** ca. 2–3 Agent-Tage

---

## R6 · Inhalte datengetrieben: Katalog-Abfragen, Schema für Wörter, generierter Index

**Kontext:** Seiten importieren `content/words.ts`, `word-sounds.ts`, `address.ts` und `gloss.ts` direkt. Neue Phrasengruppen brauchen heute einen Import von Hand (ADR-004 A, Review-Befund 5).

**Umfang**
- `src/content/queries.ts` (`createQueries`) und `useCatalog()`
- `catalogSchema` um `words` und `wordSounds` erweitern, inklusive Referenzprüfung
- `tools/gen-content-index.ts` erzeugt `content/index.generated.ts` (prebuild, pretest, CI-Check)
- Dateistruktur `content/situations/`, `content/words/`
- `npm run check:content` mit lesbarem Bericht
- Home, Practice-Module, Settings, RepeatFeedback und `srs/day` auf Abfragen umstellen

**Akzeptanzkriterien**
- [ ] Kein Import von `content/*` aus `src/pages`, `src/components` oder `src/exercises/*/View.tsx`
- [ ] Eine neue Phrase oder ein neues Wort in einer Datei braucht keine Code-Änderung (Beweis: Test mit Beispieldatei)
- [ ] `catalog.refs.test.ts` und `content-index.test.ts` grün

**Abhängigkeiten:** R2 (R5 empfohlen)
**Sicherheit:** `RichText`-Whitelist bleibt, Quellen nur `https`, Audio-Dateinamen gegen `AUDIO_FILE`
**Aufwand:** ca. 1,5 Agent-Tage

---

## R7 · Sprachen vollständig generisch: `langOptions`, i18n pro Datei, RTL-fähig

**Kontext:** ADR-003. Sprachspezifische Felder `addressVi`, `addressPt`, `addressDe`, `ptSpeaker`, `viContact` und `viRegion` sowie Sonder-Selects in `Settings.tsx`. Das Dictionary ist eine Datei mit 1883 Zeilen.

**Umfang**
- `Settings.langOptions` mit Migration beim Laden, Export Format 4 (Format 3 bleibt importierbar)
- Generische Optionen-UI aus `LanguageDef.options`
- `src/i18n/<code>.ts` mit `satisfies Dictionary`, `dictionaries` aus der Registry
- **RTL verbindlich (ADR-003 §6):** `dir` als Pflichtfeld pro Sprache in der Registry, Pseudosprache `ar-XB` (hidden, nur Dev/Test). `<html lang dir>` folgt der GUI-Sprache des aktiven Profils (auch beim Profilwechsel). Lerninhalte über `TargetText` mit eigener `lang`/`dir`, Freitext mit `dir="auto"`/`<bdi>`, Zähler isoliert.
- CSS komplett auf logische Eigenschaften umstellen; Stylelint `use-logical` und ESLint-Regel gegen `marginLeft`/`left`/`right`/`textAlign:'left'` als CI-Fehler (`npm run lint:css`)
- Richtungs-Icons über `DirIcon` spiegeln (Play, Mikrofon, Sterne nicht), Swipe über `useDirection()` spiegeln
- `splitWords` mit Segmentierer pro Sprache (`Intl.Segmenter`, falls vorhanden)
- Checkliste «Neue Sprache hinzufügen» in `docs/neue-sprache.md`
- **App-Sprache automatisch beim ersten Start:** `resolveInitialUiLang(navigator.languages)`, erste unterstützte gemäss Registry, inklusive Basis-Match (`pt-BR` → `pt`). Ohne Treffer gilt Englisch. Die manuelle Wahl wird gespeichert (`appLangSource: 'manual'`) und überschreibt die Erkennung. Dazu der Test `ui-lang.test.ts`.

**Akzeptanzkriterien**
- [ ] `rg "'pt-BR'|'vi'" src --glob '!*.test.*' --glob '!src/domain/languages/**' --glob '!src/i18n/**'` liefert 0 Treffer
- [ ] **Probe:** Eine Testsprache (z.B. `xx`, Status `hidden`, RTL) lässt sich nur mit Registry-Datei, i18n-Datei und Inhalten hinzufügen. `languages.complete.test.ts` meldet die Lücken korrekt, Seiten und Komponenten bleiben unverändert.
- [ ] `settings.migration.test.ts` grün, J5 mit alter Format-3-Datei grün
- [ ] `npm run lint:css` grün (0 physische left/right-Eigenschaften ausser `/* rtl-ok */`)
- [ ] J9 RTL (visuell, Pseudosprache `ar-XB`) grün, `direction.test.ts` grün; Profilwechsel LTR↔RTL setzt `<html dir>` sofort um

**Abhängigkeiten:** R2, R4, R6
**Sicherheit:**
- `langOptions`-Werte werden gegen die Choices validiert, kein freier Text in Dateinamen oder HTML
- Import Format 3 und 4 bleibt strikt

**Aufwand:** ca. 1,5–2 Agent-Tage

---

## G1 · GUI-Grundbausteine: `Screen`, `BottomActions`, `SpeedSwitch`, `Stars`

**Kontext:** [`gui-konzept.md`](gui-konzept.md). Hauptaktionen stehen immer unten fixiert, der Inhalt scrollt darüber.

**Umfang**
- Bausteine wie in [`bausteine.md`](bausteine.md) §10, Design-Tokens (Abstände, Farben, Typografie), Safe-Area, logische CSS-Eigenschaften
- Alle Bausteine RTL-fest: logische Eigenschaften, `DirIcon`, Hauptaktion am Ende (`inline-end`), `TargetText`/`AutoText` ([`bausteine.md`](bausteine.md) §10, RTL-Bausteine)
- `SpeedSwitch` 70/85/100 % plus «Automatisch» (`speed: 'auto'`). Standard ist 100 %, die Wahl wird pro Person gemerkt (entschieden am 13.11.2026). Bestehende Personen mit `auto` behalten `auto`, neue starten mit 100 %. `learnTempo` startet neu ebenfalls mit 1.

**Akzeptanzkriterien**
- [ ] Die Layout-Spec «Aktionen überlappen nie» (von `word-continue.spec.ts` verallgemeinert) ist für jeden Screen mit `BottomActions` grün, bei 360 × 640 und im Querformat
- [ ] Touch-Ziele mindestens 44 px, Kontrast nach AA (axe-Check in einer Journey)
- [ ] Jeder Baustein hat einen Storybook- oder Playwright-Screenshot in `dir=rtl` (Pseudosprache), Layout-Spec auch in RTL grün

**Abhängigkeiten:** R3, R4
**Aufwand:** ca. 1 Agent-Tag

## G2 · Navigation (4 Tabs), Home, Situationen und Suche, Situation

> **Entscheid 16.11.2026 (Projektinhaber):** 4 Tabs (Heute, Situationen, Zeigen, Ich). «Nachschlagen» gehört in den Tab Situationen. Der Navigationsentscheid ist kein Blocker mehr vor G2.

**Umfang**
- Tabs Heute, Situationen, Zeigen und Ich (genau diese vier; kein eigener Tab «Nachschlagen»)
- `#/lookup` wird Situationen mit Suche (Alias `#/situations`)
- Home mit Übungsarten-Kacheln aus `EXERCISES`
- Situation mit Segmenten
- Wireframes 2–4 umsetzen

- Sprach-Chip im Header von Heute und Situationen mit Bottom-Sheet (Lernsprachen des Profils, Lernstand, «+ Sprache hinzufügen»)

**Akzeptanzkriterien**
- [ ] J8a (Lernsprache wechseln, Fortschritt bleibt) grün
- [ ] J9 RTL für die Screens dieses PRs grün (Pseudosprache `ar-XB`), keine physischen left/right-Styles
- [ ] J1 und J2 grün ohne Anpassung der Journey-Logik (höchstens neue Namen aus dem Dictionary)
- [ ] Alte Hash-Links funktionieren weiter

**Abhängigkeiten:** G1, R6
**Aufwand:** ca. 1–1,5 Agent-Tage

## G3 · Phrase, Üben (Verstehen, Nachsprechen 5 Sterne), Sitzung fertig, Onboarding

> **Entscheid 16.11.2026 (Projektinhaber):** Kein Fokus-Modus. Die Tab-Leiste bleibt auch in Übungen und auf der Phrasen-Seite immer sichtbar. Die Sterne-Bedingungen in [`gui-konzept.md`](gui-konzept.md) sind die verbindliche Basis für die 5-Sterne-Kalibrierung am 27.11.

**Umfang:** Wireframes 1, 5, 6, 7 und 13. Tab-Leiste bleibt auf Phrase, Üben und Sitzung fertig sichtbar; kein Fokus-Modus und kein ✕-Beenden ohne Tab-Leiste. (Die Wireframes in [`wireframes.html`](wireframes.html) zeigen die Tab-Leiste auf Phrase, Üben und Sitzung fertig.)
- Das Onboarding zeigt die aus dem Browser erkannte App-Sprache vorausgewählt («erkannt aus deinem Browser», änderbar), danach folgt die Wahl der Lernsprache. Beide lassen sich später unter Ich → Sprachen ändern (Vorgabe des Projektinhabers, 13.11.2026).

**Akzeptanzkriterien**
- [ ] J9 RTL für die Screens dieses PRs grün (Pseudosprache `ar-XB`), keine physischen left/right-Styles
- [ ] J1 und J3 grün
- [ ] Die Sterne erscheinen zuerst, die Details sind scrollbar
- [ ] Maximal 3 Aktionen pro Screen
- [ ] Die Tab-Leiste ist auf Phrase, Üben und Sitzung fertig sichtbar

**Abhängigkeiten:** G1, R5
**Aufwand:** ca. 1,5–2 Agent-Tage

## G4 · Zeigen, Kultur, Ich/Einstellungen (Gruppen), Personen-Sheet

> **Entscheid 16.11.2026 (Projektinhaber):** Der Tab «Ich» ist bestätigt (Teil der 4 Tabs).

**Umfang:** Wireframes 9–12. Die Einstellungen werden in Unterseiten aufgeteilt, die Optionen kommen generisch (R7).

- Profil-Sheet zeigt pro Profil App-Sprache und Lernsprachen; Profilwechsel schaltet beides um

**Akzeptanzkriterien**
- [ ] J8b (zwei Profile mit verschiedenen Sprachen) grün
- [ ] J9 RTL für die Screens dieses PRs grün (Pseudosprache `ar-XB`), keine physischen left/right-Styles
- [ ] J4 und J5 grün
- [ ] «Zeigen» spielt immer mit 100 %, Wake Lock nur, wenn verfügbar

**Abhängigkeiten:** G1, R7
**Aufwand:** ca. 1–1,5 Agent-Tage

---

## R8 · Neue Übungsart «Rollenspiel/Dialog»

**Kontext:** ADR-004 B, Beispiel für das Plug-in-Modell, Wireframe 8.

**Umfang**
- Modul `src/exercises/dialog/` (`index.ts`, `View.tsx`, `schema.ts`)
- Datenformat `content/dialogs/*.ts`, 2 Beispiel-Dialoge (Café, Taxi) in allen Sprachen, Audio erzeugen
- Journey J7

**Akzeptanzkriterien**
- [ ] Die einzige Änderung ausserhalb des Modulordners und von `content/dialogs` ist der Eintrag in `EXERCISES` plus die i18n-Texte
- [ ] Der Vertragstest ist für `dialog` grün, J7 grün
- [ ] Die Dialoge erscheinen automatisch auf Home und unter der Situation

**Abhängigkeiten:** R5, R6, G3
**Sicherheit:** Aufnahmen bleiben lokal, Mikrofon nur nach Tippen, keine neuen Abhängigkeiten
**Aufwand:** ca. 1,5–2 Agent-Tage (ohne Audio-Generierung, die läuft lokal oder in den bestehenden Tools)

---

## Hinweis zu V1 (Vosk/5 Sterne 1.0.0, Routine vom 27.11., 09:30)

Das ist kein neues Issue. Es ist ein Zusatz zur bestehenden Aufgabe des Entwickler-Bots:

- Die Bewertung von Anfang an als `useRepeatScore` in `src/hooks/use-repeat-score.ts` bauen, mit der Signatur aus [`bausteine.md`](bausteine.md) §6.
- Die 5-Sterne-Bedingungen in [`gui-konzept.md`](gui-konzept.md) sind die verbindliche Basis für die Kalibrierung am 27.11. (entschieden 16.11.2026, Projektinhaber).
- Den Analyzer und den Recognizer (Vosk) injizieren, statt `testsAreRunning()` zu verwenden.
- `RepeatFeedback` zeigt nur noch an (Komponenten `Stars`, `ScoreBars`).

## Issue-Links

**Status 13.11.2026, 22:16 Uhr (Zürich): angelegt** als #59–#70 nach Freigabe durch den Projektinhaber («Issues: ja, anlegen»). Vorher gab es keine Issues im Repo, also keine Duplikate. Labels: G1 `enhancement` + `accessibility`, G2–G4 und R8 `enhancement`, R1–R7 ohne Label.

| Issue | GitHub |
|---|---|
| R1 · Sicherheitsnetz: Journeys, Lücken-Tests, gemeinsamer Test-Helfer | [#59](https://github.com/patrickstubner/Travel-Talk/issues/59) |
| R2 · Domänentypen und Sprach-Registry, Zyklus auflösen, Schichtregeln in die CI | [#60](https://github.com/patrickstubner/Travel-Talk/issues/60) |
| R3 · `usePlaybackPrefs`, `usePhrasePlayback` und `useRepeatTake` einführen | [#61](https://github.com/patrickstubner/Travel-Talk/issues/61) |
| R4 · `AppProvider` aufteilen (Catalog, Profiles, Settings, Progress) mit Repository-Injektion | [#62](https://github.com/patrickstubner/Travel-Talk/issues/62) |
| R5 · Practice zerlegen: `useStudySession` und Übungs-Plug-ins (phrase, word) | [#63](https://github.com/patrickstubner/Travel-Talk/issues/63) |
| R6 · Inhalte datengetrieben: Katalog-Abfragen, Schema für Wörter, generierter Index | [#64](https://github.com/patrickstubner/Travel-Talk/issues/64) |
| R7 · Sprachen vollständig generisch: `langOptions`, i18n pro Datei, RTL-fähig | [#65](https://github.com/patrickstubner/Travel-Talk/issues/65) |
| G1 · GUI-Grundbausteine: `Screen`, `BottomActions`, `SpeedSwitch`, `Stars` | [#66](https://github.com/patrickstubner/Travel-Talk/issues/66) |
| G2 · Navigation (4 Tabs), Home, Situationen und Suche, Situation | [#67](https://github.com/patrickstubner/Travel-Talk/issues/67) |
| G3 · Phrase, Üben (Verstehen, Nachsprechen 5 Sterne), Sitzung fertig, Onboarding | [#68](https://github.com/patrickstubner/Travel-Talk/issues/68) |
| G4 · Zeigen, Kultur, Ich/Einstellungen (Gruppen), Personen-Sheet | [#69](https://github.com/patrickstubner/Travel-Talk/issues/69) |
| R8 · Neue Übungsart «Rollenspiel/Dialog» | [#70](https://github.com/patrickstubner/Travel-Talk/issues/70) |
