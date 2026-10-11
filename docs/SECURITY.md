# Sicherheitsprüfung Travel Talk 0.4.0

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

**Audio-Pfade.** Eine Datei wird nur abgespielt, wenn der Name dem festen Muster `{sprache}/{stimme}/?{id}__{region}__{variante}(.r70|.r85)?.m4a` entspricht und in `manifest.json` steht. Der Stimmordner ist optional und muss `^[a-z0-9_-]{1,40}$` sein. Die Adresse wird daraus gebaut, nicht aus einem freien String. Die Stufe hängt `.r70` oder `.r85` an den schon geprüften Stamm. `playbackRate` wird nicht gesetzt. Das Tempo liegt nur in IndexedDB, es geht kein Audio und keine Stufe ins Netz. Es gibt keinen Abruf einer Stimme von Azure, Google oder einem anderen Dienst.

**Geheimnisse.** Keine Tokens, keine `.env`, keine `VITE_`-Schlüssel. Die CI-Deploy-Rechte sind `contents: read` plus, nur im Deploy-Job, `pages: write` und `id-token: write`.

**Berechtigungen.** Das Mikrofon wird erst beim Tippen auf Aufnehmen angefragt, auf der Satzseite und im Schritt Nachsprechen. Nach dem Stopp, beim nächsten Schritt und beim Verlassen der Seite werden Rekorder, Tracks und die Blob-Adresse aufgeräumt. Fehlt das Mikrofon oder lehnt der Browser ab, steht ein Hinweis da und die Sitzung geht weiter. Es gibt keinen zweiten Weg, der eine Aufnahme erzwingt. Die Aufnahme bleibt ein Blob im Speicher der Seite und wird nicht hochgeladen und nicht in IndexedDB geschrieben. Der Service Worker hat den Scope `/Travel-Talk/`. Audio-Pfade sind vom Navigate-Fallback ausgenommen. In der CI checkt `actions/checkout` mit `persist-credentials: false` aus, und `npm ci` läuft mit `--ignore-scripts`.

**Abhängigkeiten.** Versionen sind fest. Dependabot prüft npm und GitHub Actions wöchentlich und wartet mit `cooldown.default-days: 7`, bevor eine frisch veröffentlichte Version einen Pull Request öffnet. Das ändert die App nicht, es verzögert nur Updates. Major-Updates von `typescript` und `@types/node` sind ignoriert, über `update-types`, nicht über eine festgeschriebene Version. Sicherheitsupdates und Minor- und Patch-Updates bleiben möglich. Laufzeit: React 19.3.0, Dexie 4.4.6, ts-fsrs 5.4.2, pitchy 4.1.0, Zod 4.6.5, React Router 7.18.4. Typen: `@types/react` 19.3.0, `@types/react-dom` 19.3.0, `@types/node` 22.20.5. Build: Rsbuild 2.2.12, `@rsbuild/plugin-react` 2.1.1, Rspack über Rsbuild. Der Service Worker kommt von `workbox-build` 7.4.1 nach dem Build, weil die Audiodateien kopierte Dateien sind und nicht Teil der Kompilation. Scope `/Travel-Talk/`. Das Manifest liegt in `public/manifest.webmanifest`. Kein CDN, keine Tracker, Schriften nur vom System. Der Build setzt eine CSP ohne `unsafe-inline` und ohne `unsafe-eval`, und er setzt keine Inline-Skripte. Im Dev-Server fehlt das Meta-Tag, weil das HMR sonst blockiert. Tests laufen mit Vitest 5.0.3. Komponententests nutzen happy-dom 20.14.6 und Testing Library 16.3.3, nur in der Entwicklung. Vitest bringt Vite nur als Testläufer mit, nicht für die veröffentlichte App. TypeScript 5.9.3, ESLint 10.12.0, `@eslint/js` 10.0.1, typescript-eslint 8.71.1. `@eslint/js` 10 verlangt Node `^22.13.0`. Die CI setzt Node 22. `@types/node` bleibt auf der Linie 22, passend zu dieser CI. Die App-Version ist 0.4.0.

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
| Info | Vietnamesisch hat eine nördliche Frauenstimme und zwei Männerstimmen aus vivos. Der Akzent der Männerstimmen ist nicht dokumentiert. Das ist eine Inhaltsfrage, keine Lücke. | Siehe `docs/audio.md` und `public/audio/NOTICE.txt`. Die Sätze sind mit `geprueft: false` markiert. |
| Info | Audiodateien stehen nicht mehr im Precache. Die gewählte Lernstimme wird in einen Laufzeit-Cache gelegt. | Dieselben Origins, kein neues Netz. Die Grenze pro Datei bleibt 3 MB. |

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

Die Satzseite gibt ein Mikrofon frei, dessen Start erst nach dem Wechsel zum nächsten Satz ankommt. Test: `src/pages/phrase-mic.test.tsx`.

## 0.4.0

Geprüft am 11. Oktober 2026. Kein neues npm-Paket, kein Konto, kein API-Schlüssel, kein Netz ausser den eigenen Dateien unter `/Travel-Talk/`.

**Lizenzen.** Die neuen Dateien sind offline mit Piper erzeugt. Die Modelle liegen nicht im Repo. CC0 gilt nur für die Datensätze von Thorsten-Voice und OHF-Voice. `thorsten-high`, `thorsten`, `joe`, `cadu` und `faber` sind davon feinjustiert und sind nicht CC0. Die Basis ist lessac, und lessac gilt nur für Forschung. Englisch `ljspeech` bleibt gemeinfrei und ist von Grund auf trainiert. Vietnamesisch `vais1000`: Datensatz CC BY 4.0, https://creativecommons.org/licenses/by/4.0/, das Modell ist von lessac feinjustiert, das Material wurde verändert. Die beiden vivos-Sprecher (`vivos-22`, `vivos-32`) bleiben. Sie sind von Grund auf trainiert. Das erzeugte Audio in `vi/vivos-22/` und `vi/vivos-32/` steht unter CC BY-NC-SA 4.0, https://creativecommons.org/licenses/by-nc-sa/4.0/, das Material wurde verändert. In beiden Ordnern liegt eine LICENSE. Die Hörproben unter `docs/samples/` haben dieselbe Unterscheidung. Nicht verwendet: `en_US-ryan` (CC BY-NC-SA), `en_GB-alan` (Lizenz auf der Karte nur «See URL»), `pt_BR-jeff` (Datensatz CC0, Modell von lessac, nicht zusätzlich gepackt), lessac-Gewichte (nur Research). Piper selbst ist GPL-3.0 und wird nicht mitgeliefert. Namensnennung: `public/audio/NOTICE.txt` und `docs/audio.md`.

**Pipeline.** Piper läuft ausserhalb des Repos (`tools/generate_audio.py`). `piper-tts` ist auf 1.8.0 festgeschrieben. Die vier Modelle von 0.4.0 haben eine SHA-256 im Skript, geprüft vor der Synthese. `normalize_audio` ist die Spitzen-Normalisierung, danach `ffmpeg` AAC 48 kbit/s, mono, und `atempo` 0.7 und 0.85 ohne Tonhöhenänderung. Die App spielt nur Namen, die `AUDIO_FILE` und `manifest.json` erlauben. `include_alignments` lieferte für diese Modelle keine Zeiten. Es wurden keine Zeitstempel-Dateien geschrieben und keine erfunden. Der Service Worker precacht `m4a` nicht mehr. Eine CacheFirst-Regel speichert `/Travel-Talk/audio/*.m4a` nur bei HTTP 200, höchstens 4000 Einträge. Das Installieren kopiert kein Audio. Die Aktivierung löscht Precache-URLs, die nicht mehr im Manifest stehen, darunter die alten Audiodateien. Danach lädt man die Stimme mit «Für offline laden» neu. Andere Stimmen derselben Sprache fallen erst nach dem vollständigen Laden der neuen weg. `speechSynthesis` wird nicht aufgerufen. `*.align.json` ist vom Precache ausgenommen, falls so eine Datei später dazukommt.

**Abhängigkeiten.** Keine neue Laufzeit- und keine neue Entwicklungsabhängigkeit. `npm audit` am 11. Oktober 2026: 0 Schwachstellen. Versionen bleiben fest. Neu sind 2'244 Audiodateien, 30'013'700 Bytes. Zusammen mit den bisherigen 1'647 Dateien (17'512'855 Bytes) sind es 3'891 Dateien und 47'526'555 Bytes. Sie liegen nicht im Precache.

| ID | Schwere | Status | Auflösung |
| --- | --- | --- | --- |
| N13-01 | Niedrig | Geschlossen | `due` später als `last_review` oder, wenn der fehlt, jetzt, plus 36'500 Tage, wird gekürzt. Der Import bleibt. Dieselbe Kürzung gilt beim Lesen aus IndexedDB, die gekürzte Karte wird gespeichert, und bei `reviewCard` und `previewDue`. Tests: `src/storage/import.test.ts`, `src/storage/dexie-repository.test.ts`, `src/srs/scheduler.test.ts`, `src/pages/practice-rate.test.tsx`. |
| N13-02 | Niedrig | Geschlossen | Der Satzseiten-Test wechselt zum nächsten Satz, die Seite bleibt `PhrasePage`. Ein Start, der erst danach fertig wird, gibt die Tracks frei. Vorher werden sie nicht gestoppt. Test: `src/pages/phrase-mic.test.tsx`. |

`exportedAt` ist `z.iso.datetime()` mit höchstens 40 Zeichen. Ein Datum ohne Uhrzeit ist `IMPORT_REJECTED`, ein ISO-Zeitstempel mehr als 24 Stunden in der Zukunft bleibt `IMPORT_FUTURE`. Eine Karte, die beim Lesen aus IndexedDB ersetzt wird, zählt mit. Die Startseite kann «n Karten zurückgesetzt» sagen. Der Hinweis auf Männerstimmen liegt nur lokal (`voiceHintSeen`) und geht nicht in den Export, damit Format 3 strikt bleibt.

## Nachprüfung von Pull Request 14

Geprüft am 11. Oktober 2026 am Stand der Überprüfung von `e3d8b36`, geschlossen im selben Pull Request. Kein neues Paket, kein neues Netz. `npm audit` bleibt bei 0 Schwachstellen.

| ID | Schwere | Status | Auflösung |
| --- | --- | --- | --- |
| P14-01 | Mittel | Geschlossen | thorsten-high, thorsten, joe, cadu und faber werden nicht mehr CC0 genannt. CC0 gilt für den Datensatz. Die Stimme ist von lessac feinjustiert, lessac nur für Forschung. vivos bleibt, CC BY-NC-SA 4.0, mit LICENSE in `vi/vivos-22/` und `vi/vivos-32/`. NOTICE, die App und `docs/samples/LICENSE.txt` verlinken CC BY 4.0 und CC BY-NC-SA 4.0 und sagen, dass das Material verändert wurde. |
| P14-02 | Mittel | Geschlossen | Jede Stimme hat «Für offline laden», mit Fortschritt, «offline bereit», «Erneut versuchen» und einem Satz, wenn der Speicher voll ist. Die Startseite bietet das für die Lernsprache. Andere Stimmen derselben Sprache fallen erst weg, wenn die neue vollständig geladen ist. Offline zeigt ein fehlender Satz «Stimme offline nicht geladen». Keine Browserstimme. Die alte Audiodatei überlebt ein Update nicht von selbst. Das steht bei N14b-01. |
| P14-03 | Mittel | Geschlossen | Der Import übernimmt `voices: next.settings.voices ?? current.settings.voices`. Eine Datei ohne das Feld lässt die Stimme auf dem Gerät stehen. Test: `src/pages/settings-import.test.tsx`. |
| P14-04 | Niedrig | Geschlossen | Tests für die Kürzung ohne «jetzt», `previewDue` bei einem vergangenen `last_review`, den Satz-Token in `onStop`, den Stimmhinweis, «n Karten zurückgesetzt», unbekannte Stimmen-IDs und das Offline-Laden. |
| P14-05 | Niedrig | Geschlossen | Nach dem vollständigen Laden einer gewählten Stimme löscht die App die anderen Stimmen dieser Sprache aus jedem Cache. Die Cache-Regel nimmt nur Status 200. `maxEntries` ist 4000 und deckt die 3891 Dateien. |

Eine unbekannte Stimmen-ID, die dem Muster `^[a-z0-9_-]{1,40}$` entspricht, wird beim Lesen verworfen und nicht gespeichert. Eine ID ausserhalb des Musters lehnt die Datei weiter ab. `tools/generate_audio.py` verlangt `piper-tts` 1.8.0 und die SHA-256 der vier Modelle.

## Nachprüfung von Pull Request 14, zweiter Durchgang

Geprüft am 11. Oktober 2026 am Stand `19535e2`. N14b-03 und N14b-04 sind geschlossen. N14b-01 ist danach bewusst akzeptiert, siehe den dritten Durchgang. N14b-05 ist in 0.5.0 geschlossen. N14b-02 ist in 0.6.0 geschlossen. Kein neues Paket. `npm audit` bleibt bei 0 Schwachstellen.

| ID | Schwere | Status | Auflösung |
| --- | --- | --- | --- |
| N14b-01 | Mittel | bewusst akzeptiert | Die Aktivierung löscht Precache-Einträge, die nicht mehr im Manifest stehen, darunter die alten Audiodateien. Eine Kopie beim Installieren hält sie nicht: die gespeicherte Adresse behält `?__WB_REVISION__` und trifft nie, wenig Speicher lässt das Installieren dauerhaft scheitern, der Speicher verdoppelt sich, und jeder Cache der gemeinsamen Origin wird gelesen. Die Migration ist entfernt. Nach dem Update, das online läuft, sagt die Startseite «Offline-Audio nach dem Update neu laden», solange die Lernsprache nicht vollständig im Cache liegt. Ein Tippen auf «Für offline laden» holt sie. |
| N14b-02 | Niedrig | Geschlossen | Die Tests in `src/audio/offline.test.ts` sperren die Verhaltensweisen, die M1, M2, N4 und N15–N17 beschreiben. Die ursprünglichen Mutanten-Diffs lagen nicht im Repo. |
| N14b-03 | Niedrig | Geschlossen | Eine 404 wird übersprungen. Der Rest der Stimme wird geladen. Die Oberfläche sagt «n Dateien fehlen». Die anderen Stimmen dieser Sprache bleiben, solange Dateien fehlen. Test: `src/audio/offline.test.ts`. |
| N14b-04 | Niedrig | Geschlossen | «Speicher voll» zeigt den Fortschritt, «Erneut versuchen» und «Bisherige Stimme behalten». Der zweite Knopf entfernt nur die Dateien dieses Versuchs. Nach einem Neuladen bleibt `n/597` sichtbar, wenn Dateien im Cache liegen. Test: `src/components/voice-offline.test.tsx`. |
| N14b-05 | Niedrig | Geschlossen | `tools/generate_audio.py` prüft SHA-256 der `.onnx`-Datei und der `.onnx.json` daneben, für die vier Modelle von 0.4.0 und für `thorsten-medium`, `ljspeech`, `faber` und `vais1000`. `pt_BR-jeff` bleibt draussen. |

Die Startseite bietet das Laden nur für die Lernsprache an, nicht für die Sprache der App. Die README nennt die App nicht pauschal offline.

## Nachprüfung von Pull Request 14, dritter Durchgang

Geprüft am 11. Oktober 2026 am Stand `d191c25`. Die Installations-Migration ist entfernt. Kein neues Paket. `npm audit` bleibt bei 0 Schwachstellen.

| ID | Schwere | Status | Auflösung |
| --- | --- | --- | --- |
| N14c-01 | Mittel | Geschlossen | Kopien behielten `?__WB_REVISION__` und wurden nie getroffen. Nach dem Update blieb die App offline stumm. Behoben durch Entfernen der Migration. Die Startseite bittet um ein neues Laden. |
| N14c-02 | Mittel | Geschlossen | Bei wenig Speicher schlug das Installieren dauerhaft fehl. Die App blieb auf 0.3.1. Behoben durch Entfernen der Migration. Das Installieren fasst Audio nicht an. |
| N14c-03 | Niedrig | Geschlossen | Die Kopie verdoppelte den Speicher. Behoben durch Entfernen der Migration. Es gibt keine zweite Kopie. |
| N14c-04 | Niedrig | Geschlossen | Das Installieren las jeden Cache der gemeinsamen Origin. Behoben durch Entfernen der Migration. |

`discardAdded` löscht nur die Adressen dieses Versuchs. `added` listet sie. «Bisherige Stimme behalten» ruft `onKeepPrevious`. Danach lesen die Nachbarstimmen ihren Stand neu. Tests: `src/audio/offline.test.ts`, `src/components/voice-offline.test.tsx`.

## 0.5.0

Geprüft am 11. Oktober 2026. Keine neue Laufzeitabhängigkeit und keine neue npm-Abhängigkeit. `npm audit` bleibt bei 0 Schwachstellen.

**Wortzeiten.** `tools/align_clips.py` liest Phonemlängen aus Piper 1.8.0. Dafür lädt Piper das Modell mit `include_alignments`, und das braucht das Python-Paket `onnx` 1.17.0 nur auf der Maschine, die die Dateien erzeugt. `onnx` steht nicht in `package.json` und nicht im Service Worker. `numpy` ist dort schon vorhanden. Montreal Forced Aligner ist nicht installiert und wird nicht aufgerufen. Die JSON-Dateien liegen unter `public/audio/` neben der normalen `m4a`. `manifest.json` listet sie. `loadManifest` nimmt einen Namen nur, wenn er `ALIGN_FILE` trifft: dieselbe Sprache, derselbe optionale Stimmordner, derselbe Clip, Endung `.align.json`, ohne `.r70` oder `.r85`. «Für offline laden» speichert sie im Cache `travel-talk-audio`, zusammen mit der Stimme. Der Fortschritt zählt sie mit. Eine 404 zählt als fehlende Datei und hält das Löschen der anderen Stimme auf, wie bei Audio. Eine Zeitdatei, die nie geschrieben wurde, steht nicht in der Liste und zählt nicht als fehlend. `dropOtherVoices` löscht die Zeitdateien der anderen Stimme mit. Die Dateien stehen in `globIgnores` und kommen nicht in den Precache. Die CacheFirst-Regel nimmt `.m4a` und `.align.json`, nur Status 200. `maxEntries` ist 5500 und deckt die 5145 Dateien, 3891 Audio und 1254 Zeiten. Die App liest eine gespeicherte Zeitdatei aus dem Cache, bevor sie das Netz fragt. Die Zod-Prüfung gilt für diese Antwort genauso.

**Prüfung der JSON.** `src/audio/align.ts` liest die Datei mit Zod, `strictObject`, ohne zusätzliche Felder. Erlaubt sind 1 bis 64 Wörter, jede Zeit eine endliche Zahl von 0 bis 60 Sekunden, Ende nach Anfang, und die Folge steigt. Die Anzahl muss die Wörter der gesprochenen Zeile treffen, sonst wird die Datei verworfen. Vor `JSON.parse` gilt eine Grenze von 16 KB, am `Content-Length` und an der gelesenen Länge. Der Name muss in `manifest.json` stehen und `ALIGN_FILE` treffen. Liegt die Dauer der Audiodatei vor, darf das letzte Wort höchstens 0,1 Sekunden danach enden, multipliziert mit dem Tempofaktor. Bei 100 % sind das 0,1 s, bei 70 % etwa 0,14 s. Sonst keine Markierung. Eine 404, ein Parsefehler oder eine ungültige Datei ergibt keine Markierung. 70 % und 85 % skalieren die Zeiten der normalen Datei. Nachschlagen lädt die Zeiten der Datei, die gerade spielt.

**Wortzuordnung.** `content/gloss.ts` verbindet Wörter der vorhandenen Sätze. `GLOSS_CHECKED` ist falsch. Die Oberfläche sagt «Die Wortzuordnung ist nicht geprüft.» Eine Gruppe, deren Wörter in der Zeile nicht vorkommen, wird ausgelassen. Nichts davon ist eine neue Übersetzung.

**N14d-01.** Die Startseite sagt «Für offline noch nicht vollständig geladen», nur solange die Lernsprache nicht vollständig im Cache liegt. Der Satz setzt kein Update voraus.

**N14d-02.** In den Einstellungen wählen «Speicher voll» und «Bisherige Stimme behalten» die vorige Stimme wieder. `dropOtherVoices` sendet `travel-talk-audio-changed`. Tests: `src/components/language-choice-offline.test.tsx`, `src/audio/offline.test.ts`. Das schliesst N14b-02 nicht.

**N14b-02.** In 0.6.0 geschlossen. Die Verhaltensweisen stehen dort.

**N15.** Im Schritt Hören bleibt die Wortzuordnung verborgen, bis die Bedeutung gewählt ist. Eine Zeile mit Platzhalter, etwa `[tên]`, bleibt neben der gesprochenen Zeile sichtbar. Auf der Startseite erscheint «Bisherige Stimme behalten» nur, wenn eine andere Stimme dieser Sprache vollständig im Cache liegt, und der Knopf wählt diese Stimme.

**N14b-05.** Vor der Synthese und vor den Wortzeiten prüft `require_model` die SHA-256 der `.onnx`-Datei und der `.onnx.json`. Das gilt für die vier Modelle von 0.4.0 und für die vier älteren Modelle.

Von 1297 Clips haben 1254 eine Zeitdatei. 43 nicht: meist Englisch, wo espeak mehrere Wörter zu einer Phonemgruppe macht, etwa «I am». Die bleiben ohne Markierung. Der Median des Abstands einer inneren Grenze zum nächsten Energie-Dip in ±80 ms ist 0,040 s, das 90.-Perzentil 0,070 s. Die stille Referenz ist im Median etwa 7 % kürzer als die ausgelieferte Datei.

## 0.6.0

Geprüft am 11. Oktober 2026. Keine neue Laufzeitabhängigkeit. `onnx` 1.17.0 bleibt nur im Erzeugungspfad der Wortzeiten. `require_onnx` prüft die Version mit `importlib.metadata`, bevor `align_clips.py` das Modell mit `include_alignments` lädt. `generate_audio.py` ruft das nicht auf.

**Namen.** `cleanPersonName` entfernt Steuerzeichen, schneidet Leerzeichen ab und behält 1 bis 40 Zeichen. Alles andere wird abgelehnt. Die Oberfläche setzt den Namen als React-Text. Namen stehen nicht im Repo und nicht in den Logs. Zehn Personen sind das Maximum. Die elfte wird nicht angelegt, und der Knopf zum Hinzufügen ist dann weg.

**Import.** Format 4 ist eine Person oder alle Personen, höchstens 4 MB und 8000 Karten. Eine Person ersetzen lässt die anderen stehen. Als neue Person geht nur unter zehn und mit einem gültigen Namen. Alle Personen ersetzen läuft erst nach der eigenen Bestätigung und löscht vorher den bisherigen Stand. Formate 1 bis 3 bleiben eine Person mit leerem Namen. Eine Datei, die das Schema nicht trifft, wirft `IMPORT_REJECTED`. Die Meldung enthält den Dateiinhalt nicht. `level` ist 0. Eine andere Stufe wird abgelehnt, bis der Einstufungstest kommt.

**Isolation und Löschen.** Karten hängen an `personId`. Der Lernstand einer Person ist für die andere unsichtbar. `replaceAll` schreibt nur die aktive Person. Löschen entfernt die Karten dieser Person. Die letzte Person wird durch eine neue ohne Namen ersetzt, damit die App wieder starten kann. Der Audio-Cache bleibt.

**Stimmen.** `dropOtherVoices` behält die Stimmen-IDs, die andere Personen dieser Sprache noch benutzen. Die eigene vorige Stimme gehört nicht dazu. Ein Ordner zählt nur, wenn er genau die ID ist: `vivos-220/` bleibt nicht, wenn `vivos-22` behalten wird. Dateien einer anderen Sprache bleiben. `discardAdded([])` löscht nichts.

**N14b-02.** Geschlossen durch Tests in `src/audio/offline.test.ts`. Die ursprünglichen Mutanten-Diffs waren nicht auffindbar. Die Tests sperren diese Verhaltensweisen: ein HTTP-Status ausser 404 bricht den Download ab und behält die andere Stimme (M1). Bei vollem Speicher listet `added` die Adressen, die dieser Versuch schon geschrieben hat (M2). `dropOthers: () => false` löscht nach einem vollständigen Laden nichts (N4). Eine Stimmen-ID trifft nur den Ordner plus Schrägstrich (N15). Dateien einer anderen Sprache bleiben (N16). `discardAdded` löscht nur die genannten Adressen, eine leere Liste nichts (N17).

**Lernsprache.** Die Lernsprache und die vietnamesische Variante stehen nur in der oberen Leiste. Die Einstellungen behalten die App-Sprache und die Stimme. «Bisherige Stimme behalten» erscheint dort nur, wenn die vorige Stimme vollständig im Cache liegt.

**Wortzeiten.** Eine fehlgeschlagene Zeitdatei wird nicht gecacht. Der nächste Versuch liest sie neu. Während eine Datei spielt, bleiben die Zeiten dieser Datei, auch wenn das Tempo wechselt. `playClip` meldet die Zeit über `requestAnimationFrame`, nicht über `ontimeupdate`.
