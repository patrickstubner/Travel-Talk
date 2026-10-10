# Sicherheitsprüfung Travel Talk 0.2.0

Datum: 10. Oktober 2026. Geprüft am Quellstand dieser Version, nach dem Schreiben der Tempo-Stufen. Kein Backend, kein Konto, keine Schlüssel. Die Prüfung von 0.1.0 bleibt unten stehen, wo sie noch gilt.

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

**Eingabe, besonders der JSON-Import.** Die Datei darf höchstens 2'000'000 Zeichen haben. `JSON.parse` verwirft die Schlüssel `__proto__`, `constructor` und `prototype`. Danach prüft Zod das Paket strikt, mit `z.config({ jitless: true })`, also ohne `new Function`. Nur die erwarteten Felder, Paar- und Anrede-Werte aus einer Liste, Karten-Zahlen in festen Grenzen, höchstens 2000 Karten, keine doppelten Karten-IDs. `cardId` hat höchstens 80 Zeichen. Unbekannte Karten, die nicht zu einem Paar und einem Konzept dieser Version gehören, werden ausgelassen, und die Oberfläche nennt nur die Anzahl. `due` und `last_review` sind ISO-Zeitstempel mit höchstens 40 Zeichen. Die persönliche Notiz ist auf 500 Zeichen begrenzt und darf ausser Zeilenumbruch und Tabulator keine Steuerzeichen enthalten. Der Export lässt die Notiz weg, bis der Haken «Notiz mitexportieren» gesetzt ist. Bei einem Fehler sieht die Oberfläche nur den Satz, dass die Datei kein gültiger Export ist. Der Inhalt der Datei steht nicht in der Meldung. Import und Löschen ersetzen den Lernstand erst nach einem Dialog. Die Sicherung wird nicht von selbst heruntergeladen. Der Knopf «Sicherung herunterladen» folgt dem Haken «Notiz mitexportieren» und lässt die Notiz weg, solange der Haken fehlt. Drei Fälle für die Notiz, und sie sind nicht dasselbe: Fehlt das Feld `personalNote`, lehnt das strikte Schema die ganze Datei ab (`IMPORT_REJECTED`). Es wird nichts importiert, die lokale Notiz bleibt, weil der Dialog gar nicht so weit kommt. Ist das Feld da und leer oder nur Leerzeichen, bleibt die lokale Notiz, und der Dialog sagt das. Ist das Feld ein nicht leerer Text, ersetzt er die lokale Notiz, und der Dialog sagt das. `speed` darf nur `auto`, 0.7, 0.85 oder 1 sein. Ein altes `slow: true` ohne `speed` wird fest 85 %. `slow: false` oder ein fehlendes `slow`, der Stand von 0.1.0, wird Automatisch. Ein gesetztes `speed` gewinnt. Ein anderer Wert für `speed` wird abgelehnt. Ein unbekanntes Feld in den Einstellungen lehnt die ganze Datei ab, es wird nichts übernommen.

**XSS.** React schreibt Texte als Text. `dangerouslySetInnerHTML`, `innerHTML`, `outerHTML` und `eval` sind per ESLint verboten. Die Markierung von Platzhaltern wie `[Name]` zerlegt den String und setzt die Teile als Textknoten. Externe Links kommen nur aus dem Katalog und müssen mit `https://` beginnen. Sie tragen `rel="noreferrer noopener"`.

**Audio-Pfade.** Eine Datei wird nur abgespielt, wenn der Name dem festen Muster `{sprache}/{id}__{region}__{variante}(.r70|.r85)?.m4a` entspricht und in `manifest.json` steht. Die Adresse wird daraus gebaut, nicht aus einem freien String. Die Stufe hängt `.r70` oder `.r85` an den schon geprüften Stamm. `playbackRate` wird nicht gesetzt. Das Tempo liegt nur in IndexedDB, es geht kein Audio und keine Stufe ins Netz.

**Geheimnisse.** Keine Tokens, keine `.env`, keine `VITE_`-Schlüssel. Die CI-Deploy-Rechte sind `contents: read` plus, nur im Deploy-Job, `pages: write` und `id-token: write`.

**Berechtigungen.** Das Mikrofon wird erst beim Tippen auf Aufnehmen angefragt. Nach dem Stopp und beim Verlassen der Satzseite werden Rekorder, Tracks und die Blob-Adresse aufgeräumt. Die Aufnahme bleibt ein Blob im Speicher der Seite und wird nicht hochgeladen und nicht in IndexedDB geschrieben. Der Service Worker hat den Scope `/Travel-Talk/`. Audio-Pfade sind vom Navigate-Fallback ausgenommen. In der CI checkt `actions/checkout` mit `persist-credentials: false` aus, und `npm ci` läuft mit `--ignore-scripts`.

**Abhängigkeiten.** Versionen sind fest. Dependabot prüft npm und GitHub Actions wöchentlich und wartet mit `cooldown.default-days: 7`, bevor eine frisch veröffentlichte Version einen Pull Request öffnet. Das ändert die App nicht, es verzögert nur Updates. Laufzeit: React 19.3.0, Dexie 4.4.6, ts-fsrs 5.4.2, pitchy 4.1.0, Zod 4.6.5, React Router 7.18.4. Build: Rsbuild 2.2.12, `@rsbuild/plugin-react` 2.1.1, Rspack über Rsbuild. Der Service Worker kommt von `workbox-build` 7.4.1 nach dem Build, weil die Audiodateien kopierte Dateien sind und nicht Teil der Kompilation. Scope `/Travel-Talk/`. Das Manifest liegt in `public/manifest.webmanifest`. Kein CDN, keine Tracker, Schriften nur vom System. Der Build setzt eine CSP ohne `unsafe-inline` und ohne `unsafe-eval`, und er setzt keine Inline-Skripte. Im Dev-Server fehlt das Meta-Tag, weil das HMR sonst blockiert. Tests laufen mit Vitest 5.0.3. Komponententests nutzen happy-dom 20.14.6 und Testing Library 16.3.3, nur in der Entwicklung. Vitest bringt Vite nur als Testläufer mit, nicht für die veröffentlichte App.

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
