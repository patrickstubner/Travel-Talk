# Sicherheitsprüfung Travel Talk 0.1.0

Datum: 10. Oktober 2026. Geprüft am Quellstand dieser Version, nach dem Schreiben der App. Kein Backend, kein Konto, keine Schlüssel.

## Quellen

- OWASP Cheat Sheet, Input Validation: https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html
- OWASP Cheat Sheet, XSS Prevention: https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
- MDN, Content-Security-Policy, inklusive der Direktiven, die ein Meta-Tag nicht setzen kann: https://developer.mozilla.org/docs/Web/HTTP/Headers/Content-Security-Policy
- MDN, `getUserMedia`: https://developer.mozilla.org/docs/Web/API/MediaDevices/getUserMedia
- Zod, strikte Objekte: https://zod.dev
- GitHub Advisory GHSA-g7r4-m6w7-qqqr: https://github.com/advisories/GHSA-g7r4-m6w7-qqqr
- `npm audit` am 10. Oktober 2026, nach tsx 4.23.15: 0 low, 0 moderate, 0 high, 0 critical
- GitHub Pages liefert keine eigenen Response-Header für ein Projekt-Repo. Die CSP steht deshalb als Meta-Tag ganz am Anfang von `<head>` im gebauten `index.html`, vor dem Modul-Skript. `frame-ancestors` lässt sich in einem Meta-Tag nicht setzen (MDN).

## Was geprüft wurde

**Eingabe, besonders der JSON-Import.** Die Datei darf höchstens 2'000'000 Zeichen haben. `JSON.parse` verwirft die Schlüssel `__proto__`, `constructor` und `prototype`. Danach prüft Zod das Paket strikt, mit `z.config({ jitless: true })`, also ohne `new Function`. Nur die erwarteten Felder, Paar- und Anrede-Werte aus einer Liste, Karten-Zahlen in festen Grenzen, höchstens 2000 Karten, keine doppelten Karten-IDs. `cardId` hat höchstens 80 Zeichen. Unbekannte Karten, die nicht zu einem Paar und einem Konzept dieser Version gehören, werden ausgelassen, und die Oberfläche nennt nur die Anzahl. `due` und `last_review` sind ISO-Zeitstempel mit höchstens 40 Zeichen. Die persönliche Notiz ist auf 500 Zeichen begrenzt und darf ausser Zeilenumbruch und Tabulator keine Steuerzeichen enthalten. Der Export lässt die Notiz weg, bis der Haken «Notiz mitexportieren» gesetzt ist. Bei einem Fehler sieht die Oberfläche nur den Satz, dass die Datei kein gültiger Export ist. Der Inhalt der Datei steht nicht in der Meldung. Import und Löschen ersetzen den Lernstand erst nach einem Dialog. Vor dem Import wird eine Sicherung des jetzigen Stands angeboten und heruntergeladen; sie enthält die Notiz, wenn eine gespeichert ist.

**XSS.** React schreibt Texte als Text. `dangerouslySetInnerHTML`, `innerHTML`, `outerHTML` und `eval` sind per ESLint verboten. Die Markierung von Platzhaltern wie `[Name]` zerlegt den String und setzt die Teile als Textknoten. Externe Links kommen nur aus dem Katalog und müssen mit `https://` beginnen. Sie tragen `rel="noreferrer noopener"`.

**Audio-Pfade.** Eine Datei wird nur abgespielt, wenn der Name dem festen Muster `{sprache}/{id}__{region}__{variante}.m4a` entspricht und in `manifest.json` steht. Die Adresse wird daraus gebaut, nicht aus einem freien String.

**Geheimnisse.** Keine Tokens, keine `.env`, keine `VITE_`-Schlüssel. Die CI-Deploy-Rechte sind `contents: read` plus, nur im Deploy-Job, `pages: write` und `id-token: write`.

**Berechtigungen.** Das Mikrofon wird erst beim Tippen auf Aufnehmen angefragt. Nach dem Stopp und beim Verlassen der Satzseite werden Rekorder, Tracks und die Blob-Adresse aufgeräumt. Die Aufnahme bleibt ein Blob im Speicher der Seite und wird nicht hochgeladen und nicht in IndexedDB geschrieben. Der Service Worker hat den Scope `/Travel-Talk/`. Audio-Pfade sind vom Navigate-Fallback ausgenommen. In der CI checkt `actions/checkout` mit `persist-credentials: false` aus, und `npm ci` läuft mit `--ignore-scripts`.

**Abhängigkeiten.** Versionen sind fest. Laufzeit: React 19.3.0, Dexie 4.4.6, ts-fsrs 5.4.2, pitchy 4.1.0, Zod 4.6.5, React Router 7.18.4. Build: Rsbuild 2.2.12, `@rsbuild/plugin-react` 2.1.1, Rspack über Rsbuild. Der Service Worker kommt von `workbox-build` 7.4.1 nach dem Build, weil die Audiodateien kopierte Dateien sind und nicht Teil der Kompilation. Scope `/Travel-Talk/`. Das Manifest liegt in `public/manifest.webmanifest`. Kein CDN, keine Tracker, Schriften nur vom System. Der Build setzt eine CSP ohne `unsafe-inline` und ohne `unsafe-eval`, und er setzt keine Inline-Skripte. Im Dev-Server fehlt das Meta-Tag, weil das HMR sonst blockiert. Tests laufen mit Vitest 5.0.3. Vitest bringt Vite nur als Testläufer mit, nicht für die veröffentlichte App.

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
| Info | Vietnamesisches Audio ist eine nördliche Stimme. Das ist eine Inhaltsfrage, keine Lücke. | Siehe `docs/audio.md`. Die Sätze sind mit `geprueft: false` markiert. Die Einstellungen nennen VAIS-1000, CC BY 4.0, die langsamen Dateien und `NOTICE.txt`. |

## Nach der unabhängigen Prüfung

Geschlossen am 10. Oktober 2026, im selben Stand wie diese Datei:

- Verlassen der Satzseite während einer Aufnahme stoppt Rekorder und Tracks und widerruft die Blob-Adresse. Test: `src/audio/recorder.test.ts`.
- Import und «Lernstand löschen» warten auf einen Dialog. Der Import zeigt Kartenanzahl, Zeitraum und ob eine Notiz dabei ist, und lädt vorher eine Sicherung.
- Karten-IDs sind auf 80 Zeichen begrenzt und müssen zu dieser Version gehören. Zeitstempel sind `z.iso.datetime()` mit höchstens 40 Zeichen.
- Zod läuft mit `jitless: true`.
- tsx 4.23.15 zieht esbuild 0.28.2. Der frühere niedrige Befund GHSA-g7r4-m6w7-qqqr (`esbuild` `>=0.27.3 <0.28.1`) ist in diesem Stand nicht mehr im Audit.
- Vite und vite-plugin-pwa sind aus dem App-Build. Der Precache entsteht mit `workbox-build` über `dist/`, inklusive Audio. `navigateFallback` gilt nicht für `/Travel-Talk/audio/`.
