# ADR-002: AppProvider aufteilen

- **Status:** vorgeschlagen (13.11.2026)
- **Repo-Stand:** Commit `8ae1686`
- **Bezug:** Review Befund 1, ADR-001

## Kontext

`AppProvider` in `src/app/state.tsx` (L29–L180) stellt über `useApp()` 15 Felder bereit (`AppValue`, L10):

- **Daten:** `catalog`, `catalogOk`, `snapshot`, `storageError`
- **Funktionen:** `saveSettings`, `saveCard`, `replaceAll`, `addPerson`, `renamePerson`, `deletePerson`, `switchPerson`, `importPerson`, `importAll`, `everyone`

Probleme:

- **Grosse Reichweite:** `useApp()` hat 28 Aufrufer, davon 12 im Produktivcode (alle 8 Seiten, `Shell`, `TopBar`, `useCopy`, `useSettings`).
- **Datenbank fest eingebaut:** Der Provider erzeugt `new DexieProgressRepository()` selbst. Tests können ihn nicht austauschen.
- **Audio im Zustand:**
  - `deletePerson`, `switchPerson`, `importPerson` und `importAll` rufen `stopClip()` auf.
  - `deletePerson` ruft zusätzlich `forgetVoiceIfUnused()` auf.
  - `saveSettings` ruft `withDefaultVoices()` auf.
- **Unnötiges Neu-Rendern:** Der Kontextwert hängt von `snapshot` ab. Jede gespeicherte Karte erzeugt einen neuen Wert, und alle Konsumenten rendern neu, auch `TopBar` und Seiten ohne Lernstand.

## Entscheid

Vier Provider mit je einem schmalen Hook. Ein gemeinsamer Wurzel-Provider erhält das Repository injiziert.

```tsx
// src/app/providers.tsx
export function AppProviders({ repository, catalog, children }: {
  repository: ProgressRepository        // Produktiv: new DexieProgressRepository()
  catalog?: CatalogResult              // Tests: fester Katalog
  children: ReactNode
}) {
  return (
    <CatalogProvider value={catalog}>
      <ProfilesProvider repository={repository}>
        <SettingsProvider>
          <ProgressProvider>{children}</ProgressProvider>
        </SettingsProvider>
      </ProfilesProvider>
    </CatalogProvider>
  )
}
```

| Provider | Hook(s) | Inhalt | Ändert sich |
|---|---|---|---|
| `CatalogProvider` | `useCatalog()`, `useCatalogStatus()` | validierter Katalog plus Abfragen (siehe [`bausteine.md`](../bausteine.md)) | nie (statisch) |
| `ProfilesProvider` | `useProfiles()`, `useActivePerson()`, `useActiveTarget()` | `people`, `activePersonId`, `storageError`, `add`, `rename`, `remove`, `switchTo`, `switchTarget`, `addTarget`, `importPerson`, `importAll`, `everyone`, `replaceAll` | selten |
| `SettingsProvider` | `useSettings()`, `useSaveSettings()` | Einstellungen der aktiven Person | selten |
| `ProgressProvider` | `useCards()`, `useCard(id)`, `useSaveCard()` | Karten der aktiven Person | oft |

### Profile und Sprachen pro Profil (Vorgabe des Projektinhabers, 13.11.2026)

- **Mehrere Profile pro Gerät** (z.B. der Projektinhaber und eine zweite Person). Ein Profil = eine heutige `PersonRecord`, sichtbar als «Profil».
- **Pro Profil gespeichert:** GUI-Sprache (`uiLang`, `uiLangSource: 'detected' | 'manual'`), Liste der Lernsprachen (`targets: Lang[]`) und die aktive Lernsprache (`activeTarget`). Zwei Profile dürfen verschiedene GUI- und Lernsprachen haben.
- **Pro Profil und Lernsprache getrennt:** Fortschritt (Karten, Serie, Lernstand) und lernsprachbezogene Einstellungen (Stimme, Region, Tempo, `langOptions`, Onboarding-Status) liegen unter `perTarget[lang]`. Ein Wechsel der Lernsprache verliert nichts; zurückwechseln zeigt den alten Stand.
- **Profilwechsel** schaltet GUI-Sprache (inkl. `<html lang dir>`, ADR-003 §6), aktive Lernsprache, Einstellungen und Fortschritt gleichzeitig um. Laufendes Audio wird gestoppt (`AudioLifecycle`).
- **Schneller Lernsprachwechsel** (`switchTarget(lang)`) gilt nur innerhalb des aktiven Profils. Er ändert `activeTarget`, lädt `perTarget[lang]` und stoppt Audio.
- **Neues Profil / erster Start:** `uiLang = resolveInitialUiLang(navigator.languages)` (sonst Englisch), `uiLangSource: 'detected'`; Lernsprache im Onboarding.
- **Umsetzung:** `SettingsProvider` liefert `useSettings()` = Profil-Einstellungen zusammengeführt mit `perTarget[activeTarget]`. `ProgressProvider` lädt Karten nach Schlüssel `(personId, activeTarget)`; das passt zur heutigen Ablage pro Richtung (`directionId(app, target)`), neu aber unabhängig von der GUI-Sprache, damit ein Wechsel der App-Sprache den Fortschritt nicht «versteckt». Dafür braucht es eine einmalige Migration (Schlüssel von Richtung auf Zielsprache) mit Test.

### Regeln

- Die Callbacks sind stabil (`useCallback` ohne `snapshot` in den Abhängigkeiten). Sie lesen den aktuellen Stand über den funktionalen `setState` oder eine Ref.
- Die Funktionen liegen in einem eigenen Kontext, getrennt von den Daten. Wer nur speichert, rendert dann nicht neu, wenn sich Daten ändern.
- **Audio-Aufräumen wandert aus dem Zustand heraus:**
  - `ProfilesProvider` meldet Ereignisse: `onPersonChanging(id)` und `onPersonRemoved(person, rest)`.
  - Ein `AudioLifecycle` in `src/app/audio-lifecycle.tsx` hört darauf und ruft `stopClip()` beziehungsweise `forgetVoiceIfUnused()` auf.
  - `withDefaultVoices()` wird zur reinen Domänenfunktion `completeSettings(settings)` in `domain/settings.ts`, also ohne Audio-Import.
- Der `useApp()`-Kompatibilitätshook bleibt bis zum Ende der Migration. Er setzt `AppValue` aus den vier Hooks zusammen und wird danach gelöscht.

## Migration (je ein kleiner PR, alle Tests grün)

1. **Test-Helfer zuerst:** `renderWithApp()` mit `MemoryProgressRepository` (siehe [`testplan.md`](../testplan.md)). Die 16 `Ready*`-Wrapper werden darauf umgestellt.
2. **Repository injizieren:** `AppProvider({ repository })`. `main.tsx` übergibt `new DexieProgressRepository()`. Das Verhalten bleibt gleich.
3. **`CatalogProvider` herauslösen.** `useApp().catalog` liest intern daraus. `Culture`, `Lookup` und `Situation` werden auf `useCatalog()` umgestellt.
4. **`ProfilesProvider` und `AudioLifecycle`:** `stopClip` und `forgetVoiceIfUnused` verschwinden aus `state.tsx`. `TopBar` und `Settings` werden auf `useProfiles()` umgestellt.
5. **`SettingsProvider`:** `use-copy.ts` (`useSettings`) liest daraus, `withDefaultVoices` wird durch `completeSettings` ersetzt.
6. **`ProgressProvider`:** `Practice`, `Phrase`, `Show` und `Home` werden auf `useCards()` und `useSaveCard()` umgestellt.
7. **Aufräumen:** `useApp()` und `AppValue` löschen, `state.tsx` entfernen.

**Fertig, wenn:**
- kein Import von `app/state` mehr existiert,
- `rg "stopClip|forgetVoiceIfUnused" src/app` nur `audio-lifecycle.tsx` findet,
- alle Vitest- und Playwright-Journeys grün sind.

## Folgen

- **Positiv:** Seiten lassen sich isoliert rendern. Das ist eine Voraussetzung für den GUI-Umbau und für Komponenten-Previews. Ausserdem gibt es weniger Neu-Rendern, und Tests brauchen keine IndexedDB mehr.
- **Negativ:** Es gibt mehr Dateien. Während der Migration existieren zwei Zugriffswege (`useApp` und die neuen Hooks).
- **Sicherheit:** Keine neue Abhängigkeit. Das Datenformat in IndexedDB bleibt unverändert. Zu prüfen ist, dass Import und Export (`storage/import.ts`) unverändert validiert werden und dass `everyone()` keine Daten anderer Personen in Komponenten leakt, die sie nicht brauchen.
