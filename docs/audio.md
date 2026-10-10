# Audio in Travel Talk 0.2.0

Stand: 10. Oktober 2026.

## Entscheidung

Version 0.2.0 speichert **vorerzeugte Audiodateien** im Repo und spielt sie offline ab. Das ist Option 1 aus der Technik-Empfehlung. Azure und jede andere Stimme mit Konto, Schlüssel oder Kreditkarte sind nicht dabei.

Das Tempo hat drei feste Stufen, 70 %, 85 % und 100 %. Es gibt keinen Schieberegler. Jede Stufe ausser 100 % ist eine eigene Datei. `HTMLMediaElement.playbackRate` wird nicht gesetzt.

Zhao 1997 (Applied Linguistics 18(1)) zeigt, dass Lernende beim Hörverstehen besser abschneiden, wenn sie das Sprechtempo selbst wählen, und dass sie es meist verlangsamen. Das Konzept der App verlangt zwei Tempi und eine langsame Fassung. Alltagssprache läuft aber in normalem Tempo, deshalb steigt die App von langsam nach normal, statt bei der langsamen Fassung zu bleiben.

## Warum keine playbackRate

`playbackRate` unter 1 verschiebt die wahrgenommene Tonhöhe, wenn der Browser sie nicht ausgleicht. `preservesPitch` steht seit Dezember 2023 in der Baseline (MDN, gelesen am 10. Oktober 2026). Unpräfigiert ist es in Safari ab 17.2, davor als `webkitPreservesPitch` (Can I use, derselbe Tag). Das reicht hier nicht:

- Auf iOS war das Verhalten lange unzuverlässig. WebKit-Bug 240405 (gemeldet Mai 2022) beschreibt, dass `preservesPitch` und `playbackRate` falsch laufen, sobald das Element an einem `AudioContext` hängt. Der Fix landete erst am 27. März 2026. Telefone, die eine Familie mitnimmt, haben den Fix nicht zwingend.
- Diese Umgebung hat kein iOS-Gerät. Die Tonhöhe lässt sich hier also nicht auf dem Zielgerät prüfen. Die Vorgabe ist: `playbackRate` nur dort, wo die Tonhöhe geprüft ist. Das ist sie nicht.
- Gemessen am 10. Oktober 2026 mit pitchy (Klarheit mindestens 0.8, 70 bis 500 Hz), Datei `vi/emergency.help__any__base.m4a`: Median 278 Hz. Dieselbe Datei mit `ffmpeg atempo=0.7` liegt bei 273.5 Hz, also 0.28 Halbtöne tiefer. `atempo=0.85` liegt bei 278.4 Hz, 0.02 Halbtöne. Ein Resample, das `playbackRate` 0.7 ohne Tonhöhenausgleich entspricht (`asetrate` auf 70 % und zurück auf 22050 Hz), fällt auf 193 Hz, 6.32 Halbtöne. Ein reines 0.7 wäre 6.17 Halbtöne. Die längere Datei `vi/food.recommend__any__ba.m4a` (118 stimmhafte Frames, Median 266 Hz) bleibt mit `atempo=0.7` bei 263.1 Hz (0.19 Halbtöne) und fällt beim Resample auf 185.7 Hz (6.22 Halbtöne). Sechs Halbtöne verbiegen sắc und huyền. Drei Zehntel nicht.

Die Stufen sind deshalb Dateien. Der Player setzt `playbackRate` nicht.

## Dateigrösse und Precache

Gemessen nach dem Erzeugen, AAC-LC, 48 kbit/s, mono, 22050 Hz, wie die bestehenden Dateien:

| Stufe | Dateien | Bytes |
| --- | --- | --- |
| 100 %, `*.m4a` | 549 | 4'974'567 |
| 85 %, `*.r85.m4a` | 549 | 5'736'970 |
| 70 %, `*.r70.m4a` | 549 | 6'801'318 |
| Summe 0.2.0 | 1'647 | 17'512'855 |

Version 0.1.0 hatte 100 % plus eine langsame Datei `atempo=0.8` (`*.slow.m4a`, 549 Dateien, 5'991'211 Bytes). Zusammen 10'965'778 Bytes. Die 0.8-Dateien sind ersetzt, nicht zusätzlich im Cache. Der Zuwachs ist 6'547'077 Bytes.

Opus bei 24 kbit/s war auf einer Stichprobe etwa halb so gross. Der Container bleibt m4a. Den spielt iOS heute ab, ohne ein neues Format im Precache.

Der Service Worker nimmt jede `m4a` aus `dist/` in den Precache (`workbox-build`, `globPatterns`). 17.5 MB Audio liegen unter der Grenze, die drei Stufen noch trägt. Eine vierte Stufe oder ein freies Tempo würde neue Dateien brauchen. Dann wäre die mittlere Stufe der erste Kandidat zum Streichen, nicht ein Schieberegler.

## Automatische Steigerung

Die Regel steht in `suggestedSpeed` (`src/audio/speed.ts`) und hat Tests. Eine Kette von «Gut»-Bewertungen wird nicht gespeichert. Die Funktion liest deshalb nur Zustand und Stabilität von FSRS:

- keine Karte, Neu, Lernen oder Wiederlernen: 70 %
- Wiederholen und Stabilität unter 21: 85 %
- Wiederholen und Stabilität ab 21: 100 %

Mit dem Standard-Planer, Behaltensrate 0.9 und ohne Zufall erreicht eine neue Karte die 21 am vierten «Gut». Nach einem «Nochmal» ist der Zustand Wiederlernen, also wieder 70 %, auch wenn die Stabilität noch hoch ist.

Die Hörübung benutzt dieselbe Funktion. Eine bekannte Karte wird bei «Automatisch» mit 100 % geprüft.

Die einzige Wahl sitzt am Player des Satzes: Automatisch, 70 %, 85 %, 100 %. Eine feste Stufe gilt für alles Audio, auch Üben und Zeigen, und bleibt in den lokalen Einstellungen, bis wieder «Automatisch» gewählt wird. Üben und Zeigen zeigen die Stufe als Text und haben keine zweite Schalterleiste. Die Tonhöhenkurve liest weiter die Datei mit 100 %, nicht eine gedehnte.

Ein Export aus 0.1.0 hat `slow` und kein `speed`. `slow: true` wird fest 85 %, die nähere Stufe zu `atempo=0.8`. `slow: false` und ein fehlendes `slow` sind der alte Standard und werden «Automatisch», damit die Steigerung an bleibt und sich von einer bewusst gewählten 100 % unterscheidet. Ein gesetztes `speed` gewinnt. Neue Installationen starten mit «Automatisch».

## Browserstimme

Wenn die gewünschte Datei fehlt, spricht `speechSynthesis`. `utterance.rate` ist dann die gewählte Stufe (0.7, 0.85 oder 1). Diese Stimme kann die Tonhöhe dabei verschieben. Sie ist der Ausweg, nicht die Qualität, und die Oberfläche sagt das.

## Stimmen und Lizenzen

Die Modelle liegen nicht im Repo. Erzeugt wurde nur das Audio, am 10. Oktober 2026, mit Piper aus dem Paket `piper-tts` (OHF-Voice, Engine GPL-3.0). Die Engine wird nicht mitgeliefert.

| Sprache | Stimme | Datensatz | Lizenz der Daten | Was ungeprüft bleibt |
| --- | --- | --- | --- | --- |
| Deutsch | `de_DE-thorsten-medium` | Thorsten-Voice | CC0 | Deutsch aus Deutschland, nicht Schweizerdeutsch. Qualität nicht geprüft. Die Modellkarte nennt ein Feintuning von lessac. |
| Portugiesisch (Brasilien) | `pt_BR-faber-medium` | Faber über OHF-Voice | CC0 | Qualität nicht geprüft. Geschlecht steht nicht in der Modellkarte. Ebenfalls Feintuning von lessac. |
| Englisch | `en_US-ljspeech-medium` | LJ Speech | gemeinfrei, von Grund auf trainiert | Englisch (USA), eine Sprecherin. Qualität nicht geprüft. |
| Vietnamesisch | `vi_VN-vais1000-medium` | VAIS-1000 | CC BY 4.0 | **Nördlicher Akzent, eine Sprecherin.** Keine südliche Stimme. Die Modellkarte sagt: Feintuning von lessac (medium). Töne und Qualität nicht geprüft. |

Namensnennung für VAIS-1000 steht in `public/audio/NOTICE.txt` und hier. Quelle der Lizenz: Modellkarte bei Hugging Face (`rhasspy/piper-voices`, Tag `v1.0.0`) und die Beschreibung von VAIS-1000 (IEEE DataPort, nördlicher Akzent).

lessac (Blizzard 2013, Lessac Technologies) ist laut der Upstream-Lizenz nur für Research Purposes da: https://www.cstr.ed.ac.uk/projects/blizzard/2013/lessac_blizzard2013/license.html. Kommerzielle Sprachsynthese ist dort ausgeschlossen. Deutsch, Portugiesisch und Vietnamesisch sind davon feinjustiert. Englisch ist von Grund auf trainiert. lessac selbst wird nicht als Stimme verwendet. Im Repo liegt nur das erzeugte Audio, nicht die Gewichte. Das ist ein offener rechtlicher Vorbehalt, kein Freibrief.

Nicht verwendet:

- `vi_VN-25hours_single`: Lizenz unbekannt.
- `vi_VN-vivos`: CC BY-NC-SA, Qualität `x_low`. Ein Labor in Ho-Chi-Minh-Stadt trainiert die Stimme, der Akzent ist aber nicht als südlich dokumentiert. Non-Commercial passt nicht in ein öffentliches Repo.
- Ryan: CC BY-NC-SA.
- LibriTTS high: CC BY, mehrere Sprecher, zu gross für diese Version.

## Süd und Nord

Eine frei weitergebbare Piper-Stimme mit südlichem Akzent gibt es in dieser Auswahl nicht. Die App spricht vietnamesische Sätze deshalb mit der nördlichen Stimme, auch wenn der Text die südliche Variante ist (`đậu phộng`, `Dạ`, `ba`, `chén`). Die Oberfläche sagt das an der Stelle, nicht nur in dieser Datei.

Die Tonhöhenkurve vergleicht die eigene Aufnahme mit genau dieser nördlichen Datei. Eine Abweichung kann an der Stimme liegen. Das Schema der fünf südlichen Töne in der Übung ist eine Zeichnung, keine Aufnahme.

## Dateinamen

`{sprache}/{konzept}__{south|north|any}__{variante}.m4a`

70 % hängt `.r70` vor `.m4a`, 85 % hängt `.r85` davor. `public/audio/manifest.json` listet die Dateien. Die App baut die Adresse nur aus diesem Muster und nur, wenn der Name in der Liste steht.

Neu erzeugen, ohne die Modelle ins Repo zu legen:

```bash
npm run export-speech
python3 tools/generate_audio.py de /pfad/zu/den/modellen
python3 tools/generate_audio.py en /pfad/zu/den/modellen
python3 tools/generate_audio.py pt-BR /pfad/zu/den/modellen
python3 tools/generate_audio.py vi /pfad/zu/den/modellen
```

Die Modelle heissen `de_DE-thorsten-medium.onnx`, `en_US-ljspeech-medium.onnx`, `pt_BR-faber-medium.onnx` und `vi_VN-vais1000-medium.onnx`, jeweils mit der passenden `.onnx.json`.
