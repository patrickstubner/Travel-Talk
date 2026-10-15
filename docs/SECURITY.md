# Sicherheitsprüfung Travel Talk 0.4.0

Datum: 11. Oktober 2026. Geprüft am Quellstand dieser Version. Kein Backend, kein Konto, keine Schlüssel. Die Prüfung von 0.1.0 bleibt unten stehen, wo sie noch gilt.

## 0.11.0 Portugiesische Wörter und Melodie

Geprüft am 15. Oktober 2026. Ein neues Paket: `vosk-browser` 0.0.8, Lizenz Apache-2.0, Feld `license` in seinem `package.json`. Das Modell `vosk-model-small-pt-0.3` steht bei https://alphacephei.com/vosk/models unter Apache 2.0 (31M, leichtes Breitbandmodell). Das grosse Modell derselben Tabelle, `vosk-model-pt-fb-v0.1.1-20220516_2113`, ist GPLv3 und ist nicht in der App. `npm audit` am 15. Oktober 2026: 0 Schwachstellen. `vosk-browser` nennt `uuid` 9.0.0. Die Meldung GHSA-w5hq-g745-h8pq trifft v3, v5 und v6, wenn ein `buf` übergeben wird. Die App setzt `overrides.uuid` auf 11.1.1, damit der Baum sauber ist. Im Bundle bleibt die mitgelieferte v4-Funktion, ohne diesen `buf`-Pfad. Die App ruft `uuid` nicht selbst auf.

Das Archiv liegt unter `public/models/vosk-model-small-pt-0.3.tar.gz`, 32454947 Bytes, SHA-256 `b0dba777c534e3adfce4c72340225182962dfc62d6dc4b4bf67dccd1bb4694dd`. Es ist das Zip von Alpha Cephei (SHA-256 `6e1ce909032e1afa7a88e68a3d628ecafff302bdf195befab308826c395e93b7`, 32453112 Bytes) als tar.gz neu gepackt, dieselben Dateien, ein Ordner `vosk-model-small-pt-0.3`. Es wird nicht in `am/` und `conf/` umgebaut. Die Seite fragt, bevor sie es lädt, und nennt die Grösse. `navigator.connection.saveData` startet keinen Abruf. Die geprüften Bytes liegen im Cache `travel-talk-vosk`. `cache.put` sitzt in try/catch. Eine falsche Prüfsumme wird verworfen. Es gibt keine weitere Adresse. `connect-src` der Seite bleibt `'self'`. Die Datei steht nicht im Precache.

Der Erkenner ist die Datei `vosk-worker.js` derselben Herkunft, nicht ein Blob. Die Seite behält `script-src 'self'` und `worker-src 'self'`. `'unsafe-eval'` und `'wasm-unsafe-eval'` stehen nicht in der Seiten-CSP. Sie stehen nur in der Antwort des Workers: das WASM von Emscripten wird instanziiert, und embind baut benannte Hüllen mit `new Function` (`createNamedFunction`). GitHub Pages setzt keine Kopfzeile pro Datei. Der Service Worker hängt die Worker-CSP an `vosk-worker.js`, sobald er die Seite führt: `connect-src 'none'`, damit der Worker das Modell nicht selbst holt. Solange er die Seite noch nicht führt, hat die Worker-Antwort keine CSP. Die Meta-CSP der Seite gilt für einen Worker derselben Herkunft nicht. Das ist die erreichbare Grenze ohne Kopfzeilen pro Datei. Die geprüften Bytes gehen per `postMessage` an den Worker. Eine zweite Lieferung der Adresse wird nicht gelesen. Ein altes Skript im Cache `travel-talk-vosk-script` wird beim Aktivieren gelöscht. Scheitert der freie Durchgang, setzt der zweite Durchgang eine Grammatik aus den erwarteten Wörtern und [unk]. [unk] fällt weg. Der Satz gilt als bestätigt, wenn die erwarteten Wörter mit hoher Sicherheit herauskommen. Eine saubere Hälfte füllt er nicht auf. Das erkannte Wort bleibt im Speicher dieser Seite und geht nicht in den Score, nicht nach IndexedDB und nicht in den Export. Die Sterne bleiben ungespeichert und erscheinen erst, wenn die Wörter da sind oder die Erkennung scheitert. Die Skala ist fünf. Fünf nur, wenn der Satz passt und der Melodiebalken grün ist. Ein falscher Satz oder Unsinn bleibt bei höchstens einem. Die Beschriftung sagt «x von 5». Es entsteht kein neues Feld und kein Export. Fehlt das Modell oder läuft die Zeit ab, gilt die bisherige Zählung, und die Seite sagt das.

`pt_BR-jeff-medium` und `pt_BR-edresson-low` werden nicht geladen: jeff hat dieselbe lessac-Basis, edresson ist von `en_US-ryan` feinjustiert, und ryan ist CC BY-NC-SA. Der Melodievergleich nimmt die vorhandenen Dateien von cadu und faber. Die gewählte Stimme bleibt die Wiedergabe. faster-whisper bleibt ein Werkzeug der Erzeugung. `getUserMedia` bleibt echoCancellation true, noiseSuppression false, autoGainControl false.

## 0.10.1 Wortrunde, ein Tipp

Geprüft am 15. Oktober 2026. Kein neues Paket, kein neues Netz, kein neues Recht. `npm audit` bleibt der Stand vom 13. Oktober 2026: 0 Schwachstellen.

Die Wortrunde ändert nur die Anordnung der zwei Knöpfe. Es wird nichts gespeichert, nichts gesendet und keine Adresse gebaut. `getUserMedia` bleibt echoCancellation true, noiseSuppression false, autoGainControl false. Die CSP bleibt.

## 0.10.0 Hauptknopf unten

Geprüft am 15. Oktober 2026. Kein neues Paket, kein neues Netz, kein neues Recht. `npm audit` bleibt der Stand vom 13. Oktober 2026: 0 Schwachstellen.

Der Knopf ist nur Darstellung. Es wird nichts gespeichert. `getUserMedia` bleibt echoCancellation true, noiseSuppression false, autoGainControl false. Die CSP bleibt.

## 0.9.15 Beide Sprachen zu Beginn

Geprüft am 15. Oktober 2026. Kein neues Paket, kein neues Netz, kein neues Recht. `npm audit` bleibt der Stand vom 13. Oktober 2026: 0 Schwachstellen.

Die erste Seite nach dem Namen zeigt beide Wahlen im Text. Gespeichert wird weiter `appLang` und `targetLang` bei dieser Person. `onboarded` ist ein lokales Boolean und wird erst bei Weiter wahr. Es geht nicht in den Export. `getUserMedia` bleibt echoCancellation true, noiseSuppression false, autoGainControl false. Die CSP bleibt.

## 0.9.14 Nachfrage und iOS-Browser

Geprüft am 14. Oktober 2026. Kein neues Paket, kein neues Netz, kein neues Recht. `npm audit` bleibt der Stand vom 13. Oktober 2026: 0 Schwachstellen.

`prompt()` läuft weiter nur nach einem Tippen. Wirft es, bleibt das Ereignis im Speicher dieser Seite und geht nicht in den Export. Chrome, Edge und Firefox auf iOS 16.4 zeigen denselben Text wie Safari. Es entsteht kein Profilfeld. `getUserMedia` bleibt echoCancellation true, noiseSuppression false, autoGainControl false. Die CSP bleibt.

## 0.9.13 Zum Home-Bildschirm

Geprüft am 14. Oktober 2026. Kein neues Paket, kein neues Netz, kein neues Recht. `npm audit` bleibt der Stand vom 13. Oktober 2026: 0 Schwachstellen.

Der Eintrag liegt in den Einstellungen. `beforeinstallprompt` wird abgefangen, und `prompt()` läuft nur nach einem Tippen. Es wird nichts gespeichert und nichts exportiert. Es entsteht kein Profilfeld. `getUserMedia` bleibt echoCancellation true, noiseSuppression false, autoGainControl false. Die CSP bleibt. Das Manifest und der Service Worker bleiben.

## 0.9.12 Tests zur Tonhöhe

Geprüft am 14. Oktober 2026. Kein neues Paket, kein neues Netz, kein neues Recht. `npm audit` bleibt der Stand vom 13. Oktober 2026: 0 Schwachstellen.

Die Sternregel ändert sich nicht. Der Median bleibt im Speicher und geht nicht in den Export. Es entsteht kein Profilfeld. `getUserMedia` bleibt echoCancellation true, noiseSuppression false, autoGainControl false. Die CSP bleibt.

## 0.9.11 Grenze 4 Halbtöne

Geprüft am 14. Oktober 2026. Kein neues Paket, kein neues Netz, kein neues Recht. `npm audit` bleibt der Stand vom 13. Oktober 2026: 0 Schwachstellen.

Die Grenze in `S3_PITCH_SEMITONES` ist 4. Der Median bleibt im Speicher, nicht auf dem Score, nicht in IndexedDB und nicht im Export. Es entsteht kein Profilfeld. `getUserMedia` bleibt echoCancellation true, noiseSuppression false, autoGainControl false. Die CSP bleibt.

## 0.9.10 Tonhöhe für S3

Geprüft am 14. Oktober 2026. Kein neues Paket, kein neues Netz, kein neues Recht. `npm audit` bleibt der Stand vom 13. Oktober 2026: 0 Schwachstellen.

Die Sternregel S3 gilt weiter nur für Deutsch und nur bei «passt» und «teilweise». Sie läuft, wenn die mittlere Tonhöhe der Aufnahme nahe an der der Datei liegt, oder wenn Vorlage und sprechende Person dasselbe bekannte Geschlecht haben. Die Seite fragt das Geschlecht nicht und speichert es nicht. `speakerGender` bleibt leer, solange niemand es setzt. Der Median wird im Speicher aus der Tonhöhenrechnung gebildet und steht auf `ClipFeatures.medianHz`. Er liegt nicht auf dem Score, nicht in IndexedDB und nicht im Export. Es entsteht kein neues Profilfeld. Die Erklärung hinter dem Info-Knopf nennt kein Geschlecht mehr. `getUserMedia` bleibt echoCancellation true, noiseSuppression false, autoGainControl false. Die CSP bleibt.

## 0.9.9 Sterne und Lernstand

Geprüft am 14. Oktober 2026. Kein neues Paket, kein neues Netz, kein neues Recht. `npm audit` bleibt der Stand vom 13. Oktober 2026: 0 Schwachstellen.

Die Sternregel S3 liegt in `starsFromVerdict` und gilt nur für Deutsch, und nur wenn Vorlage und sprechende Person dasselbe bekannte Geschlecht haben: bei «passt» und «teilweise» sind es zwei Sterne, wenn ein Balken «passt» ist, sonst einer. Ein anderes oder fehlendes Geschlecht bleibt bei zwei, ebenso Englisch, Portugiesisch und Vietnamesisch. Das Profil speichert kein Geschlecht. Die gewählte Stimme liefert nur das Geschlecht der Vorlage. Es entsteht kein neues Feld und kein Export. Die Zahl steht weiter nicht auf dem Score, nicht in IndexedDB und nicht im Export. `src/pitch/sentence-grade.ts` bleibt unbenutzt. Vietnamesisch wird «daneben» unter einer Tonhöhen-Korrelation von 0,2. Das ändert keine Adresse und keinen Export. Der kurze Hinweis bei zwei Sternen und zwei grünen Balken ist Text in der Oberfläche. Die Wörter an den Lernstand-Zahlen sind Darstellung. Die Erklärung bleibt hinter dem Info-Knopf und spricht weiter nur auf dem Gerät, wenn «Vorlesen» gedrückt wird. `getUserMedia` bleibt echoCancellation true, noiseSuppression false, autoGainControl false. Die CSP bleibt.

## 0.9.8 Neue Wörter und mls-4576

Geprüft am 14. Oktober 2026. Keine neue Laufzeitabhängigkeit und keine neue npm-Abhängigkeit. Die App lädt kein Modell. `wordSpeed` ist optional und nur 0.7, 0.85 oder 1. Ein anderer Wert lehnt die ganze Exportdatei ab. Fehlt das Feld, bleibt die lokale Stufe dieser Person. Die Umschrift und die IPA sind statischer Text in `content/word-sounds.ts`. React setzt sie als Text. Es gibt kein neues `fetch`. Die Hörprobe heisst `voice.sample__any__base.m4a`, trifft `AUDIO_FILE` und steht in `manifest.json`. `playbackRate` bleibt 1. Die Stimmen-ID `mls-4576` erfüllt `^[a-z0-9_-]{1,40}$`. Eine unbekannte ID wird weiter abgelehnt. Die vier XTTS-Stimmen bekommen keine neue Hörprobe: ihre Lizenz ist die Coqui Public Model License, nur nicht kommerziell. Der vietnamesische Zweck von Đưa ist statischer Text. Die zugehörige Datei heisst `vi/help/ui.show__any__base.v2.m4a`. Der Hilfe-Cache ist CacheFirst und prüft den Inhalt nicht, deshalb trägt die geänderte Aufnahme `.v2` im Namen. Die Clip-Prüfung aus `src/pitch/clip-plausible.ts` bleibt, wie sie auf main steht. `manifest.json` hat 9888 Einträge, 7836 Audio und 2052 Zeiten. `maxEntries` bleibt 12000, mit mehr als 1200 freien Plätzen. `piper-tts` 1.8.0 und `onnx` 1.17.0 bleiben ausserhalb der App. `numpy` braucht nur `tools/generate_words.py` für die stille Ausleitung kurzer Wörter und steht nicht in `package.json`.

## 0.9.7 Tempo beim neuen Satz

Geprüft am 13. Oktober 2026. Kein neues Paket, kein neues Netz, kein neues Recht. `npm audit` am 13. Oktober 2026: 0 Schwachstellen.

Die Tempo-Wahl eines neuen Satzes ist nur 0.7, 0.85 oder 1. Fehlt sie oder ist der Wert ein anderer, gilt 0.7. Sie liegt in den Einstellungen dieser Person und geht nicht in den Export. Ein Import lässt sie auf dem Gerät stehen, `mergeLocal` übernimmt nur einen der drei Werte. `coerceSettings` verwirft einen anderen Wert. Daraus wird keine Adresse gebaut. `playbackRate` bleibt 1. Das Tempo ist der Dateiname, und der Name muss weiter `AUDIO_FILE` und `manifest.json` erfüllen. `getUserMedia` bleibt echoCancellation true, noiseSuppression false, autoGainControl false. Die CSP bleibt. Aufnahmen bleiben auf dem Gerät.

Die Sterne nach dem Nachsprechen lesen `starsFromVerdict` in `src/pitch/feedback.ts` (P29-11). Drei nur bei «passt» und beiden Balken «passt». «passt» und «teilweise» bleiben bei 2. Bei «daneben» gibt es 2 nur mit einem Balken «passt», 1 wenn der bessere Balken gelb ist, sonst 0. Rückwärts bleibt 0. Ein falscher Satz, der nie «passt» ist, bekommt damit nie 3. Fehlen die Balken oder das Urteil, gibt es keine Sterne. Die Zahl steht nicht auf dem Score, nicht in IndexedDB und nicht im Export. Das ist keine Spracherkennung. `src/pitch/sentence-grade.ts` bleibt unbenutzt. Die Erklärung steht hinter dem Info-Knopf. Ohne vorerzeugte Datei spricht `speechSynthesis` den Satz auf dem Gerät, wie bisher bei fehlenden Hilfedateien.

Der Lernstand liest die Karten dieser Person aus IndexedDB. Gezählt werden gelernte Sätze, gelernte Wörter, heute wiederholte Karten und der Anteil im Wiederholungszustand. Die Zahlen werden nicht gespeichert, nicht exportiert und nicht gesendet. Kein neues `fetch`, kein neues Paket.

«Wörter überspringen» schreibt keine Karte. Die gemerkte Wahl ist nur wahr oder fehlt, nur in den Einstellungen dieser Person, nicht im Export. Ein Import lässt sie auf dem Gerät stehen, `mergeLocal` übernimmt nur `true`. Die punktierte Linie ist Darstellung, keine Adresse. Die Erklärung dazu hat keine neue Datei. `speechSynthesis` spricht sie nur auf dem Gerät, wenn «Vorlesen» gedrückt wird.

Die offenen Punkte bleiben offen: kein `frame-ancestors` auf GitHub Pages, Mikrofon-Freigabe im Browser, Notiz unverschlüsselt in IndexedDB.

## 0.9.4 Erklärungen

Kein neues Paket, kein neues Netz, kein externer Sprachdienst. Die Info-Blätter lesen vorerzeugte Dateien unter `/Travel-Talk/audio/{sprache}/help/`. Der Name muss `AUDIO_FILE` und `manifest.json` erfüllen, derselbe Weg wie das Satz-Audio. Diese Hilfedateien liegen zusätzlich im Precache, Satz-Audio nicht. Der Erzeuger speichert den SHA-256 des Textes und baut die Datei neu, wenn der Text sich ändert. `speechSynthesis` spricht nur den Absatz, dessen Datei fehlt oder offline nicht im Cache liegt, und nur in der App-Sprache (`de-CH`, `en-US`, `pt-BR`, `vi`). Ein Abbruch, eine Pause oder anderes Audio beendet «Vorlesen», statt den nächsten Absatz zu starten. Es wird keine URL gebaut und kein Text gesendet. Die CSP bleibt. `getUserMedia` bleibt echoCancellation true, noiseSuppression false, autoGainControl false. Aufnahmen bleiben auf dem Gerät.

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

Geprüft am 11. Oktober 2026 am Stand `19535e2`. N14b-03 und N14b-04 sind geschlossen. N14b-01 ist danach bewusst akzeptiert, siehe den dritten Durchgang. N14b-05 ist in 0.5.0 geschlossen. N14b-02 ist nicht geschlossen. Kein neues Paket. `npm audit` bleibt bei 0 Schwachstellen.

| ID | Schwere | Status | Auflösung |
| --- | --- | --- | --- |
| N14b-01 | Mittel | bewusst akzeptiert | Die Aktivierung löscht Precache-Einträge, die nicht mehr im Manifest stehen, darunter die alten Audiodateien. Eine Kopie beim Installieren hält sie nicht: die gespeicherte Adresse behält `?__WB_REVISION__` und trifft nie, wenig Speicher lässt das Installieren dauerhaft scheitern, der Speicher verdoppelt sich, und jeder Cache der gemeinsamen Origin wird gelesen. Die Migration ist entfernt. Nach dem Update, das online läuft, sagt die Startseite «Offline-Audio nach dem Update neu laden», solange die Lernsprache nicht vollständig im Cache liegt. Ein Tippen auf «Für offline laden» holt sie. |
| N14b-02 | Niedrig | Offen | Nicht geschlossen. Offen bleiben M1 und N15–N17. M2 und N4 sind geschlossen. Die Tests zu «Speicher voll» und `notifyAudioChanged` schliessen M1 und N15–N17 nicht. |
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

**N14b-02.** Nicht geschlossen. Offen bleiben M1 und N15–N17. M2 und N4 sind geschlossen. Die Tests zu «Speicher voll» und `notifyAudioChanged` schliessen M1 und N15–N17 nicht.

**N15.** Im Schritt Hören bleibt die Wortzuordnung verborgen, bis die Bedeutung gewählt ist. Eine Zeile mit Platzhalter, etwa `[tên]`, bleibt neben der gesprochenen Zeile sichtbar. Auf der Startseite erscheint «Bisherige Stimme behalten» nur, wenn eine andere Stimme dieser Sprache vollständig im Cache liegt, und der Knopf wählt diese Stimme.

**N14b-05.** Vor der Synthese und vor den Wortzeiten prüft `require_model` die SHA-256 der `.onnx`-Datei und der `.onnx.json`. Das gilt für die vier Modelle von 0.4.0 und für die vier älteren Modelle.

Von 1297 Clips haben 1254 eine Zeitdatei. 43 nicht: meist Englisch, wo espeak mehrere Wörter zu einer Phonemgruppe macht, etwa «I am». Die bleiben ohne Markierung. Der Median des Abstands einer inneren Grenze zum nächsten Energie-Dip in ±80 ms ist 0,040 s, das 90.-Perzentil 0,070 s. Die stille Referenz ist im Median etwa 7 % kürzer als die ausgelieferte Datei.

## 0.6.0

Geprüft am 11. Oktober 2026. Keine neue Laufzeitabhängigkeit. `onnx` 1.17.0 bleibt nur im Erzeugungspfad der Wortzeiten. `require_onnx` prüft die Version mit `importlib.metadata`, bevor `align_clips.py` das Modell mit `include_alignments` lädt. `generate_audio.py` ruft das nicht auf.

**Namen.** `cleanPersonName` normalisiert auf NFC, entfernt Steuerzeichen, schneidet Leerzeichen ab und behält 1 bis 40 Zeichen. Mindestens ein Zeichen muss sichtbar sein. Unsichtbare Zeichen wie U+3164, U+2800 oder ein einzelnes kombinierendes Zeichen werden abgelehnt. Die Oberfläche setzt den Namen als React-Text in `<bdi>`. Namen stehen nicht im Repo und nicht in den Logs. Zehn Personen sind das Maximum. Zählen und Anlegen laufen in einer Transaktion, und der Knopf ist während des Speicherns aus. Die elfte Person wird nicht angelegt.

**Import.** Format 4 ist eine Person oder alle Personen, höchstens 4 MB und 8000 Karten. `last_review` und `due` werden gekürzt. Doppelte Karten-IDs in einer Person lehnen die Datei ab. Eine Datei mit `scope: person` und mehreren Personen wird abgelehnt. Eine Person ersetzen lässt die anderen stehen und benennt die aktive Person nicht um. Als neue Person geht nur unter zehn, in derselben Transaktion gezählt, und nur mit einem gültigen Namen. Alle Personen ersetzen fragt in einem zweiten Dialog noch einmal. Die Sicherung in diesem Dialog enthält alle Personen. Enthält die Datei keine Notiz, sagt der Dialog, dass die Notizen aller Personen überschrieben werden. Mehr als zehn Personen in der Datei werden auf zehn gekürzt. Formate 1 bis 3 bleiben eine Person mit leerem Namen. Eine Datei, die das Schema nicht trifft, wirft `IMPORT_REJECTED`. Die Meldung enthält den Dateiinhalt nicht. `level` ist 0. Eine andere Stufe wird abgelehnt, bis der Einstufungstest kommt. «Alle Personen exportieren» bleibt aus, solange eine Person keinen Namen oder nicht beide Sprachen hat, und der Satz daneben sagt das.

**Isolation und Löschen.** Karten hängen an `personId`. Der Lernstand einer Person ist für die andere unsichtbar. `saveSettings`, `saveCard` und `replaceAll` bekommen die Personen-ID vom Tippen und folgen nicht der Person, die beim Schreiben gerade aktiv ist. Ein Wechsel setzt die Seite neu (`<Outlet key={activePersonId}>`), nimmt die Personen-ID in den Sitzungsschlüssel und stoppt laufendes Audio. Löschen entfernt die Karten dieser Person. Die letzte Person wird durch eine neue ohne Namen ersetzt, damit die App wieder starten kann. Eine Stimme, die danach niemand mehr benutzt, wird aus dem Offline-Speicher genommen.

**Stimmen.** `dropOtherVoices` behält die Stimmen-IDs, die andere Personen dieser Sprache noch benutzen. Die eigene vorige Stimme gehört nicht dazu. Ein Ordner zählt nur, wenn er genau die ID ist: `vivos-220/` bleibt nicht, wenn `vivos-22` behalten wird. Dateien einer anderen Sprache bleiben. `discardAdded([])` löscht nichts.

**N14b-02.** Nicht geschlossen. Offen bleiben M1 und N15–N17. M2 und N4 sind geschlossen. Die Tests zu «Speicher voll» und `notifyAudioChanged` schliessen M1 und N15–N17 nicht. Die Tests zu einem HTTP-Status, zum vollen Speicher, zum Ordnernamen und zu `discardAdded` sperren das Verhalten des Codes. Sie beschreiben diese Mutationen nicht.

**Lernsprache.** Die Lernsprache und die vietnamesische Variante stehen nur in der oberen Leiste. Die Einstellungen behalten die App-Sprache und die Stimme. «Bisherige Stimme behalten» erscheint dort nur, wenn die vorige Stimme vollständig im Cache liegt.

**Wortzeiten.** Eine fehlgeschlagene Zeitdatei wird nicht gecacht. Der nächste Versuch liest sie neu. Während eine Datei spielt, bleiben die Zeiten dieser Datei, auch wenn das Tempo wechselt. Das gilt in Üben und im Zeigen-Modus. `playClip` meldet die Zeit über `requestAnimationFrame`, nicht über `ontimeupdate`. `require_onnx` beendet sich mit einem Satz, wenn das Paket `onnx` fehlt, statt eine Fehlerspur zu zeigen.

**Zeigen.** Im Zeigen-Modus steht der Name der Person nicht in der oberen Leiste. Die Lernsprache bleibt sichtbar. Die App hat keine Bilder. Die Texte sagen Stimmen und Audiodateien, nicht Bilder oder Wortbilder.

## Nachprüfung von Pull Request 16

Geprüft am 11. Oktober 2026 am Branch `cursor/people-v060-d07c`. Kein neues Paket. `npm audit` bleibt bei 0 Schwachstellen. N14b-02 bleibt offen.

| ID | Schwere | Status | Auflösung |
| --- | --- | --- | --- |
| P16-01 | Hoch | Geschlossen | Die Startseite hält keinen eigenen Entwurf der Sprachen mehr. Jede Wahl ruft `saveSettings` auf. «Weiter» wird frei, sobald beide Sprachen stehen, auch wenn die Lernsprache oben gewählt wird. Die Seite bleibt bis «Weiter», damit die Standardstimme gesetzt wird. Test: `src/pages/home-onboarding.test.tsx`. |
| P16-02 | Mittel | Geschlossen | `<Outlet key={activePersonId}>` setzt die Seite neu. Der Sitzungsschlüssel enthält die Personen-ID. `stopClip` stoppt Audio beim Wechsel. Jedes Speichern übergibt die Personen-ID. Tests: `src/pages/person-switch.test.tsx`, `src/storage/people.test.ts`, `src/audio/player.test.ts`. |
| P16-03 | Mittel | Geschlossen | «Sicherung herunterladen» im Dialog «Alle Personen ersetzen» sichert alle Personen. Eine leere Notiz sagt, dass alle Notizen überschrieben werden. Die Ersetzung braucht einen zweiten Dialog. Test: `src/pages/settings-import.test.tsx`. |
| P16-04 | Niedrig | Geschlossen | Zählen und Anlegen laufen in einer Transaktion. Der Knopf ist während des Speicherns aus. Test: `src/storage/people.test.ts`, `src/components/top-bar.test.tsx`. |
| P16-05 | Niedrig | Geschlossen | N14b-02 ist nicht geschlossen. Die Zeilen zum zweiten Durchgang, zu 0.5.0 und zu 0.6.0 sagen das. |
| P16-06 | Niedrig | Geschlossen | Tests für die Kürzung von `last_review` und `due` in Format 4, doppelte Karten, die Grenze von 8000 Karten, eine Personen-Datei mit mehreren Personen, die Grenze beim Import als neue Person, die Kürzung von `importAll`, die gemerkte Datei in Üben und Zeigen, und N15c-01 in Üben und Zeigen. `src/storage/import.test.ts`, `src/storage/people.test.ts`, `src/pages/practice-show-gap.test.tsx`. |
| P16-07 | Niedrig | Geschlossen | NFC, mindestens ein sichtbares Zeichen, Anzeige in `<bdi>`. Test: `src/storage/people.test.ts`, `src/components/top-bar.test.tsx`. |
| P16-08 | Niedrig | Geschlossen | Ersetzen mit einer Format-4-Datei benennt die aktive Person nicht um. Test: `src/storage/people.test.ts`. |

Eine gelöschte Stimme verlässt den Cache, wenn keine verbleibende Person sie benutzt. Im Zeigen-Modus ist der Name verborgen. «Alle Personen exportieren» nennt den Grund, solange der Knopf aus ist. `require_onnx` endet mit einem Satz, wenn das Paket fehlt.

## 0.9.0

Geprüft am 12. Oktober 2026. Keine neue Laufzeitabhängigkeit und keine neue npm-Abhängigkeit. `npm audit` bleibt bei 0 Schwachstellen. Kein neues Netz, kein Backend, kein Konto, keine Spracherkennung. Die Wortclips liegen auf dem Gerät wie die Satzclips. Die Sterne bleiben aus. Sie kommen in 0.10.0 oder danach mit der Spracherkennung auf dem Gerät. Die Notenformel in `src/pitch/sentence-grade.ts` lädt die App nicht.

**Karten.** Ein Wort ist eine FSRS-Karte pro Person und Richtung, `Richtung:w.water`. Die Satzkarte bleibt. Beide teilen die 15 neuen Karten am Tag. Der Wortblock nimmt höchstens sechs und benutzt die Staffel der Satzplätze nicht. Die Satzplätze rechnen danach, mit den schon genommenen Wortkarten. Ab 20 fälligen Karten ist beides null. Der Import nimmt eine Wortkarte nur, wenn die Id in der geprüften Liste steht. Eine unbekannte Id fällt weg, der übrige Import bleibt. Die Datei bleibt bei 2000 Karten. Füllwörter haben keine Karte und halten keinen Satz zu.

**Öffnen.** «Einmal richtig» ist nicht der Zustand Wiederholung. `wordPassed` verlangt `reps` mindestens 1 und Zustand Wiederholung, Wiedererlernen, oder `learning_steps` mindestens 1. Das erste «Gut» bleibt im Lernen. «Nochmal» danach setzt `learning_steps` auf 0 und schliesst den Satz wieder. «Leicht» und danach «Nochmal» bleibt Wiedererlernen, der Satz bleibt offen. Ein Satz ohne geprüftes Schlüsselwort ist sofort offen. Freie Satzplätze gehen zuerst an die Sätze, deren Wörter heute richtig waren. Die sechs Wörter gelten für den Tag: Karten, die heute schon neu waren, zählen in der nächsten Sitzung mit. Die Wortwahl nimmt die nächsten Sätze, die noch ein Wort ohne Karte haben, und wartet nicht darauf, dass ein zu gehaltener Satz frei wird. Eine ungeprüfte Gloss-Gruppe ist kein Schlüsselwort. `GLOSS_CHECKED` bleibt an jeder Gruppe falsch. Zahlen, etwa «dreissig Tage» und «zwei Wochen», sind in diesem Stand nicht geprüft und halten keinen Satz zu.

**Audio.** Piper 1.8.0, dieselben Männerstimmen: thorsten-high, joe, cadu, vivos-22, vivos-32. Zitierform, kein Schnitt aus dem Satz. Drei Tempi. Vietnamesisch `w.yes` hat Süd `dạ` und Nord `vâng`. Die älteren Stimmen haben keine Wortdateien. Die Wiedergabe nimmt dann die Standardstimme dieser Sprache, thorsten-high, joe, cadu oder vivos-22. Nichts wird in die alten Pfade kopiert. 291 Dateien, Minimum 3051 Bytes, Median 6254, Maximum 18599, Summe 2'038'931 Bytes. Keine Zeitdatei für Wörter. `manifest.json` hat 6154 Einträge. `maxEntries` bleibt 8000, 1846 Plätze frei. vivos-22 hat 936 Dateien, 717 Audio und 219 Zeiten. Der Clip-Test bewertet weiter die Satzzeilen. Die Wortclips kommen nicht in den Precache. Der Cache speichert sie erst, wenn sie abgerufen werden, nur bei Status 200.

**Sitzung.** Der Wortschritt hat kein Mikrofon und kein Schreiben. Vier Bedeutungen, stabil sortiert, zuerst aus dem Block. Richtig speichert «Gut», falsch «Nochmal» und zeigt die Bedeutung. Die vier Abstände erscheinen erst bei einer späteren richtigen Wortwiederholung. Neu geöffnete Sätze hängen ans Ende der Schlange, solange Satzplätze bleiben. Die Schlange wird dabei nicht neu gebaut.

**Grenzen.** Geprüft sind neunzehn Wörter: die Handliste ich, ja, bitte, danke, nicht, wo, hier, Wasser, Hilfe!, und die Visum-Gruppen Tage, bleiben, Dokumente, E-Visum, Visum, verlängern, Gesuch, aktuell, Regel, Passfoto. «nein» fehlt, weil «não» und «không» sonst zweimal richtig wären. Zwei Knöpfe mit derselben gesprochenen Form gibt es nicht. Ein Satz ausserhalb dieser Gruppen ist offen, sobald er kein geprüftes Wort hat. Eine Stimme von vor den Männerstimmen spielt das Wort mit der Standardstimme.

Tests: `src/srs/day.test.ts`, `src/pages/practice-words.test.tsx`, `src/storage/import.test.ts`, `src/pages/practice-gloss.test.tsx`, `src/pages/practice-speed.test.tsx`, `src/pages/practice-show-gap.test.tsx`, `src/pages/practice-feedback.test.tsx`, `src/pages/practice-mic.test.tsx`. `npm run test:clips` bleibt die Matrix über die Satzzeilen.

## 0.8.0

Geprüft am 12. Oktober 2026. Keine neue Laufzeitabhängigkeit und keine neue npm-Abhängigkeit. `npm audit` bleibt bei 0 Schwachstellen. Kein Netz für die Rückmeldung, keine Spracherkennung, kein Phonemmodell. Diese Fassung zeigt keine Sterne und sagt nicht, ob der gesprochene Satz der gehörte ist. Kurve, Wortfarben und die Balken für Melodie und Rhythmus bleiben. Die Sterne kommen in 0.10.0 oder danach mit der Spracherkennung auf dem Gerät. Die alte Notenformel steht in `src/pitch/sentence-grade.ts`. Die App lädt diese Datei nicht.

**Aufnahme.** `startMicrophone` fragt das Mikrofon erst beim Tippen, mit Echounterdrückung, ohne Rauschunterdrückung und ohne automatische Lautstärke, und stoppt von selbst nach 15 Sekunden. Rauschunterdrückung und die automatische Lautstärke bleiben aus, damit Chrome die Aufnahme nicht umbaut. Die Echounterdrückung bleibt an und hält den Lautsprecher draussen. Beim Start der Aufnahme stoppt die gehörte Datei, auch ein Wort aus der Rückmeldung. Die Rückmeldung ist während der Aufnahme weg. «Anhören» ist schon aus, während das Mikrofon noch startet, und die Wiedergabe stoppt noch einmal unmittelbar vor dem Aufnahmestart. «Meine Aufnahme» ist während der Aufnahme aus. Läuft sie schon, hält das Element an und geht an den Anfang, sobald eine Aufnahme startet. Versteckt sich der Tab, während die Freigabe noch offen ist, setzt die Satzseite `micStarting` zurück, und die Knöpfe sind wieder frei. Sonst nimmt das Mikrofon den Lautsprecher mit auf. Die Samples bleiben im Speicher der Seite. Vor der Tonhöhe werden sie auf 16 kHz gemittelt, und die Kurve wird einmal gerechnet. Samples und Kurve gehen nicht in IndexedDB, nicht in den Export und nicht an einen Server. Ein Wechsel der Seite, «Weiter» und ein versteckter Tab geben die Tracks frei, wie bisher. «Nochmal» ersetzt die Aufnahme auf der Seite. Ein Satzwechsel verwirft die vorige Aufnahme. Farben werden nicht gespeichert und ändern FSRS nicht. Die vier Bewertungen bleiben der einzige Weg in den Planer.

**Vergleich.** Die Modellkurve kommt aus der Datei, die gerade gehört wurde, einschliesslich 70 % und 85 %. Die Zeiten sind die der normalen Datei, gestreckt mit dem Tempofaktor. Fehlt die Zeitdatei, passt sie nicht zur Zeile oder scheitert `alignmentFitsDuration`, bleiben die Kurven ohne Farben. Die Zuordnung ist eine lineare Abbildung der stimmhaften Strecken, plus eine Verschiebung von ein paar Frames pro Wort. Eine lokale Dehnung von etwa 0,75 bis 1,33 gilt nur, wenn sie den mittleren Abstand unter 1,5 Halbtöne bringt. So verschluckt das Tempo keinen falschen Ton. Eine Aufnahme, die rückwärts besser zur Datei passt als vorwärts, ist «unklar». Das gilt auch, wenn die Tonhöhe nur etwas besser rückwärts passt und die Lautstärke nicht mitläuft. Eine einzelne gespiegelte Silbe bleibt eine Teilbewertung. Ein Dauerton gegen eine gesprochene Datei ist «unklar», weil die Lautstärke der Datei sich bewegt und die des Tons nicht. «unklar» gilt ausserdem, wenn die Aufnahme weniger als 1,2 Halbtöne Hub hat und die gehörte Datei um mindestens diesen Hub bewegter ist. Eine kurze ebene Phrase gegen sich selbst ist nicht unklar. Fehlen die Wortzeiten, obwohl die Audiodatei da ist, steht «Keine Wortzeiten für diese Stimme.» Die Klarheit der Tonhöhe liegt bei 0,6. Bei 0,8 fielen die meisten Frames der tiefen englischen Stimme weg. Die gemessene Tonhöhe lag dort um 110 Hz, nicht unter der Grenze von 70 Hz. Ein Wort bekommt eine Farbe nur, wenn das Modell darin mindestens drei stimmhafte Frames hat. Die Balken bleiben leer, wenn weniger als 60 % dieser Wörter eine Farbe haben. Die Farbe verlangt, dass die Aufnahme etwa die Hälfte der stimmhaften Frames des Wortes trifft. Der Text sagt dann nicht «passt». Die Bänder stehen in `src/pitch/feedback.ts`. Sie sind vom Autor gesetzt, nicht aus einer Lernstudie. Unter 1,5 Halbtönen ist die Melodie grün, von 1,5 bis 3 gelb, darüber rot. Rhythmus grün ist 0,7 bis 1,4 der gehörten Dauer, gelb von 0,5 bis unter 0,7 und über 1,4 bis 1,8. Ein gleichmässig langsames Nachsprechen bleibt bei den Wörtern grün. Der Rhythmusbalken nimmt das schlechtere aus dem Tempo der ganzen Aufnahme und den Wörtern. Ein Wort, dessen Modell sich um mindestens einen Halbton bewegt, braucht dieselbe Richtung in der Aufnahme, sonst bleibt die Melodie höchstens gelb. Fehlt die Korrelation, weil das Wort dafür zu flach ist, fällt es nicht auf gelb. Die Klangfolge, zwölf Koeffizienten ohne den Lautstärkewert, wird im Browser gegen die gehörte Datei gerechnet. Jeder Koeffizient wird auf Mittelwert und Streuung der Aufnahme normiert. Die Mel-Filter werden in Schritten von 4 % bis etwa ±20 % verschoben, und der nähere Abstand zählt. Liegt er über der Grenze der Sprache, bleiben die Balken leer und es steht «unklar». Das ist keine Prüfung, ob der Satz der richtige war. Passt die Form rückwärts klar besser, ist sie ebenfalls «unklar». Die Rechnung läuft in einem Worker. Die Samples werden kopiert, nicht übertragen, und der Worker schreibt nichts und sendet nichts. Die Merkmale der gehörten Datei bleiben für die nächste Aufnahme im Speicher der Seite. Die Aufnahme selbst geht nicht in IndexedDB, nicht in den Export und nicht an einen Server.

**Töne.** Nur Vietnamesisch bekommt einen Satz, aus der Schrift und aus der gehörten Form, etwa «Du bist gestiegen. Der Ton sollte fallen.» Die Farbe bleibt der Abstand der Kurven, nicht die Schrift. Im Süden bekommen hỏi und ngã keinen Satz. ngã im Norden gilt als Senke oder steigend. nặng zählt nur als fallend. Knarrlaut sieht die Kurve nicht. Der Hinweis «Nördliche Stimme» gilt nur für die Stimme vais1000 und ist keine Note.

**Grenzen dieser Fassung.** Ein Hinweis auf die Pausenlänge und ein Satz zu einem nur bei sich selbst leiseren Wort fehlen. Die Schwelle «unklar» bei 6 Halbtönen, die flache Kurve bei 1,2 Halbtönen gegen eine bewegtere Datei und «zu kurz» bei 0,3 Sekunden sind eine Wahl. Die Zeit eines Frames ist der Anfang des Analysefensters. Die Abbildung kennt keine Phoneme. Eine Pause länger als etwa 40 ms kann die Melodie des nächsten Wortes verschieben. Die Klarheit 0,6 lässt mehr von einer leisen Stimme durch. Rauschen und ein Brummen aus 50, 100 und 150 Hz bleiben ohne Kontur. Die Klangfolge kann die Balken leer lassen, wenn die Form weit von der Datei weg ist. Sie erkennt den Satz nicht. Ein Summen, das der Melodie folgt, kann die Kurve trotzdem färben. Deshalb gibt es keine Note dazu. Die Grenzen der Klangfolge stehen je Sprache in `src/pitch/feedback.ts`: Deutsch 0,5, Englisch 0,5, Portugiesisch 0,5, Vietnamesisch 0,44, auf der normierten Skala. Die Zeitdateien, die Piper beim Erzeugen verwirft, bleiben ohne JSON. Die Oberfläche sagt «Keine Wortzeiten für diese Stimme.» erst, wenn die Zeitdatei fehlt, nicht solange sie noch lädt. Eine Faltung auf die Modellkurve läuft nur, wenn die Klangfolge schon passt und ein Frame mindestens 6 Halbtöne daneben auf einer Oberwelle sitzt. Drei neu gesprochene Zeilen tragen `.v2` im Dateinamen. Beim Start löscht die App die 32 alten Namen aus dem Cache `travel-talk-audio`, einmal je Versionsmarke. Offline fehlen diese Clips, bis die neuen Dateien geladen sind. Tests: `src/pitch/feedback.test.ts`, `src/pitch/clips.test.ts`, `src/pitch/contour.test.ts`, `src/pitch/analyze.test.ts`, `src/components/repeat-feedback.test.tsx`, `src/pages/phrase-feedback.test.tsx`, `src/pages/practice-feedback.test.tsx`, `src/audio/recorder.test.ts`, `src/audio/slice.test.ts`, `src/audio/offline.test.ts`, `src/content/catalog.test.ts`. `npm run test:clips` dekodiert die Clips mit ffmpeg und rechnet die Melodie, ohne eine Note. `npm test` braucht ffmpeg nicht. Der CI-Job `clips` ist eine Matrix, eine Sprache je Lauf, je 20 Minuten, installiert ffmpeg mit `--no-install-recommends` und schreibt `ffmpeg -version`. Dekodierte Clips liegen im Cache. Der Schlüssel enthält einen Hash von `src/pitch/clips.test.ts`. Das ist kein Paket der App.

Die Tabellen der Nachprüfungen darunter sind der Stand des jeweiligen Durchgangs. Sie beschreiben eine Note, die 0.8.0 nicht ausliefert. Massgeblich für diese Fassung ist dieser Abschnitt.

## Nachprüfung von Pull Request 18

Geprüft am 11. Oktober 2026. Die Korrekturen liegen in 0.8.0, auf main nach 0.7.0. Kein neues Paket. `npm audit` bleibt bei 0 Schwachstellen. N14b-02 bleibt offen. Offen bleiben M1 und N15–N17. M2 und N4 sind geschlossen.

| ID | Schwere | Status | Auflösung |
| --- | --- | --- | --- |
| P18-01 | Mittel | Geschlossen | Sterne nur, wenn mindestens 60 % der Wörter eine Farbe haben. Eine flache Kurve ist «unklar». Die lokale Dehnung bleibt etwa bei 0,75 bis 1,33. Tests mit Dauerton, Brummen, rückwärts und einer gleichmässig langsameren Aufnahme: `src/pitch/feedback.test.ts`. |
| P18-02 | Mittel | Geschlossen | Die Aufnahme stoppt nach 15 Sekunden. Die Analyse mittelt auf 16 kHz. Die Kurve wird einmal gerechnet. `thin` ist geprüft. Tests: `src/audio/recorder.test.ts`, `src/pitch/contour.test.ts`, `src/pitch/feedback.test.ts`. |
| P18-03 | Niedrig | Geschlossen | «Nördliche Stimme» nur bei vais1000. Test: `src/components/repeat-feedback.test.tsx`. |
| P18-04 | Niedrig | Geschlossen | Tests für `thin`, Stopp beim Verlassen und das Verwerfen der Aufnahme beim Satzwechsel. `context.close()` der Aufnahme steht in `src/audio/recorder.test.ts`. `context.close()` der Wortwiedergabe steht in `src/audio/slice.test.ts`. Die unbenutzte Zuordnung und der unbenutzte Hinweistext sind entfernt. Die Abbildung der Aufnahme heisst linear. Tests: `src/pitch/feedback.test.ts`, `src/components/repeat-feedback.test.tsx`, `src/audio/recorder.test.ts`, `src/audio/slice.test.ts`, `src/pages/phrase-feedback.test.tsx`. |
| P17-01 | Niedrig | Geschlossen | `practice-speed.test.tsx` wartet, bis `playClip` aufgerufen wurde. |
| P17-02 | Niedrig | Geschlossen | Die Zeilen zu N14b-02 nennen M1 und N15–N17 als offen und M2 und N4 als geschlossen. N14b-02 bleibt offen. |
| P17-03 | Niedrig | Geschlossen | «Ich bin seekrank.», «Cho tôi một chiếc taxi.», «phà ra đảo», Sân ga im Hinweis und im Gloss, «estação» für die Metro. Die geänderten Clips, die langsamen Varianten und die Zeitdateien sind für jede Stimme neu erzeugt. Der VLT-Satz nennt Rio und die Baixada Santista, siehe P18b-04. Der vietnamesische Gloss zu «dừng ở đây» und der portugiesische Kontext der Plattform sind in P18b nachgezogen. |
| P17-04 | Niedrig | Geschlossen | Der Vietnam-Hinweis verlinkt das Công báo. «oder über die App» steht beim vereinbarten Preis. Die unbelegte Aussage, GrabCar sei ein Vertragswagen, ist entfernt, siehe P18b-03. |
| P17-05 | Niedrig | Geschlossen | `maxEntries` ist 8000. Der Test vergleicht die Grenze mit der Länge von `manifest.json` und verlangt mindestens 1200 freie Plätze. Test: `src/audio/offline.test.ts`. |

## Nachprüfung von Pull Request 18, zweiter Durchgang

Geprüft am 11. Oktober 2026. Die Korrekturen liegen in 0.8.0. Kein neues Paket. `npm audit` bleibt bei 0 Schwachstellen. N14b-02 bleibt offen. Offen bleiben M1 und N15–N17. M2 und N4 sind geschlossen. Sicherheit, Mikrofon und Privatsphäre waren in diesem Durchgang sauber. P18-02, P18-03, P17-01, P17-02 und P17-05 bleiben geschlossen.

| ID | Schwere | Status | Auflösung |
| --- | --- | --- | --- |
| P18b-01 | Mittel | Geschlossen | Die 60 % gelten nur für Wörter mit genug Stimme im Modell. Die Abdeckung der stimmhaften Frames liegt bei etwa der Hälfte. «unklar» nur, wenn die gehörte Datei deutlich bewegter ist als die Aufnahme. Fehlen die Sterne, bleibt der Balken leer und der Grund steht da. Dauerton und Rückwärts sind in P18c-01 nachgezogen. |
| P18b-02 | Niedrig | Geschlossen | Tests scheitern, wenn die lokale Dehnung auf 0,45–2,05 oder auf 0,6–1,6 geweitet wird. Die flache Schwelle, der Stopp nach 15 Sekunden, `context.close()` in `slice.ts` und die gewählte Stimme auf Satz- und Übungsseite sind geprüft. `legacyDistance` ist entfernt. |
| P18b-03 | Niedrig | Geschlossen | Der Metro-Satz nennt die Identifikation mit CCCD oder den Schalter. «oder über die App» steht beim vereinbarten Preis. GrabCar wird nicht als Vertragswagen bezeichnet. |
| P18b-04 | Niedrig | Geschlossen | Die drei Sätze «Em São Paulo, VLT» nennen Rio und die Baixada Santista. Gesprochener Text ist unverändert, deshalb keine neuen Clips. |
| P18b-05 | Niedrig | Geschlossen | `configure({ asyncUtilTimeout: 5000 })` in `src/test-setup.ts`. |
| P17-03 | Niedrig | Geschlossen | Der vietnamesische Gloss von transport.07 nennt «dừng ở đây». Der portugiesische Kontext von transport.14 nennt die Plattform, nicht die Linie. |

## Nachprüfung von Pull Request 18, dritter Durchgang

Geprüft am 11. Oktober 2026. Die Korrekturen liegen in 0.8.0. Kein neues Paket. `npm audit` bleibt bei 0 Schwachstellen. N14b-02 bleibt offen. Offen bleiben M1 und N15–N17. M2 und N4 sind geschlossen. P18c-01 ist bei den symmetrischen Sätzen nicht ganz geschlossen. Die Sterne bleiben.

| ID | Schwere | Status | Auflösung |
| --- | --- | --- | --- |
| P18c-01 | Mittel | Teilweise | Zusätzlich zum mittleren Abstand prüft die Bewertung die Richtung. Passt die Kurve rückwärts klar besser, ist die Aufnahme «unklar». Ein Dauerton gegen Sprache ist «unklar», weil die Lautstärke nicht mitläuft. Eine gespiegelte Silbe bleibt bei 2 Sternen. Rückwärts liegen die Stimmen unter 5 % der Sätze mit Sternen. Ein Dauerton bekommt keine. Bei Deutsch, Portugiesisch und Vietnamesisch bleiben ±3 Halbtöne und ±10 % Tempo bei den allermeisten Sätzen auf mindestens 2 Sternen. Bei joe, der englischen Standardstimme, sind es bei +3 Halbtönen etwa die Hälfte und bei -3 etwa 39 % der Sätze, die gegen sich selbst Sterne bekommen. Ein paar symmetrische Sätze bekommen rückwärts weiter 2 oder 3 Sterne. Die Schwelle, die das wegnehmen würde, drückt dort auch die kleinen Tonhöhen- und Temposchritte unter 2 Sterne. Test: `src/pitch/clips.test.ts`. |
| P18c-02 | Niedrig | Geschlossen | `src/pitch/clips.test.ts` bewertet jede gebündelte Stimme gegen sich selbst. joe lag bei Klarheit 0,8 meist ohne genug Frames. Die Tonhöhe war etwa 110 Hz, nicht unter 70 Hz. Die Klarheit ist 0,6. Rauschen und Brummen bleiben ohne Kontur. Die fehlenden Zeitdateien scheitern in `align_clips.py` an Wortzahl, Dauer oder Zuordnung. Die Oberfläche sagt «Keine Wortzeiten für diese Stimme.» |
| P18c-03 | Niedrig | Geschlossen | Die Clip-Prüfung läuft als `npm run test:clips` und als CI-Job `clips`, nicht neben den UI-Tests. |
| P18c-04 | Niedrig | Geschlossen | Der Job `clips` hat `timeout-minutes`, installiert ffmpeg mit `--no-install-recommends` und schreibt `ffmpeg -version`. Ohne ffmpeg bricht der Lauf lokal mit einem Hinweis ab. In CI wird ffmpeg verlangt. Die Grenzen sind Anteile, keine festen Zählungen. Die README nennt ffmpeg für `npm run test:clips`. |

## Nachprüfung von Pull Request 18, vierter Durchgang

Geprüft am 11. Oktober 2026. Die Korrekturen liegen in 0.8.0. Kein neues Paket. `npm audit` bleibt bei 0 Schwachstellen. N14b-02 bleibt offen. Offen bleiben M1 und N15–N17. M2 und N4 sind geschlossen. P18d-01 ist geschlossen. Die Sterne bleiben. Summen, Hintergrundgespräch und ein anderer Satz bekommen in der Messung keine.

| ID | Schwere | Status | Auflösung |
| --- | --- | --- | --- |
| P18d-01 | Mittel | Geschlossen | Die Sterne bleiben, für jede Stimme. Ein bewegtes Wort braucht dieselbe Richtung, sonst höchstens gelb, und Sterne nur, wenn mindestens die Hälfte solcher Wörter mitgeht. Die Klangfolge ist eine kleine Rechnung im Browser, ohne Netz und ohne neues Paket. Um 3 Halbtöne verschobene Filter, der nähere Abstand zählt. Darüber ist die Aufnahme «unklar» und ohne Sterne. Grenzen: Deutsch 2, Englisch 2, Portugiesisch 1,9, Vietnamesisch 1,7. In `src/pitch/clips.test.ts`: Summen, Hintergrundgespräch und ein anderer Satz 0 Sterne je Sprache. Hall und leichtes Rauschen bleiben über 60 % der Sätze mit mindestens 2 Sternen. Die Aufnahme wird dabei nicht gespeichert und nicht gesendet. |
| P18d-02 | Mittel | Geschlossen, mit Einschränkung | Die Verschiebung im Test stellt die Dauer wieder her, sonst wäre plus oder minus 3 Halbtöne zugleich ein Temposprung. Eine einzelne Oberwelle nahe am Median wird zurückgefaltet, und nur wenn höchstens etwa ein Drittel der Frames das betrifft. joe: selbst 100 von 104, plus 3 Halbtöne 68 von 100, minus 3 Halbtöne 56 von 100, plus 10 % Tempo 72 von 100, minus 10 % 75 von 100, rückwärts 0, Dauerton 0. Mit rosa Rauschen bei 10 dB: plus 3 Halbtöne 28 von 100, minus 3 Halbtöne 14 von 100. Hall 52 von 100. Das liegt über der Testuntergrenze von 35 % und unter den anderen Stimmen. Stärker auf die Modellkurve zu falten hat den Dauerton belohnt. Sterne für joe bleiben an. Verglichen wird mit joe. |
| P18d-03 | Niedrig | Geschlossen | `RepeatFeedback` übergibt die Lautstärke. «Keine Wortzeiten» steht nur, wenn die Zeiten fehlen, und nicht, solange sie laden. `takeRunsBackwards`, der Abstieg von grün auf gelb und die Schwelle 0,12 für den Dauerton haben je einen Unit-Test. Die Liste der Sätze, die rückwärts Sterne bekommen, ist leer. |
| P18d-04 | Niedrig | Geschlossen | Die 32 neu gesprochenen Dateien (Vietnamesisch Taxi und Fähre, drei Stimmen; Deutsch seekrank, zwei Stimmen; je Audio, 70 %, 85 % und Zeitdatei) heissen `.v2`. `AUDIO_FILE` und `ALIGN_FILE` erlauben das. `dropReplacedClips` löscht beim Start genau die alten Namen aus `travel-talk-audio`. Tests: `src/content/catalog.test.ts`, `src/audio/offline.test.ts`, `src/audio/align.test.ts`. |

## Nachprüfung von Pull Request 18, fünfter Durchgang

Geprüft am 11. Oktober 2026. Die Korrekturen liegen in 0.8.0. Kein neues Paket. `npm audit` bleibt bei 0 Schwachstellen. N14b-02 bleibt offen. Offen bleiben M1 und N15–N17. M2 und N4 sind geschlossen. Die Aufnahme wird nicht gespeichert und nicht gesendet. P18d-01, P18d-04 und die Privatsphäre bleiben geschlossen.

| ID | Schwere | Status | Auflösung |
| --- | --- | --- | --- |
| P18e-01 | Hoch | Teilweise | Mittelwert und Streuung je Koeffizient, dazu eine Frequenzverschiebung in 4-%-Schritten bis etwa ±20 %. Dieselbe Zeile, andere gebündelte Stimme, mindestens 2 Sterne: Deutsch 161 von 272, Englisch 43 von 208, Portugiesisch 60 von 300, Vietnamesisch 151 von 652. Summen, Dauerton, Rückwärts und Hintergrundgespräch: 0 in jeder Sprache. Ein anderer Satz: Deutsch 0 von 272. Englisch 27 von 208, Portugiesisch 54 von 300 und Vietnamesisch 75 von 652 liegen im selben Bereich wie die andere Stimme. Eine engere Grenze würde die andere Stimme mitnehmen. Bei vais1000 sind es 3 von 219 und bei vivos-32 gegen vais1000 10 von 214. Die Spektralgrenze verwirft 81 bis 89 Prozent der Paare vivos gegen vais1000. Die Klangfolge ist der Grund, nicht die Tonhöhe. Die Trennung hängt an der Ähnlichkeit der Stimmen: AUC 0,96 bis 0,98 bei demselben Sprecher oder bei vivos gegen vivos, 0,81 bei Englisch Mann gegen Frau, 0,53 bei Portugiesisch, 0,48 bei vivos gegen vais1000. Deutsch gegen espeak bleibt bei 3 bis 4 Prozent. Test: `src/pitch/clips.test.ts`. |
| P18d-02 | Mittel | Geschlossen, mit Einschränkung | joe: plus 3 Halbtöne 71 von 100, minus 3 Halbtöne 62 von 100, Raumhall 38 von 100, 10 dB 40 von 100. Mit der Verschiebung und 10 dB: 46 von 100 und 24 von 100. vais1000: plus 3 Halbtöne 209 von 217, minus 3 Halbtöne 215 von 217, Raumhall 198 von 217, 10 dB 206 von 217. Dauerton und Rückwärts bleiben bei 0. Die Untergrenzen stehen je Stimme in `src/pitch/clips.test.ts`. joe bleibt unter den anderen Stimmen. |
| P18e-02 | Niedrig | Geschlossen | Die Bänder gehen in `scoreRepeat`. `startAudioMaintenance` ruft die Cache-Löschung auf, und `main.tsx` ruft diese Funktion auf. Eine kurze zweite Harmonische wird in `contourFromSamples` gefaltet. Schwache Korrelation, zu wenig Hub und ein einzelnes gegenläufiges Wort haben je einen Test. Die positiven Untergrenzen liegen so, dass eine um ein Viertel strengere Klanggrenze sie verfehlt. |
| P18e-03 | Niedrig | Geschlossen | Die Analyse läuft in einem Worker. Die Merkmale der gehörten Datei werden wiederverwendet. Die Verschiebung läuft nur, wenn der unverschobene Abstand nicht schon reicht. Die Samples werden kopiert, nicht übertragen. Der Worker schreibt nichts und sendet nichts. |

Der Audio-Cache wird nur einmal je Versionsmarke durchgesehen. Die 32 alten Clips fehlen offline, bis die `.v2`-Dateien geladen sind. Der Job `clips` hat 30 Minuten. Der lokale Lauf brauchte etwa 15 Minuten.

## Nachprüfung von Pull Request 18, sechster Durchgang

Geprüft am 12. Oktober 2026. Die Bewertung und ihre Grenzen bleiben unverändert. Kein neues Paket. `npm audit` bleibt bei 0 Schwachstellen. N14b-02 bleibt offen. Offen bleiben M1 und N15–N17. M2 und N4 sind geschlossen. Die Aufnahme wird nicht gespeichert und nicht gesendet. P18e-03, die Versionsmarke und die Privatsphäre bleiben geschlossen.

| ID | Schwere | Status | Auflösung |
| --- | --- | --- | --- |
| Mikrofon | Niedrig | Geschlossen | `getUserMedia` fragt mit Echounterdrückung, ohne Rauschunterdrückung und ohne automatische Lautstärke. Test: `src/audio/recorder.test.ts`. |
| P18e-01 | Hoch | Offen | Die Bewertung bleibt. Die frühere Aussage, bei vais1000 sei die Tonhöhe der Grund, ist falsch. Die Spektralgrenze verwirft 81 bis 89 Prozent der Paare vivos gegen vais1000. Die Trennung hängt an der Ähnlichkeit der Stimmen, nicht an der Sprache. AUC 0,96 bis 0,98 bei demselben Sprecher oder bei vivos gegen vivos, 0,81 bei Englisch Mann gegen Frau, 0,53 bei Portugiesisch, 0,48 bei vivos gegen vais1000. Deutsch gegen espeak bleibt bei 3 bis 4 Prozent. |
| Summen und Singen | Info | Gemeldet, keine Grenze | Ein Summen auf der Lautstärke der Datei und ein Singen der Melodie bekommen weiter Sterne. Der Clip-Test schreibt die Raten und erwartet, dass der Fall scheitert. Das färbt CI nicht rot. Summen im Silbenrhythmus, mindestens 2 Sterne: Deutsch 36 von 272, Englisch 73 von 208, Portugiesisch 111 von 300, Vietnamesisch 85 von 652. Singen: Deutsch 29 von 272, Englisch 45 von 208, Portugiesisch 102 von 300, Vietnamesisch 47 von 652. |
| Testbudget | Niedrig | Zurückgenommen | `testTimeout` 15 Sekunden greift nicht, weil `asyncUtilTimeout` bei 5 Sekunden bleibt. Das Zurücksetzen von `renameDraft` ist in 0.7.1 behoben. Diese Fassung sitzt auf diesem Stand. Das Testbudget bleibt weg. |

Der Clip-Test ist ein Test je Sprache. Summen mit 4-Hz-Takt, Dauerton, Rückwärts und Hintergrund bleiben bei 0.

## Nachprüfung von Pull Request 18, siebter Durchgang

Geprüft am 12. Oktober 2026. Die Bewertung und ihre Grenzen bleiben unverändert. Kein neues Paket. `npm audit` bleibt bei 0 Schwachstellen. N14b-02 bleibt offen. Offen bleiben M1 und N15–N17. M2 und N4 sind geschlossen. Die Aufnahme wird nicht gespeichert und nicht gesendet.

| ID | Schwere | Status | Auflösung |
| --- | --- | --- | --- |
| N6-01 | Mittel | Geschlossen mit N7-01 | Vor `startMicrophone` ruft die Satzseite und die Übung `stopClip()`. «Anhören» und «Meine Aufnahme» sind während der Aufnahme aus. Zwei Wege blieben offen: die Wortknöpfe der Rückmeldung und «Anhören», solange das Mikrofon noch startet. Beides ist erst mit N7-01 geschlossen. Die Echounterdrückung kostet kaum Sterne, in der Messung 5 von 7, nicht 6 von 7. |
| N6-02 | Niedrig | Geschlossen | Der Clip-Test summt auch die Melodie, mit demselben Klang wie das Summen im Silbenrhythmus und mit der Kurve der Datei. Jede Rate hat eine Obergrenze knapp über dem gemessenen Wert. Steigt sie, wird der Lauf rot. |
| N6-03 | Niedrig | Geschlossen | Die Spannen stehen oben. Summen: Deutsch 13 bis 32 Prozent, Englisch 35 bis 48, Portugiesisch 37 bis 53, Vietnamesisch 13 bis 39. Im Browser liegen die Raten höher als in Node. |
| N6-04 | Niedrig | Geschlossen | Der Job `clips` ist eine Matrix, eine Sprache je Lauf, je 20 Minuten. Dekodierte Clips liegen in `.cache/tt-clips` und werden je Sprache im Actions-Cache gehalten. |
| N6-05 | Info | Geschlossen | Die Datei gegen sich selbst, mindestens 2 Sterne: Deutsch, Portugiesisch und Vietnamesisch mindestens 97 Prozent der Zeilen mit Zeitdatei, Englisch mindestens 95. |
| N6-06 | Info | Geschlossen | Escape setzt die Markierung zurück und das Feld auf den gespeicherten Namen. Test: `src/components/top-bar.test.tsx`. |

## Nachprüfung von Pull Request 18, achter Durchgang

Geprüft am 12. Oktober 2026. Die Bewertung und ihre Grenzen bleiben unverändert. Kein neues Paket. `npm audit` bleibt bei 0 Schwachstellen. N14b-02 bleibt offen. Offen bleiben M1 und N15–N17. M2 und N4 sind geschlossen. Die Aufnahme wird nicht gespeichert und nicht gesendet. N6-02 bis N6-06 bleiben geschlossen. N6-01 gilt nur zusammen mit N7-01 als geschlossen.

| ID | Schwere | Status | Auflösung |
| --- | --- | --- | --- |
| N6-01 | Mittel | Geschlossen | Zusammen mit N7-01. Die Wiedergabe der Datei und eines Wortes stoppt, bevor das Mikrofon aufnimmt. «Anhören» ist auch während des Starts aus. |
| N7-01 | Mittel | Geschlossen | Auf der Satzseite ist die Rückmeldung während der Aufnahme weg, und `onRecord` ruft `stopSlices()` auf. «Anhören» ist aus, sobald die Aufnahme startet, auch solange das Mikrofon noch kommt. Unmittelbar vor `recorder.start()` stoppt die Wiedergabe noch einmal. Dasselbe gilt in der Übung. Tests: `src/pages/phrase-feedback.test.tsx`, `src/pages/practice-feedback.test.tsx`, `src/audio/recorder.test.ts`. |
| N7-02 | Niedrig | Geschlossen | Die Echounterdrückung kostet kaum Sterne. Die Messung ist 5 von 7, nicht 6 von 7. |
| N7-03 | Niedrig | Geschlossen | Die Obergrenze für einen anderen Satz liegt bei Englisch bei 0,16, bei Portugiesisch bei 0,21 und bei Vietnamesisch bei 0,14. Das ist eine Testgrenze, keine neue Bewertung. |
| N7-04 | Niedrig | Geschlossen | Der Name einer dekodierten Datei enthält einen Hash von `src/pitch/clips.test.ts`. Der Actions-Cache nimmt denselben Hash in den Schlüssel. |
| N7-05 | Info | Geschlossen | `knownFailing` und «not gated» sind aus dem Clip-Test. N6-01 steht nur zusammen mit N7-01 als geschlossen. |

## Fassung ohne Sterne

Geprüft am 12. Oktober 2026. 0.8.0 liefert keine Sterne aus. Kurve, Wortfarben und die Balken für Melodie und Rhythmus bleiben. Ob der Satz der richtige war, prüft diese Fassung nicht. Das kommt in 0.10.0 oder danach mit der Spracherkennung auf dem Gerät. Die Notenformel liegt in `src/pitch/sentence-grade.ts` und wird von der App nicht geladen. N7-01, N7-04 und N7-05 bleiben im Code. N7-02 bleibt als Mikrofon: Echounterdrückung an, Rauschunterdrückung und automatische Lautstärke aus. N7-03, die Obergrenze für einen anderen Satz, geht mit der Note aus dem Clip-Test. Der Clip-Test dekodiert die Dateien und rechnet die Melodie.

## 0.7.1

Geprüft am 12. Oktober 2026. Kein neues Paket, kein neues Netz. `npm audit` bleibt bei 0 Schwachstellen. Der Name bleibt auf dem Gerät. Er geht nicht in den Export als Aufnahme und nicht ins Netz.

**Name.** Die Kopfzeile erscheint erst, wenn eine Person im Stand steht. Tippt man den Namen, bevor der Effekt des Einblendens den gespeicherten Text einsetzt, bleibt der getippte Text. «Weiter» speichert ihn. Ein leerer oder unsichtbarer Name sagt «Der Name braucht ein sichtbares Zeichen.» Die Meldung über eine ungültige Exportdatei erscheint dabei nicht. Nach dem Speichern zeigt das Feld den bereinigten Namen, und die Markierung, dass getippt wurde, geht zurück. Wechselt die Person, geht diese Markierung ebenfalls zurück, und ein später ankommender Name dieser Person ersetzt den Entwurf. Das Formular für den ersten Namen gilt nur für eine Person ohne Namen. Es benennt keine schon benannte Person, solange der Stand noch fehlt. Fehlt die Person beim Umbenennen, sagt das Menü «Diese Person ist nicht mehr da.» Scheitert das Hinzufügen, weil schon zehn Personen da sind, nennt es dieses Limit. Beides ist nicht die Meldung zur Exportdatei. Test: `src/components/top-bar.test.tsx`.

## 0.7.0

Geprüft am 11. Oktober 2026. Keine neue Laufzeitabhängigkeit, kein neues Paket, kein neues Netz aus der App. `npm audit` bleibt bei 0 Schwachstellen. Die Sätze, der Gloss und die Kulturhinweise sind statische Daten im Katalog. `phrase()` setzt `geprueft` auf `false`. Die Oberfläche sagt weiter, dass die Zeilen und die Wortzuordnung nicht geprüft sind.

**Darstellung.** Titel, Sätze, Hinweise und Quellen stehen als React-Text. Ein Kulturhinweis setzt keinen HTML-String. Die Quellenlinks sind `https`, mit `rel="noreferrer noopener"`, wie bisher. Die App lädt diese Seiten nicht selbst. Ein Hinweis enthält keine Personen-Namen.

**Was der Text behauptet.** Jede konkrete Angabe hat eine Quelle und das Lesedatum 2026-10-11. Was nicht belegt ist, steht im Hinweis als «noch nicht geprüft»: der Preis für ein xe ôm am Strassenrand, ein ausländischer Pass in der App der Hà Nội Metro, der Taxameter ausserhalb der Stadt São Paulo, der Taxameter in der Deutschschweiz, Taxi und Fahr-Apps ausserhalb Londons. Notrufnummern stehen in dieser Situation nicht. Die bestehenden Nummern im Notfall-Hinweis sind hier nicht erneut gelesen. Philippinen, Paraguay, Thailand und Portugal als Land haben keinen Code in `CultureNote.regions` und keinen eigenen Hinweis.

**Audio.** Dieselben acht Modelle, `piper-tts` 1.8.0, `onnx` 1.17.0 nur für die Wortzeiten. Neue Dateien nur für die neuen Zeilen: 540 Audiodateien und 178 Zeitdateien, zusammen 5'324'023 Bytes. Drei dieser Zeilen sind in 0.8.0 neu gesprochen. Zwei englische Clips der App-Bestellung haben keine Zeitdatei, weil die Wortzahl nicht zur Phonemgruppe passt, wie die älteren englischen Ausfälle. Sie stehen nicht in `manifest.json` und zählen nicht als fehlend. `manifest.json` hat danach 5863 Einträge, 4431 Audio und 1432 Zeiten. `maxEntries` ist 8000 und lässt Abstand zur Manifestlänge. Die Cache-Regel bleibt Status 200. Nichts davon kommt in den Precache.

## Nachprüfung von Pull Request 16, zweiter Durchgang

Geprüft am 11. Oktober 2026. Die Korrekturen liegen in 0.7.0. Kein neues Paket. `npm audit` bleibt bei 0 Schwachstellen. N14b-02 bleibt offen.

| ID | Schwere | Status | Auflösung |
| --- | --- | --- | --- |
| P16b-01 | Niedrig | Geschlossen | Sobald beide Sprachen gespeichert sind, setzt die Startseite die Standardstimmen und `voiceHintSeen`. Ein Verlassen oder Neuladen ohne «Weiter» lässt die Einführung aus, behält aber die Männerstimme und zeigt den Hinweis auf Männerstimmen nicht. Test: `src/pages/home-onboarding.test.tsx`. |
| P16b-02 | Niedrig | Geschlossen | `personName` gilt nur, wenn `cleanPersonName` denselben Text zurückgibt. U+3164 lehnt die Datei ab. `importAll` wirft `IMPORT_REJECTED` und lässt die bisherigen Personen stehen, statt eine Person samt Karten auszulassen. Test: `src/storage/import.test.ts`, `src/storage/people.test.ts`. |
| P16b-03 | Niedrig | Geschlossen | Die Zeilen zu N14b-02 nennen M1 und N15–N17 als offen und M2 und N4 als geschlossen, ohne ihnen das Verhalten der Download-Tests zuzuschreiben und ohne zu behaupten, die Mutanten-Diffs fehlten im Repo. P16-05 steht als Niedrig. Ein ZWJ zwischen zwei Emoji bleibt im Namen. Ein einzelner ZWJ nicht. Test: `src/storage/people.test.ts`. |

Ein Speichern für eine Person, die gerade gelöscht wurde, schreibt keine Karte und keine Einstellungen. Ein unbekannter Personen-Wechsel ändert die aktive Person nicht. Eine leere Notiz im Import behält die Notiz auf dem Gerät. Die Personenliste setzt den Namen in `<bdi>`. Löschen ruft `forgetVoiceIfUnused` auf. `playClip` hält an, wenn `stopClip` während `play()` gewinnt.

## XTTS-v2, vier portugiesische Frauenstimmen

Geprüft am 12. Oktober 2026. Keine neue Laufzeitabhängigkeit und kein neues npm-Paket. Die App lädt das Modell nicht. `npm audit` bleibt bei 0 Schwachstellen.

**Lizenz.** Die Stimmen `daisy-studious`, `gracie-wise`, `tammie-ema` und `claribel-dervla` sind offline mit Coqui XTTS-v2 erzeugt, Sprache `pt`, Sprecherinnen Daisy Studious, Gracie Wise, Tammie Ema und Claribel Dervla. Claribel ist ein Versuch. `SHIP_CLARIBEL` in `src/audio/voices.ts` nimmt sie aus der Wahl, ohne die drei anderen zu ändern. Die Lizenz ist die Coqui Public Model License 1.0.0. https://coqui.ai/cpml.txt antwortet mit 404. Der Text der festgeschriebenen Revision liegt unter https://huggingface.co/coqui/XTTS-v2/resolve/6c2b0d75eae4b7047358e3b6bd9325f857d43f77/LICENSE.txt und als Kopie in `docs/samples/cpml.txt`. Sie erlaubt nur nicht kommerzielle Nutzung des Modells und der Ausgabe. Diese App ist für die Familie und nicht kommerziell. Der Lizenztext liegt auch in `LICENSE.txt` in jedem Stimmordner und als Hinweis in `public/audio/NOTICE.txt`. Die Oberfläche nennt CPML und die nicht kommerzielle Beschränkung.

**Revision.** Hugging Face `coqui/XTTS-v2`, Revision `6c2b0d75eae4b7047358e3b6bd9325f857d43f77`. SHA-256 von `model.pth`: `c7ea20001c6a0a841c77e252d8409f6a74fb423e79b3206a0771ba5989776187`. `tools/generate_xtts.py` prüft die SHA-256 von `model.pth`, `config.json`, `vocab.json`, `speakers_xtts.pth`, `dvae.pth`, `mel_stats.pth`, `hash.md5` und `LICENSE.txt`, bevor es synthetisiert. Die Gewichte liegen nicht im Repo. `coqui-tts` ist auf 0.27.2 festgeschrieben und steht nicht in `package.json`.

**Pipeline.** Dieselbe Kette wie Piper: Spitzen-Normalisierung, AAC 48 kbit/s, mono, 22050 Hz, `atempo` 0.7 und 0.85. Die Satz-Wortzeiten schreibt `tools/align_clips.py` mit der Phonemuhr von `pt_BR-cadu-medium` (`piper-tts` 1.8.0, `onnx` 1.17.0), gelegt auf die vorhandene m4a. Die neunzehn Wortclips von 0.9.0 haben keine Zeitdatei, wie die Piper-Wörter. Eine Datei unter 0,3 Sekunden auf voller Geschwindigkeit, oder unter 0,45 Sekunden mit weniger als 40 % stimmhaften Frames (pitchy, Klarheit 0,6, 70 bis 450 Hz), wird nicht übernommen. Das gilt für Sätze und Wörter, auch bei 70 % und 85 %. Zusätzlich darf die Basisdatei nicht länger sein als `Wörter × 0,72 + 0,85` Sekunden plus 0,03. XTTS spricht manchmal ein Satzzeichen am Ende mit. Die Erzeugung spricht deshalb ohne Satzzeichen am Ende und prüft die Basisdatei mit `faster-whisper` small (`faster-whisper` 1.2.1, `av` 15.1.0, Modell `small`, Sprache `pt`). Ein Transkript mit `ponto`, `vírgula` oder `interrogação`, oder mit mehr Wörtern als der Text, wird verworfen. Der Spracherkenner läuft nicht in der App. Claribel bleibt in der Wahl. Der Standard für neue Nutzer bleibt cadu. Unbekannte Stimmen-IDs bleiben abgelehnt. Die Ids erfüllen `^[a-z0-9_-]{1,40}$`.

**Cache.** 1800 Satzdateien, 483 Satz-Zeitdateien und 228 Wortdateien. `manifest.json` hat 9278 Einträge, 7358 Audio und 1920 Zeiten. `maxEntries` ist 12000. Die Prüfung von 0.9.0 nannte 8000. Diese Fassung hebt die Grenze, damit mehr als 1200 Plätze frei bleiben, auch wenn Pull Request 22 später dazukommt. Die Cache-Regel bleibt Status 200. Satz-Audio und Hilfedateien kommen nicht in den Precache. Hilfedateien liegen im Laufzeit-Cache.

| ID | Schwere | Status | Auflösung |
| --- | --- | --- | --- |
| X1 | Mittel | Geschlossen | CPML erlaubt nur nicht kommerzielle Nutzung. LICENSE.txt, NOTICE.txt, die Hörproben und die Satzseite nennen das. Die App holt das Modell nicht. |
| X2 | Niedrig | Geschlossen | Die Gewichte sind über Revision und SHA-256 festgeschrieben und liegen ausserhalb des Repos. |
| X3 | Info | Offen gegenüber PR 22 | Pull Request 22 ist nicht gemergt und steht auch gegen `main` von 0.9.0 in Konflikt. Er setzt faber auf Mann, fügt die deutsche Frau `mls-4576` hinzu und hält `maxEntries` bei 8000. Diese Fassung lässt faber weiblich, wie auf `main`, hebt `maxEntries` auf 12000 und fügt Claribel Dervla hinzu. Ein Merge braucht die höhere Grenze, behält beide Stimmlisten und nimmt die Claribel-Zeilen in `voices.ts`, im Wörterbuch und in `KNOWN_MISSING` mit. |
