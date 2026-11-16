# ADR-001: Schichtregeln und keine Zyklen

- **Status:** vorgeschlagen (13.11.2026)
- **Repo-Stand:** Commit `8ae1686`
- **Bezug:** Review vom 13.11.2026, Befund 4

## Kontext

Die Graphify-Analyse und die Read-only-Kopie des Repos zeigen fünf Probleme.

1. **Zyklus zwischen Storage und Audio:**
   - `src/storage/types.ts` importiert `isBundledVoiceId` aus `src/audio/voices.ts`.
   - `src/audio/voices.ts` importiert `Settings` aus `src/storage/types.ts`.
2. **Storage hängt von Audio ab:** `storage/types.ts`, `storage/dexie-repository.ts` und `storage/import.ts` importieren `audio/speed.ts`.
3. **Inhalt hängt von Audio ab:** `src/content/resolve.ts` importiert `reviseClip` aus `audio/clip-revision.ts`.
4. **Der Grundtyp liegt in einer Inhaltsdatei:** `Lang` und `LANGS` stehen in `content/phrase.ts` und werden von domain, storage, audio, srs und den Komponenten importiert.
5. **Riesiger Wirkungsradius:** `storage/types.ts` hat 47 abhängige Dateien, davon 26 im Produktivcode.

## Entscheid

Abhängigkeiten zeigen nur nach unten. Was weiter oben steht, darf importieren, was darunter steht, nie umgekehrt.

```
pages/            Routen, dünne Komposition
components/       reine Darstellung (Props rein, Events raus)
hooks/            React-Bausteine: usePhrasePlayback, useStudySession …
app/              Provider (Catalog, Profiles, Progress, Settings), Router, Shell
──────────────────────────────────────────────────────────────
storage/  audio/  pitch/  srs/  content/(Abfragen)  pwa/  i18n/
──────────────────────────────────────────────────────────────
domain/           Typen, Sprach-Registry, Validatoren. Keine Importe aus src/.
content-Daten     (Ordner content/: nur Daten, darf nur domain importieren)
```

### Regeln

1. `src/domain` importiert nichts aus `src/` und nichts aus `content/`. Erlaubt sind nur externe Pakete ohne Seiteneffekte, zum Beispiel `zod`.
2. Die Dienst-Schicht (`storage`, `audio`, `pitch`, `srs`, `content`, `pwa`, `i18n`):
   - darf `domain` importieren,
   - darf untereinander nur über die erlaubten Pfeile unten importieren,
   - darf nie React-Komponenten oder `app/` importieren.
   - Erlaubte Pfeile:
     - `audio` → `content` (resolve), `pitch`
     - `srs` → `content`
     - `content` → `audio` ist verboten. `clip-revision` wandert nach `domain` oder `content`.
3. `hooks` dürfen Dienste und `app`-Provider nutzen.
4. `components` importieren nur `domain`-Typen, `i18n` und andere Komponenten. Kein `audio`, `storage`, `pitch` oder `srs`, alles kommt über Props oder Hooks.
5. `pages` setzen Hooks und Komponenten zusammen. Direkte Importe aus `audio`, `storage` oder `content`-Daten sind verboten.
6. Keine Zyklen, auch nicht über Typ-Importe.
7. Tests (`*.test.ts(x)`, `e2e/`) sind von den Regeln ausgenommen.

### Was dafür verschoben wird (Umsetzung in Issue R2)

| Heute | Neu |
|---|---|
| `Lang`, `LANGS` in `content/phrase.ts` | `src/domain/lang.ts` (Registry, siehe ADR-003) |
| `Settings`, `VoiceMap` in `storage/types.ts` | `src/domain/settings.ts` |
| `SpeedStep`, `SpeedChoice`, `isSpeedStep`, `SPEED_STEPS` in `audio/speed.ts` | `src/domain/speed.ts` |
| `isBundledVoiceId`, `CatalogVoice`, `VOICES` in `audio/voices.ts` | `src/domain/voices.ts` (Daten), Logik bleibt in `audio/voices.ts` |
| `reviseClip` in `audio/clip-revision.ts` | `src/domain/clip-revision.ts` |
| `StoredCard`, `ProgressSnapshot`, `ProgressRepository` | bleiben in `storage/types.ts` (Persistenzformat) |

Die alten Exporte bleiben für einen Release als Re-Export erhalten (`export type { Lang } from '../src/domain/lang'`), damit der Umbau in kleinen PRs geht.

## Prüfung in der CI (Vorschlag, noch nicht committet)

Das Werkzeug ist `dependency-cruiser`: devDependency, gratis, nur Build-Zeit, kein Backend. Script: `"depcheck": "depcruise src content --config .dependency-cruiser.cjs"`. Es läuft in der CI nach `lint`.

```js
// .dependency-cruiser.cjs (Vorschlag)
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    { name: 'no-circular', severity: 'error', from: {}, to: { circular: true } },
    {
      name: 'domain-is-leaf',
      severity: 'error',
      from: { path: '^src/domain' },
      to: { path: '^(src|content)/', pathNot: '^src/domain' },
    },
    {
      name: 'content-data-only-domain',
      severity: 'error',
      from: { path: '^content/' },
      to: { path: '^src/', pathNot: '^src/domain' },
    },
    {
      name: 'services-no-ui',
      severity: 'error',
      from: { path: '^src/(storage|audio|pitch|srs|content|pwa|i18n)/' },
      to: { path: '^src/(app|hooks|components|pages)/' },
    },
    {
      name: 'storage-no-audio',
      severity: 'error',
      from: { path: '^src/storage/' },
      to: { path: '^src/(audio|pitch)/' },
    },
    {
      name: 'content-no-audio',
      severity: 'error',
      from: { path: '^src/content/' },
      to: { path: '^src/(audio|pitch)/' },
    },
    {
      name: 'components-are-dumb',
      severity: 'error',
      from: { path: '^src/components/', pathNot: '\\.test\\.tsx?$' },
      to: { path: '^(src/(audio|storage|pitch|srs|content)/|content/)' },
    },
    {
      name: 'pages-use-hooks',
      severity: 'error',
      from: { path: '^src/pages/', pathNot: '\\.test\\.tsx?$' },
      to: { path: '^(src/(audio|storage|pitch)/|content/)' },
    },
  ],
  options: {
    tsConfig: { fileName: 'tsconfig.json' },
    tsPreCompilationDeps: true,
    exclude: { path: '(\\.test\\.tsx?$|^e2e/)' },
  },
}
```

**Einführung:** Zuerst nur `no-circular`, `domain-is-leaf` und `storage-no-audio` als `error`. Die übrigen Regeln laufen als `warn` und werden nach R3 bis R6 einzeln auf `error` gestellt.

## Folgen

- **Positiv:** Typänderungen bleiben lokal, und es entstehen keine Zyklen mehr. Komponenten lassen sich für den GUI-Umbau frei austauschen, und eine neue Sprache betrifft nur `domain` und `content` (ADR-003).
- **Negativ:** Die Importpfade ändern sich einmalig, das sind viele kleine Diffs. Ausserdem kommt eine devDependency dazu (dependency-cruiser), die vor der Aufnahme auf Schwachstellen geprüft wird.
- **Sicherheit:** Keine Laufzeitänderung. Die neue devDependency wird mit `npm audit` und Lizenzcheck geprüft.
