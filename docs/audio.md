# Audio in Travel Talk 0.1.0

Stand: 10. Oktober 2026.

## Entscheidung

Version 0.1.0 speichert **vorerzeugte Audiodateien** im Repo und spielt sie offline ab. Das ist Option 1 aus der Technik-Empfehlung. Azure und jede andere Stimme mit Konto, Schlüssel oder Kreditkarte sind nicht dabei.

Wenn eine Datei fehlt, spricht der Browser über `speechSynthesis`. Die Rate bleibt 1. Eine tiefere Rate würde vietnamesische Töne verschieben. Diese Browserstimme ist nur der Ausweg, nicht die gewählte Qualität.

Langsame Dateien heissen `*.slow.m4a`. Sie entstehen mit `ffmpeg` und `atempo=0.8`, also ohne die Tonhöhe zu ändern. `playbackRate` am Audio-Element wird nicht benutzt.

## Stimmen und Lizenzen

Die Modelle liegen nicht im Repo. Erzeugt wurde nur das Audio, am 10. Oktober 2026, mit Piper aus dem Paket `piper-tts` (OHF-Voice, Engine GPL-3.0). Die Engine wird nicht mitgeliefert.

| Sprache | Stimme | Datensatz | Lizenz der Daten | Was ungeprüft bleibt |
| --- | --- | --- | --- | --- |
| Deutsch | `de_DE-thorsten-medium` | Thorsten-Voice | CC0 | Deutsch aus Deutschland, nicht Schweizerdeutsch. Qualität nicht geprüft. Die Modellkarte nennt ein Feintuning von lessac. |
| Portugiesisch (Brasilien) | `pt_BR-faber-medium` | Faber über OHF-Voice | CC0 | Qualität nicht geprüft. Geschlecht steht nicht in der Modellkarte. Ebenfalls Feintuning von lessac. |
| Englisch | `en_US-ljspeech-medium` | LJ Speech | gemeinfrei, von Grund auf trainiert | Englisch (USA), eine Sprecherin. Qualität nicht geprüft. |
| Vietnamesisch | `vi_VN-vais1000-medium` | VAIS-1000 | CC BY 4.0 | **Nördlicher Akzent, eine Sprecherin.** Keine südliche Stimme. Töne und Qualität nicht geprüft. |

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

Die langsamen Dateien hängen `.slow` vor `.m4a`. `public/audio/manifest.json` listet die Dateien. Die App baut die Adresse nur aus diesem Muster und nur, wenn der Name in der Liste steht.

Neu erzeugen, ohne die Modelle ins Repo zu legen:

```bash
npm run export-speech
python3 tools/generate_audio.py de /pfad/zu/den/modellen
python3 tools/generate_audio.py en /pfad/zu/den/modellen
python3 tools/generate_audio.py pt-BR /pfad/zu/den/modellen
python3 tools/generate_audio.py vi /pfad/zu/den/modellen
```

Die Modelle heissen `de_DE-thorsten-medium.onnx`, `en_US-ljspeech-medium.onnx`, `pt_BR-faber-medium.onnx` und `vi_VN-vais1000-medium.onnx`, jeweils mit der passenden `.onnx.json`.
