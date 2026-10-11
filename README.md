# Travel Talk

**Live:** [patrickstubner.github.io/Travel-Talk](https://patrickstubner.github.io/Travel-Talk/)

Reise-Sprachhilfe für eine Familie. Version 0.3.1. Offline, ohne Konto, ohne Tracking.

Die App hilft beim Üben kurzer Sätze entlang einer Reise: Notfall, Menschen treffen, Ankunft, Restaurant und ein Anfang für Visum, Unterkunft, Einkaufen, Sehenswürdigkeiten und Alltag. Die Sprache der App und die Lernsprache sind zwei getrennte Wahlen. Hören, Verstehen und Sprechen kommen zuerst. Lesen stützt das Hören. Schreiben ist nicht der Weg durch die Sitzung. Höchstens 15 neue Sätze am Tag, über alle Richtungen zusammen.

Die Sätze auf Vietnamesisch und Portugiesisch (Brasilien) sind noch nicht von einer muttersprachlichen Person geprüft. Dasselbe gilt für Deutsch und Englisch. Im UI steht das an den Sätzen.

## Zwei Sprachen

Deutsch, Englisch, Portugiesisch (Brasilien) und Vietnamesisch. Jede Richtung aus zwei verschiedenen Sprachen läuft aus denselben 103 Konzepten. Eine fehlende Zeile wird ausgelassen, und der Start sagt das. Die Zahlen pro Situation stehen unten. Ein Konzept kann in zwei Situationen hängen, zum Beispiel die Allergie im Notfall und im Restaurant. Deshalb ist die Summe der Situationen grösser als 103.

| Situation | Stand | Konzepte |
| --- | --- | --- |
| Notfall | ausgearbeitet | 20 |
| Menschen treffen | ausgearbeitet | 29 |
| Ankunft und Einreise | kleiner Satz | 11 |
| Restaurant, Essen, Trinken | kleiner Satz | 14 |
| Visum vor der Reise | Anfang | 8 |
| Unterkunft | Anfang | 8 |
| Alltag | Anfang | 8 |
| Einkaufen | Anfang | 7 |
| Sehenswürdigkeiten | Anfang | 6 |

Vietnamesisch ist im Text südlich voreingestellt. Nord ist eine Variante, zum Beispiel `đậu phộng` und `lạc`. Die Audiodatei ist trotzdem eine nördliche Stimme. Das Tempo hat drei Stufen, 70 %, 85 % und 100 %, als eigene Dateien, damit die Tonhöhe gleich bleibt. Die Wahl sitzt nur am Player. Details in [docs/audio.md](docs/audio.md).

## Lokal entwickeln

Voraussetzung: Node 22.

```bash
npm ci
npm run dev
```

Die App liegt unter `http://127.0.0.1:5173/Travel-Talk/`. Der Build ist Rsbuild. Der Service Worker entsteht nach dem Build mit `workbox-build`: er liest das fertige `dist/` und nimmt damit auch die kopierten Audiodateien in den Cache. Ein Rspack-Plugin sähe nur die kompilierten Assets. Die Tests laufen mit Vitest, getrennt vom Build. Weitere Befehle:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Der Build schreibt die App nach `dist/` und kopiert `index.html` nach `404.html`, weil GitHub Pages kein SPA-Fallback hat. Die Navigation läuft über den Hash. Die Basis ist `/Travel-Talk/`.

Lernstand, Aufnahmen und die persönliche Notiz bleiben im Browser. Export und Import sind JSON. Der Export wartet, bis beide Sprachen gewählt sind. Die Notiz kommt nur in den Export, wenn der Haken gesetzt ist, weil sie Gesundheitsangaben enthalten kann. Der Import prüft die Datei, zeigt eine Zusammenfassung und lehnt Unpassendes ab, ohne den Inhalt anzuzeigen. Eine Aufnahme stoppt, wenn der Tab versteckt wird oder die Seite zugeht.

## Inhalt ergänzen

Die Daten sind konzept-zentriert. Ein Konzept hat pro Sprache eine Realisierung. Die Seiten lesen diese Realisierung, sie enthalten keine eigenen Sätze.

**Situation.** Ein Eintrag in `content/situations.ts` mit `id`, Reihenfolge, Tiefe (`core`, `sample` oder `starter`) und Titel plus Kurztext in `de`, `en`, `pt-BR` und `vi`. Die Navigation nimmt jede Situation aus dieser Liste.

**Sätze.** Eine Datei unter `content/phrases/` und der Eintrag in `content/index.ts`. `phrase()` setzt `geprueft` auf `false`. Vietnamesisch mit allen Zeichen. Portugiesisch in brasilianischer Verwendung: `você`, nicht das europäische `tu`. Beispielnamen sind erfunden. Wo die Anrede die Grammatik nicht bricht, steht `{addr}` oder `{Addr}`. Deutsch mit wechselndem Verb bekommt volle Varianten (`Sie` und `du`), keine Token. Tests in `src/content/catalog.test.ts` prüfen das Schema.

**Kulturhinweis.** Ein Eintrag in `content/culture.ts` mit Situationen, Regionen (`VN`, `BR`, `DE-CH`, `EN`), Text in vier Sprachen, mindestens einer `https`-Quelle und dem Lesedatum. Im Text «häufig» oder «vielerorts», keine Regel für alle Menschen. Die Quelle erscheint in der Oberfläche.

**Sprache.** Eine weitere Sprache ist eine weitere Realisierung pro Konzept, kein neues Layout. Die Liste der Sprachen in `content/phrase.ts` und im Schema ist geschlossen, weil nur diese vier vorkommen. Sprache der App und Lernsprache sind zwei Wahlen. Die Richtung entsteht daraus, in `src/domain/direction.ts`. Für eine fünfte Sprache kommt der Code dort dazu und, wenn Audio mitgeliefert wird, eine Stimme in `tools/generate_audio.py` und `docs/audio.md`. Die Seiten bleiben dieselben.

Audio neu bauen steht in [docs/audio.md](docs/audio.md). Die Prüfung der Abhängigkeiten und der Eingaben steht in [docs/SECURITY.md](docs/SECURITY.md).

## Veröffentlichung

GitHub Pages baut über die Action in `.github/workflows/ci.yml`, nur beim Push auf `main`. Lint, Typprüfung, Tests, Build und `npm audit` laufen auch auf Pull Requests. Der Audit bricht ab der Stufe moderate ab.
