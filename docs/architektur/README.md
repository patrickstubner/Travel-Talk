# Architekturplan Travel Talk

- **Stand:** 16.11.2026
- **Bezug:** Planungsstand zum Commit `8ae1686` auf `main`

Dieses Verzeichnis enthält das GUI-Konzept, die Architektur-Entscheidungen (ADRs), den Ablaufplan ab dem 27.11.2026 und die übrigen Planungsdokumente für den Umbau.

Der frühere klickbare Prototyp und eine Read-only-Kopie des Quelltexts gehören nicht in dieses Repo und sind hier nicht enthalten.

## Inhalt

| Datei | Inhalt |
|---|---|
| [gui-konzept.md](gui-konzept.md) | GUI- und UX-Konzept, Navigation (4 Tabs, entschieden 16.11.), Hauptflüsse, 5-Sterne-Abbildung, Entscheide vom 13.11. und 16.11. |
| [adr/ADR-001-schichtregeln.md](adr/ADR-001-schichtregeln.md) | Schichten domain ← Dienste ← hooks ← components/pages, keine Zyklen, dependency-cruiser-Vorschlag |
| [adr/ADR-002-zustand-aufteilen.md](adr/ADR-002-zustand-aufteilen.md) | `AppProvider` wird zu Catalog, Profiles, Settings und Progress, Repository-Injektion, `AudioLifecycle`, Migrationsschritte |
| [adr/ADR-003-neue-sprachen.md](adr/ADR-003-neue-sprachen.md) | Sprach-Registry, Vollständigkeitsprüfung, Fallbacks, RTL verbindlich (dir pro Sprache, logisches CSS, Lint, J9), Sprachen pro Profil, schneller Lernsprachwechsel, Schrift, Stimmen, Checkliste «Neue Sprache hinzufügen» |
| [adr/ADR-004-erweiterbare-inhalte-und-uebungen.md](adr/ADR-004-erweiterbare-inhalte-und-uebungen.md) | Inhalte rein datengetrieben, Übungsarten als Plug-ins (Rollenspiel als Beispiel), Checklisten für neue Inhalte und neue Übungsarten |
| [bausteine.md](bausteine.md) | API-Skizzen: domain-Typen, Katalog-Abfragen, `usePlaybackPrefs`, `usePhrasePlayback`, `useRepeatTake`, `useRepeatScore`, `useStudySession`, Übungs-Plug-ins, Provider-Hooks, GUI-Bausteine |
| [ablaufplan.md](ablaufplan.md) | Reihenfolge ab 27.11. mit Voraussetzungen, Umfang, «Fertig, wenn», Sicherheitsprüfung und Aufwand |
| [testplan.md](testplan.md) | 6 Journeys (plus J7 Rollenspiel, J8 Profile/Sprachwechsel, J9 RTL visuell), Unit-Tests (`direction`, Router, `register-sw`, Sprachen-Vollständigkeit, Vertragstest für Übungen), Test-Helfer `renderWithApp` |
| [review-2026-11-13.md](review-2026-11-13.md) | Architektur-Review: 7 Befunde mit Belegen aus Graphify, Wirkung und Fix |
| [issues-entwuerfe.md](issues-entwuerfe.md) | Issue-Texte R1–R8 und G1–G4, Notiz zu V1; angelegt als #59–#70 |
| [wireframes.html](wireframes.html) | 13 Wireframes, eigenständig ohne externe Dateien. `#only=<id>` zeigt einen einzelnen Screen. |
| [wireframes/00-uebersicht.png](wireframes/00-uebersicht.png) | Alle Wireframes auf einem Bild |
| [wireframes/](wireframes/) | Ein Bild pro Screen (`s01`–`s13`) |
