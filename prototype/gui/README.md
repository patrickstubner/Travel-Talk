# Klickbarer GUI-Prototyp Travel Talk

Öffnen: `index.html` direkt im Browser (Doppelklick genügt, offline, keine Installation). Mobilformat 375 × 740, rechts eine Seitenleiste mit Testschaltern.

**Stand 16.11.2026 (Projektinhaber):** 4 Tabs (Heute, Situationen, Zeigen, Ich). «Nachschlagen» ist die Suche im Tab Situationen. Die Tab-Leiste bleibt auch in Übungen und auf der Phrasen-Seite sichtbar. Der Fokus-Modus und die Navigationsvariante B («wie heute») sind verworfen.

**Nur Design-Referenz**, nicht produktiv und nicht in die App übernehmen. Die echte App entsteht weiter im bestehenden Code (`src/`).

**Durchklickbar:** Onboarding (erkannte App-Sprache + Lernsprachwahl), 4 Tabs, Situation → Phrase, Üben (Verstehen, Nachsprechen mit simulierten 5 Sternen, Tab-Leiste sichtbar), Tempo 70/85/100 % + Automatisch, Rollenspiel, Kultur, Einstellungen mit Hörprobe-Platzhalter, Profile (Anna, Luca, Mia; fiktiv) mit eigener App- und Lernsprache, Sprach-Chip für schnellen Lernsprachwechsel, RTL-Testschalter.

**URL-Parameter (für Tests/Screenshots):** `?demo` (Onboarding überspringen), `?lang=pt-BR` (Browsersprache simulieren), `?rtl=1` (RTL-Pseudosprache), `?sheet=lang|people`, `?step=nachsprechen`, `?ob=2`. Der frühere Parameter `?nav=B` entfällt.

**RTL-Test:** Schalter «RTL-Pseudosprache an/aus» in der Seitenleiste. Das Layout spiegelt sich (Zurück rechts, Chevrons gespiegelt, Hauptaktion links), deutsche Texte bleiben stehen, Lerninhalte (vi/pt) bleiben links-nach-rechts in `<bdi dir="ltr">`, Übersetzungen mit `dir="auto"`. Play ▶ wird bewusst nicht gespiegelt.

**Klicktest:** `node test/klicktest.mjs` (braucht lokales `google-chrome`). Prüft unter anderem, dass genau 4 Tabs da sind und die Tab-Leiste auf Phrase und Üben sichtbar bleibt. Der Test ermittelt den Pfad zu `index.html` relativ zu diesem Ordner.

**Screenshots:** `screenshots/01-heute-sprachchip.png`, `02-lernsprache-wechseln.png`, `03-nachsprechen-5-sterne.png`, `04-profile.png`, `05-rtl-test-situation.png`, `06-onboarding-sprachen.png`, `07-ueben-tabs-sichtbar.png`, `08-phrase-tabs-sichtbar.png`.

Sicherheit: siehe `SECURITY.md`. Nicht öffentlich gehostet.
