export type Dictionary = {
  appName: string
  skip: string
  nav: { today: string; lookup: string; show: string; settings: string }
  cultureTitle: string
  pairTitle: string
  pairLead: string
  uncheckedBanner: string
  due: (count: number) => string
  practiceNow: string
  showEmergency: string
  situations: string
  depth: { core: string; sample: string; starter: string }
  search: string
  cultureForSituation: string
  showThis: string
  back: string
  context: string
  play: string
  speedTitle: string
  speedAuto: string
  speed70: string
  speed85: string
  speed100: string
  speedAutoHint: (percent: number) => string
  speedFixedHint: (percent: number) => string
  speedShown: (percent: number) => string
  unchecked: string
  audioVi: string
  audioPt: string
  audioDe: string
  audioEn: string
  audioSynth: string
  regionSouth: string
  regionNorth: string
  addressTitle: string
  record: string
  stop: string
  playMine: string
  playModel: string
  micHint: string
  micDenied: string
  pitchTitle: string
  pitchModel: string
  pitchYou: string
  pitchCaveat: string
  pitchEmpty: string
  pitchNoModel: string
  shape: {
    level: string
    rising: string
    falling: string
    dipping: string
    unknown: string
    similar: string
    apart: string
  }
  listen: string
  recall: string
  listenPrompt: string
  recallPrompt: string
  scratch: string
  reveal: string
  correct: string
  wrong: string
  next: string
  again: string
  hard: string
  good: string
  easy: string
  sessionEmpty: string
  needPair: string
  progress: (index: number, total: number) => string
  forOther: string
  hideGloss: string
  showGloss: string
  showNote: string
  hideNote: string
  cultureLead: string
  sources: string
  accessed: string
  infoStale: string
  settingsTitle: string
  uiLanguage: string
  uiGerman: string
  uiSource: string
  viRegion: string
  retention: string
  personalNote: string
  personalNoteHelp: string
  exportLabel: string
  importLabel: string
  importOk: string
  importBad: string
  importNewer: string
  importFuture: string
  importSkipped: (count: number) => string
  importSummary: (cards: number, from: string | null, to: string | null, hasNote: boolean) => string
  importBackup: string
  importNoteKept: string
  importNoteReplaced: string
  exportNote: string
  exportNoteHint: string
  confirmImport: string
  confirmReset: string
  cancel: string
  resetAsk: string
  backupDownload: string
  voicesTitle: string
  voicesVi: string
  voicesCc: string
  voicesSlow: string
  voicesNotice: string
  reset: string
  resetOk: string
  persist: string
  persistOk: string
  persistNo: string
  privacy: string
  loading: string
  storageError: string
  version: string
  exampleAudio: string
  pairNote: string
  noResults: string
  phrases: (count: number) => string
  learnToday: string
  reviewCard: (count: number) => string
  reviewNone: string
  learnNew: string
  learnNewHint: string
  lookupCard: string
  lookupHint: string
  showCard: string
  showHint: string
  sessionLength: string
  onboardingKicker: string
  onboardingTitle: string
  sameChoice: string
  sameChoiceLead: string
  appLangTitle: string
  appLangHint: string
  targetLangTitle: string
  targetLangHint: string
  scriptTitle: string
  scriptHint: string
  voiceTitle: string
  voiceVi: string
  voiceEn: string
  voiceDe: string
  voicePt: string
  voiceViNote: string
  voiceEnNote: string
  voicePlainNote: string
  continueOn: string
  ifThen: string
  everyPair: string
  missingLine: string
  stepSlow: (index: number, total: number) => string
  stepNormal: (index: number, total: number) => string
  stepRepeat: (index: number, total: number) => string
  stepUnderstand: (index: number, total: number) => string
  stepRecall: (index: number, total: number) => string
  visibleTitle: string
  recallTitle: string
  newStays: string
  sessionKicker: string
  noReviewWasDue: string
  sessionNewCount: (count: number) => string
  playingSlow: string
  playingNormal: string
  replaySlow: string
  playNormal: string
  playSlow: string
  saidIt: string
  micSkipped: string
  meaningPrompt: string
  afterChoice: string
  rateAgain: string
  rateSoon: string
  rateLater: string
  rateMuchLater: string
  rateHint: string
  inMinutes: (count: number) => string
  inHours: (count: number) => string
  inDays: (count: number) => string
  tomorrow: string
  sessionDone: string
  sessionCount: (count: number) => string
  tomorrowReviews: string
  anotherSession: string
  done: string
  uncheckedCalm: string
  directionKept: string
  playing: string
  lookupTitle: string
  noReviews: string
  noNewToday: string
  reviewTitle: string
  startLead: (fresh: number, due: number) => string
}

export const de: Dictionary = {
  appName: 'Travel Talk',
  skip: 'Zum Inhalt',
  nav: { today: 'Heute', lookup: 'Nachschlagen', show: 'Zeigen', settings: 'Einstellungen' },
  cultureTitle: 'Kultur',
  pairTitle: 'Sprachpaar',
  pairLead: 'Zuerst das Paar. Deutsch bleibt die Oberfläche, bis du sie auf die Ausgangssprache umstellst.',
  uncheckedBanner:
    'Vietnamesisch und Portugiesisch (Brasilien) sind noch nicht von einer muttersprachlichen Person geprüft. Die deutschen und englischen Sätze auch nicht.',
  due: (count) => (count === 1 ? '1 Satz ist fällig.' : `${count} Sätze sind fällig.`),
  practiceNow: 'Heute üben',
  showEmergency: 'Notfall zeigen',
  situations: 'Situationen',
  depth: { core: 'Ausgearbeitet', sample: 'Kleiner Satz', starter: 'Anfang' },
  search: 'Suchen',
  cultureForSituation: 'Kulturhinweise dazu',
  showThis: 'Zeigen-Modus',
  back: 'Zurück',
  context: 'Wozu der Satz',
  play: 'Anhören',
  speedTitle: 'Tempo',
  speedAuto: 'Automatisch',
  speed70: '70 %',
  speed85: '85 %',
  speed100: '100 %',
  speedAutoHint: (percent) =>
    `Automatisch, dieser Satz mit ${percent} %. Neue und unsichere Sätze starten bei 70 % und steigen nach sicheren Wiederholungen auf 85 % und dann auf 100 %. Eine feste Stufe hier gilt für alles Audio, bis du wieder Automatisch wählst.`,
  speedFixedHint: (percent) => `Fest ${percent} % für alles Audio, bis du wieder Automatisch wählst.`,
  speedShown: (percent) => `Tempo ${percent} %`,
  unchecked: 'Noch nicht geprüft',
  audioVi:
    'Stimme: Piper vais1000, nördlicher Akzent, eine Sprecherin. Süd liegt nicht vor. Töne und Qualität sind nicht geprüft.',
  audioPt: 'Stimme: Piper faber, Portugiesisch (Brasilien). Qualität nicht geprüft.',
  audioDe: 'Stimme: Piper thorsten, Deutsch aus Deutschland, nicht Schweizerdeutsch. Qualität nicht geprüft.',
  audioEn: 'Stimme: Piper LJSpeech, Englisch (USA). Qualität nicht geprüft.',
  audioSynth: 'Keine Datei. Browserstimme. Akzent und Qualität hängen vom Gerät ab und sind nicht geprüft.',
  regionSouth: 'Süd, Standard',
  regionNorth: 'Nord, Variante',
  addressTitle: 'Anrede',
  record: 'Aufnehmen',
  stop: 'Stopp',
  playMine: 'Meine Aufnahme',
  playModel: 'Modell',
  micHint: 'Das Mikrofon wird erst jetzt angefragt. Die Aufnahme bleibt auf diesem Gerät und wird nicht hochgeladen.',
  micDenied: 'Das Mikrofon ist nicht verfügbar. Es wurde nichts aufgenommen.',
  pitchTitle: 'Tonhöhe',
  pitchModel: 'Modell',
  pitchYou: 'Du',
  pitchCaveat:
    'Die Modellkurve stammt aus der nördlichen TTS-Stimme, nicht aus einer geprüften südlichen Aufnahme. Eine Abweichung kann an der Stimme liegen.',
  pitchEmpty: 'In der Aufnahme war zu wenig stimmhafte Tonhöhe.',
  pitchNoModel: 'Ohne Audiodatei gibt es keine Modellkurve. Die Browserstimme liefert kein Signal.',
  shape: {
    level: 'eher eben',
    rising: 'eher steigend',
    falling: 'eher fallend',
    dipping: 'eher mit Senke',
    unknown: 'unklar',
    similar: 'Die Kurven liegen nahe beieinander. Das ist ein Hinweis, keine Bewertung.',
    apart: 'Die Kurven weichen ab. Das ist ein Hinweis, keine Bewertung.',
  },
  listen: 'Hören',
  recall: 'Abrufen',
  listenPrompt: 'Höre den Satz und wähle die Bedeutung.',
  recallPrompt: 'Wie sagst du das? Die Lösung kommt erst nach deinem Versuch.',
  scratch: 'Optional aufschreiben. Der Text wird nicht gespeichert.',
  reveal: 'Lösung zeigen',
  correct: 'Richtig.',
  wrong: 'Nicht ganz. So heisst es:',
  next: 'Weiter',
  again: 'Nochmals',
  hard: 'Schwer',
  good: 'Gut',
  easy: 'Leicht',
  sessionEmpty: 'Nichts fällig. Öffne eine Situation oder starte die neuen Sätze später erneut.',
  needPair: 'Bitte zuerst ein Sprachpaar wählen.',
  progress: (index, total) => `${index} von ${total}`,
  forOther: 'Für die andere Person',
  hideGloss: 'Bedeutung ausblenden',
  showGloss: 'Bedeutung einblenden',
  showNote: 'Persönliche Notiz zeigen',
  hideNote: 'Notiz verbergen',
  cultureLead: 'Keine Regel für alle Menschen. Häufig und vielerorts, mit Quelle.',
  sources: 'Quellen',
  accessed: 'Gelesen am',
  infoStale: 'Diese Karte ist älter als sechs Monate. Bitte die Quelle neu prüfen.',
  settingsTitle: 'Einstellungen',
  uiLanguage: 'Oberflächensprache',
  uiGerman: 'Deutsch',
  uiSource: 'Ausgangssprache des Paars',
  viRegion: 'Vietnamesisch',
  retention: 'Behaltensrate',
  personalNote: 'Persönliche Notiz',
  personalNoteHelp: 'Nur auf diesem Gerät. Der Export enthält die Notiz nur mit dem Haken. Nützlich für eine Allergie im Zeigen-Modus.',
  exportLabel: 'Fortschritt exportieren',
  importLabel: 'Fortschritt importieren',
  importOk: 'Import gespeichert.',
  importBad: 'Die Datei ist kein gültiger Travel-Talk-Export.',
  importNewer: 'Datei aus neuerer Version – bitte App aktualisieren (Seite neu laden)',
  importFuture: 'Die Datei stammt mehr als einen Tag aus der Zukunft. Bitte die Uhr prüfen.',
  importSkipped: (count) =>
    count === 1
      ? '1 Karte gehört nicht zu dieser Version und wurde nicht übernommen.'
      : `${count} Karten gehören nicht zu dieser Version und wurden nicht übernommen.`,
  importSummary: (cards, from, to, hasNote) => {
    const count = cards === 1 ? '1 Karte.' : `${cards} Karten.`
    const range = from && to ? ` Zeitraum ${from} bis ${to}.` : ''
    const note = hasNote ? ' Eine Notiz ist enthalten.' : ' Keine Notiz.'
    return `${count}${range}${note}`
  },
  importBackup: 'Die Sicherung folgt dem Haken «Notiz mitexportieren». Ohne Haken bleibt die Notiz nur auf diesem Gerät.',
  importNoteKept: 'Die Datei enthält keine Notiz. Die Notiz auf diesem Gerät bleibt.',
  importNoteReplaced: 'Die Notiz in der Datei ersetzt die Notiz auf diesem Gerät.',
  exportNote: 'Notiz mitexportieren',
  exportNoteHint: 'Die Notiz kann Gesundheitsangaben enthalten, zum Beispiel eine Allergie. Ohne Haken bleibt sie nur auf diesem Gerät.',
  confirmImport: 'Importieren',
  confirmReset: 'Wirklich löschen',
  cancel: 'Abbrechen',
  resetAsk: 'Der Lernstand auf diesem Gerät wird gelöscht. Das lässt sich hier nicht zurückholen.',
  backupDownload: 'Sicherung herunterladen',
  voicesTitle: 'Stimmen und Lizenzen',
  voicesVi: 'Vietnamesisch spricht vais1000 aus dem Datensatz VAIS-1000, eine nördliche Sprecherin. Laut Modellkarte ist die Stimme von lessac feinjustiert (Forschungslizenz).',
  voicesCc: 'CC BY 4.0',
  voicesSlow: '70 % und 85 % sind eigene Dateien (ffmpeg atempo). Die Tonhöhe bleibt erhalten. 100 % ist die normale Datei.',
  voicesNotice: 'NOTICE.txt',
  reset: 'Lernstand auf diesem Gerät löschen',
  resetOk: 'Der lokale Lernstand ist gelöscht.',
  persist: 'Speicher behalten anfragen',
  persistOk: 'Der Browser darf den lokalen Lernstand behalten.',
  persistNo: 'Der Browser hat das nicht zugesichert. Exportiere regelmässig.',
  privacy:
    'Lernstand, Aufnahmen und die Notiz bleiben auf diesem Gerät. Kein Konto, kein Tracking, keine Schrift aus dem Netz.',
  loading: 'Einen Moment.',
  storageError: 'Der lokale Speicher ist nicht verfügbar.',
  version: 'Version 0.3.1',
  exampleAudio: 'Das Audio spricht den Beispielsatz.',
  pairNote: 'Hinweis zum Sprachpaar',
  noResults: 'Keine Treffer.',
  phrases: (count) => (count === 1 ? '1 Satz' : `${count} Sätze`),
  learnToday: 'Heute lernen',
  reviewCard: (count) => (count === 1 ? '1 fälliger Satz.' : `${count} fällige Sätze.`),
  reviewNone: 'Fällige Sätze. Heute keine.',
  learnNew: 'Neu lernen',
  learnNewHint: 'Der nächste Satz aus der Situation.',
  lookupCard: 'Nachschlagen',
  lookupHint: 'Sätze lesen, ohne Prüfung.',
  showCard: 'Zeigen',
  showHint: 'Grosser Text für die andere Person.',
  sessionLength: 'Eine kurze Sitzung, etwa 8 Minuten. Danach ist sie zu Ende.',
  onboardingKicker: 'Einmal zu Beginn',
  onboardingTitle: 'Zwei Sprachen',
  sameChoice: 'Dieselbe Wahl',
  sameChoiceLead: 'Dieselbe Stelle wie zu Beginn. Keine zweite Wahl an den Sätzen.',
  appLangTitle: 'Sprache der App',
  appLangHint: 'Damit liest du. Damit sind auch die Übersetzungen geschrieben.',
  targetLangTitle: 'Sprache, die du lernst',
  targetLangHint: 'Dazu gehören Stimme und, bei Vietnamesisch, die Variante der Wörter.',
  scriptTitle: 'Schrift und Wörter',
  scriptHint: 'Nur weil die Lernsprache Vietnamesisch ist. Das ist nicht die Stimme.',
  voiceTitle: 'Stimme',
  voiceVi: 'Eine Stimme, Frau, Norden',
  voiceEn: 'Eine Stimme, Frau',
  voiceDe: 'Eine Stimme',
  voicePt: 'Eine Stimme',
  voiceViNote: 'Eine Stimme. Eine Männerstimme und eine südliche Stimme mit klarer Lizenz gibt es hier nicht.',
  voiceEnNote: 'Eine Stimme, Frau. Eine zweite Stimme kommt erst nach einer Hörprobe.',
  voicePlainNote: 'Eine Stimme. Mann oder Frau steht hier erst, wenn eine Quelle das sagt.',
  continueOn: 'Weiter zu Heute lernen',
  ifThen: 'Wenn ich morgens Kaffee trinke, öffne ich Heute lernen. Das kannst du überspringen.',
  everyPair: 'Sätze gibt es für jede Kombination aus zwei verschiedenen Sprachen.',
  missingLine: 'Für diese Kombination gibt es den Satz noch nicht.',
  stepSlow: (index, total) => `Neuer Satz · ${index} von ${total} · langsam`,
  stepNormal: (index, total) => `Neuer Satz · ${index} von ${total} · normal`,
  stepRepeat: (index, total) => `Nachsprechen · ${index} von ${total}`,
  stepUnderstand: (index, total) => `Hören · ${index} von ${total}`,
  stepRecall: (index, total) => `Abrufen · ${index} von ${total}`,
  visibleTitle: 'Der Satz bleibt sichtbar',
  recallTitle: 'Wie sagst du das?',
  newStays: 'Er ist neu. Du liest mit, während er läuft.',
  sessionKicker: 'Sitzung',
  noReviewWasDue: 'Keine Wiederholung war fällig.',
  sessionNewCount: (count) => (count === 1 ? '1 neuer Satz.' : `${count} neue Sätze.`),
  playingSlow: 'Läuft langsam.',
  playingNormal: 'Läuft in normalem Tempo.',
  replaySlow: 'Noch einmal langsam',
  playNormal: 'Jetzt in normalem Tempo',
  playSlow: 'Langsam anhören',
  saidIt: 'Ich habe es gesagt',
  micSkipped: 'Ohne Mikrofon wird nichts aufgenommen. Du kannst weiter.',
  meaningPrompt: 'Was bedeutet der Satz?',
  afterChoice: 'Die Bedeutung wählst du. Nach der Wahl siehst du die richtige Zeile noch einmal, mit demselben Ton.',
  rateAgain: 'Gleich noch einmal',
  rateSoon: 'Bald wieder',
  rateLater: 'Später wieder',
  rateMuchLater: 'Viel später',
  rateHint: 'Der Abstand kommt vom Wiederholungsplaner, nicht aus einem festen Spruch.',
  inMinutes: (count) => (count === 1 ? 'in 1 Minute' : `in ${count} Minuten`),
  inHours: (count) => (count === 1 ? 'in 1 Stunde' : `in ${count} Stunden`),
  inDays: (count) => `in ${count} Tagen`,
  tomorrow: 'morgen',
  sessionDone: 'Heute geschafft',
  sessionCount: (count) => (count === 1 ? '1 Satz.' : `${count} Sätze.`),
  tomorrowReviews: 'Morgen liegen diese Sätze unter Wiederholen.',
  anotherSession: 'Noch eine kurze Sitzung',
  done: 'Fertig',
  uncheckedCalm: 'Die Sätze sind noch nicht von einer muttersprachlichen Person geprüft.',
  directionKept: 'Die Oberfläche war Deutsch. Die Aufgaben bleiben bei der bisherigen Ausgangssprache.',
  playing: 'Läuft',
  lookupTitle: 'Nachschlagen',
  noReviews: 'Keine Wiederholung ist fällig.',
  noNewToday: 'Heute keine neuen Sätze mehr. Die Wiederholungen liegen unter Wiederholen.',
  reviewTitle: 'Wiederholen',
  startLead: (fresh, due) => `${fresh === 1 ? '1 neuer Satz' : `${fresh} neue Sätze`}. ${due === 0 ? 'Keine Wiederholung.' : due === 1 ? '1 Wiederholung.' : `${due} Wiederholungen.`}`,
}

export const en: Dictionary = {
  ...de,
  skip: 'Skip to content',
  nav: { today: 'Today', lookup: 'Look up', show: 'Show', settings: 'Settings' },
  cultureTitle: 'Culture',
  pairTitle: 'Language pair',
  pairLead: 'Choose the pair first. German stays the interface until you switch it to the source language.',
  uncheckedBanner:
    'Vietnamese and Brazilian Portuguese have not been checked by a native speaker. The German and English lines have not either.',
  due: (count) => (count === 1 ? '1 line is due.' : `${count} lines are due.`),
  practiceNow: 'Practice today',
  showEmergency: 'Show emergency',
  situations: 'Situations',
  depth: { core: 'Built out', sample: 'Smaller set', starter: 'Starter' },
  search: 'Search',
  cultureForSituation: 'Cultural notes',
  showThis: 'Show mode',
  back: 'Back',
  context: 'When to use it',
  play: 'Play',
  speedTitle: 'Speed',
  speedAuto: 'Automatic',
  speed70: '70 %',
  speed85: '85 %',
  speed100: '100 %',
  speedAutoHint: (percent) =>
    `Automatic, this line at ${percent} %. New and shaky lines start at 70 % and step up to 85 % and then 100 % after reliable reviews. A fixed step here applies to all audio until you choose Automatic again.`,
  speedFixedHint: (percent) => `Fixed at ${percent} % for all audio until you choose Automatic again.`,
  speedShown: (percent) => `Speed ${percent} %`,
  unchecked: 'Not checked yet',
  audioVi:
    'Voice: Piper vais1000, northern accent, one woman. No southern voice. Tones and quality are not checked.',
  audioPt: 'Voice: Piper faber, Brazilian Portuguese. Quality not checked.',
  audioDe: 'Voice: Piper thorsten, German from Germany, not Swiss German. Quality not checked.',
  audioEn: 'Voice: Piper LJSpeech, English (US). Quality not checked.',
  audioSynth: 'No file. Browser voice. Accent and quality depend on the device and are not checked.',
  regionSouth: 'South, default',
  regionNorth: 'North, variant',
  addressTitle: 'Address form',
  record: 'Record',
  stop: 'Stop',
  playMine: 'My recording',
  playModel: 'Model',
  micHint: 'The microphone is requested only now. The recording stays on this device and is not uploaded.',
  micDenied: 'The microphone is not available. Nothing was recorded.',
  pitchTitle: 'Pitch',
  pitchModel: 'Model',
  pitchYou: 'You',
  pitchCaveat:
    'The model curve comes from the northern TTS voice, not from a checked southern recording. A gap can be the voice, not only you.',
  pitchEmpty: 'The recording had too little voiced pitch.',
  pitchNoModel: 'Without an audio file there is no model curve. The browser voice gives no signal.',
  shape: {
    level: 'mostly level',
    rising: 'mostly rising',
    falling: 'mostly falling',
    dipping: 'mostly a dip',
    unknown: 'unclear',
    similar: 'The curves sit close. That is a hint, not a grade.',
    apart: 'The curves differ. That is a hint, not a grade.',
  },
  listen: 'Listen',
  recall: 'Recall',
  listenPrompt: 'Listen, then choose the meaning.',
  recallPrompt: 'How do you say this? The answer comes after you try.',
  scratch: 'Optional note. The text is not saved.',
  reveal: 'Show the answer',
  correct: 'Right.',
  wrong: 'Not quite. It goes:',
  next: 'Next',
  again: 'Again',
  hard: 'Hard',
  good: 'Good',
  easy: 'Easy',
  sessionEmpty: 'Nothing is due. Open a situation, or start the new lines again later.',
  needPair: 'Choose a language pair first.',
  progress: (index, total) => `${index} of ${total}`,
  forOther: 'For the other person',
  hideGloss: 'Hide the meaning',
  showGloss: 'Show the meaning',
  showNote: 'Show personal note',
  hideNote: 'Hide note',
  cultureLead: 'Not a rule for everyone. Often, in many places, with a source.',
  sources: 'Sources',
  accessed: 'Read on',
  infoStale: 'This card is older than six months. Please check the source again.',
  settingsTitle: 'Settings',
  uiLanguage: 'Interface language',
  uiGerman: 'German',
  uiSource: 'Source language of the pair',
  viRegion: 'Vietnamese',
  retention: 'Retention',
  personalNote: 'Personal note',
  personalNoteHelp: 'Only on this device. The export includes the note only when the box is checked. Useful for an allergy in show mode.',
  exportLabel: 'Export progress',
  importLabel: 'Import progress',
  importOk: 'Import saved.',
  importBad: 'This file is not a valid Travel Talk export.',
  importNewer: 'File from a newer version – please update the app (reload the page)',
  importFuture: 'This file was exported more than a day in the future. Please check the clock.',
  importSkipped: (count) =>
    count === 1 ? '1 card is not part of this version and was left out.' : `${count} cards are not part of this version and were left out.`,
  importSummary: (cards, from, to, hasNote) => {
    const count = cards === 1 ? '1 card.' : `${cards} cards.`
    const range = from && to ? ` Range ${from} to ${to}.` : ''
    const note = hasNote ? ' A note is included.' : ' No note.'
    return `${count}${range}${note}`
  },
  importBackup: 'The backup follows the “Include the note” box. Without the box the note stays on this device.',
  importNoteKept: 'The file has no note. The note on this device stays.',
  importNoteReplaced: 'The note in the file replaces the note on this device.',
  exportNote: 'Include the note in the export',
  exportNoteHint: 'The note may contain health information, for example an allergy. Without the box it stays on this device.',
  confirmImport: 'Import',
  confirmReset: 'Delete for sure',
  cancel: 'Cancel',
  resetAsk: 'Progress on this device will be deleted. This screen cannot bring it back.',
  backupDownload: 'Download a backup',
  voicesTitle: 'Voices and licences',
  voicesVi: 'Vietnamese uses vais1000 from the VAIS-1000 dataset, a northern speaker. The model card says this voice is fine-tuned from lessac (research licence).',
  voicesCc: 'CC BY 4.0',
  voicesSlow: '70 % and 85 % are their own files (ffmpeg atempo). The pitch stays the same. 100 % is the normal file.',
  voicesNotice: 'NOTICE.txt',
  reset: 'Delete progress on this device',
  resetOk: 'Local progress was deleted.',
  persist: 'Ask to keep storage',
  persistOk: 'The browser may keep the local progress.',
  persistNo: 'The browser did not promise that. Export regularly.',
  privacy: 'Progress, recordings and the note stay on this device. No account, no tracking, no font from the network.',
  loading: 'One moment.',
  storageError: 'Local storage is not available.',
  exampleAudio: 'The audio speaks the example sentence.',
  pairNote: 'Note for this pair',
  noResults: 'No matches.',
  phrases: (count) => (count === 1 ? '1 line' : `${count} lines`),
  learnToday: 'Learn today',
  reviewCard: (count) => (count === 1 ? '1 line is due.' : `${count} lines are due.`),
  reviewNone: 'Due lines. None today.',
  learnNew: 'Learn something new',
  learnNewHint: 'The next line from the situation.',
  lookupCard: 'Look up',
  lookupHint: 'Read the lines, without a test.',
  showCard: 'Show',
  showHint: 'Large text for the other person.',
  sessionLength: 'A short session, about 8 minutes. Then it ends.',
  onboardingKicker: 'Once at the start',
  onboardingTitle: 'Two languages',
  sameChoice: 'The same choice',
  sameChoiceLead: 'The same place as at the start. No second choice on the lines.',
  appLangTitle: 'Language of the app',
  appLangHint: 'This is what you read. The translations are written in it too.',
  targetLangTitle: 'Language you are learning',
  targetLangHint: 'The voice belongs here, and for Vietnamese the variant of the words.',
  scriptTitle: 'Script and words',
  scriptHint: 'Only because the language you learn is Vietnamese. This is not the voice.',
  voiceTitle: 'Voice',
  voiceVi: 'One voice, woman, north',
  voiceEn: 'One voice, woman',
  voiceDe: 'One voice',
  voicePt: 'One voice',
  voiceViNote: 'One voice. There is no male voice and no southern voice with a clear licence here.',
  voiceEnNote: 'One voice, a woman. A second voice comes only after someone has listened to it.',
  voicePlainNote: 'One voice. Man or woman is written here only when a source says so.',
  continueOn: 'Continue to Learn today',
  ifThen: 'When I have coffee in the morning, I open Learn today. You can skip this.',
  everyPair: 'There is a line for every combination of two different languages.',
  missingLine: 'This line is not available for this combination yet.',
  stepSlow: (index, total) => `New line · ${index} of ${total} · slow`,
  stepNormal: (index, total) => `New line · ${index} of ${total} · normal`,
  stepRepeat: (index, total) => `Repeat aloud · ${index} of ${total}`,
  stepUnderstand: (index, total) => `Listen · ${index} of ${total}`,
  stepRecall: (index, total) => `Say it · ${index} of ${total}`,
  visibleTitle: 'The line stays visible',
  recallTitle: 'How do you say that?',
  newStays: 'It is new. You read along while it plays.',
  sessionKicker: 'Session',
  noReviewWasDue: 'No review was due.',
  sessionNewCount: (count) => (count === 1 ? '1 new line.' : `${count} new lines.`),
  playingSlow: 'Playing slowly.',
  playingNormal: 'Playing at normal speed.',
  replaySlow: 'Slowly once more',
  playNormal: 'Now at normal speed',
  playSlow: 'Listen slowly',
  saidIt: 'I have said it',
  micSkipped: 'Without a microphone nothing is recorded. You can continue.',
  meaningPrompt: 'What does the line mean?',
  afterChoice: 'You choose the meaning. After that you see the correct line again, with the same audio.',
  rateAgain: 'Again right away',
  rateSoon: 'Again soon',
  rateLater: 'Again later',
  rateMuchLater: 'Much later',
  rateHint: 'The gap comes from the scheduler, not from a fixed label.',
  inMinutes: (count) => (count === 1 ? 'in 1 minute' : `in ${count} minutes`),
  inHours: (count) => (count === 1 ? 'in 1 hour' : `in ${count} hours`),
  inDays: (count) => `in ${count} days`,
  tomorrow: 'tomorrow',
  sessionDone: 'Done for today',
  sessionCount: (count) => (count === 1 ? '1 line.' : `${count} lines.`),
  tomorrowReviews: 'Tomorrow these lines are under Review.',
  anotherSession: 'Another short session',
  done: 'Done',
  uncheckedCalm: 'The lines have not been checked by a native speaker yet.',
  directionKept: 'The interface was German. The tasks stay with the previous source language.',
  playing: 'Playing',
  lookupTitle: 'Look up',
  noReviews: 'No review is due.',
  noNewToday: 'No new lines today. Reviews are under Review.',
  reviewTitle: 'Review',
  startLead: (fresh, due) => `${fresh === 1 ? '1 new line' : `${fresh} new lines`}. ${due === 0 ? 'No review.' : due === 1 ? '1 review.' : `${due} reviews.`}`,
}

export const pt: Dictionary = {
  ...en,
  skip: 'Ir ao conteúdo',
  nav: { today: 'Hoje', lookup: 'Consultar', show: 'Mostrar', settings: 'Ajustes' },
  cultureTitle: 'Cultura',
  pairTitle: 'Par de línguas',
  pairLead: 'Primeiro o par. O alemão continua na tela até você mudar para a língua de partida.',
  uncheckedBanner:
    'Vietnamita e português do Brasil ainda não foram revisados por uma pessoa nativa. As frases em alemão e inglês também não.',
  due: (count) => (count === 1 ? '1 frase está para revisar.' : `${count} frases estão para revisar.`),
  practiceNow: 'Praticar hoje',
  showEmergency: 'Mostrar emergência',
  situations: 'Situações',
  depth: { core: 'Desenvolvida', sample: 'Conjunto menor', starter: 'Começo' },
  search: 'Buscar',
  cultureForSituation: 'Notas culturais',
  showThis: 'Modo mostrar',
  back: 'Voltar',
  context: 'Quando usar',
  play: 'Ouvir',
  speedTitle: 'Velocidade',
  speedAuto: 'Automático',
  speed70: '70 %',
  speed85: '85 %',
  speed100: '100 %',
  speedAutoHint: (percent) =>
    `Automático, esta frase em ${percent} %. Frases novas ou pouco firmes começam em 70 % e sobem para 85 % e depois 100 % depois de revisões seguras. Um passo fixo aqui vale para todo o áudio, até você escolher Automático de novo.`,
  speedFixedHint: (percent) => `Fixo em ${percent} % para todo o áudio, até você escolher Automático de novo.`,
  speedShown: (percent) => `Velocidade ${percent} %`,
  unchecked: 'Ainda não revisado',
  audioVi:
    'Voz: Piper vais1000, sotaque do norte, uma falante. Não há voz do sul. Tons e qualidade não foram revisados.',
  audioPt: 'Voz: Piper faber, português do Brasil. Qualidade não revisada.',
  audioDe: 'Voz: Piper thorsten, alemão da Alemanha, não suíço-alemão. Qualidade não revisada.',
  audioEn: 'Voz: Piper LJSpeech, inglês (EUA). Qualidade não revisada.',
  audioSynth: 'Sem arquivo. Voz do navegador. Sotaque e qualidade dependem do aparelho e não foram revisados.',
  regionSouth: 'Sul, padrão',
  regionNorth: 'Norte, variante',
  addressTitle: 'Tratamento',
  record: 'Gravar',
  stop: 'Parar',
  playMine: 'Minha gravação',
  playModel: 'Modelo',
  micHint: 'O microfone só é pedido agora. A gravação fica neste aparelho e não é enviada.',
  micDenied: 'O microfone não está disponível. Nada foi gravado.',
  pitchTitle: 'Tom',
  pitchModel: 'Modelo',
  pitchYou: 'Você',
  pitchCaveat:
    'A curva do modelo vem da voz TTS do norte, não de uma gravação do sul revisada. A diferença pode ser a voz.',
  pitchEmpty: 'A gravação tinha pouca voz com tom.',
  pitchNoModel: 'Sem arquivo de áudio não há curva do modelo. A voz do navegador não entrega sinal.',
  shape: {
    level: 'mais plano',
    rising: 'mais subindo',
    falling: 'mais caindo',
    dipping: 'mais com uma queda',
    unknown: 'incerto',
    similar: 'As curvas ficam perto. É um indício, não uma nota.',
    apart: 'As curvas divergem. É um indício, não uma nota.',
  },
  listen: 'Ouvir',
  recall: 'Lembrar',
  listenPrompt: 'Ouça e escolha o sentido.',
  recallPrompt: 'Como você diz isto? A resposta vem depois da tentativa.',
  scratch: 'Anotação opcional. O texto não é salvo.',
  reveal: 'Mostrar a resposta',
  correct: 'Certo.',
  wrong: 'Quase. É assim:',
  next: 'Seguinte',
  again: 'De novo',
  hard: 'Difícil',
  good: 'Bom',
  easy: 'Fácil',
  sessionEmpty: 'Nada para revisar. Abra uma situação ou comece as frases novas de novo mais tarde.',
  needPair: 'Escolha primeiro um par de línguas.',
  progress: (index, total) => `${index} de ${total}`,
  forOther: 'Para a outra pessoa',
  hideGloss: 'Esconder o sentido',
  showGloss: 'Mostrar o sentido',
  showNote: 'Mostrar nota pessoal',
  hideNote: 'Esconder nota',
  cultureLead: 'Não é uma regra para todo mundo. Com frequência, em muitos lugares, com fonte.',
  sources: 'Fontes',
  accessed: 'Lido em',
  infoStale: 'Este cartão tem mais de seis meses. Confira a fonte de novo.',
  settingsTitle: 'Ajustes',
  uiLanguage: 'Língua da tela',
  uiGerman: 'Alemão',
  uiSource: 'Língua de partida do par',
  viRegion: 'Vietnamita',
  retention: 'Retenção',
  personalNote: 'Nota pessoal',
  personalNoteHelp: 'Só neste aparelho. A exportação inclui a nota só com a caixa marcada. Útil para uma alergia no modo mostrar.',
  exportLabel: 'Exportar progresso',
  importLabel: 'Importar progresso',
  importOk: 'Importação salva.',
  importBad: 'O arquivo não é uma exportação válida do Travel Talk.',
  importNewer: 'Arquivo de uma versão mais nova – atualize o aplicativo (recarregue a página)',
  importFuture: 'O arquivo foi exportado mais de um dia no futuro. Verifique o relógio.',
  importSkipped: (count) =>
    count === 1
      ? '1 cartão não faz parte desta versão e ficou de fora.'
      : `${count} cartões não fazem parte desta versão e ficaram de fora.`,
  importSummary: (cards, from, to, hasNote) => {
    const count = cards === 1 ? '1 cartão.' : `${cards} cartões.`
    const range = from && to ? ` Período ${from} até ${to}.` : ''
    const note = hasNote ? ' Uma nota está incluída.' : ' Nenhuma nota.'
    return `${count}${range}${note}`
  },
  importBackup: 'A cópia segue a caixa da nota. Sem a caixa, a nota fica só neste aparelho.',
  importNoteKept: 'O arquivo não tem nota. A nota neste aparelho fica.',
  importNoteReplaced: 'A nota do arquivo substitui a nota neste aparelho.',
  exportNote: 'Incluir a nota na exportação',
  exportNoteHint: 'A nota pode ter dados de saúde, por exemplo uma alergia. Sem a caixa ela fica só neste aparelho.',
  confirmImport: 'Importar',
  confirmReset: 'Apagar de verdade',
  cancel: 'Cancelar',
  resetAsk: 'O progresso neste aparelho será apagado. Esta tela não o traz de volta.',
  backupDownload: 'Baixar uma cópia',
  voicesTitle: 'Vozes e licenças',
  voicesVi: 'O vietnamita usa vais1000 do conjunto VAIS-1000, uma falante do norte. O cartão do modelo diz que a voz é um ajuste fino de lessac (licença de pesquisa).',
  voicesCc: 'CC BY 4.0',
  voicesSlow: '70 % e 85 % são arquivos próprios (ffmpeg atempo). O tom fica igual. 100 % é o arquivo normal.',
  voicesNotice: 'NOTICE.txt',
  reset: 'Apagar o progresso neste aparelho',
  resetOk: 'O progresso local foi apagado.',
  persist: 'Pedir para manter o armazenamento',
  persistOk: 'O navegador pode manter o progresso local.',
  persistNo: 'O navegador não garantiu isso. Exporte com regularidade.',
  privacy: 'Progresso, gravações e a nota ficam neste aparelho. Sem conta, sem rastreamento, sem fonte da rede.',
  loading: 'Um momento.',
  storageError: 'O armazenamento local não está disponível.',
  exampleAudio: 'O áudio fala a frase de exemplo.',
  pairNote: 'Nota deste par',
  noResults: 'Nenhum resultado.',
  phrases: (count) => (count === 1 ? '1 frase' : `${count} frases`),
  learnToday: 'Aprender hoje',
  reviewCard: (count) => (count === 1 ? '1 frase para revisar.' : `${count} frases para revisar.`),
  reviewNone: 'Frases para revisar. Hoje nenhuma.',
  learnNew: 'Aprender algo novo',
  learnNewHint: 'A próxima frase da situação.',
  lookupCard: 'Consultar',
  lookupHint: 'Ler as frases, sem prova.',
  showCard: 'Mostrar',
  showHint: 'Texto grande para a outra pessoa.',
  sessionLength: 'Uma sessão curta, cerca de 8 minutos. Depois ela acaba.',
  onboardingKicker: 'Uma vez no começo',
  onboardingTitle: 'Duas línguas',
  sameChoice: 'A mesma escolha',
  sameChoiceLead: 'O mesmo lugar do começo. Nenhuma segunda escolha nas frases.',
  appLangTitle: 'Língua do aplicativo',
  appLangHint: 'É com ela que você lê. As traduções também estão nela.',
  targetLangTitle: 'Língua que você aprende',
  targetLangHint: 'A voz fica aqui e, no vietnamita, a variante das palavras.',
  scriptTitle: 'Escrita e palavras',
  scriptHint: 'Só porque a língua que você aprende é o vietnamita. Isso não é a voz.',
  voiceTitle: 'Voz',
  voiceVi: 'Uma voz, mulher, norte',
  voiceEn: 'Uma voz, mulher',
  voiceDe: 'Uma voz',
  voicePt: 'Uma voz',
  voiceViNote: 'Uma voz. Não há voz masculina nem voz do sul com licença clara aqui.',
  voiceEnNote: 'Uma voz, mulher. Uma segunda voz só depois de alguém ouvir.',
  voicePlainNote: 'Uma voz. Homem ou mulher só aparece aqui quando uma fonte diz isso.',
  continueOn: 'Seguir para Aprender hoje',
  ifThen: 'Quando tomo café de manhã, abro Aprender hoje. Você pode pular isso.',
  everyPair: 'Há frases para cada combinação de duas línguas diferentes.',
  missingLine: 'Esta frase ainda não existe para esta combinação.',
  stepSlow: (index, total) => `Frase nova · ${index} de ${total} · devagar`,
  stepNormal: (index, total) => `Frase nova · ${index} de ${total} · normal`,
  stepRepeat: (index, total) => `Repetir em voz alta · ${index} de ${total}`,
  stepUnderstand: (index, total) => `Ouvir · ${index} de ${total}`,
  stepRecall: (index, total) => `Dizer · ${index} de ${total}`,
  visibleTitle: 'A frase fica visível',
  recallTitle: 'Como você diz isso?',
  newStays: 'Ela é nova. Você acompanha a leitura enquanto ela toca.',
  sessionKicker: 'Sessão',
  noReviewWasDue: 'Nenhuma revisão estava na hora.',
  sessionNewCount: (count) => (count === 1 ? '1 frase nova.' : `${count} frases novas.`),
  playingSlow: 'Está tocando devagar.',
  playingNormal: 'Está tocando no tempo normal.',
  replaySlow: 'Devagar mais uma vez',
  playNormal: 'Agora no tempo normal',
  playSlow: 'Ouvir devagar',
  saidIt: 'Eu disse',
  micSkipped: 'Sem microfone nada é gravado. Você pode continuar.',
  meaningPrompt: 'O que a frase significa?',
  afterChoice: 'Você escolhe o sentido. Depois vê a linha certa de novo, com o mesmo áudio.',
  rateAgain: 'De novo agora',
  rateSoon: 'De novo em breve',
  rateLater: 'De novo mais tarde',
  rateMuchLater: 'Muito mais tarde',
  rateHint: 'O intervalo vem do planejador, não de um texto fixo.',
  inMinutes: (count) => (count === 1 ? 'em 1 minuto' : `em ${count} minutos`),
  inHours: (count) => (count === 1 ? 'em 1 hora' : `em ${count} horas`),
  inDays: (count) => `em ${count} dias`,
  tomorrow: 'amanhã',
  sessionDone: 'Feito por hoje',
  sessionCount: (count) => (count === 1 ? '1 frase.' : `${count} frases.`),
  tomorrowReviews: 'Amanhã estas frases ficam em Revisar.',
  anotherSession: 'Mais uma sessão curta',
  done: 'Pronto',
  uncheckedCalm: 'As frases ainda não foram revistas por uma pessoa falante nativa.',
  directionKept: 'A tela estava em alemão. As tarefas continuam na língua de partida anterior.',
  playing: 'Tocando',
  lookupTitle: 'Consultar',
  noReviews: 'Nenhuma revisão está para hoje.',
  noNewToday: 'Hoje não há frases novas. As revisões ficam em Revisar.',
  reviewTitle: 'Revisar',
  startLead: (fresh, due) => `${fresh === 1 ? '1 frase nova' : `${fresh} frases novas`}. ${due === 0 ? 'Nenhuma revisão.' : due === 1 ? '1 revisão.' : `${due} revisões.`}`,
}

export const vi: Dictionary = {
  ...en,
  skip: 'Tới nội dung',
  nav: { today: 'Hôm nay', lookup: 'Tra cứu', show: 'Đưa', settings: 'Cài đặt' },
  cultureTitle: 'Văn hoá',
  pairTitle: 'Cặp ngôn ngữ',
  pairLead: 'Chọn cặp trước. Giao diện vẫn là tiếng Đức cho đến khi bạn chuyển sang ngôn ngữ xuất phát.',
  uncheckedBanner:
    'Tiếng Việt và tiếng Bồ Đào Nha Brasil chưa được người bản ngữ kiểm tra. Câu tiếng Đức và tiếng Anh cũng chưa.',
  due: (count) => (count === 1 ? '1 câu đến hạn.' : `${count} câu đến hạn.`),
  practiceNow: 'Luyện hôm nay',
  showEmergency: 'Đưa câu khẩn cấp',
  situations: 'Tình huống',
  depth: { core: 'Đã soạn', sample: 'Bộ nhỏ', starter: 'Khởi đầu' },
  search: 'Tìm',
  cultureForSituation: 'Ghi chú văn hoá',
  showThis: 'Chế độ đưa màn hình',
  back: 'Quay lại',
  context: 'Khi nào dùng',
  play: 'Nghe',
  speedTitle: 'Tốc độ',
  speedAuto: 'Tự động',
  speed70: '70 %',
  speed85: '85 %',
  speed100: '100 %',
  speedAutoHint: (percent) =>
    `Tự động, câu này ở ${percent} %. Câu mới hoặc chưa chắc bắt đầu ở 70 % và tăng lên 85 % rồi 100 % sau các lần nhớ chắc. Một mức cố định ở đây áp dụng cho mọi audio, cho đến khi bạn chọn Tự động.`,
  speedFixedHint: (percent) => `Cố định ${percent} % cho mọi audio, cho đến khi bạn chọn lại Tự động.`,
  speedShown: (percent) => `Tốc độ ${percent} %`,
  unchecked: 'Chưa được kiểm tra',
  audioVi:
    'Giọng: Piper vais1000, giọng Bắc, một người nữ. Không có giọng Nam. Thanh điệu và chất lượng chưa được kiểm tra.',
  audioPt: 'Giọng: Piper faber, tiếng Bồ Đào Nha Brasil. Chất lượng chưa được kiểm tra.',
  audioDe: 'Giọng: Piper thorsten, tiếng Đức của Đức, không phải tiếng Đức Thụy Sĩ. Chất lượng chưa được kiểm tra.',
  audioEn: 'Giọng: Piper LJSpeech, tiếng Anh (Mỹ). Chất lượng chưa được kiểm tra.',
  audioSynth: 'Không có tệp. Giọng trình duyệt. Giọng và chất lượng tuỳ máy, chưa được kiểm tra.',
  regionSouth: 'Nam, mặc định',
  regionNorth: 'Bắc, biến thể',
  addressTitle: 'Xưng hô',
  record: 'Ghi âm',
  stop: 'Dừng',
  playMine: 'Bản của tôi',
  playModel: 'Mẫu',
  micHint: 'Micro chỉ được hỏi bây giờ. Bản ghi ở trên máy này và không được tải lên.',
  micDenied: 'Không có micro. Không có gì được ghi.',
  pitchTitle: 'Đường thanh',
  pitchModel: 'Mẫu',
  pitchYou: 'Bạn',
  pitchCaveat:
    'Đường của mẫu lấy từ giọng TTS miền Bắc, không phải bản thu miền Nam đã kiểm tra. Lệch có thể do giọng mẫu.',
  pitchEmpty: 'Bản ghi ít đoạn có thanh.',
  pitchNoModel: 'Không có tệp âm thanh thì không có đường mẫu. Giọng trình duyệt không cho tín hiệu.',
  shape: {
    level: 'khá bằng',
    rising: 'khá lên',
    falling: 'khá xuống',
    dipping: 'khá có chỗ lõm',
    unknown: 'chưa rõ',
    similar: 'Hai đường gần nhau. Đây là gợi ý, không phải điểm.',
    apart: 'Hai đường lệch. Đây là gợi ý, không phải điểm.',
  },
  listen: 'Nghe',
  recall: 'Nhớ lại',
  listenPrompt: 'Nghe rồi chọn nghĩa.',
  recallPrompt: 'Bạn nói thế nào? Đáp án hiện sau khi bạn thử.',
  scratch: 'Ghi tạm nếu muốn. Chữ không được lưu.',
  reveal: 'Hiện đáp án',
  correct: 'Đúng.',
  wrong: 'Chưa đúng. Câu là:',
  next: 'Tiếp',
  again: 'Lại',
  hard: 'Khó',
  good: 'Tốt',
  easy: 'Dễ',
  sessionEmpty: 'Chưa có câu đến hạn. Mở một tình huống hoặc bắt đầu câu mới sau.',
  needPair: 'Hãy chọn một cặp ngôn ngữ trước.',
  progress: (index, total) => `${index} trên ${total}`,
  forOther: 'Cho người kia đọc',
  hideGloss: 'Ẩn nghĩa',
  showGloss: 'Hiện nghĩa',
  showNote: 'Hiện ghi chú cá nhân',
  hideNote: 'Ẩn ghi chú',
  cultureLead: 'Không phải quy tắc cho mọi người. Thường gặp, nhiều nơi, có nguồn.',
  sources: 'Nguồn',
  accessed: 'Đọc ngày',
  infoStale: 'Thẻ này hơn sáu tháng. Hãy xem lại nguồn.',
  settingsTitle: 'Cài đặt',
  uiLanguage: 'Ngôn ngữ giao diện',
  uiGerman: 'Tiếng Đức',
  uiSource: 'Ngôn ngữ xuất phát của cặp',
  viRegion: 'Tiếng Việt',
  retention: 'Mức nhớ',
  personalNote: 'Ghi chú cá nhân',
  personalNoteHelp: 'Chỉ trên máy này. Bản xuất chỉ có ghi chú khi đánh dấu. Hữu ích cho dị ứng ở chế độ đưa màn hình.',
  exportLabel: 'Xuất tiến độ',
  importLabel: 'Nhập tiến độ',
  importOk: 'Đã lưu bản nhập.',
  importBad: 'Tệp này không phải bản xuất hợp lệ của Travel Talk.',
  importNewer: 'Tệp từ phiên bản mới hơn – hãy cập nhật ứng dụng (tải lại trang)',
  importFuture: 'Tệp được xuất hơn một ngày trong tương lai. Hãy kiểm tra đồng hồ.',
  importSkipped: (count) =>
    count === 1 ? '1 thẻ không thuộc phiên bản này và không được lấy.' : `${count} thẻ không thuộc phiên bản này và không được lấy.`,
  importSummary: (cards, from, to, hasNote) => {
    const count = cards === 1 ? '1 thẻ.' : `${cards} thẻ.`
    const range = from && to ? ` Khoảng ${from} đến ${to}.` : ''
    const note = hasNote ? ' Có ghi chú.' : ' Không có ghi chú.'
    return `${count}${range}${note}`
  },
  importBackup: 'Bản sao theo ô xuất ghi chú. Không đánh dấu thì ghi chú chỉ ở trên máy này.',
  importNoteKept: 'Tệp không có ghi chú. Ghi chú trên máy này được giữ.',
  importNoteReplaced: 'Ghi chú trong tệp thay ghi chú trên máy này.',
  exportNote: 'Xuất kèm ghi chú',
  exportNoteHint: 'Ghi chú có thể chứa thông tin sức khoẻ, ví dụ dị ứng. Không đánh dấu thì ghi chú chỉ ở trên máy này.',
  confirmImport: 'Nhập',
  confirmReset: 'Xóa hẳn',
  cancel: 'Huỷ',
  resetAsk: 'Tiến độ trên máy này sẽ bị xoá. Màn hình này không lấy lại được.',
  backupDownload: 'Tải bản sao',
  voicesTitle: 'Giọng và giấy phép',
  voicesVi: 'Tiếng Việt dùng vais1000 từ bộ VAIS-1000, một giọng nữ miền Bắc. Thẻ mô hình ghi giọng này được tinh chỉnh từ lessac (giấy phép nghiên cứu).',
  voicesCc: 'CC BY 4.0',
  voicesSlow: '70 % và 85 % là tệp riêng (ffmpeg atempo). Độ cao giọng giữ nguyên. 100 % là tệp bình thường.',
  voicesNotice: 'NOTICE.txt',
  reset: 'Xóa tiến độ trên máy này',
  resetOk: 'Tiến độ trên máy đã được xoá.',
  persist: 'Xin trình duyệt giữ bộ nhớ',
  persistOk: 'Trình duyệt có thể giữ tiến độ trên máy.',
  persistNo: 'Trình duyệt không hứa điều đó. Hãy xuất thường xuyên.',
  privacy: 'Tiến độ, bản ghi và ghi chú ở trên máy này. Không tài khoản, không theo dõi, không phông từ mạng.',
  loading: 'Một lát.',
  storageError: 'Bộ nhớ trên máy không dùng được.',
  exampleAudio: 'Audio đọc câu ví dụ.',
  pairNote: 'Ghi chú của cặp này',
  noResults: 'Không thấy.',
  phrases: (count) => (count === 1 ? '1 câu' : `${count} câu`),
  learnToday: 'Học hôm nay',
  reviewCard: (count) => (count === 1 ? '1 câu đến hạn.' : `${count} câu đến hạn.`),
  reviewNone: 'Câu đến hạn. Hôm nay không có.',
  learnNew: 'Học câu mới',
  learnNewHint: 'Câu tiếp theo trong tình huống.',
  lookupCard: 'Tra cứu',
  lookupHint: 'Đọc câu, không kiểm tra.',
  showCard: 'Đưa',
  showHint: 'Chữ lớn cho người kia.',
  sessionLength: 'Một buổi ngắn, khoảng 8 phút. Rồi buổi học kết thúc.',
  onboardingKicker: 'Một lần lúc đầu',
  onboardingTitle: 'Hai ngôn ngữ',
  sameChoice: 'Cùng một lựa chọn',
  sameChoiceLead: 'Cùng chỗ như lúc đầu. Không có lựa chọn thứ hai trên câu.',
  appLangTitle: 'Ngôn ngữ của ứng dụng',
  appLangHint: 'Bạn đọc bằng ngôn ngữ này. Bản dịch cũng viết bằng ngôn ngữ này.',
  targetLangTitle: 'Ngôn ngữ bạn học',
  targetLangHint: 'Giọng nói nằm ở đây, và với tiếng Việt là dạng của từ.',
  scriptTitle: 'Chữ và từ',
  scriptHint: 'Chỉ vì ngôn ngữ bạn học là tiếng Việt. Đây không phải giọng nói.',
  voiceTitle: 'Giọng',
  voiceVi: 'Một giọng, nữ, miền Bắc',
  voiceEn: 'Một giọng, nữ',
  voiceDe: 'Một giọng',
  voicePt: 'Một giọng',
  voiceViNote: 'Một giọng. Ở đây không có giọng nam và không có giọng miền Nam với giấy phép rõ.',
  voiceEnNote: 'Một giọng, nữ. Giọng thứ hai chỉ sau khi có người nghe.',
  voicePlainNote: 'Một giọng. Nam hay nữ chỉ ghi ở đây khi nguồn nói rõ.',
  continueOn: 'Tiếp tục tới Học hôm nay',
  ifThen: 'Khi sáng uống cà phê, tôi mở Học hôm nay. Bạn có thể bỏ qua.',
  everyPair: 'Có câu cho mỗi cặp hai ngôn ngữ khác nhau.',
  missingLine: 'Câu này chưa có cho cặp ngôn ngữ này.',
  stepSlow: (index, total) => `Câu mới · ${index} / ${total} · chậm`,
  stepNormal: (index, total) => `Câu mới · ${index} / ${total} · bình thường`,
  stepRepeat: (index, total) => `Nhắc lại · ${index} / ${total}`,
  stepUnderstand: (index, total) => `Nghe · ${index} / ${total}`,
  stepRecall: (index, total) => `Nói · ${index} / ${total}`,
  visibleTitle: 'Câu vẫn hiện',
  recallTitle: 'Bạn nói thế nào?',
  newStays: 'Câu này mới. Bạn đọc theo trong lúc nghe.',
  sessionKicker: 'Buổi học',
  noReviewWasDue: 'Không có câu nào đến hạn ôn.',
  sessionNewCount: (count) => (count === 1 ? '1 câu mới.' : `${count} câu mới.`),
  playingSlow: 'Đang phát chậm.',
  playingNormal: 'Đang phát tốc độ bình thường.',
  replaySlow: 'Chậm thêm một lần',
  playNormal: 'Bây giờ tốc độ bình thường',
  playSlow: 'Nghe chậm',
  saidIt: 'Tôi đã nói',
  micSkipped: 'Không có micro thì không ghi âm. Bạn có thể tiếp tục.',
  meaningPrompt: 'Câu này nghĩa là gì?',
  afterChoice: 'Bạn chọn nghĩa. Sau đó bạn thấy lại dòng đúng, với cùng âm thanh.',
  rateAgain: 'Ngay lần nữa',
  rateSoon: 'Sắp nữa',
  rateLater: 'Lát nữa',
  rateMuchLater: 'Lâu hơn nhiều',
  rateHint: 'Khoảng cách đến từ bộ lập lịch, không phải một câu cố định.',
  inMinutes: (count) => `trong ${count} phút`,
  inHours: (count) => `trong ${count} giờ`,
  inDays: (count) => `trong ${count} ngày`,
  tomorrow: 'ngày mai',
  sessionDone: 'Hôm nay xong',
  sessionCount: (count) => (count === 1 ? '1 câu.' : `${count} câu.`),
  tomorrowReviews: 'Ngày mai các câu này nằm ở Ôn lại.',
  anotherSession: 'Thêm một buổi ngắn',
  done: 'Xong',
  uncheckedCalm: 'Các câu chưa được người bản ngữ kiểm tra.',
  directionKept: 'Giao diện đã là tiếng Đức. Bài tập giữ ngôn ngữ xuất phát trước đó.',
  playing: 'Đang phát',
  lookupTitle: 'Tra cứu',
  noReviews: 'Không có câu ôn đến hạn.',
  noNewToday: 'Hôm nay không còn câu mới. Phần ôn nằm ở Ôn lại.',
  reviewTitle: 'Ôn lại',
  startLead: (fresh, due) => `${fresh === 1 ? '1 câu mới' : `${fresh} câu mới`}. ${due === 0 ? 'Không có ôn lại.' : `${due} câu ôn.`}`,
}

export const dictionaries = { de, en, 'pt-BR': pt, vi } as const
