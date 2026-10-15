# Audio in Travel Talk

Stand: 11. Oktober 2026. Dateien, Lizenzen und die drei Tempostufen sind die von 0.2.0. Ab 0.3.0 spielt die Sitzung 70 % und 100 % als zwei Schritte. Die fünf festen Tonbögen sind aus der Oberfläche.

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

Bis 0.3.1 nahm der Service Worker jede `m4a` aus `dist/` in den Precache (`workbox-build`, `globPatterns`). Ab 0.4.0 liegen die Audiodateien nicht mehr im Precache. 17.5 MB Audio lagen unter der Grenze, die drei Stufen noch trägt. Eine vierte Stufe oder ein freies Tempo würde neue Dateien brauchen. Dann wäre die mittlere Stufe der erste Kandidat zum Streichen, nicht ein Schieberegler.

## Automatische Steigerung

Die Regel steht in `suggestedSpeed` (`src/audio/speed.ts`) und hat Tests. Eine Kette von «Gut»-Bewertungen wird nicht gespeichert. Die Funktion liest deshalb nur Zustand und Stabilität von FSRS:

- keine Karte, Neu, Lernen oder Wiederlernen: 70 %
- Wiederholen und Stabilität unter 21: 85 %
- Wiederholen und Stabilität ab 21: 100 %

Mit dem Standard-Planer, Behaltensrate 0.9 und ohne Zufall erreicht eine neue Karte die 21 am vierten «Gut». Nach einem «Nochmal» ist der Zustand Wiederlernen, also wieder 70 %, auch wenn die Stabilität noch hoch ist.

Die Satzseite benutzt dieselbe Funktion. Eine bekannte Karte wird bei «Automatisch» mit 100 % abgespielt. Die Sitzung seit 0.3.0 spielt einen neuen Satz erst mit 70 % und dann mit 100 %, als zwei Schritte, nicht über diesen Regler.

Die einzige Wahl sitzt am Player des Satzes: Automatisch, 70 %, 85 %, 100 %. Eine feste Stufe gilt für alles Audio, auch Üben und Zeigen, und bleibt in den lokalen Einstellungen, bis wieder «Automatisch» gewählt wird. Üben und Zeigen zeigen die Stufe als Text und haben keine zweite Schalterleiste. Die Tonhöhenkurve liest weiter die Datei mit 100 %, nicht eine gedehnte.

Ein Export aus 0.1.0 hat `slow` und kein `speed`. `slow: true` wird fest 85 %, die nähere Stufe zu `atempo=0.8`. `slow: false` und ein fehlendes `slow` sind der alte Standard und werden «Automatisch», damit die Steigerung an bleibt und sich von einer bewusst gewählten 100 % unterscheidet. Ein gesetztes `speed` gewinnt. Neue Installationen starten mit «Automatisch».

## Keine Browserstimme für Sätze

Fehlt die Datei eines Satzes oder Wortes, oder ist sie offline nicht geladen, spielt die App sie nicht. Die Oberfläche sagt «Stimme offline nicht geladen». `speechSynthesis` spricht keine Lernsätze.

Erklärungen hinter dem Info-Knopf sind eine Ausnahme, ab 0.9.4. «Vorlesen» spielt zuerst eine vorerzeugte Piper-Datei der App-Sprache, `public/audio/{sprache}/help/{id}__any__base.m4a`, Stimme thorsten-high, joe, cadu oder vivos-22, nur 100 %. Eine neu gesprochene Hilfedatei trägt `.vN` vor `.m4a`, zum Beispiel `vi/help/ui.show__any__base.v2.m4a`, weil `travel-talk-help` CacheFirst ist und den Dateinamen als Schlüssel nimmt. Die Datei steht in `manifest.json` und passt auf `AUDIO_FILE`. Die Hilfedateien liegen nicht im Precache. Der Service Worker holt sie bei Bedarf in den eigenen Cache `travel-talk-help` (CacheFirst, höchstens 200 Einträge, eine App-Sprache). «Für offline laden» speichert dieselben Dateien dort, nur für die App-Sprache, und zählt sie nicht zur Stimme. `tools/help_audio.py` speichert den SHA-256 des Textes in `tools/help_text_hashes.json`. Eine vorhandene Datei wird nur übersprungen, wenn der Hash zum heutigen Text passt. Fehlt die Datei, oder gibt `playClip` `offline` zurück, spricht `speechSynthesis` denselben Absatz in der App-Sprache (`de-CH`, `en-US`, `pt-BR`, `vi`). Bricht die Wiedergabe ab, pausiert sie, oder startet anderes Audio, geht der Knopf von «Stopp» zurück auf «Vorlesen» und der nächste Absatz startet nicht. Es geht kein Text an einen Dienst. Die langen Kulturartikel auf der eigenen Seite bleiben sichtbar und haben keine eigene Datei.

## Offline laden

Jede Stimme hat «Für offline laden». Der Fortschritt zählt die Audiodateien und die Zeitdateien dieser Stimme. Die vietnamesische Standardstimme hat 936 Dateien, 717 Audio und 219 Zeiten. Der Stand bleibt nach einem Neuladen stehen. «offline bereit» heisst, alle diese Dateien liegen im Cache `travel-talk-audio`. Ein Netzfehler behält den bisherigen Stand und bietet «Erneut versuchen». Eine fehlende Datei (404) hält die übrige Stimme nicht auf. Danach steht da, wie viele Dateien fehlen. Ist der Speicher voll, bleiben «Erneut versuchen» und «Bisherige Stimme behalten». Der zweite Knopf entfernt nur die Dateien dieses Versuchs und lässt die Nachbarstimme ihren Stand neu lesen. Ein Update löscht alte Audiodateien aus dem Precache. Die App kopiert sie nicht. Das Installieren fasst das Satz-Audio und die Hilfedateien nicht an, damit wenig Speicher das Update nicht aufhält. Hilfedateien kommen erst zur Laufzeit oder über «Für offline laden», und nur für die App-Sprache. Danach sagt die Startseite «Für offline noch nicht vollständig geladen», nur für die Lernsprache und nur, solange deren Audio nicht vollständig im Cache liegt. Andere Stimmen derselben Sprache fallen erst weg, wenn die neue vollständig geladen ist. Gespeichert wird nur HTTP 200. Der Cache fasst 12000 Einträge, mit Abstand über den 9888 Dateien, 7836 Audio und 2052 Zeiten. Eine fehlende Zeitdatei zählt wie eine fehlende Audiodatei. Wird eine andere Stimme gelöscht, gehen ihre Zeitdateien mit.

## Stimmen und Lizenzen

Die Modelle liegen nicht im Repo. Erzeugt wurde nur das Audio, mit Piper aus dem Paket `piper-tts` (OHF-Voice, Engine GPL-3.0). Die Engine wird nicht mitgeliefert. Die Dateien von 0.2.0 stammen vom 10. Oktober 2026. Die zusätzlichen Stimmen von 0.4.0 stammen vom 11. Oktober 2026.

Die App ist für den nicht kommerziellen Gebrauch in der Familie. CC BY-NC und CC BY-NC-SA sind dafür in Ordnung. ShareAlike gilt auch für das erzeugte Audio: vivos-Dateien stehen unter CC BY-NC-SA 4.0.

Eine spätere bezahlte Stimme ist ein weiterer Eintrag in `src/audio/voices.ts` (`provider: 'azure'`, `bundled: false`). Sie erscheint erst in der Wahl, wenn `bundled` wahr ist. Es gibt kein Konto und keinen Schlüssel in dieser Version.

| Sprache | Id | Modell | Datensatz | Lizenz | Was die Karte sagt |
| --- | --- | --- | --- | --- | --- |
| Deutsch | `thorsten-high` | `de_DE-thorsten-high` | Thorsten-Voice, Datensatz CC0 | Stimme nicht CC0. Von lessac (high) feinjustiert, lessac nur Forschung. | Eine Stimme, hohe Qualität. Die Karte nennt das Geschlecht nicht. Der Datensatz ist die Stimme von Thorsten Müller, die Synthese liegt bei etwa 127 Hz. Standard für neue Nutzer. |
| Deutsch | `thorsten` | `de_DE-thorsten-medium` | Thorsten-Voice, Datensatz CC0 | Stimme nicht CC0. Von lessac feinjustiert. | Dieselbe Stimme, mittlere Qualität. Das sind die Dateien von vor 0.4.0. |
| Deutsch | `mls-4576` | `de_DE-mls-medium`, Piper-Id 153 | Multilingual LibriSpeech, OpenSLR 94 | CC BY 4.0. Von Grund auf trainiert. | Eine Sprecherin, mittlere Qualität, 22050 Hz. Die Karte nennt das Geschlecht nicht. Optional, nicht der Standard. LICENSE im Ordner. |
| Portugiesisch (Brasilien) | `cadu` | `pt_BR-cadu-medium` | OHF-Voice, Datensatz CC0 | Stimme nicht CC0. Von lessac (medium) feinjustiert. | Die Karte nennt das Geschlecht nicht. Die veröffentlichte Hörprobe liegt bei etwa 143 Hz, die Synthese bei etwa 119 Hz. Standard für neue Nutzer. |
| Portugiesisch (Brasilien) | `faber` | `pt_BR-faber-medium` | OHF-Voice, Datensatz CC0 | Stimme nicht CC0. Von lessac (medium) feinjustiert. | Die Karte nennt das Geschlecht nicht. Die Datensatzbeschreibung Faber 1.0 nennt einen männlichen Sprecher (https://mozilladatacollective.com/datasets/cmiupazq801ftnv079bo1zu4h). Dieselbe Seite sagt im Demografie-Absatz, Alter und Geschlecht seien nicht angegeben; die App folgt nur der Zeile «male speaker», und etwa 202 Hz ist keine Bestimmung des Geschlechts. |
| Portugiesisch (Brasilien) | `daisy-studious` | XTTS-v2, Sprecherin Daisy Studious | Coqui XTTS-v2 | Coqui Public Model License 1.0.0, nur nicht kommerziell | Frau. Sprache der Synthese `pt`. Nicht der Standard. |
| Portugiesisch (Brasilien) | `gracie-wise` | XTTS-v2, Sprecherin Gracie Wise | Coqui XTTS-v2 | CPML, nur nicht kommerziell | Frau. Sprache `pt`. |
| Portugiesisch (Brasilien) | `tammie-ema` | XTTS-v2, Sprecherin Tammie Ema | Coqui XTTS-v2 | CPML, nur nicht kommerziell | Frau. Sprache `pt`. |
| Portugiesisch (Brasilien) | `claribel-dervla` | XTTS-v2, Sprecherin Claribel Dervla | Coqui XTTS-v2 | CPML, nur nicht kommerziell | Frau, Versuch. Sprache `pt`. Nicht der Standard. |
| Englisch | `joe` | `en_US-joe-medium` | OHF-Voice, Datensatz CC0 | Stimme nicht CC0. Von lessac (medium) feinjustiert. | Die Karte nennt das Geschlecht nicht. Die Hörprobe liegt bei etwa 110 Hz, die Synthese bei etwa 99 Hz. Standard für neue Nutzer. |
| Englisch | `ljspeech` | `en_US-ljspeech-medium` | LJ Speech | gemeinfrei | Eine Sprecherin, von Grund auf trainiert. |
| Vietnamesisch | `vivos-22` | `vi_VN-vivos-x_low`, Sprecher 9 (`VIVOSSPK22`) | VIVOS, InfoRe / AILAB HCMUS | CC BY-NC-SA 4.0, Material verändert, von Grund auf | 65 Sprecher, 16 kHz, `x_low`. Die Karte nennt weder Geschlecht noch Akzent. Median der Grundfrequenz dieser Synthese etwa 148 Hz. Standard für neue Nutzer. LICENSE im Ordner. |
| Vietnamesisch | `vivos-32` | derselbe, Sprecher 37 (`VIVOSSPK32`) | VIVOS | CC BY-NC-SA 4.0, Material verändert | Median etwa 145 Hz. Zweite Männerstimme. LICENSE im Ordner. |
| Vietnamesisch | `vais1000` | `vi_VN-vais1000-medium` | VAIS-1000, Datensatz CC BY 4.0 | Datensatz CC BY 4.0. Modell von lessac. Material verändert. | Nördlicher Akzent, eine Sprecherin. |

`en_US-ryan` ist CC BY-NC-SA und wurde nicht genommen. `en_GB-alan` verweist die Lizenz nur auf eine URL, ohne eine freie Lizenz auf der Karte. `pt_BR-jeff` (`pt_BR-jeff-medium`) hat einen CC0-Datensatz, das Modell ist von lessac feinjustiert und nach der Tonhöhe männlich (Hörprobe etwa 151 Hz). Für den Melodievergleich wurde es geprüft und nicht mitgeliefert: die Basis ist dieselbe unklare lessac-Lizenz. `pt_BR-edresson-low` nennt den Datensatz TTS-Portuguese-Corpus unter CC BY 4.0 (https://github.com/Edresson/TTS-Portuguese-Corpus) und ist laut Modellkarte von der Ryan-Stimme (low) feinjustiert. `en_US-ryan` ist CC BY-NC-SA, deshalb bleibt edresson draussen. Der Vergleich in der App nimmt nur die vorhandenen Dateien von cadu und faber. lessac bleibt draussen: die Upstream-Lizenz ist nur Research Purposes, https://www.cstr.ed.ac.uk/projects/blizzard/2013/lessac_blizzard2013/license.html. Die Gewichte liegen nicht im Repo. thorsten, cadu, joe, faber und vais1000 sind laut Karte von lessac feinjustiert. Diese Stimmen sind nicht CC0. CC0 nennt nur den Datensatz. vivos ist von Grund auf trainiert, das erzeugte Audio steht unter CC BY-NC-SA 4.0, https://creativecommons.org/licenses/by-nc-sa/4.0/. vais1000 nennt den Datensatz unter CC BY 4.0, https://creativecommons.org/licenses/by/4.0/. Das Material wurde verändert. LJSpeech ist gemeinfrei und von Grund auf trainiert. Die Hörproben unter `docs/samples/` haben eine eigene Lizenznotiz. In der App spielt «Hörprobe» bei einer Piper-Stimme `voice.sample__any__base.m4a`, nur im normalen Tempo: Deutsch «Hallo, ich heisse Anna. Ich komme aus der Schweiz.», Englisch «Hello, my name is Anna. I am from Switzerland.», Portugiesisch «Olá, eu me chamo Anna. Eu sou da Suíça.», Vietnamesisch «Xin chào, tôi tên là Anna. Tôi đến từ Thụy Sĩ.» Keine `.r70`- und keine `.r85`-Kopie. Die vier XTTS-Stimmen behalten die Satzprobe «Hilfe!». Ihre Lizenz ist nur nicht kommerziell, deshalb kommt keine neue Datei dazu. «Für offline laden» holt die Piper-Hörprobe mit der Stimme.

Die Wortzeiten liegen neben der normalen Datei als `*.align.json`, eine Datei pro Clip und Stimme. Piper 1.8.0 kann die Phonemlängen aus dem Modell lesen, wenn die Laufzeit mit `include_alignments` geladen wird. Die ausgelieferten Dateien sind mit dem üblichen Dauer-Rauschen erzeugt. Ein zweiter Lauf mit demselben Rauschen trifft die Datei nicht. Das Skript `tools/align_clips.py` synthetisiert deshalb eine stille Referenz (`noise_scale` 0, `noise_w_scale` 0) und legt die Phonemgrenzen mit bandförmiger dynamischer Zeitverzerrung auf die vorhandene `m4a`. Unbekannte Phoneme bei vivos, etwa `6` und `̪`, bekommen keine Samples, statt den Clip zu verwerfen. Montreal Forced Aligner ist in dieser Umgebung nicht installiert. Passt die Zahl der Wörter nicht, ist das Längenverhältnis unplausibel oder klebt der Pfad am Band, wird keine JSON geschrieben. Die App markiert dann nichts. 70 % und 85 % benutzen dieselben Zeiten, geteilt durch 0.7 oder 0.85, weil `atempo` die ganze Datei gleich streckt. Die JSON gehört nicht zum Precache. «Für offline laden» holt die vorhandenen Zeitdateien der Stimme mit. Vor `JSON.parse` gilt eine Grenze von 16 KB. Sie gilt für den `Content-Length` und für die gelesene Länge, und eine grössere Datei wird verworfen, bevor sie als JSON gelesen wird. Der Name muss in `manifest.json` stehen. Das letzte Wort darf höchstens 0,1 Sekunden nach der Audiodauer enden, multipliziert mit dem Tempofaktor. Bei 100 % sind das 0,1 s, bei 70 % etwa 0,14 s. Nachschlagen lädt die Zeiten der Datei, die gerade spielt. Von 1297 Clips haben 1254 eine Zeitdatei. 43 haben keine: 38 englische Dateien, bei denen espeak «I am» und ähnliche Folgen zu einer Phonemgruppe zusammenzieht, dazu «Es ist sehr laut.» auf beiden deutschen Stimmen und fünf kurze vivos-32-Clips. Dort gibt es keine Markierung. Ein Energie-Dip in einem Fenster von ±80 ms liegt im Median 40 ms und beim 90.-Perzentil 70 ms von der gesetzten Grenze. Das ist kein Fehler gegen eine von Hand gesetzte Grenze. Die Referenz ist im Median etwa 7 % kürzer als die ausgelieferte Datei, weil die Datei mit Dauer-Rauschen erzeugt wurde und die Referenz ohne.

Kurze Hörproben derselben Sätze liegen unter `docs/samples/`: `vi-mann-1-erdnuss.mp3`, `vi-mann-2-erdnuss.mp3`, `de-mann-erdnuss.mp3`, `de-frau-erdnuss.mp3`, `pt-mann-erdnuss.mp3`.

## Süd und Nord

Die Modellkarte von vivos dokumentiert den Akzent nicht. Die Phonemkette von espeak ist für alle 65 Sprecher dieselbe, und zwei Zeichen daraus (`̪` und `6`) fehlen in der Karte des Modells, sie fallen weg. An den Proben ist nicht zu hören, ob ein Sprecher südlich oder nördlich ist. Der Korpus VIVOS wird an anderer Stelle als südliches Vietnamesisch beschrieben (Montreal Forced Aligner, Labor in Ho-Chi-Minh-Stadt). Das steht nicht auf der Piper-Karte, und die Qualität `x_low` trägt ein solches Urteil nicht. Die Oberfläche sagt deshalb nicht «Süden». Die Frau bleibt «Frau (Norden)», weil VAIS-1000 den nördlichen Akzent nennt.

Die Qualität der Männerstimmen ist niedrig: 16 kHz, fehlende Phoneme, brummig. Sie sind eine Wahl, keine geprüfte Aussprache. Die Tonhöhenkurve vergleicht die eigene Aufnahme mit der gerade gewählten Datei.

Wird der Tab versteckt oder die Seite geschlossen, stoppt die Aufnahme und das Mikrofon wird freigegeben, auf der Satzseite und im Schritt Nachsprechen. «Weiter» ist gesperrt, solange das Mikrofon in der Sitzung noch startet. Ein Start, der erst danach fertig wird, gibt die Tracks sofort frei.

Wird der Tab versteckt oder die Seite geschlossen, stoppt die Aufnahme und das Mikrofon wird freigegeben, auf der Satzseite und im Schritt Nachsprechen. «Weiter» ist gesperrt, solange das Mikrofon in der Sitzung noch startet. Ein Start, der erst danach fertig wird, gibt die Tracks sofort frei.

## Dateinamen

`{sprache}/{konzept}__{south|north|any}__{variante}.m4a`

Eine Stimme aus 0.4.0 legt ihren Ordner dazwischen: `{sprache}/{stimme}/{konzept}__{south|north|any}__{variante}.m4a`. Die Stimme von vor 0.4.0 bleibt ohne diesen Ordner. 70 % hängt `.r70` vor `.m4a`, 85 % hängt `.r85` davor. `public/audio/manifest.json` listet die Audiodateien und die Zeitdateien. Die App nimmt einen Namen nur, wenn er einem der beiden Muster entspricht und in der Liste steht. Die Zeitdatei heisst wie der Clip, mit `.align.json` statt `.m4a`. 70 % und 85 % haben keine eigene Zeitdatei. Ein Wortclip heisst `{sprache}/{stimme}/w.water__any__base.m4a`, bei `w.yes` auf Vietnamesisch `__south__` oder `__north__`. Er liegt bei den Männerstimmen, bei mls-4576 und bei den vier XTTS-Frauen. Eine Zeitdatei hat er nicht.

Die Hörprobe heisst `voice.sample__any__base.m4a`, im Stimmordner oder, bei der Stimme von vor 0.4.0, direkt unter der Sprache. Sie ist kein Satz aus dem Katalog. Es gibt nur die Basisdatei. Die XTTS-Stimmen haben diese Datei nicht.

Der Service Worker legt Audiodateien und Zeitdateien nicht in den Precache. Er speichert beide mit HTTP 200, wenn sie abgerufen werden, höchstens 12000 Einträge. Die App lädt eine Stimme, einschliesslich ihrer Zeitdateien, erst auf «Für offline laden». Andere Stimmen derselben Sprache löscht sie erst nach dem vollständigen Laden, die Zeitdateien mit.

Neu erzeugen, ohne die Modelle ins Repo zu legen:

```bash
npm run export-speech
python3 tools/generate_audio.py de /pfad/zu/den/modellen
python3 tools/generate_audio.py en /pfad/zu/den/modellen
python3 tools/generate_audio.py pt-BR /pfad/zu/den/modellen
python3 tools/generate_audio.py vi /pfad/zu/den/modellen
python3 tools/generate_audio.py extra /pfad/zu/den/modellen
```

`extra` schreibt thorsten-high, joe, cadu, mls-4576 und die beiden vivos-Sprecher. Ein vierter Parameter wählt eine Stimme, zum Beispiel `extra /pfad/zu/den/modellen mls-4576`. Die Modelle heissen `de_DE-thorsten-high.onnx`, `en_US-joe-medium.onnx`, `pt_BR-cadu-medium.onnx`, `vi_VN-vivos-x_low.onnx` und `de_DE-mls-medium.onnx`, jeweils mit der passenden `.onnx.json`. Die älteren vier Modelle bleiben für die Dateien ohne Stimmordner. Das Skript verlangt `piper-tts` 1.8.0 und prüft die SHA-256, bevor es synthetisiert. Die Wortzeiten verlangen zusätzlich `onnx` 1.17.0. Die Synthese selbst läuft ohne dieses Paket. `onnx` steht nicht in `package.json`. Die Gewichte bleiben ausserhalb des Repos. Wörter für mls-4576: `python3 tools/generate_words.py /pfad/zu/den/modellen mls-4576`. Acht kurze Zitierformen dieser Stimme (`ich`, `ja`, `bitte`, `danke`, `hier`, `wo`, `Wasser`, `Gesuch`) wären allein etwa 0,2 s Rauschen. `tools/generate_words.py` schneidet sie aus einem Träger («Bitte schön.», «Danke schön.» und je ein kurzer Satz) und hängt bei Bedarf eine stille Ausleitung an, damit die Basisdatei über 0,3 s bleibt. `numpy` braucht nur dieses Skript, es steht nicht in `package.json`.

Die vier portugiesischen Frauenstimmen kommen nicht von Piper. `tools/generate_xtts.py` lädt Coqui XTTS-v2 ausserhalb des Repos, Revision `6c2b0d75eae4b7047358e3b6bd9325f857d43f77`, und prüft die SHA-256, darunter `model.pth` `c7ea20001c6a0a841c77e252d8409f6a74fb423e79b3206a0771ba5989776187`. Die Sprache ist `pt`. Die Sprecherinnen sind Daisy Studious, Gracie Wise, Tammie Ema und Claribel Dervla. Claribel ist ein Versuch. `SHIP_CLARIBEL` in `src/audio/voices.ts` nimmt sie aus der Wahl. `coqui-tts` ist auf 0.27.2 festgeschrieben und ist keine Abhängigkeit der App. Die Lizenz ist die Coqui Public Model License 1.0.0, nur nicht kommerziell. Der Text der Revision liegt unter https://huggingface.co/coqui/XTTS-v2/resolve/6c2b0d75eae4b7047358e3b6bd9325f857d43f77/LICENSE.txt und in `docs/samples/cpml.txt`. https://coqui.ai/cpml.txt antwortet mit 404. Dieselbe Encode-Kette schreibt Basis, `.r70.m4a` und `.r85.m4a`. `tools/align_clips.py` legt die Phonemuhr von cadu auf die Sätze. Gesprochen wird ohne Satzzeichen am Ende. `faster-whisper` small prüft die Basisdatei auf mitgesprochene Satzzeichen (`ponto`, `vírgula`, `interrogação`) und auf mehr Wörter als im Text. Die Dauergrenze `Wörter × 0,72 + 0,85` Sekunden plus 0,03 steht auch in `src/pitch/clip-plausible.ts`. Der Spracherkenner ist kein Teil der App. Die neunzehn Wörter aus 0.9.0 liegen in derselben Zitierform, je Basis, 70 % und 85 %, ohne Zeitdatei, wie die Piper-Wörter. Eine Datei unter 0,3 Sekunden, oder unter 0,45 Sekunden mit zu wenig stimmhaften Frames, wird verworfen. Das gilt für Sätze und Wörter. Der Standard bleibt cadu. Vier Stimmen ergeben 150 Sätze in drei Tempi, 1800 Satzdateien, und 228 Wortdateien. Nach diesen vier Stimmen hatte `manifest.json` 9278 Einträge, 7358 Audio und 1920 Zeiten.
