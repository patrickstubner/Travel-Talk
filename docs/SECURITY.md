# Sicherheitsprüfung Travel Talk 0.3.0

Datum: 11. Oktober 2026. Geprüft am Quellstand dieser Version. Kein Backend, kein Konto, keine Schlüssel. Die Prüfung von 0.1.0 bleibt unten stehen, wo sie noch gilt.

## Quellen

- OWASP Cheat Sheet, Input Validation: https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html
- OWASP Cheat Sheet, XSS Prevention: https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
- MDN, Content-Security-Policy, inklusive der Direktiven, die ein Meta-Tag nicht setzen kann: https://developer.mozilla.org/docs/Web/HTTP/Headers/Content-Security-Policy
- MDN, `getUserMedia`: https://developer.mozilla.org/docs/Web/API/MediaDevices/getUserMedia
- Zod, strikte Objekte: https://zod.dev
- GitHub Advisory GHSA-g7r4-m6w7-qqqr: https://github.com/advisories/GHSA-g7r4-m6w7-qqqr
- `npm audit` am 10. Oktober 2026, nach tsx 4.23.15, erneut für 0.2.0 ohne neue Pakete: 0 low, 0 moderate, 0 high, 0 critical
- Dependabot, Cooldown: https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file#cooldown
- GitHub Pages liefert keine eigenen Response-Header für ein Projekt-Repo. Die CSP steht deshalb als Meta-Tag ganz am Anfang von `<head>` im gebauten `index.html`, vor dem Modul-Skript. `frame-ancestors` lässt sich in einem Meta-Tag nicht setzen (MDN).

## Was geprüft wurde

**Eingabe, besonders der JSON-Import.** Die Datei darf höchstens 2'000'000 Zeichen haben. `JSON.parse` verwirft die Schlüssel `__proto__`, `constructor` und `prototype`. Danach prüft Zod das Paket strikt, mit `z.config({ jitless: true })`, also ohne `new Function`. Nur die erwarteten Felder, Paar- und Anrede-Werte aus einer Liste, Karten-Zahlen in festen Grenzen, höchstens 2000 Karten, keine doppelten Karten-IDs. `cardId` hat höchstens 80 Zeichen. Unbekannte Karten, die nicht zu einem Paar und einem Konzept dieser Version gehören, werden ausgelassen, und die Oberfläche nennt nur die Anzahl. `due` und `last_review` sind ISO-Zeitstempel mit höchstens 40 Zeichen. Die persönliche Notiz ist auf 500 Zeichen begrenzt und darf ausser Zeilenumbruch und Tabulator keine Steuerzeichen enthalten. Der Export lässt die Notiz weg, bis der Haken «Notiz mitexportieren» gesetzt ist. Bei einem Fehler sieht die Oberfläche nur den Satz, dass die Datei kein gültiger Export ist. Der Inhalt der Datei steht nicht in der Meldung. Import und Löschen ersetzen den Lernstand erst nach einem Dialog. Die Sicherung wird nicht von selbst heruntergeladen. Der Knopf «Sicherung herunterladen» folgt dem Haken «Notiz mitexportieren» und lässt die Notiz weg, solange der Haken fehlt. Drei Fälle für die Notiz, und sie sind nicht dasselbe: Fehlt das Feld `personalNote`, lehnt das strikte Schema die ganze Datei ab (`IMPORT_REJECTED`). Es wird nichts importiert, die lokale Notiz bleibt, weil der Dialog gar nicht so weit kommt. Ist das Feld da und leer oder nur Leerzeichen, bleibt die lokale Notiz, und der Dialog sagt das. Ist das Feld ein nicht leerer Text, ersetzt er die lokale Notiz, und der Dialog sagt das. `speed` darf nur `auto`, 0.7, 0.85 oder 1 sein. Ein altes `slow: true` ohne `speed` wird fest 85 %. `slow: false` oder ein fehlendes `slow`, der Stand von 0.1.0, wird Automatisch. Ein gesetztes `speed` gewinnt. Ein anderer Wert für `speed` wird abgelehnt. Ein unbekanntes Feld in den Einstellungen lehnt die ganze Datei ab, es wird nichts übernommen. Der Export schreibt `format` 3 mit `appLang` und `targetLang`. `pairId` und `uiLang` sind in Format 3 keine Felder. Stehen sie trotzdem in der Datei, lehnt das strikte Schema die ganze Datei ab. Dieselbe Sprache zweimal wird nach dem Schema abgelehnt. Ein optionales `voices` ist ein striktes Objekt mit höchstens einer ID pro Sprache (`de`, `en`, `pt-BR`, `vi`). Die ID muss `^[a-z0-9_-]{1,40}$` entsprechen. Ein fremder Schlüssel darin lehnt die Datei ab. Der Import liest Format 1 und 2 weiter, mit den bisherigen getrennten Schemas, und übersetzt sie. Format 1 bleibt wie bisher: `slow` ist optional, `speed` ist optional, `slow: true` wird fest 85 %, `slow: false` oder ein fehlendes `slow` wird Automatisch, ein gesetztes `speed` gewinnt. Format 2 verlangt `speed` (`auto`, 0.7, 0.85 oder 1) und kennt `slow` nicht. Ein vorhandenes `slow` oder ein fehlendes `speed` lehnt die ganze Datei ab. Die Übersetzung nimmt die bisherige Ausgangssprache als `appLang` und die bisherige Lernsprache als `targetLang`. `uiLang` wird nicht zur App-Sprache. War die Oberfläche Deutsch und die Ausgangssprache eine andere, bleiben Karten und Richtung bei dieser Ausgangssprache, und der Dialog sagt das in einem Satz. Karten-IDs werden nicht umbenannt. Vor dem strikten Schema liest die Prüfung nur `app` und `format`. Der Satz zur neueren Version erscheint nur, wenn `app` `travel-talk` ist und `format` eine sichere ganze Zahl über 3 ist (`Number.isSafeInteger(format) && format > 3`). 2.5, `1e308`, JSON-`1e400` (daraus wird `Infinity`) und der Text `"3"` sind kein solcher Fall. Sie fallen unter den normalen Ablehnungssatz. Der Inhalt der Datei steht in keinem der beiden Sätze. Ein unbekanntes Feld bei einem bekannten Format fällt nicht unter den Aktualisierungssatz, die Datei bleibt abgelehnt. Dieselbe Übersetzung gilt für eine alte Zeile in IndexedDB: `pairId` wird gelesen und nicht wieder gespeichert.

**XSS.** React schreibt Texte als Text. `dangerouslySetInnerHTML`, `innerHTML`, `outerHTML` und `eval` sind per ESLint verboten. Die Markierung von Platzhaltern wie `[Name]` zerlegt den String und setzt die Teile als Textknoten. Externe Links kommen nur aus dem Katalog und müssen mit `https://` beginnen. Sie tragen `rel="noreferrer noopener"`.

**Audio-Pfade.** Eine Datei wird nur abgespielt, wenn der Name dem festen Muster `{sprache}/{id}__{region}__{variante}(.r70|.r85)?.m4a` entspricht und in `manifest.json` steht. Die Adresse wird daraus gebaut, nicht aus einem freien String. Die Stufe hängt `.r70` oder `.r85` an den schon geprüften Stamm. `playbackRate` wird nicht gesetzt. Das Tempo liegt nur in IndexedDB, es geht kein Audio und keine Stufe ins Netz.

**Geheimnisse.** Keine Tokens, keine `.env`, keine `VITE_`-Schlüssel. Die CI-Deploy-Rechte sind `contents: read` plus, nur im Deploy-Job, `pages: write` und `id-token: write`.

**Berechtigungen.** Das Mikrofon wird erst beim Tippen auf Aufnehmen angefragt, auf der Satzseite und im Schritt Nachsprechen. Nach dem Stopp, beim nächsten Schritt und beim Verlassen der Seite werden Rekorder, Tracks und die Blob-Adresse aufgeräumt. Fehlt das Mikrofon oder lehnt der Browser ab, steht ein Hinweis da und die Sitzung geht weiter. Es gibt keinen zweiten Weg, der eine Aufnahme erzwingt. Die Aufnahme bleibt ein Blob im Speicher der Seite und wird nicht hochgeladen und nicht in IndexedDB geschrieben. Der Service Worker hat den Scope `/Travel-Talk/`. Audio-Pfade sind vom Navigate-Fallback ausgenommen. In der CI checkt `actions/checkout` mit `persist-credentials: false` aus, und `npm ci` läuft mit `--ignore-scripts`.

**Abhängigkeiten.** Versionen sind fest. Dependabot prüft npm und GitHub Actions wöchentlich und wartet mit `cooldown.default-days: 7`, bevor eine frisch veröffentlichte Version einen Pull Request öffnet. Das ändert die App nicht, es verzögert nur Updates. Major-Updates von `typescript` und `@types/node` sind ignoriert, über `update-types`, nicht über eine festgeschriebene Version. Sicherheitsupdates und Minor- und Patch-Updates bleiben möglich. Laufzeit: React 19.3.0, Dexie 4.4.6, ts-fsrs 5.4.2, pitchy 4.1.0, Zod 4.6.5, React Router 7.18.4. Typen: `@types/react` 19.3.0, `@types/react-dom` 19.3.0, `@types/node` 22.20.5. Build: Rsbuild 2.2.12, `@rsbuild/plugin-react` 2.1.1, Rspack über Rsbuild. Der Service Worker kommt von `workbox-build` 7.4.1 nach dem Build, weil die Audiodateien kopierte Dateien sind und nicht Teil der Kompilation. Scope `/Travel-Talk/`. Das Manifest liegt in `public/manifest.webmanifest`. Kein CDN, keine Tracker, Schriften nur vom System. Der Build setzt eine CSP ohne `unsafe-inline` und ohne `unsafe-eval`, und er setzt keine Inline-Skripte. Im Dev-Server fehlt das Meta-Tag, weil das HMR sonst blockiert. Tests laufen mit Vitest 5.0.3. Komponententests nutzen happy-dom 20.14.6 und Testing Library 16.3.3, nur in der Entwicklung. Vitest bringt Vite nur als Testläufer mit, nicht für die veröffentlichte App. TypeScript 5.9.3, ESLint 10.12.0, `@eslint/js` 10.0.1, typescript-eslint 8.71.1. `@eslint/js` 10 verlangt Node `^22.13.0`. Die CI setzt Node 22. `@types/node` bleibt auf der Linie 22, passend zu dieser CI. Die App-Version ist 0.3.1.

**Fehler.** Ungültiger Katalog und fehlgeschlagener Import nennen keine Parser-Details.

**Angriffsfläche.** Statische Seite auf GitHub Pages, Hash-Routing, lokaler Lernstand in IndexedDB. Kein Server, der Anfragen annimmt.

## Befunde

| Schwere | Befund | Vorschlag |
| --- | --- | --- |
| Niedrig | GitHub Pages setzt keine eigenen HTTP-Header. `frame-ancestors` fehlt, weil ein Meta-Tag das nicht darf. Ein fremdes Frame könnte die öffentliche Lernseite einbetten. | Sobald der Host Header kann, `frame-ancestors 'none'` und die CSP als Header setzen. |
| Niedrig | Nach der Freigabe merkt sich der Browser das Mikrofon. Die App stoppt Rekorder und Tracks beim Stopp und beim Verlassen der Seite. Die Freigabe selbst bleibt im Browser. | Widerruf liegt in den Browser-Einstellungen. |
| Niedrig | Die persönliche Notiz kann eine Allergie enthalten. Sie liegt in IndexedDB, unverschlüsselt. Der Export enthält sie nur mit dem Haken «Notiz mitexportieren». | Nur auf diesem Gerät, Hinweis im UI. Löschen fragt nach. Vor einem späteren Sync eigene Zustimmung. |
| Info | Die Seite ist öffentlich. Die Sätze sind Lernmaterial, der Lernstand nicht. | Export nicht weitergeben, wenn die Notiz privat ist. |
| Info | Der Service Worker füllt den Cache nach dem ersten Besuch über HTTPS. | Scope bleibt `/Travel-Talk/`. |
| Info | Vietnamesisches Audio ist eine nördliche Stimme. Das ist eine Inhaltsfrage, keine Lücke. | Siehe `docs/audio.md`. Die Sätze sind mit `geprueft: false` markiert. Die Einstellungen nennen VAIS-1000, CC BY 4.0, die Tempo-Dateien und `NOTICE.txt`. |
| Info | Der Precache enthält neu 1'647 Audiodateien, 17'512'855 Bytes. | Dieselben Origins, kein neues Netz. Die Grenze pro Datei bleibt 3 MB. |

## Nach der unabhängigen Prüfung

Geschlossen am 10. Oktober 2026, im selben Stand wie diese Datei:

- Verlassen der Satzseite während einer Aufnahme stoppt Rekorder und Tracks und widerruft die Blob-Adresse. Tests: `src/audio/recorder.test.ts` und `src/pages/phrase-mic.test.tsx`.
- Import und «Lernstand löschen» warten auf einen Dialog. Der Import zeigt Kartenanzahl, Zeitraum und ob eine Notiz dabei ist. Die Sicherung lädt erst auf den Knopf und folgt dem Haken für die Notiz. Ein leeres Notizfeld behält die lokale Notiz. Ein fehlendes Notizfeld lehnt die ganze Datei ab.
- Karten-IDs sind auf 80 Zeichen begrenzt und müssen zu dieser Version gehören. Zeitstempel sind `z.iso.datetime()` mit höchstens 40 Zeichen.
- Zod läuft mit `jitless: true`.
- tsx 4.23.15 zieht esbuild 0.28.2. Der frühere niedrige Befund GHSA-g7r4-m6w7-qqqr (`esbuild` `>=0.27.3 <0.28.1`) ist in diesem Stand nicht mehr im Audit.
- Vite und vite-plugin-pwa sind aus dem App-Build. Der Precache entsteht mit `workbox-build` über `dist/`, inklusive Audio. `navigateFallback` gilt nicht für `/Travel-Talk/audio/`.

## 0.2.0, noch einmal gelesen

Geprüft am 10. Oktober 2026, nur die Differenz zu 0.1.0:

- Tempo: drei Literale, kein freier String, keine URL. Die Datei muss zusätzlich in `manifest.json` stehen. Fehlt sie, spricht der Browser mit `utterance.rate`. Das bleibt auf dem Gerät.
- Kein neues Mikrofon, kein neues `fetch` ausser der bestehenden Manifest- und Audio-Adresse unter `/Travel-Talk/`.
- Kein `playbackRate`. Damit entsteht auch kein zweiter Audiograph, der die Tonhöhe auf iOS verschieben könnte.
- Import der Notiz: die drei Fälle oben sind im Dialog und in `src/storage/import.test.ts` getrennt. Ein Test lehnt eine Datei ohne das Feld `personalNote` ab. Ein Test lehnt ein unbekanntes Feld in den Einstellungen ab.
- Gespeicherte Einstellungen und der Import behandeln `slow` gleich: `true` wird fest 85 %, `false` oder ein fehlendes Feld wird Automatisch. Ein gesetztes `speed` bleibt.
- Dependabot-Datei `.github/dependabot.yml` hat keine Tokens und startet nichts in der App.
- `npm audit` am 10. Oktober 2026: 0 Schwachstellen. Kein neues Paket in dieser Version.
- Offene Punkte von oben bleiben offen: kein `frame-ancestors` auf GitHub Pages, Mikrofon-Freigabe im Browser, Notiz unverschlüsselt in IndexedDB.

## 0.2.1

Geprüft am 10. Oktober 2026. Kein neues Paket, kein neues Netz.

- `format` im Export ist 2. Format 1 bleibt gültig und wird wie bisher übersetzt. Eine höhere Nummer wird vor dem strikten Schema erkannt und nur mit dem festen Satz beantwortet. Tests: `src/storage/import.test.ts` und `src/pages/settings-import.test.tsx`.
- Unbekannte Felder bei Format 1 und 2 bleiben ein Abbruch der ganzen Datei. Sie werden nicht stillschweigend verworfen.
- `npm audit` unverändert: 0 Schwachstellen. Die offenen Punkte von oben bleiben offen.

## 0.2.2

Geprüft am 10. Oktober 2026.

- Der Satz zur neueren Version gilt nur für `Number.isSafeInteger(format) && format > 2`. 2.5, `1e308`, JSON-`1e400` und `"3"` bleiben `IMPORT_REJECTED`. Tests in `src/storage/import.test.ts`.
- Format 1 und Format 2 haben getrennte Schemas. Format 1 ist unverändert, inklusive optionalem `slow` und optionalem `speed`. Format 2 verlangt `speed` und lehnt `slow` ab, auch wenn `speed` daneben steht.
- `@types/react` von 19.2.14 auf 19.3.0, `@types/react-dom` von 19.2.3 auf 19.3.0. Nur Typen, kein Laufzeitpaket, kein neues Netz.
- `npm audit` am 10. Oktober 2026: 0 Schwachstellen. Die offenen Punkte von oben bleiben offen.

## Werkzeuge, ohne neue App-Version

Geprüft am 10. Oktober 2026. Kein Laufzeitpaket, kein neues Netz, die App bleibt 0.2.2.

- `@eslint/js` von 9.39.4 auf 10.0.1. ESLint 10.12.0 und typescript-eslint 8.71.1 bleiben. Dieselbe Konfiguration. Das Paket verlangt Node `^22.13.0` oder neuer. Die CI setzt Node 22, dieser Stand ist 22.14.
- `@types/node` von 22.19.11 auf 22.20.5. Die Linie 22 beschreibt Node 22. 26.6.4 würde APIs ab Node 23 beschreiben, die CI läuft aber mit Node 22. `undici-types` bleibt bei 6.21.0.
- TypeScript bleibt 5.9.3. 7.0.2 ist mit typescript-eslint 8.71.1 nicht benutzbar: das Paket verweigert den Start und nennt als Bereich `>=4.8.4 <6.1.0`.
- Dependabot ignoriert Major-Updates von `typescript` und `@types/node` mit `update-types`. Sicherheitsupdates und Minor- und Patch-Updates bleiben möglich.
- `npm audit` am 10. Oktober 2026: 0 Schwachstellen.

## 0.3.0

Geprüft am 11. Oktober 2026. Kein neues Paket, kein neues Netz, kein Upload.

**Import und Format 3.** Der Export enthält `appLang`, `targetLang` und die bisherigen Anrede-Felder, `speed` und die Notiz nur mit Haken. `pairId` und `uiLang` werden nicht geschrieben. Ein optionales `voices` wird nur geschrieben, wenn nach der Bereinigung mindestens eine Sprache übrig ist. Ungültige Schlüssel und IDs ausserhalb von `^[a-z0-9_-]{1,40}$` fallen dabei weg, sie werden nicht still in die Datei übernommen. Beim Lesen ist `voices` strikt: ein unbekannter Schlüssel oder eine ungültige ID lehnt die ganze Datei ab, nichts wird importiert. `appLang` und `targetLang` kommen aus der Liste `de`, `en`, `pt-BR`, `vi`. Sind beide gesetzt und gleich, ist das `IMPORT_REJECTED`. Format 1 und 2 bleiben gültig und laufen durch ihre alten Schemas, inklusive der Regeln für `slow` und `speed`. Die Übersetzung setzt `appLang` auf die alte Ausgangssprache und `targetLang` auf die alte Lernsprache. Ein deutsches `uiLang` über einer anderen Ausgangssprache wird nicht zur App-Sprache umetikettiert. Der Dialog sagt das mit einem festen Satz, ohne den Dateiinhalt. Karten-IDs bleiben, auch die Richtung im Präfix. Eine Karte zählt nur, wenn die Richtung eine der zwölf ist und das Konzept in diesem Katalog steht. Unbekannte Karten werden gezählt und ausgelassen. Dieselbe Prüfung gilt für eine gespeicherte Einstellungszeile: `coerceSettings` liest `pairId` einmal und schreibt die neuen Felder, ohne fremde Schlüssel mitzuspeichern.

**Mikrofon in der Sitzung.** Nachsprechen fragt das Mikrofon erst auf den Knopf hin an. `startMicrophone` gibt `null` zurück, wenn `mediaDevices` fehlt. Die Seite zeigt dann einen Hinweis und der Knopf Weiter bleibt da. Lehnt der Browser die Freigabe ab, fängt die Sitzung den Fehler und zeigt denselben Hinweis. Beim Wechsel des Schritts und beim Verlassen der Sitzung ruft die Seite `release` auf, wie die Satzseite beim Verlassen. Tracks stoppen, die Blob-Adresse wird widerrufen. Die Kurve der Tonhöhe wird nur nach einer Aufnahme gezeichnet und bleibt im Speicher der Seite. Nichts davon geht in den Export oder ins Netz.

**Sitzung und Schrift.** Unbekannte Konzepte sind nicht fällig. Der Start zählt nur Karten mit einem gespeicherten Termin. Die Sitzung wird einmal pro Richtung und Art gebaut, nicht neu, während eine Bewertung die Karte schreibt. Höchstens 15 neue Karten am Tag, über alle Richtungen zusammen. Die Zielschrift ist bei einem neuen Satz sichtbar und wird nach einer verdeckten Hörfrage sofort wieder gezeigt. Das ändert keine Daten, die das Gerät verlassen.

- Tests: `src/storage/import.test.ts`, `src/srs/session.test.ts`, `src/pages/settings-import.test.tsx`, `src/pages/phrase-mic.test.tsx`, `src/pages/practice-mic.test.tsx`, `src/srs/scheduler.test.ts`.
- `npm audit` am 11. Oktober 2026: 0 Schwachstellen. Die offenen Punkte von oben bleiben offen: kein `frame-ancestors` auf GitHub Pages, Mikrofon-Freigabe im Browser, Notiz unverschlüsselt in IndexedDB.

## Nachprüfung von Pull Request 12

Geprüft am 11. Oktober 2026 am Stand `cf9cbe0`, geschlossen im selben Pull Request. Kein neues Paket, kein neues Netz.

| ID | Schwere | Status | Auflösung |
| --- | --- | --- | --- |
| P12-01 | Mittel | Geschlossen | Startet das Mikrofon und der Schritt oder die Karte ist bis zur Freigabe schon weg, gibt `startMicrophone` die Tracks im `.then` sofort frei. Ein Zähler auf der Sitzung und auf der Satzseite macht einen verspäteten Start ungültig. «Weiter» ist gesperrt, solange die Aufnahme startet. Test: `src/pages/practice-mic.test.tsx`. |
| P12-02 | Mittel | Geschlossen | Der Planer rechnet mit dem späteren von «jetzt» und `last_review`. `reviewCard` und `previewDue` fangen einen Fehler und setzen den nächsten Termin einen Tag nach diesem Zeitpunkt, ohne die Seite abstürzen zu lassen. Der Import lehnt die ganze Datei ab, wenn `last_review` nach `exportedAt` liegt. `due` darf später sein, das ist der nächste Termin. Test: `src/srs/scheduler.test.ts`, `src/storage/import.test.ts`. |
| P12-03 | Niedrig | Geschlossen | Tests decken die fünf Lücken: Mikrofon frei bei «Weiter» und beim Verlassen der Übung, Zählen der 15 neuen Karten, alte Paare inklusive `pt-vi`, unbekanntes Feld auf der obersten Ebene von Format 3. |
| P12-04 | Niedrig | Geschlossen | Der Export und beide Sicherungen bleiben aus, bis Sprache der App und Lernsprache gesetzt sind. Format 3 verlangt die beiden Enums weiter, `null` ist keine gültige Datei. Dieselbe Notiz-Regel wie beim Import gilt beim Lesen aus IndexedDB: Steuerzeichen ausser Zeilenumbruch und Tabulator fallen weg, höchstens 500 Zeichen. Der Import lehnt Steuerzeichen in der Datei weiter ab, er schneidet sie nicht heraus. Test: `src/pages/settings-import.test.tsx`, `src/storage/import.test.ts`. |
| P12-05 | Niedrig | Geschlossen | Eine Stimmen-ID muss `^[a-z0-9_-]{1,40}$` entsprechen. Der Import lehnt die ganze Datei ab. `cleanVoices` lässt eine ungültige ID aus IndexedDB weg. Test: `src/storage/import.test.ts`. |
| P12-06 | Niedrig | Geschlossen | `visibilitychange` auf `hidden` und `pagehide` stoppen die Aufnahme und geben das Mikrofon frei, in der Übung und auf der Satzseite. Tests: `src/pages/practice-mic.test.tsx`, `src/pages/phrase-mic.test.tsx`. |

## 0.3.1

Geprüft am 11. Oktober 2026. Kein neues Paket, kein neues Netz. Die Ablehnung von `last_review` nach `exportedAt` aus P12-02 gilt nicht mehr.

| ID | Schwere | Status | Auflösung |
| --- | --- | --- | --- |
| N12-01 | Niedrig | Geschlossen | `last_review` wird auf `min(last_review, exportedAt, jetzt)` gekürzt, der Import bleibt. Liegt `exportedAt` mehr als 24 Stunden in der Zukunft, lehnt die App die Datei mit einem eigenen Satz ab (`IMPORT_FUTURE`). Ein Export aus 2031 fällt darunter. Tests: `src/storage/import.test.ts`, `src/pages/settings-import.test.tsx`. |
| N12-02 | Niedrig | Geschlossen | Vor der Bewertung wird `last_review` auf jetzt gekürzt und so gespeichert. Die Karte wird nicht von einem zukünftigen Zeitpunkt aus geplant. Test: `src/srs/scheduler.test.ts`. |
| N12-03 | Niedrig | Geschlossen | `load` prüft jede Karte mit `storedCardSchema`, demselben Schema wie der Import. Schlägt das fehl, entsteht in der Fehlerbehandlung eine neue Karte und wird sofort geschrieben. Der Planer setzt eine unleserliche Karte auf neu, nicht einen Tag weiter. Tests: `src/storage/dexie-repository.test.ts`, `src/srs/scheduler.test.ts`. |

Die Satzseite gibt ein Mikrofon frei, dessen Start erst nach dem Verlassen der Seite ankommt. Test: `src/pages/phrase-mic.test.tsx`.
