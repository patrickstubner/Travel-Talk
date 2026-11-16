# Ablaufplan ab 27.11.2026

- **Stand:** 16.11.2026. Alle Zeiten in Zürcher Zeit.
- **Wer:** Alle Coding-Schritte macht der **Entwickler-Bot mit Cloud Agents**, die ab dem Reset am 27.11.2026 wieder verfügbar sind. On-Demand bleibt aus. Ist das Kontingent aufgebraucht, wird pausiert und nicht nachgekauft.
- **Pro PR (Daueregel des Projektinhabers):**
  - Sicherheits- und Schwachstellenprüfung nach jeder Code-Änderung, mit Schweregrad und Fix-Vorschlag. Sie steht im PR und in der Meldung an den Projektinhaber.
  - `npm audit` gehört dazu.
- **Merge:**
  - Gemäss der gespeicherten Travel-Talk-Merge-Regel.
  - Das gilt auch für GUI-PRs (G1–G4) und die Änderung am Exportformat (R7), ohne extra Vorschau (Entscheid des Projektinhabers, 13.11.2026).
- **Immer gilt:** nur Frontend, kein Backend, keine Kosten ohne Rückfrage.

## Kontingent-Aufteilung (Entscheid des Projektinhabers, 13.11.2026)

Cloud-Agent-Kontingent ab Reset 27.11. bis zum nächsten Reset:
- **Travel Talk ca. 50 %:** V1 Vosk/5 Sterne, S1 Audit-Fix, S2 Dependabot, danach **nur R1–R4** (#59–#62).
- **Edovita ca. ein Drittel:** Start mit Rezept-Detailseite und zweisprachiger Einkaufsliste.
- **Reserve 15–20 %:** kleine Anpassungen an PadelCounterV2 und Retirement Calculator.
- **R5–R7, G1–G4 und R8 (#63–#70) erst ab dem Januar-Kontingent.** Die Routine «Travel Talk Ablaufplan R1–R8» (werktags 11:00) stoppt nach R4 und prüft vor jedem Start den Verbrauch.

Die Daten in der Übersicht für R5 bis R8 und G1 bis G4 verschieben sich entsprechend in den Januar 2027.

## Übersicht

| # | Wann (ca.) | Schritt | Voraussetzung | Aufwand |
|---|---|---|---|---|
| V1 | Fr 27.11., 09:30 | Vosk/5 Sterne 1.0.0, Bewertung als `useRepeatScore` | – | laut bestehender Routine |
| S1 | Fr 27.11., 10:00 | Audit-Fix (17 Schwachstellen, 2 hoch) | V1 gemergt oder pausiert | 0,5 Tag |
| S2 | 27.–30.11. | Dependabot und Major-Updates, je Paket ein PR | S1 | 0,5–1 Tag |
| R1 | ab 30.11. | Sicherheitsnetz: Journeys, Lücken-Tests, `renderWithApp` | S2 | 1–1,5 Tage |
| R2 | ~2.12. | `src/domain`, Sprach-Registry, Zyklus lösen, dependency-cruiser | R1 | 1–1,5 Tage |
| R3 | ~4.12. | `usePlaybackPrefs`, `usePhrasePlayback`, `useRepeatTake` | R2 | 1–1,5 Tage |
| R4 | ~7.12. | `AppProvider` aufteilen und Repository-Injektion, `AudioLifecycle`, Sprachen pro Profil | R1, R2 (R3) | 2–2,5 Tage |
| R5 | ~9.12. | Practice zerlegen: `useStudySession` und Plug-ins phrase und word | R3, R4 | 2–3 Tage |
| R6 | ~14.12. | Katalog-Abfragen, Schema für Wörter, generierter Index | R2 (R5) | 1,5 Tage |
| R7 | ~16.12. | Sprachen generisch: `langOptions`, i18n pro Datei, RTL verbindlich (logisches CSS, Lint, J9) | R2, R4, R6 | 2–2,5 Tage |
| G1 | ~18.12. | GUI-Bausteine `Screen`, `BottomActions`, `SpeedSwitch` (inkl. Automatik), `Stars` | R3, R4 | 1 Tag |
| G2 | ~21.12. | Navigation (4 Tabs, entschieden 16.11.), Home mit Sprach-Chip, Situationen und Suche, Situation | G1, R6 | 1–1,5 Tage |
| G3 | ~23.12. | Onboarding, Phrase, Üben mit 5 Sternen, Ende | G1, R5 | 1,5–2 Tage |
| G4 | Anfang Jan. | Zeigen, Kultur, Ich/Einstellungen, Personen | G1, R7 | 1–1,5 Tage |
| R8 | Jan. | Übungsart Rollenspiel/Dialog | R5, R6, G3 | 1,5–2 Tage |

**Total:** rund 19–25 Agent-Tage (inkl. Profile/Sprachwechsel und RTL).

Die Daten sind Richtwerte. Sie hängen vom Cloud-Agent-Kontingent ab und davon, wie schnell der Projektinhaber freigibt. Massgebend ist die Reihenfolge, nicht das Datum. Zwischen 24.12. und 2.1. ist eine Pause eingeplant.

## Schritte im Detail

### V1 · Vosk/5 Sterne 1.0.0 (Fr 27.11., 09:30, bestehende Routine)
- **Voraussetzung:** keine.
- **PR-Umfang:** wie in der Routine geplant, dazu:
  - die Bewertung als `src/hooks/use-repeat-score.ts` (Signatur [`bausteine.md`](bausteine.md) §6),
  - die 5-Sterne-Bedingungen in [`gui-konzept.md`](gui-konzept.md) als verbindliche Basis für die Kalibrierung am 27.11. (entschieden 16.11.2026, Projektinhaber),
  - Analyzer und Vosk-Recognizer injiziert, kein neues `testsAreRunning`,
  - `RepeatFeedback` nur noch für die Anzeige,
  - Vosk läuft lokal im Browser, Modell im Bundle oder Cache, kein Server.
- **Fertig, wenn:**
  - 5 Sterne erscheinen,
  - `use-repeat-score.test.tsx` mit synchronem Analyzer grün,
  - die bestehenden Feedback-Tests grün,
  - Version 1.0.0 gebaut und deployt.
- **Sicherheit:**
  - Vosk-Paket und Modell prüfen (Lizenz, Grösse, `npm audit`),
  - Mikrofon nur nach Tippen,
  - keine Uploads.

### S1 · Audit-Fix (10:00)
- **Voraussetzung:** V1 abgeschlossen. Ist V1 noch offen, wartet S1, damit es keinen Konflikt in `package-lock.json` gibt.
- **PR-Umfang:** die 17 Schwachstellen beheben, die 2 hohen zuerst. Nur Lockfile und Versionssprünge, keine Refactorings.
- **Fertig, wenn:** `npm audit` zeigt 0 hohe und 0 kritische Schwachstellen (Rest begründet), und Build, Tests und Layout-Specs sind grün.
- **Sicherheit:** Das ist die Kernaufgabe. Der Bericht listet pro Schwachstelle Paket, Schweregrad und Fix.

### S2 · Dependabot und Major-Updates
- **Voraussetzung:** S1.
- **PR-Umfang:** ein PR pro Major. Ein rotes PR wird nicht gemergt, sondern repariert oder geschlossen.
- **Fertig, wenn:** keine offenen Dependabot-PRs mehr, alles grün.
- **Sicherheit:** Changelog pro Major auf Breaking Changes und Security-Hinweise prüfen.

### R1 · Sicherheitsnetz
- **Voraussetzung:** S2, also aktuelle Abhängigkeiten.
- **PR-Umfang:** siehe Issue R1, [`testplan.md`](testplan.md). Kein Produktivcode, ausser Labels und Test-IDs.
- **Fertig, wenn:** J1–J6 und die Unit-Tests für `direction`, Router und SW sind in der CI grün, 2× ohne Flackern.
- **Sicherheit:** Test-Dependencies prüfen. Es dürfen keine Testdaten mit echten Personendaten ins Repo.

### R2 · Domain, Sprach-Registry und Zyklus
- **Voraussetzung:** R1.
- **PR-Umfang:** Issue R2 (ADR-001, ADR-003 Teil 1), inklusive `languages.complete.test.ts`.
- **Fertig, wenn:** dependency-cruiser zeigt 0 Zyklen, `domain` ist ein Blatt, und das Verhalten ist unverändert.
- **Sicherheit:** devDependency `dependency-cruiser` prüfen.

### R3 · Playback-Hooks
- **Voraussetzung:** R2.
- **PR-Umfang:** Issue R3.
- **Fertig, wenn:** Phrase, Show, Situation und Lookup importieren kein `audio/*` mehr, und die Hook-Tests sowie J2 und J3 sind grün.
- **Sicherheit:** Object-URLs werden freigegeben, das Mikrofon startet nur nach Nutzeraktion.

### R4 · AppProvider aufteilen
- **Voraussetzung:** R1, R2 (R3 empfohlen).
- **PR-Umfang:** ADR-002 Schritte 2–7, auf Wunsch als 2–3 PRs.
- **Fertig, wenn:** `useApp` ist gelöscht, das Audio-Aufräumen steckt nur noch in `AudioLifecycle`, J4, J5 und J8 (Profile und Sprachen) sind grün, und die Fortschritts-Migration (Richtung → Zielsprache) ist getestet.
- **Sicherheit:** Die Import-Validierung bleibt unverändert, es werden keine Personendaten geloggt.

### R5 · Practice zerlegen
- **Voraussetzung:** R3, R4.
- **PR-Umfang:** Issue R5 (ADR-004 B).
- **Fertig, wenn:**
  - `PracticePage` hat weniger als 120 Zeilen,
  - der Vertragstest für Übungen ist grün,
  - ein Dummy-Modul beweist die Erweiterbarkeit,
  - J3 ist grün,
  - die Lernstände bleiben gültig.
- **Sicherheit:** wie R3, zusätzlich darf kein Modul das Repository direkt beschreiben.

### R6 · Inhalte datengetrieben
- **Voraussetzung:** R2 (R5 empfohlen).
- **PR-Umfang:** Issue R6 (ADR-004 A).
- **Fertig, wenn:** Keine UI importiert `content/*` mehr, `check:content` läuft, und eine neue Phrase braucht nur eine Inhaltsdatei.
- **Sicherheit:** `RichText`-Whitelist, `https`-Quellen, die Dateinamen-Regex `AUDIO_FILE`.

### R7 · Sprachen generisch
- **Voraussetzung:** R2, R4, R6.
- **PR-Umfang:** Issue R7 (ADR-003 Teil 2).
- **Fertig, wenn:** Die Probe mit der Testsprache `xx` (RTL) braucht keine Änderung an Seiten oder Komponenten, die Migration ist getestet, und J5 ist mit einer alten Sicherung grün. **RTL verbindlich:** `lint:css` (logische Eigenschaften) als CI-Fehler aktiv, J9 RTL (Pseudosprache `ar-XB`) grün, `<html dir lang>` folgt dem aktiven Profil.
- **Sicherheit:** `langOptions` gegen die Registry validiert, der Import bleibt strikt.

### G1–G4 · GUI-Umbau
- **Voraussetzung:** R3 bis R7 wie oben.
  - Der Tempo-Standard ist entschieden: 100 %, Automatik wählbar.
  - **Navigation entschieden am 16.11.2026 (Projektinhaber):** 4 Tabs (Heute, Situationen, Zeigen, Ich), «Nachschlagen» im Tab Situationen. **Kein Fokus-Modus:** Die Tab-Leiste bleibt auch in Übungen und auf der Phrasen-Seite sichtbar. Der Navigationsentscheid ist kein Blocker mehr vor G2. Grundlage bleiben die Entscheide in [`gui-konzept.md`](gui-konzept.md).
- **PR-Umfang:** je ein PR pro Issue G1–G4. Merge gemäss der Travel-Talk-Merge-Regel. Keine Arbeit am verworfenen Fokus-Modus.
- **Fertig, wenn:** Die Journeys inklusive J9 RTL sind ohne Logik-Änderung grün, die Layout-Spec «Aktionen überlappen nie» ist für alle Screens grün, und der axe-Check zeigt keine schweren Befunde.
- **Sicherheit:** keine externen Fonts, Skripte oder CDNs, die CSP bleibt unverändert oder wird strenger.

### R8 · Rollenspiel
- **Voraussetzung:** R5, R6, G3.
- **PR-Umfang:** Issue R8, mit 2 Beispiel-Dialogen.
- **Fertig, wenn:** Ausserhalb des Moduls ändern sich nur `EXERCISES` und i18n, J7 ist grün, und die Dialoge erscheinen automatisch.
- **Sicherheit:** Aufnahmen bleiben lokal.

## Was jetzt schon erledigt ist (Teil A, 13.11.)

- Review, ADR-001 bis ADR-004, Bausteine, GUI-Konzept mit Wireframes, Testplan und Issue-Entwürfe liegen unter `/workspace/travel-talk-architektur/`.
- **Entschieden am 13.11.:** Tempo 100 % mit wählbarer Automatik, Rollenspiel nach dem GUI-Umbau, Merge-Regel ohne extra Vorschau.
- **Entschieden am 16.11. (Projektinhaber):** 4 Tabs (Heute, Situationen, Zeigen, Ich), «Nachschlagen» in Situationen, kein Fokus-Modus (Tab-Leiste bleibt in Übungen und auf der Phrasen-Seite sichtbar), Sterne-Bedingungen in [`gui-konzept.md`](gui-konzept.md) als verbindliche Basis für die Kalibrierung am 27.11. Die Wireframes sind nachgeführt; der frühere klickbare Prototyp liegt nicht in diesem Repo.
- Der Entwickler-Bot bekommt diese Unterlagen am 27.11. als Grundlage. Die Routinen um 09:30 und 10:00 bleiben, die Notiz zu V1 (`useRepeatScore` und Sterne-Basis) kommt dazu.

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
