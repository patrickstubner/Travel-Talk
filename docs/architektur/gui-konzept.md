# GUI-/UX-Konzept für den Umbau

- **Stand:** 16.11.2026
- **Wireframes:** [`wireframes.html`](wireframes.html), als Bilder unter [`wireframes/*.png`](wireframes/), Übersicht in [`wireframes/00-uebersicht.png`](wireframes/00-uebersicht.png)
- **Basis:** heutige Routen und Screenshots in `docs/screenshots/` (Commit `8ae1686`)
- **Rahmen:** nur Frontend, offline-fähige PWA

## Leitlinien

1. **Mobile first:** Die Wireframes sind für 360 × 740 gezeichnet. Ab 768 px wird der Inhalt zentriert (max. 560 px), es gibt keine eigene Desktop-Version.
2. **Hauptaktionen immer unten fixiert:** 1 bis 3 Knöpfe in der `BottomActions`-Leiste, der Inhalt scrollt darüber. Die Leiste respektiert `safe-area-inset-bottom` und überlappt nie.
   - Das ist heute schon ein Problem: `e2e/word-continue.spec.ts` prüft die Überlappung von Replay und Weiter. Neu wird das einmal im Baustein `Screen` gelöst und gilt dann überall.
3. **Eine Hauptaktion pro Screen:** Sie ist dunkel gefüllt und steht rechts beziehungsweise unten. Nebenaktionen sind umrandet.
4. **Tab-Leiste immer sichtbar** (entschieden am 16.11.2026, Projektinhaber): In Übungen und auf der Phrasen-Seite bleibt die Tab-Leiste sichtbar. Der früher vorgeschlagene **Fokus-Modus** (keine Tab-Leiste, oben ✕ mit Rückfrage) ist **verworfen**. Beim Onboarding gibt es weiter keine Tab-Leiste, weil die App noch nicht eingerichtet ist. Oben bleibt ein Fortschrittsbalken; Zurück führt zur vorherigen Seite beziehungsweise nach Heute.
5. **Tempo** (entschieden am 13.11.2026): Wählbar sind 70, 85 und 100 % sowie «Automatisch» (heutiges `speed: 'auto'`, folgt dem Lernstand). **Standard ist 100 %**, die Wahl wird pro Person gemerkt. Die Automatik bleibt als Option erhalten. Der Umschalter sitzt direkt über den Aktionsknöpfen. Die Seite «Zeigen» spielt immer mit 100 %.
6. **App-Sprache automatisch** (Vorgabe des Projektinhabers, 13.11.2026): Beim ersten Start kommt die App-Sprache aus der Browsersprache (`navigator.languages`, erste unterstützte gemäss Registry, inklusive Basis-Match wie `pt-BR` → `pt`). Wird keine unterstützt, gilt Englisch. Die Lernsprache wählt man im Onboarding. Beide sind jederzeit unter «Ich» → «Sprachen» änderbar, und die manuelle Wahl hat Vorrang vor der Erkennung.
6a. **Profile und schneller Sprachwechsel** (Vorgabe des Projektinhabers, 13.11.2026): Mehrere Profile pro Gerät. GUI-Sprache und Lernsprachen sind pro Profil gespeichert; ein Profilwechsel (Avatar oben rechts → Profil-Sheet) schaltet GUI-Sprache, Leserichtung, Lernsprache und Fortschritt um. Die Lernsprache wechselt man jederzeit über den **Sprach-Chip** (Flagge + Kürzel) im Header von Heute und Situationen: Bottom-Sheet mit den Lernsprachen des Profils, Lernstand pro Sprache und «+ Sprache hinzufügen». Fortschritt und Einstellungen bleiben pro Lernsprache getrennt.
7. **Hörproben:** Pro Stimme 1–2 natürliche Sätze, zum Beispiel ein Gruss und eine kurze Vorstellung (`VOICE_SAMPLE`). Kein Lektionssatz.
8. **Gleich gebaut, auch bei neuen Sprachen:** Optionen wie Region und Anrede kommen aus der Sprach-Registry (ADR-003). Es gibt keine Sonderscreens pro Sprache. Das Layout nutzt logische CSS-Eigenschaften, damit RTL-Sprachen funktionieren.
9a. **RTL ist verbindlich** (Vorgabe des Projektinhabers, 13.11.2026): Die Leserichtung folgt der GUI-Sprache des aktiven Profils (`<html dir lang>`). Bei RTL spiegelt sich alles: Zurück-Pfeil rechts oben, Chevrons zeigen nach links, Hauptaktion steht am Ende der Leiste (also links), Tab-Reihenfolge von rechts nach links, Swipe «weiter» nach rechts. Play ▶, Mikrofon, Sterne und Häkchen werden **nicht** gespiegelt. Lerninhalte behalten die Richtung ihrer Sprache (`<bdi dir>`), z.B. ein vietnamesischer Satz bleibt in einer arabischen GUI links-nach-rechts. Zahlen und Zähler werden isoliert, damit `2 / 6` nicht kippt. Prüfbar über eine RTL-Pseudosprache oder `?rtl=1`.
9. **Platz für mehr:** Übungsarten erscheinen als Kacheln aus der Registry (ADR-004), Situationen als Liste aus dem Katalog. Neue Einträge brauchen keine Layout-Änderung.
10. **Barrierefreiheit:** Touch-Ziele mindestens 44 px, Kontrast nach WCAG AA, Fremdtext mit `lang`-Attribut, alles per Tastatur bedienbar.

## Navigation

**Entschieden am 16.11.2026 (Projektinhaber):** 4 Tabs. «Nachschlagen» gehört in den Tab Situationen. Ältere Wireframes zeigen noch den verworfenen Fokus-Modus; massgebend sind die Entscheide in diesem Dokument. Der frühere klickbare Prototyp liegt nicht in diesem Repo.

Heute gibt es Heute, Nachschlagen, Zeigen und Einstellungen, auf einigen Screens zusätzlich Start, Üben und Kultur, also uneinheitlich. Neu sind es 4 Tabs:

| Tab | Route | Inhalt |
|---|---|---|
| **Heute** | `#/` | Tagesplan und Start, Übungsarten, «weiter mit Situation» |
| **Situationen** | `#/lookup` (später alias `#/situations`) | Suche (heute «Nachschlagen») und Liste der Situationen, dazu der Zugang zu Kultur |
| **Zeigen** | `#/show` | Satz gross für die andere Person |
| **Ich** | `#/settings` | Person, Lernen, Daten, Info |

`Üben` (`#/practice`), `Phrase` (`#/phrase/:id`), `Situation` (`#/situation/:id`) und `Kultur` (`#/culture/:id`) sind Unterseiten, also keine eigenen Tabs.

## Hauptflüsse

| # | Screen | Route | Hauptaktion(en) unten | Wichtigste Änderungen gegenüber heute |
|---|---|---|---|---|
| 1 | Onboarding (Name → Sprachen → Stimme) | `#/` beim ersten Start | Zurück · **Weiter** | 3 kurze Schritte mit Fortschritt. Die App-Sprache ist aus dem Browser vorausgewählt («erkannt aus deinem Browser», änderbar), die Lernsprache wird gewählt. Stimmenwahl mit Hörprobe, Region als Segment. |
| 2 | Heute | `#/` | **Heute lernen · 8 Min.** | Eine klare Hauptaktion. Kacheln für Übungsarten, darunter Platz für weitere. |
| 3 | Situationen und Suche | `#/lookup` | – (Liste) | Nachschlagen und Situationen werden zusammengelegt, mit Suche oben. |
| 4 | Situation | `#/situation/:id` | Rollenspiel · **Diese Situation üben** | Segmente Sätze, Rollenspiele und Kultur. Status pro Satz (neu, fällig, gelernt). |
| 5 | Phrase | `#/phrase/:id` | Tempo · Nachsprechen · **Anhören** | Grosser Text mit Karaoke-Markierung, Wörter als Chips, Wischen zur nächsten Phrase. |
| 6 | Üben: Verstehen | `#/practice` | Nochmals · **Weiter** | «Weiter» wird erst nach einer Antwort aktiv. Der Text erscheint nach der Antwort. |
| 7 | Üben: Nachsprechen | `#/practice` | Vorbild · Nochmals · **Weiter** | **5 Sterne** zuerst, dazu ein Tipp. Melodie, Rhythmus und Wörter als Balken (Vosk), Kurve und Wort für Wort zum Scrollen. |
| 8 | Rollenspiel | `#/practice?type=dialog&id=…` | Nochmals · **Sprechen** | Neue Übungsart als Plug-in, im gleichen Rahmen wie die anderen Übungen. |
| 9 | Zeigen | `#/show/:id` | Anderer Satz · **Vorspielen 100 %** | Dunkel mit hohem Kontrast und grosser Schrift. Der Bildschirm bleibt an (Wake Lock, falls verfügbar). |
| 10 | Kultur | `#/culture/:id` | **Sätze dazu üben** | Passende Sätze und Quellen mit Prüfdatum |
| 11 | Ich / Einstellungen | `#/settings` | – | Gruppen mit Unterseiten statt einer langen Seite (heute 429 Zeilen Code in `Settings.tsx`). |
| 12 | Personen | Sheet über `#/settings` oder über den Avatar oben | Bearbeiten · **+ Person** | Wechsel mit einem Tipp, Audio stoppt automatisch. |
| 13 | Sitzung fertig | `#/practice` | Schwierige üben · **Fertig** | Klares Ende mit Durchschnitt der Sterne und nächster Wiederholung. |

## 5-Sterne-Feedback: Abbildung

Heute vergibt `starsFromVerdict` und `starsFromBars` 0–3 Sterne aus `melody`, `rhythm` und `BarState`. Neu (`useRepeatScore`):

| Sterne | Bedeutung | Bedingung (verbindliche Basis für die Kalibrierung am 27.11.2026) |
|---|---|---|
| 5 | Wie das Vorbild | Melodie und Rhythmus `passt`, alle Wörter erkannt |
| 4 | Sehr gut | 2 von 3 `passt`, der Rest `teilweise` |
| 3 | Gut verständlich | Wörter erkannt, Melodie oder Rhythmus `teilweise` |
| 2 | Teilweise | Wörter zum Teil erkannt oder ein Balken `daneben` |
| 1 | Nochmals versuchen | kaum erkannt oder zu kurz oder zu leise |

Es gibt immer nur **einen** konkreten Tipp, zum Beispiel «‹cảm› etwas tiefer fallen lassen». Die Details sind optional und lassen sich aufklappen beziehungsweise scrollen.

Der Projektinhaber hat diese Bedingungen am 16.11.2026 als verbindliche Basis für die 5-Sterne-Kalibrierung am 27.11. bestätigt. Die Bedeutung der fünf Stufen bleibt; Schwellenwerte dürfen bei der Kalibrierung noch feinjustiert werden.

## Platz für weitere Übungsarten

- **Home:** Ein Kachel-Raster aus `EXERCISES` mit `label()` und `icon`. Eine gestrichelte Kachel markiert in den Wireframes den Platz für weitere Arten.
- **Situation:** Ein Segment pro Übungsart, die Daten für diese Situation hat (z.B. «Rollenspiele 2»).
- **Übungsrahmen:** Fortschritt oben und Aktionen unten sind fix, nur die Mitte (`module.View`) ist modulspezifisch.

## Entscheide

**Entschieden am 13.11.2026:**
- **Tempo:** Standard 100 %, pro Person gemerkt. Die bestehende Automatik (`speed: 'auto'`) bleibt als wählbare Option.
- **Rollenspiel** kommt als erste neue Übungsart nach dem GUI-Umbau (R8 nach G3).
- **Merge:** GUI-PRs und die Änderung am Exportformat laufen über die gespeicherte Travel-Talk-Merge-Regel, ohne extra Vorschau.

**Entschieden am 16.11.2026 (Projektinhaber):**

1. **4 Tabs** (Heute, Situationen, Zeigen, Ich). «Nachschlagen» wandert in den Tab Situationen.
2. **Kein Fokus-Modus.** Die Tab-Leiste bleibt auch in Übungen und auf der Phrasen-Seite immer sichtbar. Die Fokus-Modus-Variante (keine Tab-Leiste, ✕ zum Beenden) ist verworfen, ebenso die frühere Navigationsvariante B («wie heute», fünf Tabs).
3. **5-Sterne-Abbildung:** Die Bedingungen oben sind die verbindliche Basis für die Kalibrierung am 27.11.

**Noch offen:** keine. Die offenen Fragen vom 13.11. (Navigation, Fokus-Modus, Sterne-Basis) sind geschlossen. Tempo und Rollenspiel waren schon am 13.11. entschieden.
