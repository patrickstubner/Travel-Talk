# Changelog

## 0.9.0 — 2026-10-12

- Vor den neuen Sätzen kommen höchstens sechs Wörter. Jedes Wort ist eine eigene Karte, zum Beispiel `de-vi:w.water`, pro Person. Wörter und Sätze teilen sich die 15 neuen Karten am Tag, über alle Richtungen. Wiederholungen bleiben vorn, höchstens acht. Ab 20 fälligen Karten gibt es keine neuen Wörter und keine neuen Sätze.
- Ein neues Wort: einmal langsam hören, die Schrift bleibt sichtbar, vier Bedeutungen in der App-Sprache. Richtig zählt als «Gut», falsch zeigt die Bedeutung und zählt als «Nochmal». Kein Mikrofon und kein Schreiben. Bei einer späteren Wiederholung kommen nach der richtigen Bedeutung die vier Abstände.
- Ein Satz geht erst auf, wenn jedes geprüfte Schlüsselwort mindestens einmal «Gut» oder «Leicht» war. Ein Satz ohne geprüftes Schlüsselwort ist sofort offen. Freie Satzplätze gehen zuerst an die Sätze, deren Wörter heute richtig waren. Fällige Sätze verbrauchen diese Plätze nicht. Die Wörter kommen aus den nächsten Sätzen, die noch ein Wort ohne Karte haben, auch wenn der Satz selbst noch zu ist. Füllwörter sind keine Schlüsselwörter. Die Startseite nennt das fehlende Wort und, solange die Sätze noch folgen, «bis zu N neue Sätze nach den Wörtern». Höchstens sechs neue Wörter am Tag, auch über mehrere Sitzungen.
- Geprüft sind die Handliste (ich, ja, bitte, danke, nicht, wo, hier, Wasser, Hilfe!) und die Visum-Gruppen (Tage, bleiben, Dokumente, E-Visum, Visum, verlängern, Gesuch, aktuell, Regel, Passfoto). «nein» ist keine eigene Karte: auf Portugiesisch und Vietnamesisch wäre es dieselbe Form wie «nicht». Zahlen sind noch nicht geprüft. Neunzehn Wörter, Piper-Zitierform der Männerstimmen, 70 %, 85 % und 100 %. 291 Dateien, Median 6254 Bytes, zusammen 2'038'931 Bytes. Eine ältere Stimme spielt das Wort mit der Standardstimme dieser Sprache.
- Die Sterne und die Spracherkennung kommen in einer späteren Fassung, 0.10.0 oder danach. Diese Fassung bewertet den gesprochenen Satz weiter nicht.

## 0.8.1 — 2026-10-12

- Im Zeigen-Modus sind Karten, Knöpfe, Chips, Karaoke-Wörter, Hinweise, Statusfelder und Details dunkel, mit heller Schrift. Das gilt auch für die obere Leiste und die Navigation. Der Text erreicht WCAG AA (4,5:1, grosse Schrift 3:1).
- Unter «Für die andere Person» steht, wozu Zeigen da ist: ein Satz gross auf dem Bildschirm, zum Hinhalt an jemand anderen, zum Beispiel im Notfall oder in der Apotheke, und das Audio lässt sich abspielen. Derselbe Satz steht auf Englisch, Portugiesisch (Brasilien) und Vietnamesisch.
- Kurve, Wortfarben und Balken aus 0.8.0 bleiben auf der Satzseite und in der Übung. Im Zeigen-Modus sind dieselben Flächen dunkel: Wort-Chips, Tonkacheln, Balken und die gezeichnete Kurve. Grün, gelb und rot bleiben unterscheidbar, und der Text bleibt bei WCAG AA.

## 0.8.0 — 2026-10-12

- Nach jeder Aufnahme, beim Nachsprechen in der Übung und auf der Satzseite, liegt die eigene Tonhöhe über der Kurve der gehörten Datei. Die Wörter stehen darunter. Grün, gelb oder rot ist das schlechtere von Melodie und Rhythmus. Zu wenig stimmhafte Frames im Modell bleiben ungefärbt.
- Diese Fassung zeigt keine Sterne und sagt nicht, ob der Satz der richtige war. Kurve, Wortfarben und die Balken für Melodie und Rhythmus bleiben. Die Sterne kommen mit der Spracherkennung in 0.10.0 oder danach. Die vier Bewertungen bleiben der Weg durch den Planer. Die Rückmeldung ändert den Lernstand nicht.
- Ein Tippen auf ein Wort spielt zuerst das Modell, dann die eigene Stelle. Beide laufen nicht zugleich. Im Detail hat Modell und Du je einen Knopf «Hören». «Nochmal» nimmt neu auf und ersetzt die Aufnahme. «Weiter» bleibt «Weiter» und gibt das Mikrofon frei.
- Zwei Balken, Melodie und Rhythmus. Keine Prozentzahl.
- Ein gleichmässig langsameres Nachsprechen färbt die Wörter nicht rot. Die lokale Dehnung bleibt etwa bei 0,75 bis 1,33. Der Rhythmusbalken folgt dem Tempo der ganzen Aufnahme gegen die Datei, die gerade gehört wurde, auch bei 70 % und 85 %.
- Die Balken bleiben leer, wenn weniger als etwa 60 % der bewertbaren Wörter eine Farbe haben. Der Text sagt dann nicht «passt». Eine Aufnahme ist «unklar», wenn sie deutlich flacher ist als die gehörte Datei, wenn sie rückwärts besser passt als vorwärts, oder wenn ein Dauerton auf eine gesprochene Lautstärke trifft. Eine kurze ebene Phrase gegen sich selbst bleibt klar. Eine einzelne gespiegelte Silbe bleibt eine Teilbewertung.
- Fehlen die Wortzeiten für die gehörte Stimme, steht das unter den Kurven. Die Klarheit der Tonhöhe liegt bei 0,6, damit die tiefe englische Stimme nicht an der Schwelle hängen bleibt. Die untere Grenze bleibt 70 Hz.
- `npm run test:clips` prüft die mitgelieferten Aufnahmen. Dafür braucht es ffmpeg. `npm test` nicht.
- Vietnamesisch kann einen Satz pro Silbe zeigen, etwa «Du bist gestiegen. Der Ton sollte fallen.» Im Süden bleiben hỏi und ngã ohne solchen Satz. Der Hinweis «Nördliche Stimme» erscheint nur bei der Stimme vais1000. Portugiesisch, Englisch und Deutsch haben keinen Tonhinweis.
- Zu wenig Stimme, eine Aufnahme unter 0,3 Sekunden oder eine unklare Zuordnung zeigen die Kurven ohne Farben. Fehlt die Zeitdatei oder passt sie nicht, bleiben die Farben weg. Die eigene Aufnahme wird linear auf die Modellzeit gelegt.
- Die Aufnahme stoppt von selbst nach etwa 15 Sekunden. Das Mikrofon wird mit Echounterdrückung gefragt, ohne Rauschunterdrückung und ohne automatische Lautstärke. Rauschunterdrückung und die automatische Lautstärke bleiben aus. Die Echounterdrückung bleibt an und hält den Lautsprecher draussen. Beim Start der Aufnahme stoppt die gehörte Datei, auch ein Wort aus der Rückmeldung. Die Rückmeldung ist während der Aufnahme weg. «Anhören» ist schon aus, während das Mikrofon noch startet. «Meine Aufnahme» ist während der Aufnahme aus. Läuft sie schon, stoppt sie und geht an den Anfang, sobald eine neue Aufnahme startet. Versteckt sich der Tab, während die Mikrofonfreigabe noch offen ist, sind die Knöpfe auf der Satzseite wieder frei. Tonhöhe und Klangfolge laufen in einem Worker, nach einem Heruntersampeln auf 16 kHz, damit die Seite dabei nicht stehen bleibt. Die Merkmale der gehörten Datei bleiben für die nächste Aufnahme im Speicher. Die Frequenzverschiebung läuft nur, wenn die Form noch nicht passt. Ein Satzwechsel verwirft die vorige Aufnahme. Die Samples bleiben nicht im Worker, nicht in IndexedDB und nicht im Netz.
- Ohne Mikrofon oder bei verweigerter Erlaubnis bleibt der bisherige Hinweis, und die Sitzung geht weiter. Die Aufnahme verlässt das Gerät nicht, steht nicht in IndexedDB und nicht im Export.
- In Transport heissen drei Zeilen neu: «Ich bin seekrank.», «Cho tôi một chiếc taxi.» und «phà ra đảo». Sân ga steht im Hinweis und im Gloss. Auf Portugiesisch steht VLT für Rio und die Baixada Santista, und für die Metro «estação». Die drei Sätze dazu sind Kontext, nicht gesprochener Text, deshalb gibt es dafür keine neuen Clips. Der Vietnam-Hinweis verlinkt das Công báo. «oder über die App» steht beim vereinbarten Preis. GrabCar wird nicht als Vertragswagen bezeichnet. Der Audio-Cache lässt 8000 Einträge, mit Abstand zur Manifestlänge.
- Die Klangfolge wird je Koeffizient auf Mittelwert und Streuung normiert, und die Mel-Filter werden in Schritten von 4 % bis etwa ±20 % verschoben. Liegt der Abstand über der Grenze der Sprache, bleiben die Balken leer. Das sagt nicht, ob der Satz der richtige war. Ein Wort, dessen gehörte Kurve sich bewegt, braucht dieselbe Richtung, sonst bleibt es höchstens gelb.
- «Keine Wortzeiten für diese Stimme.» erscheint erst, wenn die Zeitdatei fehlt. Solange sie noch lädt, bleibt der Satz weg.
- Die drei neu gesprochenen Zeilen (seekrank, Taxi, Fähre) heissen im Dateinamen `.v2`, samt 70 %, 85 % und den Zeitdateien. Ein Gerät, das die alten Namen aus 0.7.0 im Audio-Cache hat, verwirft genau diese 32 Einträge beim Start. Offline fehlen sie, bis die neuen Dateien geladen sind. Der Cache wird dafür nur einmal je Versionsmarke durchgesehen, nicht bei jedem Start.
- Nach dem Speichern zeigt das Namensfeld den bereinigten Namen. Fehlt die Person, sagt das Menü das. Scheitert das Hinzufügen, weil schon zehn Personen da sind, nennt es dieses Limit. Die Meldung über eine ungültige Exportdatei erscheint dabei nicht.

## 0.7.1 — 2026-10-12

- Tippt man den Namen, bevor der gespeicherte Stand ankommt, bleibt der getippte Text. «Weiter» speichert diesen Namen. Wechselt die aktive Person, übernimmt das Feld den Namen dieser Person.
- Ein leerer oder unsichtbarer Name sagt: «Der Name braucht ein sichtbares Zeichen.» Die Meldung über eine ungültige Exportdatei erscheint dabei nicht.

## 0.7.0 — 2026-10-11

- Neue Situation Transport, nach den bisherigen neun. Zwanzig kurze Sätze, vom kurzen zum längeren: Taxi und Ziel, Preis und Taxameter, Halt, Kennzeichen, Bestellung in der App, Ticket, Haltestelle, Aussteigen, Linie, Gleis, Dauer, Gate, Verspätung, verpasster Anschluss, Fähre und Übelkeit auf dem Schiff. Dieselben vier Sprachen und dieselben Stimmen wie bisher, mit 70 %, 85 % und 100 %, Wortzeiten wo die Zuordnung trägt, und der Wort-für-Wort-Gloss. Der Kann-Satz der Situation sagt, dass man nach Weg, Preis und Ticket fragen kann.
- Vier Kulturhinweise, ungeprüft wie die übrigen: Vietnam (Taxameter und App nach Nghị định 158/2024/NĐ-CP, Grab, Einzelticket der Hà Nội Metro), São Paulo und Brasilien (Taxameter nach dem Gemeindegesetz, 99 und Uber), ZVV (Ticket vor der Abfahrt, Schiff, Kurzstrecke), London (Pay as you go, antippen). Was nicht belegt ist, steht als «noch nicht geprüft». Philippinen, Paraguay, Thailand und Portugal als Land haben keinen eigenen Ländercode in den Hinweisen.
- Wer beide Sprachen wählt und die Seite verlässt, ohne «Weiter» zu tippen, hat trotzdem die Männerstimme als Standard. Der Hinweis auf Männerstimmen erscheint dann nicht.
- Ein Personenname im Import muss sichtbar sein. Ein unsichtbarer Name lehnt die ganze Datei ab. «Alle ersetzen» lässt niemanden aus. Ein ZWJ zwischen zwei Emoji bleibt im Namen. Ein Speichern für eine gerade gelöschte Person schreibt keine Zeile.

## 0.6.0 — 2026-10-11

- Mehrere Personen können auf einem Gerät lernen, bis zu zehn. Jede Person hat einen eigenen Namen, eine eigene App-Sprache, eine eigene Lernsprache, eine eigene Stimme und einen eigenen Lernstand. Geladene Stimmen und Audiodateien bleiben gemeinsam und werden nicht pro Person kopiert.
- Oben in der Mitte stehen immer die aktuelle Person und die gewählte Lernsprache, mit der Variante, wenn es eine gibt. Ein Tippen wechselt die Person oder die Lernsprache an dieser Stelle. Das ist der einzige Schalter für beides. Hinzufügen, Umbenennen und Löschen sitzen in demselben Menü. Löschen fragt nach und entfernt nur den Lernstand dieser Person.
- Ein bestehendes Gerät wird zur ersten Person. Karten, Notiz und Stimme bleiben. Der Name ist leer, bis er eingegeben ist. Exportformat 4 speichert eine Person oder alle Personen. Formate 1 bis 3 werden als eine Person gelesen und ersetzen die anderen nicht still. Alle Personen ersetzen braucht eine eigene Bestätigung. Eine abgelehnte Datei zeigt ihren Inhalt nicht.
- Wechselt eine Person die Stimme, bleibt eine Stimme, die eine andere Person noch benutzt. «Bisherige Stimme behalten» erscheint in den Einstellungen nur, wenn die vorige Stimme vollständig geladen ist.
- Während eine Datei spielt, bleiben ihre Wortzeiten, auch wenn das Tempo wechselt. Die Markierung folgt `requestAnimationFrame`. Eine fehlende Zeitdatei wird nicht für den Rest der Sitzung gemerkt. `onnx` 1.17.0 ist nur für das Erzeugen der Zeiten festgelegt, nicht als Abhängigkeit der App. Fehlt das Paket, endet das Skript mit einem Satz.
- Die Sprachwahl zu Beginn speichert jede Wahl sofort. «Weiter» wird frei, sobald beide Sprachen stehen, auch wenn die Lernsprache oben gewählt wird. Die Seite bleibt bis zu diesem Knopf, damit die Standardstimme gesetzt wird.
- Ein Personenwechsel setzt die offene Seite neu, stoppt laufendes Audio und schreibt den Lernstand auf die Person, die beim Tippen aktiv war.
- «Alle Personen ersetzen» sichert vorher alle Personen, sagt bei einer leeren Notiz, dass alle Notizen überschrieben werden, und fragt in einem zweiten Schritt nach. Ersetzen einer einzelnen Person benennt sie nicht um.
- Zehn Personen bleiben das Maximum, auch bei einem zweiten Klick. Ein Name braucht ein sichtbares Zeichen. In der Leiste steht er so, dass eine fremde Schreibrichtung den Rest nicht mitzieht. Im Zeigen-Modus steht der Name nicht oben.
- Eine Stimme, die nach dem Löschen niemand mehr benutzt, verlässt den Offline-Speicher. «Alle Personen exportieren» sagt, warum der Knopf aus ist, solange eine Person unvollständig ist. Die Texte nennen Stimmen und Audiodateien, nicht Bilder.

## 0.5.0 — 2026-10-11

- Während eine Stimme spielt, wird das gesprochene Wort markiert. Vietnamesisch läuft Silbe für Silbe, weil die Schrift die Silben mit Leerzeichen trennt. Unter der Zeile steht die andere Sprache Wort für Wort. Ein Tippen markiert die verbundenen Wörter auf beiden Seiten, auch wenn mehrere Wörter auf beiden Seiten zusammengehören. Die Zuordnung ist nicht geprüft. Das steht unter der Zeile.
- Die Markierung lässt sich in den Einstellungen abstellen, an derselben Stelle wie die Sprachen. Sie geht nicht in den Export. Fehlt eine Zeitdatei oder passt sie nicht zur Zeile, bleibt die Markierung aus.
- Die Zeiten kommen aus den Phonemlängen von Piper, mit `noise_scale` 0, und werden mit dynamischer Zeitverzerrung auf die vorhandene Datei gelegt. Montreal Forced Aligner ist hier nicht installiert. Eine Datei, deren Wörter nicht zur Aufnahme passen, bekommt keine Zeitdatei. 70 % und 85 % strecken dieselben Zeiten gleichmässig.
- «Für offline laden» holt die Zeitdateien der Stimme mit. Der Fortschritt zählt sie mit, bei der vietnamesischen Standardstimme 796 Dateien, 597 Audio und 199 Zeiten. Eine 404 zählt wie bei einer Audiodatei. Wird eine andere Stimme gelöscht, gehen ihre Zeitdateien mit. Sie bleiben aus dem Precache.
- Im Schritt Hören bleibt die Wortzuordnung verborgen, bis die Bedeutung gewählt ist. Eine Zeile mit einem Platzhalter, etwa `[tên]`, bleibt neben der gesprochenen Zeile sichtbar.
- Auf der Startseite erscheint «Bisherige Stimme behalten» nur, wenn eine andere Stimme dieser Sprache vollständig im Cache liegt. Der Knopf wählt diese Stimme.
- Eine Zeitdatei über 16 KB oder ein Name ausserhalb von `manifest.json` ergibt keine Markierung. Das letzte Wort darf höchstens 0,1 Sekunden nach der Audiodauer enden, multipliziert mit dem Tempofaktor. Beim Nachschlagen laden 70 % und 85 % die Zeiten der Datei, die gerade spielt.
- Die Startseite sagt «Für offline noch nicht vollständig geladen», solange die Lernsprache nicht vollständig im Cache liegt. Der Satz nennt kein Update, weil er auch bei einer neuen Installation stimmt.
- Die Prüfsummen gelten auch für die `.onnx.json`-Dateien und für die vier älteren Modelle.

## 0.4.0 — 2026-10-11

- Jede Lernsprache hat eine Stimmenwahl, an derselben Stelle wie die Sprachen. Eine neue Installation startet mit einer Männerstimme. Wer die App schon benutzt, behält die bisherige Stimme und sieht einmal den Hinweis, dass Männerstimmen da sind.
- Deutsch thorsten (hoch und mittel), Englisch joe, Portugiesisch cadu und faber: der Datensatz ist CC0, die Stimme nicht. Die Modelle sind von lessac feinjustiert, und lessac gilt nur für Forschung. LJSpeech bleibt gemeinfrei. Vietnamesisch: zwei Sprecher aus vivos (`x_low`, CC BY-NC-SA 4.0, das Material ist verändert), zusätzlich zu vais1000 (Datensatz CC BY 4.0, ebenfalls verändert). Der Akzent der Männerstimmen ist nicht dokumentiert, die Qualität ist niedrig. Links auf die beiden Creative-Commons-Lizenzen stehen in der App und in NOTICE.txt. In beiden vivos-Ordnern liegt eine LICENSE. Die Hörproben haben eine Lizenznotiz.
- Langsam und normal bleiben eigene Dateien (`ffmpeg atempo`), mit derselben Lautstärke-Normalisierung. Piper liefert für diese Modelle keine Wortzeiten. Es gibt keine Zeitstempel-Dateien. `piper-tts` 1.8.0 und die Prüfsummen der vier Modelle stehen im Erzeugungsskript.
- Jede Stimme hat «Für offline laden», mit Fortschritt, «offline bereit», einem erneuten Versuch und einem Hinweis, wenn der Speicher voll ist. Ein Update löscht alte Audiodateien aus dem Precache. Die App kopiert sie nicht, damit wenig Speicher das Update nicht blockiert. Danach ist man online. Die Startseite sagt «Offline-Audio nach dem Update neu laden» für die Lernsprache, solange deren Audio nicht vollständig im Cache liegt. Ein Tippen holt die Stimme neu. Eine 404 lässt die übrige Stimme durch und sagt, wie viele Dateien fehlen. «Speicher voll» bietet «Erneut versuchen» und «Bisherige Stimme behalten». Der Fortschritt bleibt nach einem Neuladen sichtbar. Ein fehlender Satz sagt «Stimme offline nicht geladen». Es gibt keine Browserstimme.
- Ein Import ohne Stimmenfeld behält die Stimme auf dem Gerät. Eine unbekannte Stimmen-ID wird weggelassen. Nach dem vollständigen Laden löscht der Cache die anderen Stimmen dieser Sprache. Gespeichert wird nur Status 200. Der Cache fasst alle Audiodateien.
- Ein `due` später als `last_review` (oder jetzt) plus 36'500 Tage wird gekürzt, beim Import, beim Lesen aus IndexedDB und bei der Bewertung. `exportedAt` muss ein ISO-Zeitstempel sein. Eine Karte, die beim Lesen ersetzt wird, kann auf der Startseite als «n Karten zurückgesetzt» erscheinen.

## 0.3.1 — 2026-10-11

- Ein `last_review` kurz nach dem Export bleibt in der Datei. Er wird auf den früheren Zeitpunkt von Lernzeit, Export und jetzt gekürzt. Liegt `exportedAt` mehr als einen Tag in der Zukunft, gibt es einen eigenen Satz, die Datei wird nicht importiert.
- Eine Bewertung einer Karte mit `last_review` in der Zukunft speichert den Lernzeitpunkt als jetzt. Die Karte verschwindet nicht für Jahre.
- Karten aus IndexedDB laufen durch dasselbe Schema wie der Import. Eine ungültige Karte, etwa `stability` NaN oder ein kaputter `difficulty`- oder `state`-Wert, wird eine neue Karte und in derselben Fehlerbehandlung gespeichert. Der Planer setzt eine unleserliche Karte auf neu, nicht einen Tag weiter.

## 0.3.0 — 2026-10-11

- Sprache der App und Lernsprache sind getrennt. Dieselbe Wahl steht zu Beginn und in den Einstellungen. Die feste Paarliste und der Schalter für die Oberflächensprache sind weg. Alle zwölf Richtungen laufen aus den vorhandenen Sätzen. Fehlt eine Zeile, wird sie ausgelassen.
- Heute lernen ist eine kurze Sitzung: fällige Wiederholungen und wenige neue Sätze. Unbekannte Sätze sind nicht fällig. Höchstens 15 neue Sätze am Tag, über alle Richtungen zusammen. In einer Sitzung etwa vier, weniger wenn viele Wiederholungen warten.
- Jeder neue Satz: langsam hören, normales Tempo, nachsprechen, Bedeutung wählen, selbst sagen, dann vier Abstände vom Planer. Die Schrift der Lernsprache bleibt bei einem neuen Satz sichtbar und kommt nach der Antwort wieder, wenn sie verdeckt war. Tippen ist nicht Teil des Wegs.
- Am Ende stehen die Anzahl, ein Satz aus der Situation und was morgen kommt. Keine Punkte.
- Die fünf festen Tonbögen sind von der Satzseite weg. Die Tonhöhenkurve kommt nur nach einer Aufnahme. Eine Stimme pro Sprache, ehrlich benannt. Ein optionales `voices`-Feld bleibt für eine spätere Wahl.
- Exportformat 3 speichert `appLang` und `targetLang`. `pairId` und `uiLang` sind keine Felder mehr. Format 1 und 2 werden gelesen. Die App-Sprache wird die bisherige Ausgangssprache, die Lernsprache die bisherige Zielsprache. Karten und Lernstand bleiben. War die Oberfläche Deutsch und die Ausgangssprache eine andere, bleiben die Aufgaben bei dieser Ausgangssprache.
- Das Mikrofon stoppt, wenn der Tab versteckt wird oder die Seite zugeht, in der Übung und auf der Satzseite. «Weiter» wartet, bis die Aufnahme steht. Ein Start, der erst nach dem Schrittwechsel ankommt, gibt die Tracks sofort frei.
- Ein `last_review` in der Zukunft bringt «Heute lernen» nicht mehr zum Absturz. Der Import lehnt eine Karte ab, deren letzter Lernzeitpunkt nach dem Export liegt.
- Export und Sicherung bleiben aus, bis beide Sprachen gewählt sind. Eine Stimmen-ID ist `^[a-z0-9_-]{1,40}$`. Eine Notiz aus IndexedDB verliert Steuerzeichen ausser Zeilenumbruch und Tabulator.

## 0.2.2 — 2026-10-10

- Der Hinweis auf eine neuere Datei erscheint nur, wenn `format` eine sichere ganze Zahl über 2 ist. 2.5, `1e308`, `1e400` und der Text `"3"` bleiben ein normaler Ablehnungsfehler.
- Format 1 bleibt wie bisher. Format 2 verlangt `speed` und lehnt `slow` ab.
- `@types/react` 19.3.0 und `@types/react-dom` 19.3.0.

## 0.2.1 — 2026-10-10

- Der Export schreibt `format` 2. Der Import nimmt 1 und 2 und liest 1 wie bisher. Eine höhere Nummer sagt, die Datei stamme aus einer neueren Version, und bittet darum, die App zu aktualisieren. Unbekannte Felder bei einem bekannten Format lehnen die Datei weiter ab.

## 0.2.0 — 2026-10-10

Tempo fürs Hören, in drei festen Stufen.

- 70 %, 85 % und 100 % direkt am Player jedes Satzes. Die Wahl gilt für alles Audio und bleibt lokal, bis wieder Automatisch gewählt wird. Automatisch startet neue und unsichere Sätze bei 70 % und steigt mit dem FSRS-Zustand bis 100 %. Eine feste Stufe setzt das aus. Ein altes `slow: false` wird Automatisch, nur `slow: true` wird fest 85 %.
- Die Stufen sind eigene Dateien (`ffmpeg atempo`). Die Tonhöhe bleibt erhalten. `playbackRate` wird nicht benutzt, weil sie auf manchen Geräten, besonders iOS, die vietnamesischen Töne verbiegen kann.
- Die Hörübung prüft bekannte Karten bei Automatisch mit 100 %.
- Import: der Dialog sagt, ob die lokale Notiz bleibt oder ersetzt wird. Eine Datei ohne das Feld `personalNote` wird ganz abgelehnt.
- Dependabot prüft npm und GitHub Actions wöchentlich und wartet sieben Tage, bevor eine neue Version einen Pull Request bekommt.

## 0.1.0 — 2026-10-10

Erste Fassung für eine Familie, offline, ohne Konto.

- Sprachpaare: Deutsch nach Vietnamesisch, Portugiesisch (Brasilien) in beide Richtungen mit Deutsch, Englisch und Vietnamesisch.
- Situationen für die ganze Reise. Ausgearbeitet: Notfall und Menschen treffen. Kleinere Sätze: Ankunft und Restaurant. Kurze Anfänge: Visum, Unterkunft, Einkaufen, Sehenswürdigkeiten, Alltag.
- Üben mit FSRS, Hören, Abrufen, eigener Aufnahme und Tonhöhenkurve für Vietnamesisch.
- Zeigen-Modus für den Notfall, grosse Schrift, offline nach dem ersten Laden.
- Kulturhinweise mit Quellen, noch nicht muttersprachlich geprüft.
- Lernstand lokal, Export und Import als geprüftes JSON.
- Audio: Piper-Dateien im Repo, Browserstimme nur als Ausweg. Vietnamesisch ist eine nördliche Stimme.
- Vor dem Merge: Mikrofon stoppt beim Verlassen der Satzseite. Import und Löschen fragen nach. Unbekannte Karten werden ausgelassen. Die Notiz kommt nur mit Haken in den Export. Einstellungen nennen Stimmen und Lizenzen.
- Build mit Rsbuild statt Vite. Offline-Cache über Workbox (`workbox-build`), Scope `/Travel-Talk/`. Tests bleiben bei Vitest.
