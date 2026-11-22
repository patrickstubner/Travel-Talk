# Sicherheitsprüfung Prototyp (16.11.2026, Nachtrag 22.11.2026)

Gemäss der Regel «Sicherheitsprüfung nach jeder Codeänderung». Geprüft: `prototype/gui/index.html` (eine Datei, HTML/CSS/JS inline) und `test/klicktest.mjs`. Änderung gegenüber 13.11.2026: Navigationsvarianten A/B und der Fokus-Modus (✕ ohne Tab-Leiste) sind entfernt. Genau 4 Tabs, Tab-Leiste auch in Übungen und auf der Phrasen-Seite sichtbar.

Nachtrag 22.11.2026: Der Prototyp liegt neu unter `prototype/gui/` im Repo. Bereinigt: kein Vorname, keine lokalen Rechnerpfade. Der Klicktest öffnet `index.html` relativ zu diesem Ordner (kein fest verdrahteter Arbeitsordner). Acht Screenshots (zusammen ca. 1,2 MB) gehören zur Design-Referenz.

| Punkt | Ergebnis |
|---|---|
| Abhängigkeiten / Libraries | **Keine.** Kein npm, kein CDN, keine Webfonts. Damit gibt es auch keine verwundbaren Libraries. Der Klicktest nutzt nur Node-Bordmittel und das lokal installierte Chrome (DevTools-Protokoll). |
| Externe Requests | **Keine** im Anwendungscode. Keine `http(s)://`-URL dort. CSP per `<meta>`: `default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'` – der Browser blockiert jeden Netzwerkzugriff, auch versehentliche. Der Klicktest spricht nur `127.0.0.1` (lokales Chrome) an. |
| XSS | Alle Nutzereingaben (Profilname, Suche, Toasts) gehen durch `esc()` bevor sie per `innerHTML` gerendert werden. Kein `eval`, kein `new Function`, kein `document.write`. Namen sind auf 40 Zeichen begrenzt, max. 10 Profile. Der frühere `confirm()`-Dialog zum Beenden einer Übung ist entfallen (Fokus-Modus verworfen). |
| Gespeicherter Zustand | Nur `localStorage` dieses Browsers (Schlüssel `tt-prototyp-v1`). Beim Laden wird der Zustand gegen erlaubte Werte geprüft (Sprachen aus der Registry, aktives Profil vorhanden, Namen gekürzt); kaputtes JSON → frischer Zustand. Das frühere Feld `nav` (Variante A/B) wird ignoriert. «Zurücksetzen» in der Seitenleiste löscht den Zustand. |
| Mikrofon / Audio | **Nicht verwendet.** Nachsprechen und 5 Sterne sind simuliert (Zufallswerte), Hörproben sind Platzhalter. Keine Berechtigungsabfrage. |
| Personendaten | Nur fiktive Beispielnamen (Anna, Luca, Mia). Nichts wird übertragen oder geloggt. |
| RTL-Testschalter | Setzt nur `dir`/`lang` und die Pseudosprache `ar-XB` im aktiven Profil; keine neuen Eingabewege. |
| Hosting | **Wird nicht auf GitHub Pages veröffentlicht.** Pages liefert nur den App-Build unter `dist/`, nicht `prototype/`. Eine öffentliche Demo nur nach Ja des Projektinhabers und Prüfung durch Stabschef. Dafür müsste die CSP als HTTP-Header gesetzt und `'unsafe-inline'` per Hash ersetzt werden. `'unsafe-inline'` bleibt für den lokalen Ein-Datei-Prototyp bewusst bestehen (N1). |

**Restrisiko:** gering. `'unsafe-inline'` ist nötig, weil alles in einer Datei liegt; ohne externe Quellen und mit `esc()` ist das für einen lokalen Prototyp vertretbar. Für die echte App gilt weiter die bestehende CSP von Travel Talk.

**Befund (16.11.2026, bestätigt 22.11.2026):** keine Schwachstelle mit Schweregrad kritisch, hoch oder mittel. `'unsafe-inline'` und `innerHTML` bleiben ein bekanntes niedriges Restrisiko des Ein-Datei-Prototyps.
