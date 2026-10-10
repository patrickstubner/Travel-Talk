# Sicherheitsprüfung Travel Talk 0.1.0

Datum: 10. Oktober 2026. Geprüft am Quellstand dieser Version, nach dem Schreiben der App. Kein Backend, kein Konto, keine Schlüssel.

## Quellen

- OWASP Cheat Sheet, Input Validation: https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html
- OWASP Cheat Sheet, XSS Prevention: https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
- MDN, Content-Security-Policy, inklusive der Direktiven, die ein Meta-Tag nicht setzen kann: https://developer.mozilla.org/docs/Web/HTTP/Headers/Content-Security-Policy
- MDN, `getUserMedia`: https://developer.mozilla.org/docs/Web/API/MediaDevices/getUserMedia
- Zod, strikte Objekte: https://zod.dev
- GitHub Advisory GHSA-g7r4-m6w7-qqqr: https://github.com/advisories/GHSA-g7r4-m6w7-qqqr
- `npm audit` am 10. Oktober 2026: 1 low, 0 moderate, 0 high, 0 critical
- GitHub Pages liefert keine eigenen Response-Header für ein Projekt-Repo. Die CSP steht deshalb als Meta-Tag ganz am Anfang von `<head>` im gebauten `index.html`, vor dem Modul-Skript. `frame-ancestors` lässt sich in einem Meta-Tag nicht setzen (MDN).

## Was geprüft wurde

**Eingabe, besonders der JSON-Import.** Die Datei darf höchstens 2'000'000 Zeichen haben. `JSON.parse` verwirft die Schlüssel `__proto__`, `constructor` und `prototype`. Danach prüft Zod das Paket strikt: nur die erwarteten Felder, Paar- und Anrede-Werte aus einer Liste, Karten-Zahlen in festen Grenzen, höchstens 2000 Karten, keine doppelten Karten-IDs. Die persönliche Notiz ist auf 500 Zeichen begrenzt und darf ausser Zeilenumbruch und Tabulator keine Steuerzeichen enthalten. Bei einem Fehler sieht die Oberfläche nur den Satz, dass die Datei kein gültiger Export ist. Der Inhalt der Datei steht nicht in der Meldung.

**XSS.** React schreibt Texte als Text. `dangerouslySetInnerHTML`, `innerHTML`, `outerHTML` und `eval` sind per ESLint verboten. Die Markierung von Platzhaltern wie `[Name]` zerlegt den String und setzt die Teile als Textknoten. Externe Links kommen nur aus dem Katalog und müssen mit `https://` beginnen. Sie tragen `rel="noreferrer noopener"`.

**Audio-Pfade.** Eine Datei wird nur abgespielt, wenn der Name dem festen Muster `{sprache}/{id}__{region}__{variante}.m4a` entspricht und in `manifest.json` steht. Die Adresse wird daraus gebaut, nicht aus einem freien String.

**Geheimnisse.** Keine Tokens, keine `.env`, keine `VITE_`-Schlüssel. Die CI-Deploy-Rechte sind `contents: read` plus, nur im Deploy-Job, `pages: write` und `id-token: write`.

**Berechtigungen.** Das Mikrofon wird erst beim Tippen auf Aufnehmen angefragt. Nach dem Stopp werden die Tracks beendet. Die Aufnahme bleibt ein Blob im Speicher der Seite und wird nicht hochgeladen und nicht in IndexedDB geschrieben. Der Service Worker hat den Scope `/Travel-Talk/`. Audio-Pfade sind vom Navigate-Fallback ausgenommen.

**Abhängigkeiten.** Versionen sind fest. Laufzeit: React 19.3.0, Vite 8.3.4, vite-plugin-pwa 2.0.0, Dexie 4.4.6, ts-fsrs 5.4.2, pitchy 4.1.0, Zod 4.6.5, React Router 7.18.4. Kein CDN, keine Tracker, Schriften nur vom System. Der Build setzt eine CSP ohne `unsafe-inline` und ohne `unsafe-eval`. Im Dev-Server fehlt das Meta-Tag, weil das Vite-HMR sonst blockiert.

**Fehler.** Ungültiger Katalog und fehlgeschlagener Import nennen keine Parser-Details.

**Angriffsfläche.** Statische Seite auf GitHub Pages, Hash-Routing, lokaler Lernstand in IndexedDB. Kein Server, der Anfragen annimmt.

## Befunde

| Schwere | Befund | Vorschlag |
| --- | --- | --- |
| Niedrig | GitHub Pages setzt keine eigenen HTTP-Header. `frame-ancestors` fehlt, weil ein Meta-Tag das nicht darf. Ein fremdes Frame könnte die öffentliche Lernseite einbetten. | Sobald der Host Header kann, `frame-ancestors 'none'` und die CSP als Header setzen. |
| Niedrig | Nach der Freigabe merkt sich der Browser das Mikrofon. Die App beendet die Tracks, die Freigabe bleibt. | Anfrage nur auf dem Knopf, das ist so gebaut. Widerruf liegt in den Browser-Einstellungen. |
| Niedrig | `esbuild` `>=0.27.3 <0.28.1`, GHSA-g7r4-m6w7-qqqr. Ein lokaler Dev-Server unter Windows kann Dateien lesen. Betrifft nicht das gebaute Paket und nicht Linux. | `npm audit` in der CI bricht ab moderate ab. Sobald Vite ein gepatchtes esbuild mitbringt, die Version anheben. |
| Niedrig | Die persönliche Notiz kann eine Allergie enthalten. Sie liegt in IndexedDB und im JSON-Export, unverschlüsselt. | Nur auf diesem Gerät, Hinweis im UI, Löschen-Knopf in den Einstellungen. Vor einem späteren Sync eigene Zustimmung. |
| Info | Die Seite ist öffentlich. Die Sätze sind Lernmaterial, der Lernstand nicht. | Export nicht weitergeben, wenn die Notiz privat ist. |
| Info | Der Service Worker füllt den Cache nach dem ersten Besuch über HTTPS. | Scope bleibt `/Travel-Talk/`. |
| Info | Vietnamesisches Audio ist eine nördliche Stimme. Das ist eine Inhaltsfrage, keine Lücke. | Siehe `docs/audio.md`. Die Sätze sind mit `geprueft: false` markiert. |
