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
  tempoSlow: string
  tempoNormal: string
  speedAutoHint: (percent: number) => string
  speedFixedHint: (percent: number) => string
  speedShown: (percent: number) => string
  unchecked: string
  audioVi: string
  audioViMale: string
  audioPt: string
  audioPtMale: string
  audioPtDaisy: string
  audioPtGracie: string
  audioPtTammie: string
  audioPtClaribel: string
  audioDe: string
  audioDeHigh: string
  audioDeFemale: string
  audioEn: string
  audioEnMale: string
  audioOffline: string
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
  pitchEmpty: string
  pitchNoModel: string
  repeatFeedback: {
    melody: string
    rhythm: string
    pass: string
    part: string
    off: string
    stars: (count: number) => string
    starsInfo: string
    starsTitle: string
    starsHint: string
    barsFit: string
    unclear: string
    noWordTimes: string
    tooShort: string
    quiet: string
    file: string
    otherSentence: string
    few: string
    modelGap: (word: string) => string
    again: string
    sequential: string
    backSentence: string
    back: string
    northern: string
    toneTap: string
    creak: string
    target: string
    you: { rising: string; falling: string; level: string; dipping: string }
    should: { rising: string; falling: string; level: string; dipping: string }
    expect: { rising: string; falling: string; level: string; dipping: string }
    tone: { ngang: string; huyen: string; sac: string; hoi: string; nga: string; nang: string }
    toneShape: { ngang: string; huyen: string; sac: string; hoi: string; nga: string; nang: string }
  }
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
  study: {
    info: string
    title: string
    learned: (sentences: number, words: number) => string
    reviewed: (count: number) => string
    kept: (percent: number) => string
    learnedLabel: string
    reviewedLabel: string
    keptLabel: string
    learnedHint: string
    reviewedHint: string
    keptHint: string
  }
  forOther: string
  showPurpose: string
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
  voicesNc: string
  voicesChanged: string
  offlineLoad: string
  offlineReload: string
  highlightTitle: string
  highlightHint: string
  skipWords: string
  skipWordsRemember: string
  skipWordsInfo: string
  skipWordsTitle: string
  skipWordsHint: string
  skipWordsSetting: string
  wordDots: string
  glossUnchecked: string
  offlineReady: string
  offlineRetry: string
  offlineFull: string
  offlineKeep: string
  offlineMissing: (count: number) => string
  offlineProgress: (have: number, total: number) => string
  voicesSlow: string
  voicesNotice: string
  reset: string
  resetOk: string
  persist: string
  persistOk: string
  persistNo: string
  installHome: string
  installIos: string
  privacy: string
  loading: string
  speechProgress: (percent: number) => string
  speechFallback: string
  storageError: string
  version: string
  exampleAudio: string
  aboutLine: string
  infoOpen: string
  infoClose: string
  readAloud: string
  readAloudStop: string
  pairNote: string
  noResults: string
  phrases: (count: number) => string
  learnToday: string
  wordsFirst: string
  wordPrompt: string
  wordIntro: string
  wordIntroStep: (index: number, total: number) => string
  wordGloss: string
  wordIpa: string
  wordReplay: string
  wordSpeedTitle: string
  wordSpeedHint: string
  wordRight: string
  wordWrong: (meaning: string) => string
  todayWords: (count: number) => string
  sentencesAfterWords: (count: number) => string
  missingWord: (word: string) => string
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
  targetLangBody: string
  sameLangHint: string
  notSelected: string
  scriptTitle: string
  scriptHint: string
  voiceTitle: string
  voiceMann1: string
  voiceMann2: string
  voiceFrauNorth: string
  voiceMann: string
  voiceFrau: string
  voiceFrauDaisy: string
  voiceFrauGracie: string
  voiceFrauTammie: string
  voiceFrauClaribel: string
  voiceMannHigh: string
  voiceMannMid: string
  voicePreview: string
  voiceViNote: string
  voiceEnNote: string
  voiceDeNote: string
  voicePtNote: string
  voiceHint: string
  voiceHintClose: string
  cardsReset: (count: number) => string
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
  startLead: (fresh: number, due: number, afterWords?: number) => string
  whoKicker: string
  whoTitle: string
  whoCount: (count: number) => string
  whoShared: string
  personAdd: string
  personNameAsk: string
  personNameHint: string
  personNameEmpty: string
  personGone: string
  personSave: string
  personRename: string
  personDelete: string
  personDeleteAsk: string
  personLimit: string
  personLevel: string
  personLearns: (language: string) => string
  personNoLang: string
  exportAll: string
  importReplace: string
  importAdd: string
  importAddName: string
  importReplaceAll: string
  importAllAsk: string
  importAllNotesCleared: string
  importAllNotesReplaced: string
  importAllConfirmTitle: string
  importAllConfirmBody: string
  importAllConfirm: string
  exportAllHint: string
  importPeople: (count: number) => string
  moreTarget: string
  moreTargetHint: string
  resetPerson: string
  resetPersonAsk: string
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
  tempoSlow: 'Langsam',
  tempoNormal: 'Normal',
  speedAutoHint: (percent) =>
    `Automatisch, dieser Satz mit ${percent} %. Neue und unsichere Sätze starten bei 70 % und steigen nach sicheren Wiederholungen auf 85 % und dann auf 100 %. Eine feste Stufe hier gilt für alles Audio, bis du wieder Automatisch wählst.`,
  speedFixedHint: (percent) => `Fest ${percent} % für alles Audio, bis du wieder Automatisch wählst.`,
  speedShown: (percent) => `Tempo ${percent} %`,
  unchecked: 'Noch nicht geprüft',
  audioVi:
    'Stimme: Piper vais1000, nördlicher Akzent, eine Sprecherin. Töne und Qualität sind nicht geprüft.',
  audioViMale:
    'Stimme: Piper vivos, Mann, Qualität sehr niedrig. Der Akzent steht nicht in der Modellkarte. Töne und Qualität sind nicht geprüft.',
  audioPt: 'Stimme: Piper faber, Mann, Portugiesisch (Brasilien). Die Modellkarte nennt das Geschlecht nicht. Der Datensatz nennt einen Sprecher. Qualität nicht geprüft.',
  audioPtMale: 'Stimme: Piper cadu, Mann, Portugiesisch (Brasilien). Qualität nicht geprüft.',
  audioPtDaisy: 'Stimme: XTTS-v2, Daisy Studious, Frau, Portugiesisch. CPML, nur nicht kommerziell. Qualität nicht geprüft.',
  audioPtGracie: 'Stimme: XTTS-v2, Gracie Wise, Frau, Portugiesisch. CPML, nur nicht kommerziell. Qualität nicht geprüft.',
  audioPtTammie: 'Stimme: XTTS-v2, Tammie Ema, Frau, Portugiesisch. CPML, nur nicht kommerziell. Qualität nicht geprüft.',
  audioPtClaribel: 'Stimme: XTTS-v2, Claribel Dervla, Frau, Portugiesisch, Versuch. CPML, nur nicht kommerziell. Qualität nicht geprüft.',
  audioDe: 'Stimme: Piper thorsten, mittlere Qualität, Mann. Deutsch aus Deutschland, nicht Schweizerdeutsch. Qualität nicht geprüft.',
  audioDeHigh: 'Stimme: Piper thorsten, hohe Qualität, Mann. Deutsch aus Deutschland, nicht Schweizerdeutsch. Qualität nicht geprüft.',
  audioDeFemale:
    'Stimme: Piper mls, Sprecherin 4576, Frau, mittlere Qualität. Deutsch aus Deutschland, nicht Schweizerdeutsch. Multilingual LibriSpeech, CC BY 4.0. Qualität nicht geprüft.',
  audioEn: 'Stimme: Piper LJSpeech, Frau, Englisch (USA). Qualität nicht geprüft.',
  audioEnMale: 'Stimme: Piper joe, Mann, Englisch (USA). Qualität nicht geprüft.',
  audioOffline: 'Stimme offline nicht geladen',
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
  pitchEmpty: 'In der Aufnahme war zu wenig stimmhafte Tonhöhe.',
  pitchNoModel: 'Ohne Audiodatei gibt es keine Modellkurve.',
  repeatFeedback: {
    melody: 'Melodie',
    rhythm: 'Rhythmus',
    pass: 'passt',
    part: 'teilweise',
    off: 'daneben',
    stars: (count) => `${count} von 5 Sternen`,
    starsInfo: 'Was die Sterne bedeuten',
    starsTitle: 'Sterne',
    starsHint:
      'Fünf Sterne nur, wenn der Satz passt und die Melodie grün ist. Ein falscher Satz oder Unsinn bekommt höchstens einen Stern. Ein Satz, der passt oder teilweise ist, bekommt mindestens zwei. Sind die Wörter richtig und die Melodie schwach, sind es drei. Sind die Wörter richtig und die Melodie gut, sind es vier, und fünf, wenn Satz und Melodie beide grün sind. Liegt die Tonhöhe nahe an der Datei, bleibt Deutsch ohne grünen Balken bei zwei. Rückwärts keinen. Ein falscher Satz bekommt nie fünf. Auf Portugiesisch gelten die Wörter, sobald die Spracherkennung da ist.',
    barsFit: 'Vier Sterne. Die Balken passen, der Satz noch nicht ganz.',
    unclear: 'Das lässt sich nicht zuordnen. Sprich in derselben Richtung wie die Datei, ohne lange Pause davor.',
    noWordTimes: 'Für diese Stimme gibt es keine Wortzeiten. Die Kurve bleibt, die Wörter bleiben grau.',
    tooShort: 'Zu kurz. Sprich den ganzen Satz.',
    quiet: 'Zu leise. Geh näher ans Mikrofon und sprich noch einmal.',
    file: 'In dieser Datei ist zu wenig Stimme. Nochmal ändert daran nichts.',
    otherSentence: 'Das klingt nach einem anderen Satz. Hör die Datei noch einmal und sprich denselben.',
    few: 'Nur ein Teil der Wörter ist bewertet. Die Balken gelten für diesen Teil.',
    modelGap: (word) => `In der Datei hat «${word}» zu wenig Stimme. Nochmal ändert daran nichts.`,
    again: 'Nochmal',
    sequential: 'Nacheinander. Beide laufen nicht zugleich.',
    backSentence: 'Zurück zum Satz',
    back: 'Zurück',
    northern: 'Nördliche Stimme. Ein Hinweis, keine Note.',
    toneTap: 'Tippe den Tonhinweis, wenn du die sechs Formen sehen willst.',
    creak: 'Knarrlaut bei ngã und nặng sieht die Kurve nicht. Im Süden sind hỏi und ngã ein Ton.',
    target: 'Soll',
    you: {
      rising: 'Du bist gestiegen.',
      falling: 'Du bist gefallen.',
      level: 'Du bist eben geblieben.',
      dipping: 'Du bist in eine Senke gegangen.',
    },
    should: {
      rising: 'Der Ton sollte steigen.',
      falling: 'Der Ton sollte fallen.',
      level: 'Der Ton sollte eben bleiben.',
      dipping: 'Der Ton sollte eine Senke machen.',
    },
    expect: {
      rising: 'sollte steigen',
      falling: 'sollte fallen',
      level: 'sollte eben bleiben',
      dipping: 'sollte eine Senke machen',
    },
    tone: { ngang: 'ngang', huyen: 'huyền', sac: 'sắc', hoi: 'hỏi', nga: 'ngã', nang: 'nặng' },
    toneShape: { ngang: 'eben', huyen: 'fallend', sac: 'steigend', hoi: 'Senke', nga: 'Knarr', nang: 'schwer' },
  },
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
  study: {
    info: 'Was die Balken bedeuten',
    title: 'Lernstand',
    learned: (sentences, words) =>
      `${sentences === 1 ? '1 Satz' : `${sentences} Sätze`} und ${words === 1 ? '1 Wort' : `${words} Wörter`} gelernt`,
    reviewed: (count) => `${count} heute wiederholt`,
    kept: (percent) => `${percent} Prozent behalten`,
    learnedLabel: 'Gelernt',
    reviewedLabel: 'Heute',
    keptLabel: 'Behalten',
    learnedHint:
      'Der erste Balken zählt Sätze und Wörter, die mindestens einmal bewertet wurden. Türkis sind Sätze, Grün sind Wörter. Die Zahl ist die Summe.',
    reviewedHint:
      'Der zweite Balken zählt Karten, die schon bekannt waren und heute noch einmal drankamen. Der erste Kontakt an diesem Tag zählt nicht als Wiederholung.',
    keptHint:
      'Der dritte Balken ist der Anteil der gelernten Karten im Wiederholungszustand. Das ist keine Note für die Aussprache. Nichts davon verlässt das Gerät.',
  },
  forOther: 'Für die andere Person',
  showPurpose:
    'Zeigen stellt einen Satz gross auf den Bildschirm, damit du ihn jemandem hinhältst, zum Beispiel im Notfall oder in der Apotheke, und das Audio lässt sich abspielen.',
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
  voicesVi:
    'Neue Nutzer starten mit einer Männerstimme. Die bisherige Stimme bleibt, bis du wechselst. Vietnamesisch: vais1000 (Datensatz CC BY 4.0, Frau, Norden; das Modell ist von lessac feinjustiert) und vivos (CC BY-NC-SA 4.0, Männer, Qualität niedrig, von Grund auf trainiert). Das erzeugte vivos-Audio steht unter derselben Lizenz. Deutsch thorsten, Portugiesisch cadu und faber, Englisch joe: der Datensatz ist CC0, die Stimme nicht. Sie ist von lessac feinjustiert, und lessac gilt nur für Forschung. Deutsch hat zusätzlich eine Frau, mls 4576, aus Multilingual LibriSpeech, CC BY 4.0, von Grund auf trainiert. LJSpeech ist gemeinfrei und von Grund auf trainiert. Namensnennung steht in NOTICE.txt. Portugiesisch hat vier weitere Frauen aus XTTS-v2 (coqui/XTTS-v2, CPML, nur nicht kommerziell). Claribel ist ein Versuch. Der Standard bleibt cadu.',
  voicesCc: 'CC BY 4.0',
  voicesNc: 'CC BY-NC-SA 4.0',
  voicesChanged: 'Das Material wurde verändert.',
  offlineLoad: 'Für offline laden',
  offlineReload: 'Für offline noch nicht vollständig geladen',
  highlightTitle: 'Wörter mitlaufen lassen',
  highlightHint: 'Während die Stimme spielt, wird das Wort markiert. Darunter steht eine Wortzuordnung. Sie ist nicht geprüft.',
  skipWords: 'Wörter überspringen',
  skipWordsRemember: 'Für mich merken',
  skipWordsInfo: 'Was Überspringen bedeutet',
  skipWordsTitle: 'Wörter überspringen',
  skipWordsHint:
    'Die Wörter dieser Sitzung werden ausgelassen. Sie zählen nicht als gelernt und nicht als falsch. Ein Satz, der so ein Wort braucht, bleibt zu.',
  skipWordsSetting: 'Wörter vor den Sätzen überspringen',
  wordDots: 'Eine punktierte Linie zeigt ein Wort, das zur Übersetzung darunter gehört. Ein Wort ohne Linie hat keine Zuordnung.',
  glossUnchecked: 'Die Wortzuordnung ist nicht geprüft.',
  offlineReady: 'offline bereit',
  offlineRetry: 'Erneut versuchen',
  offlineFull: 'Der Speicher ist voll. Die Stimme ist nicht vollständig geladen.',
  offlineKeep: 'Bisherige Stimme behalten',
  offlineMissing: (count) => (count === 1 ? '1 Datei fehlt' : `${count} Dateien fehlen`),
  offlineProgress: (have, total) => `${have}/${total}`,
  voicesSlow: '70 % und 85 % sind eigene Dateien (ffmpeg atempo). Die Tonhöhe bleibt erhalten. 100 % ist die normale Datei.',
  voicesNotice: 'NOTICE.txt',
  reset: 'Lernstand auf diesem Gerät löschen',
  resetOk: 'Der lokale Lernstand ist gelöscht.',
  persist: 'Speicher behalten anfragen',
  persistOk: 'Der Browser darf den lokalen Lernstand behalten.',
  persistNo: 'Der Browser hat das nicht zugesichert. Exportiere regelmässig.',
  installHome: 'Zum Home-Bildschirm',
  installIos: 'Tippe auf Teilen, dann auf «Zum Home-Bildschirm».',
  privacy:
    'Lernstand, Aufnahmen und die Notiz bleiben auf diesem Gerät. Kein Konto, kein Tracking, keine Schrift aus dem Netz.',
  loading: 'Einen Moment.',
  speechProgress: (percent) => `Spracherkennung für Portugiesisch, ${percent} Prozent.`,
  speechFallback: 'Die Spracherkennung fehlt. Es gilt die Wertung ohne die Wörter.',
  storageError: 'Der lokale Speicher ist nicht verfügbar.',
  version: 'Version 0.11.0',
  exampleAudio: 'Das Audio spricht den Beispielsatz.',
  aboutLine: 'Zum Satz',
  infoOpen: 'Erklärungen zum Satz',
  infoClose: 'Schliessen',
  readAloud: 'Vorlesen',
  readAloudStop: 'Stopp',
  pairNote: 'Hinweis zum Sprachpaar',
  noResults: 'Keine Treffer.',
  phrases: (count) => (count === 1 ? '1 Satz' : `${count} Sätze`),
  learnToday: 'Heute lernen',
  wordsFirst: 'Zuerst die Wörter von heute.',
  wordPrompt: 'Was bedeutet das Wort?',
  wordIntro: 'Neues Wort',
  wordIntroStep: (index, total) => `Hören · ${index} von ${total}`,
  wordGloss: 'Bedeutung',
  wordIpa: 'IPA',
  wordReplay: 'Noch einmal hören',
  wordSpeedTitle: 'Tempo der Wörter',
  wordSpeedHint: 'Gilt für einzelne Wörter dieser Person und bleibt gespeichert. Sätze behalten ihr Tempo.',
  wordRight: 'Das stimmt.',
  wordWrong: (meaning) => `Gemeint ist «${meaning}».`,
  todayWords: (count) => (count === 1 ? '1 neues Wort.' : `${count} neue Wörter.`),
  sentencesAfterWords: (count) => (count === 1 ? 'Bis zu 1 neuer Satz nach den Wörtern' : `Bis zu ${count} neue Sätze nach den Wörtern`),
  missingWord: (word) => `Der nächste Satz wartet auf «${word}».`,
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
  onboardingTitle: 'Deine Sprache und die, die du lernen willst',
  sameChoice: 'Dieselbe Wahl',
  sameChoiceLead: 'Deine Sprache steht hier. Die Sprache, die du lernen willst, steht oben.',
  appLangTitle: 'Sprache der App',
  appLangHint: 'Deine Sprache. Die Seiten und die Übersetzungen sind darin.',
  targetLangTitle: 'Sprache, die du lernen willst',
  targetLangHint: 'Die Sprache, die du lernen willst, steht oben in der Mitte. Das ist nicht deine Sprache. Hier bleibt die Stimme.',
  targetLangBody: 'Die Sprache, die du lernen willst. Das ist nicht die Sprache der Seiten.',
  sameLangHint: 'Das ist dieselbe Sprache. Wähl eine andere.',
  notSelected: 'nicht gewählt',
  scriptTitle: 'Schrift und Wörter',
  scriptHint: 'Nur weil die Lernsprache Vietnamesisch ist. Das ist nicht die Stimme.',
  voiceTitle: 'Stimme',
  voiceMann1: 'Mann 1',
  voiceMann2: 'Mann 2',
  voiceFrauNorth: 'Frau (Norden)',
  voiceMann: 'Mann',
  voiceFrau: 'Frau',
  voiceFrauDaisy: 'Frau (Daisy)',
  voiceFrauGracie: 'Frau (Gracie)',
  voiceFrauTammie: 'Frau (Tammie)',
  voiceFrauClaribel: 'Frau (Claribel)',
  voiceMannHigh: 'Mann (hoch)',
  voiceMannMid: 'Mann (mittel)',
  voicePreview: 'Hörprobe',
  voiceViNote: 'Zwei Männerstimmen, Qualität sehr niedrig. Der Akzent steht nicht in der Modellkarte. Die Frau ist nördlich.',
  voiceEnNote: 'Mann oder Frau. Englisch aus den USA.',
  voiceDeNote: 'Ein Mann, hohe oder mittlere Qualität, oder eine Frau. Deutsch aus Deutschland, nicht Schweizerdeutsch.',
  voicePtNote: 'Zwei Männerstimmen, cadu bleibt der Standard. Bei der zweiten Stimme nennt die Modellkarte das Geschlecht nicht. Der Datensatz nennt einen Sprecher. Vier Frauen von XTTS-v2, Sprache pt, CPML, nur nicht kommerziell. Claribel ist ein Versuch. Der Akzent ist nicht geprüft.',
  voiceHint: 'Es gibt jetzt Männerstimmen. Die bisherige Stimme bleibt ausgewählt.',
  voiceHintClose: 'Verstanden',
  cardsReset: (count) => (count === 1 ? '1 Karte zurückgesetzt.' : `${count} Karten zurückgesetzt.`),
  continueOn: 'Weiter zu Heute lernen',
  ifThen: 'Wenn ich morgens Kaffee trinke, öffne ich Heute lernen. Das kannst du überspringen.',
  everyPair: 'Sätze gibt es für jede Kombination aus zwei verschiedenen Sprachen.',
  missingLine: 'Für diese Kombination gibt es den Satz noch nicht.',
  stepSlow: (index, total) => `Neuer Satz · ${index} von ${total}`,
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
  startLead: (fresh, due, afterWords = 0) =>
    `${fresh === 0 && afterWords > 0 ? (afterWords === 1 ? 'Bis zu 1 neuer Satz nach den Wörtern' : `Bis zu ${afterWords} neue Sätze nach den Wörtern`) : fresh === 1 ? '1 neuer Satz' : `${fresh} neue Sätze`}. ${due === 0 ? 'Keine Wiederholung.' : due === 1 ? '1 Wiederholung.' : `${due} Wiederholungen.`}`,
  whoKicker: 'Auf diesem Gerät',
  whoTitle: 'Wer lernt?',
  whoCount: (count) => `${count === 1 ? 'Eine' : count === 2 ? 'Zwei' : String(count)} von zehn. Der Name bleibt auf diesem Gerät. Stimmen und Audiodateien sind gemeinsam.`,
  whoShared: 'Gemeinsam, nicht pro Person kopiert: geladene Stimmen, Audiodateien, die Sätze im Programm.',
  personAdd: 'Person hinzufügen',
  personNameAsk: 'Wie sollen wir dich nennen?',
  personNameHint: 'Ein Kosename reicht. Der Name bleibt auf diesem Gerät.',
  personNameEmpty: 'Der Name braucht ein sichtbares Zeichen.',
  personGone: 'Diese Person ist nicht mehr da.',
  personSave: 'Weiter',
  personRename: 'Umbenennen',
  personDelete: 'Person löschen',
  personDeleteAsk: 'Der Lernstand dieser Person wird gelöscht. Die anderen Personen bleiben. Eine Stimme, die niemand mehr benutzt, wird aus dem Offline-Speicher genommen.',
  personLimit: 'Zehn Personen. Mehr geht auf diesem Gerät nicht.',
  personLevel: 'Stufe 0',
  personLearns: (language) => `lernt ${language}`,
  personNoLang: 'Sprachen fehlen noch',
  exportAll: 'Alle Personen exportieren',
  importReplace: 'Diese Person ersetzen',
  importAdd: 'Als neue Person',
  importAddName: 'Name der neuen Person',
  importReplaceAll: 'Alle Personen ersetzen',
  importAllAsk: 'Das ersetzt alle Personen auf diesem Gerät. Die Datei wird erst nach dieser Bestätigung geschrieben.',
  importAllNotesCleared: 'Die Datei enthält keine Notiz. Die Notizen aller Personen auf diesem Gerät werden überschrieben.',
  importAllNotesReplaced: 'Die Notizen in der Datei ersetzen die Notizen aller Personen auf diesem Gerät.',
  importAllConfirmTitle: 'Alle Personen ersetzen?',
  importAllConfirmBody: 'Die Personen auf diesem Gerät werden gelöscht und durch die Datei ersetzt. Das lässt sich hier nicht rückgängig machen.',
  importAllConfirm: 'Ja, alle ersetzen',
  exportAllHint: 'Alle Personen exportieren bleibt aus, solange eine Person keinen Namen oder nicht beide Sprachen hat.',
  importPeople: (count) => (count === 1 ? '1 Person.' : `${count} Personen.`),
  moreTarget: 'Weitere Lernsprache',
  moreTargetHint: 'Heute lernen übt eine Lernsprache. Die neuen Karten des Tages zählen alle Lernsprachen dieser Person zusammen.',
  resetPerson: 'Lernstand dieser Person löschen',
  resetPersonAsk: 'Der Lernstand dieser Person wird gelöscht. Die anderen Personen bleiben. Das kann hier nicht zurückgeholt werden.',
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
  tempoSlow: 'Slow',
  tempoNormal: 'Normal',
  speedAutoHint: (percent) =>
    `Automatic, this line at ${percent} %. New and shaky lines start at 70 % and step up to 85 % and then 100 % after reliable reviews. A fixed step here applies to all audio until you choose Automatic again.`,
  speedFixedHint: (percent) => `Fixed at ${percent} % for all audio until you choose Automatic again.`,
  speedShown: (percent) => `Speed ${percent} %`,
  unchecked: 'Not checked yet',
  audioVi: 'Voice: Piper vais1000, northern accent, one woman. Tones and quality are not checked.',
  audioViMale:
    'Voice: Piper vivos, a man, very low quality. The accent is not on the model card. Tones and quality are not checked.',
  audioPt: 'Voice: Piper faber, a man, Brazilian Portuguese. The model card does not state the gender. The dataset calls the speaker male. Quality not checked.',
  audioPtMale: 'Voice: Piper cadu, a man, Brazilian Portuguese. Quality not checked.',
  audioPtDaisy: 'Voice: XTTS-v2, Daisy Studious, a woman, Portuguese. CPML, non-commercial only. Quality not checked.',
  audioPtGracie: 'Voice: XTTS-v2, Gracie Wise, a woman, Portuguese. CPML, non-commercial only. Quality not checked.',
  audioPtTammie: 'Voice: XTTS-v2, Tammie Ema, a woman, Portuguese. CPML, non-commercial only. Quality not checked.',
  audioPtClaribel: 'Voice: XTTS-v2, Claribel Dervla, a woman, Portuguese, a trial. CPML, non-commercial only. Quality not checked.',
  audioDe: 'Voice: Piper thorsten, medium quality, a man. German from Germany, not Swiss German. Quality not checked.',
  audioDeHigh: 'Voice: Piper thorsten, high quality, a man. German from Germany, not Swiss German. Quality not checked.',
  audioDeFemale:
    'Voice: Piper mls, speaker 4576, a woman, medium quality. German from Germany, not Swiss German. Multilingual LibriSpeech, CC BY 4.0. Quality not checked.',
  audioEn: 'Voice: Piper LJSpeech, a woman, English (US). Quality not checked.',
  audioEnMale: 'Voice: Piper joe, a man, English (US). Quality not checked.',
  audioOffline: 'Voice not loaded for offline',
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
  pitchEmpty: 'The recording had too little voiced pitch.',
  pitchNoModel: 'Without an audio file there is no model curve.',
  repeatFeedback: {
    melody: 'Melody',
    rhythm: 'Rhythm',
    pass: 'fits',
    part: 'partly',
    off: 'off',
    stars: (count) => `${count} of 5 stars`,
    starsInfo: 'What the stars mean',
    starsTitle: 'Stars',
    starsHint:
      'Five stars only when the sentence fits and the melody bar is green. A wrong sentence or nonsense gets at most one star. A sentence that fits or partly fits gets at least two. Right words and a weak melody are three. Right words and a good melody are four, and five when the sentence and the melody are both green. When the pitch is close to the file, German with no green bar stays at two. Spoken backwards gets none. A wrong sentence never gets five. In Portuguese the page reads the words when speech recognition is here.',
    barsFit: 'Four stars. The bars fit, the sentence does not quite.',
    unclear: 'This cannot be lined up. Speak in the same direction as the file, without a long pause first.',
    noWordTimes: 'This voice has no word timings. The curve stays, and the words stay grey.',
    tooShort: 'Too short. Say the whole sentence.',
    quiet: 'Too quiet. Move closer to the microphone and try again.',
    file: 'This file has too little voice. Another take will not change that.',
    otherSentence: 'That sounds like a different sentence. Listen to the file again and say the same one.',
    few: 'Only part of the words could be scored. The bars cover that part.',
    modelGap: (word) => `«${word}» has too little voice in the file. Another take will not change that.`,
    again: 'Once more',
    sequential: 'One after the other. The two do not play together.',
    backSentence: 'Back to the sentence',
    back: 'Back',
    northern: 'Northern voice. A hint, not a grade.',
    toneTap: 'Tap the tone hint if you want to see the six forms.',
    creak: 'The curve does not see the creak in ngã and nặng. In the south, hỏi and ngã are one tone.',
    target: 'Target',
    you: {
      rising: 'You rose.',
      falling: 'You fell.',
      level: 'You stayed level.',
      dipping: 'You went into a dip.',
    },
    should: {
      rising: 'The tone should rise.',
      falling: 'The tone should fall.',
      level: 'The tone should stay level.',
      dipping: 'The tone should dip.',
    },
    expect: {
      rising: 'should rise',
      falling: 'should fall',
      level: 'should stay level',
      dipping: 'should dip',
    },
    tone: { ngang: 'ngang', huyen: 'huyền', sac: 'sắc', hoi: 'hỏi', nga: 'ngã', nang: 'nặng' },
    toneShape: { ngang: 'level', huyen: 'falling', sac: 'rising', hoi: 'dip', nga: 'creak', nang: 'heavy' },
  },
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
  study: {
    info: 'What the bars mean',
    title: 'Progress',
    learned: (sentences, words) =>
      `${sentences === 1 ? '1 sentence' : `${sentences} sentences`} and ${words === 1 ? '1 word' : `${words} words`} learned`,
    reviewed: (count) => `${count} reviewed today`,
    kept: (percent) => `${percent} percent retained`,
    learnedLabel: 'Learned',
    reviewedLabel: 'Today',
    keptLabel: 'Kept',
    learnedHint:
      'The first bar counts sentences and words rated at least once. Teal is sentences, green is words. The number is the sum.',
    reviewedHint: 'The second bar counts cards that were already known and came up again today. The first meeting that day is not a review.',
    keptHint:
      'The third bar is the share of learned cards in the review state. It is not a grade for pronunciation. None of this leaves the device.',
  },
  forOther: 'For the other person',
  showPurpose:
    'Show puts a phrase large on the screen so you can hold it up to someone else, for example in an emergency or at a pharmacy, and the audio can be played.',
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
  voicesVi:
    'New users start with a male voice. The previous voice stays until you change it. Vietnamese: vais1000 (dataset CC BY 4.0, woman, north; the model is fine-tuned from lessac) and vivos (CC BY-NC-SA 4.0, men, low quality, trained from scratch). The generated vivos audio is under the same licence. German thorsten, Brazilian cadu and faber, and English joe: the dataset is CC0, the voice is not. It is fine-tuned from lessac, and lessac is research-only. German also has a woman, mls 4576, from Multilingual LibriSpeech, CC BY 4.0, trained from scratch. LJSpeech is public domain and trained from scratch. Attribution is in NOTICE.txt. Brazilian Portuguese has four more women from XTTS-v2 (coqui/XTTS-v2, CPML, non-commercial only). Claribel is a trial. The default stays cadu.',
  voicesCc: 'CC BY 4.0',
  voicesNc: 'CC BY-NC-SA 4.0',
  voicesChanged: 'The material was changed.',
  offlineLoad: 'Load for offline',
  offlineReload: 'Not fully loaded for offline yet',
  highlightTitle: 'Follow the words',
  highlightHint: 'While the voice plays, the word is marked. Under the line is a word-by-word gloss. It has not been checked.',
  skipWords: 'Skip the words',
  skipWordsRemember: 'Remember for me',
  skipWordsInfo: 'What skipping does',
  skipWordsTitle: 'Skip the words',
  skipWordsHint:
    'The words in this sitting are left out. They are not counted as learned or as wrong. A line that needs one of those words stays closed.',
  skipWordsSetting: 'Skip the words before the lines',
  wordDots: 'A dotted line marks a word that belongs to the translation underneath. A word with no line has no match.',
  glossUnchecked: 'The word links have not been checked.',
  offlineReady: 'ready offline',
  offlineRetry: 'Try again',
  offlineFull: 'Storage is full. The voice is not fully loaded.',
  offlineKeep: 'Keep the previous voice',
  offlineMissing: (count) => (count === 1 ? '1 file is missing' : `${count} files are missing`),
  offlineProgress: (have, total) => `${have}/${total}`,
  voicesSlow: '70 % and 85 % are their own files (ffmpeg atempo). The pitch stays the same. 100 % is the normal file.',
  voicesNotice: 'NOTICE.txt',
  reset: 'Delete progress on this device',
  resetOk: 'Local progress was deleted.',
  persist: 'Ask to keep storage',
  persistOk: 'The browser may keep the local progress.',
  persistNo: 'The browser did not promise that. Export regularly.',
  installHome: 'Add to Home Screen',
  installIos: 'Tap Share, then Add to Home Screen.',
  privacy: 'Progress, recordings and the note stay on this device. No account, no tracking, no font from the network.',
  loading: 'One moment.',
  speechProgress: (percent) => `Portuguese speech recognition, ${percent} percent.`,
  speechFallback: 'Speech recognition is missing. The score stays without the words.',
  storageError: 'Local storage is not available.',
  version: 'Version 0.11.0',
  exampleAudio: 'The audio speaks the example sentence.',
  aboutLine: 'About this line',
  infoOpen: 'Notes about this line',
  infoClose: 'Close',
  readAloud: 'Read aloud',
  readAloudStop: 'Stop',
  pairNote: 'Note for this pair',
  noResults: 'No matches.',
  phrases: (count) => (count === 1 ? '1 line' : `${count} lines`),
  learnToday: 'Learn today',
  wordsFirst: 'The words for today come first.',
  wordPrompt: 'What does the word mean?',
  wordIntro: 'New word',
  wordIntroStep: (index, total) => `Listen · ${index} of ${total}`,
  wordGloss: 'Meaning',
  wordIpa: 'IPA',
  wordReplay: 'Hear it again',
  wordSpeedTitle: 'Word speed',
  wordSpeedHint: 'Applies to single words for this person and stays saved. Sentences keep their speed.',
  wordRight: 'That is the one.',
  wordWrong: (meaning) => `The meaning is «${meaning}».`,
  todayWords: (count) => (count === 1 ? '1 new word.' : `${count} new words.`),
  sentencesAfterWords: (count) => (count === 1 ? 'Up to 1 new line after the words' : `Up to ${count} new lines after the words`),
  missingWord: (word) => `The next line is waiting for «${word}».`,
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
  onboardingTitle: 'Your language and the one you want to learn',
  sameChoice: 'The same choice',
  sameChoiceLead: 'Your language is here. The language you want to learn is at the top.',
  appLangTitle: 'App language',
  appLangHint: 'Your language. The screens and the translations use it.',
  targetLangTitle: 'Language you want to learn',
  targetLangHint: 'The language you want to learn is at the top. It is not your language. The voice stays here.',
  targetLangBody: 'The language you want to learn. It is not the language of the screens.',
  sameLangHint: 'That is the same language. Choose another one.',
  notSelected: 'not selected',
  scriptTitle: 'Script and words',
  scriptHint: 'Only because the language you learn is Vietnamese. This is not the voice.',
  voiceTitle: 'Voice',
  voiceMann1: 'Man 1',
  voiceMann2: 'Man 2',
  voiceFrauNorth: 'Woman (north)',
  voiceMann: 'Man',
  voiceFrau: 'Woman',
  voiceFrauDaisy: 'Woman (Daisy)',
  voiceFrauGracie: 'Woman (Gracie)',
  voiceFrauTammie: 'Woman (Tammie)',
  voiceFrauClaribel: 'Woman (Claribel)',
  voiceMannHigh: 'Man (high)',
  voiceMannMid: 'Man (medium)',
  voicePreview: 'Preview',
  voiceViNote: 'Two male voices, very low quality. The accent is not on the model card. The woman is northern.',
  voiceEnNote: 'A man or a woman. English from the US.',
  voiceDeNote: 'A man, high or medium quality, or a woman. German from Germany, not Swiss German.',
  voicePtNote: 'Two male voices, and cadu stays the default. The second voice\'s model card does not state the gender. The dataset calls the speaker male. Four women from XTTS-v2, language pt, CPML, non-commercial only. Claribel is a trial. The accent is not checked.',
  voiceHint: 'Male voices are available now. Your current voice stays selected.',
  voiceHintClose: 'Got it',
  cardsReset: (count) => (count === 1 ? '1 card was reset.' : `${count} cards were reset.`),
  continueOn: 'Continue to Learn today',
  ifThen: 'When I have coffee in the morning, I open Learn today. You can skip this.',
  everyPair: 'There is a line for every combination of two different languages.',
  missingLine: 'This line is not available for this combination yet.',
  stepSlow: (index, total) => `New line · ${index} of ${total}`,
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
  startLead: (fresh, due, afterWords = 0) =>
    `${fresh === 0 && afterWords > 0 ? (afterWords === 1 ? 'Up to 1 new line after the words' : `Up to ${afterWords} new lines after the words`) : fresh === 1 ? '1 new line' : `${fresh} new lines`}. ${due === 0 ? 'No review.' : due === 1 ? '1 review.' : `${due} reviews.`}`,
  whoKicker: 'On this device',
  whoTitle: 'Who is learning?',
  whoCount: (count) => `${count} of ten. The name stays on this device. Voices and audio are shared.`,
  whoShared: 'Shared, not copied per person: downloaded voices, audio files, the sentences in the app.',
  personAdd: 'Add a person',
  personNameAsk: 'What should we call you?',
  personNameHint: 'A short name is enough. It stays on this device.',
  personNameEmpty: 'The name needs a visible character.',
  personGone: 'That person is no longer here.',
  personSave: 'Continue',
  personRename: 'Rename',
  personDelete: 'Delete person',
  personDeleteAsk: 'This person\'s progress is deleted. The others stay. A voice nobody still uses is removed from offline storage.',
  personLimit: 'Ten people. This device cannot hold more.',
  personLevel: 'Stage 0',
  personLearns: (language) => `learning ${language}`,
  personNoLang: 'Languages not chosen yet',
  exportAll: 'Export every person',
  importReplace: 'Replace this person',
  importAdd: 'Add as a new person',
  importAddName: 'Name of the new person',
  importReplaceAll: 'Replace every person',
  importAllAsk: 'This replaces every person on this device. Nothing is written until you confirm.',
  importAllNotesCleared: 'The file has no note. The notes of every person on this device are overwritten.',
  importAllNotesReplaced: 'The notes in the file replace the notes of every person on this device.',
  importAllConfirmTitle: 'Replace every person?',
  importAllConfirmBody: 'The people on this device are deleted and replaced by the file. This cannot be undone here.',
  importAllConfirm: 'Yes, replace everyone',
  exportAllHint: 'Export every person stays off while any person has no name or is missing either language.',
  importPeople: (count) => (count === 1 ? '1 person.' : `${count} people.`),
  moreTarget: 'Another language to learn',
  moreTargetHint: 'Today practises one language. The day’s new cards count every language this person learns.',
  resetPerson: 'Delete this person\'s progress',
  resetPersonAsk: 'This person\'s progress is deleted. The others stay. This screen cannot bring it back.',
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
  tempoSlow: 'Devagar',
  tempoNormal: 'Normal',
  speedAutoHint: (percent) =>
    `Automático, esta frase em ${percent} %. Frases novas ou pouco firmes começam em 70 % e sobem para 85 % e depois 100 % depois de revisões seguras. Um passo fixo aqui vale para todo o áudio, até você escolher Automático de novo.`,
  speedFixedHint: (percent) => `Fixo em ${percent} % para todo o áudio, até você escolher Automático de novo.`,
  speedShown: (percent) => `Velocidade ${percent} %`,
  unchecked: 'Ainda não revisado',
  audioVi: 'Voz: Piper vais1000, sotaque do norte, uma mulher. Tons e qualidade não foram revisados.',
  audioViMale:
    'Voz: Piper vivos, homem, qualidade muito baixa. O sotaque não está no cartão do modelo. Tons e qualidade não foram revisados.',
  audioPt: 'Voz: Piper faber, homem, português do Brasil. O cartão do modelo não diz o gênero. O conjunto chama o falante de homem. Qualidade não revisada.',
  audioPtMale: 'Voz: Piper cadu, homem, português do Brasil. Qualidade não revisada.',
  audioPtDaisy: 'Voz: XTTS-v2, Daisy Studious, mulher, português. CPML, só não comercial. Qualidade não revisada.',
  audioPtGracie: 'Voz: XTTS-v2, Gracie Wise, mulher, português. CPML, só não comercial. Qualidade não revisada.',
  audioPtTammie: 'Voz: XTTS-v2, Tammie Ema, mulher, português. CPML, só não comercial. Qualidade não revisada.',
  audioPtClaribel: 'Voz: XTTS-v2, Claribel Dervla, mulher, português, ensaio. CPML, só não comercial. Qualidade não revisada.',
  audioDe: 'Voz: Piper thorsten, qualidade média, homem. Alemão da Alemanha, não suíço-alemão. Qualidade não revisada.',
  audioDeHigh: 'Voz: Piper thorsten, qualidade alta, homem. Alemão da Alemanha, não suíço-alemão. Qualidade não revisada.',
  audioDeFemale:
    'Voz: Piper mls, falante 4576, mulher, qualidade média. Alemão da Alemanha, não suíço-alemão. Multilingual LibriSpeech, CC BY 4.0. Qualidade não revisada.',
  audioEn: 'Voz: Piper LJSpeech, mulher, inglês (EUA). Qualidade não revisada.',
  audioEnMale: 'Voz: Piper joe, homem, inglês (EUA). Qualidade não revisada.',
  audioOffline: 'Voz não carregada para offline',
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
  pitchEmpty: 'A gravação tinha pouca voz com tom.',
  pitchNoModel: 'Sem arquivo de áudio não há curva do modelo.',
  repeatFeedback: {
    melody: 'Melodia',
    rhythm: 'Ritmo',
    pass: 'encaixa',
    part: 'em parte',
    off: 'fora',
    stars: (count) => `${count} de 5 estrelas`,
    starsInfo: 'O que as estrelas significam',
    starsTitle: 'Estrelas',
    starsHint:
      'Cinco estrelas só quando a frase encaixa e a melodia está verde. Uma frase errada ou bobagem fica em no máximo uma estrela. Uma frase que encaixa ou encaixa em parte fica em pelo menos duas. Palavras certas e melodia fraca: três. Palavras certas e melodia boa: quatro, e cinco quando a frase e a melodia estão verdes. Quando o tom está perto do arquivo, o alemão sem barra verde fica em duas. Ao contrário, nenhuma. Uma frase errada nunca ganha cinco. Em português a página lê as palavras quando o reconhecimento de fala está aqui.',
    barsFit: 'Quatro estrelas. As barras encaixam, a frase ainda não.',
    unclear: 'Não dá para alinhar. Fale na mesma direção do arquivo, sem uma pausa longa antes.',
    noWordTimes: 'Esta voz não tem os tempos das palavras. A curva fica, e as palavras ficam cinza.',
    tooShort: 'Curto demais. Fale a frase inteira.',
    quiet: 'Baixo demais. Chegue mais perto do microfone e tente de novo.',
    file: 'Neste arquivo há pouca voz. Outra tentativa não muda o arquivo.',
    otherSentence: 'Parece outra frase. Ouça o arquivo de novo e fale a mesma.',
    few: 'Só uma parte das palavras foi avaliada. As barras valem para essa parte.',
    modelGap: (word) => `«${word}» tem pouca voz no arquivo. Outra tentativa não muda o arquivo.`,
    again: 'De novo',
    sequential: 'Um depois do outro. Os dois não tocam juntos.',
    backSentence: 'Voltar à frase',
    back: 'Voltar',
    northern: 'Voz do norte. Um aviso, não uma nota.',
    toneTap: 'Toque no aviso de tom para ver as seis formas.',
    creak: 'A curva não vê o rangido de ngã e nặng. No sul, hỏi e ngã são um tom.',
    target: 'Alvo',
    you: {
      rising: 'Você subiu.',
      falling: 'Você desceu.',
      level: 'Você ficou plano.',
      dipping: 'Você fez uma descida.',
    },
    should: {
      rising: 'O tom deveria subir.',
      falling: 'O tom deveria cair.',
      level: 'O tom deveria ficar plano.',
      dipping: 'O tom deveria fazer uma descida.',
    },
    expect: {
      rising: 'deveria subir',
      falling: 'deveria cair',
      level: 'deveria ficar plano',
      dipping: 'deveria fazer uma descida',
    },
    tone: { ngang: 'ngang', huyen: 'huyền', sac: 'sắc', hoi: 'hỏi', nga: 'ngã', nang: 'nặng' },
    toneShape: { ngang: 'plano', huyen: 'caindo', sac: 'subindo', hoi: 'descida', nga: 'rangido', nang: 'pesado' },
  },
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
  study: {
    info: 'O que as barras significam',
    title: 'Progresso',
    learned: (sentences, words) =>
      `${sentences === 1 ? '1 frase' : `${sentences} frases`} e ${words === 1 ? '1 palavra' : `${words} palavras`} aprendidas`,
    reviewed: (count) => `${count} revisadas hoje`,
    kept: (percent) => `${percent} por cento retidas`,
    learnedLabel: 'Aprendidas',
    reviewedLabel: 'Hoje',
    keptLabel: 'Retidas',
    learnedHint:
      'A primeira barra conta frases e palavras avaliadas pelo menos uma vez. Verde-azulado são frases, verde são palavras. O número é a soma.',
    reviewedHint:
      'A segunda barra conta cartões que já eram conhecidos e voltaram hoje. O primeiro contato nesse dia não conta como revisão.',
    keptHint:
      'A terceira barra é a parte dos cartões aprendidos no estado de revisão. Não é uma nota de pronúncia. Nada disso sai do aparelho.',
  },
  forOther: 'Para a outra pessoa',
  showPurpose:
    'Mostrar põe uma frase grande na tela para você mostrar a outra pessoa, por exemplo numa emergência ou na farmácia, e o áudio pode ser tocado.',
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
  voicesVi:
    'Quem começa agora usa uma voz de homem. A voz anterior fica até você trocar. Vietnamita: vais1000 (conjunto CC BY 4.0, mulher, norte; o modelo vem de lessac) e vivos (CC BY-NC-SA 4.0, homens, qualidade baixa, treinado do zero). O áudio gerado de vivos fica na mesma licença. Alemão thorsten, português cadu e faber, e inglês joe: o conjunto é CC0, a voz não. Ela vem de lessac, e lessac vale só para pesquisa. O alemão também tem uma mulher, mls 4576, do Multilingual LibriSpeech, CC BY 4.0, treinada do zero. LJSpeech é domínio público e treinado do zero. A atribuição está em NOTICE.txt. Português do Brasil tem mais quatro mulheres do XTTS-v2 (coqui/XTTS-v2, CPML, só não comercial). Claribel é um ensaio. O padrão continua cadu.',
  voicesCc: 'CC BY 4.0',
  voicesNc: 'CC BY-NC-SA 4.0',
  voicesChanged: 'O material foi alterado.',
  offlineLoad: 'Carregar para offline',
  offlineReload: 'Ainda não está completo para offline',
  highlightTitle: 'Acompanhar as palavras',
  highlightHint: 'Enquanto a voz toca, a palavra fica marcada. Abaixo está a relação entre as palavras. Ela não foi revista.',
  skipWords: 'Pular as palavras',
  skipWordsRemember: 'Lembrar para mim',
  skipWordsInfo: 'O que pular significa',
  skipWordsTitle: 'Pular as palavras',
  skipWordsHint:
    'As palavras desta sessão ficam de fora. Elas não contam como aprendidas nem como erradas. Uma frase que precisa de uma dessas palavras continua fechada.',
  skipWordsSetting: 'Pular as palavras antes das frases',
  wordDots: 'Uma linha pontilhada mostra uma palavra que tem par na tradução abaixo. Uma palavra sem linha não tem par.',
  glossUnchecked: 'A relação entre as palavras não foi revista.',
  offlineReady: 'pronto offline',
  offlineRetry: 'Tentar de novo',
  offlineFull: 'O armazenamento está cheio. A voz não foi carregada por completo.',
  offlineKeep: 'Manter a voz anterior',
  offlineMissing: (count) => (count === 1 ? '1 arquivo falta' : `${count} arquivos faltam`),
  offlineProgress: (have, total) => `${have}/${total}`,
  voicesSlow: '70 % e 85 % são arquivos próprios (ffmpeg atempo). O tom fica igual. 100 % é o arquivo normal.',
  voicesNotice: 'NOTICE.txt',
  reset: 'Apagar o progresso neste aparelho',
  resetOk: 'O progresso local foi apagado.',
  persist: 'Pedir para manter o armazenamento',
  persistOk: 'O navegador pode manter o progresso local.',
  persistNo: 'O navegador não garantiu isso. Exporte com regularidade.',
  installHome: 'Adicionar à Tela de Início',
  installIos: 'Toque em Compartilhar e depois em Adicionar à Tela de Início.',
  privacy: 'Progresso, gravações e a nota ficam neste aparelho. Sem conta, sem rastreamento, sem fonte da rede.',
  loading: 'Um momento.',
  speechProgress: (percent) => `Reconhecimento de fala em português, ${percent} por cento.`,
  speechFallback: 'O reconhecimento de fala não está aqui. A nota fica sem as palavras.',
  storageError: 'O armazenamento local não está disponível.',
  version: 'Version 0.11.0',
  exampleAudio: 'O áudio fala a frase de exemplo.',
  aboutLine: 'Sobre a frase',
  infoOpen: 'Notas sobre a frase',
  infoClose: 'Fechar',
  readAloud: 'Ler em voz alta',
  readAloudStop: 'Parar',
  pairNote: 'Nota deste par',
  noResults: 'Nenhum resultado.',
  phrases: (count) => (count === 1 ? '1 frase' : `${count} frases`),
  learnToday: 'Aprender hoje',
  wordsFirst: 'Primeiro as palavras de hoje.',
  wordPrompt: 'O que a palavra significa?',
  wordIntro: 'Palavra nova',
  wordIntroStep: (index, total) => `Ouvir · ${index} de ${total}`,
  wordGloss: 'Sentido',
  wordIpa: 'IPA',
  wordReplay: 'Ouvir de novo',
  wordSpeedTitle: 'Velocidade das palavras',
  wordSpeedHint: 'Vale para as palavras soltas desta pessoa e fica guardada. As frases mantêm a velocidade delas.',
  wordRight: 'É essa.',
  wordWrong: (meaning) => `O sentido é «${meaning}».`,
  todayWords: (count) => (count === 1 ? '1 palavra nova.' : `${count} palavras novas.`),
  sentencesAfterWords: (count) => (count === 1 ? 'Até 1 frase nova depois das palavras' : `Até ${count} frases novas depois das palavras`),
  missingWord: (word) => `A próxima frase espera «${word}».`,
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
  onboardingTitle: 'A sua língua e a que você quer aprender',
  sameChoice: 'A mesma escolha',
  sameChoiceLead: 'A sua língua fica aqui. A língua que você quer aprender fica em cima.',
  appLangTitle: 'Língua do aplicativo',
  appLangHint: 'A sua língua. As telas e as traduções estão nela.',
  targetLangTitle: 'Língua que você quer aprender',
  targetLangHint: 'A língua que você quer aprender fica em cima. Não é a sua língua. A voz fica aqui.',
  targetLangBody: 'A língua que você quer aprender. Não é a língua das telas.',
  sameLangHint: 'É a mesma língua. Escolha outra.',
  notSelected: 'não escolhida',
  scriptTitle: 'Escrita e palavras',
  scriptHint: 'Só porque a língua que você aprende é o vietnamita. Isso não é a voz.',
  voiceTitle: 'Voz',
  voiceMann1: 'Homem 1',
  voiceMann2: 'Homem 2',
  voiceFrauNorth: 'Mulher (norte)',
  voiceMann: 'Homem',
  voiceFrau: 'Mulher',
  voiceFrauDaisy: 'Mulher (Daisy)',
  voiceFrauGracie: 'Mulher (Gracie)',
  voiceFrauTammie: 'Mulher (Tammie)',
  voiceFrauClaribel: 'Mulher (Claribel)',
  voiceMannHigh: 'Homem (alta)',
  voiceMannMid: 'Homem (média)',
  voicePreview: 'Ouvir',
  voiceViNote: 'Duas vozes de homem, qualidade muito baixa. O sotaque não está no cartão do modelo. A mulher é do norte.',
  voiceEnNote: 'Homem ou mulher. Inglês dos EUA.',
  voiceDeNote: 'Um homem, qualidade alta ou média, ou uma mulher. Alemão da Alemanha, não suíço-alemão.',
  voicePtNote: 'Duas vozes de homem, e cadu continua o padrão. O cartão da segunda voz não diz o gênero. O conjunto chama o falante de homem. Quatro mulheres do XTTS-v2, idioma pt, CPML, só não comercial. Claribel é um ensaio. O sotaque não foi revisado.',
  voiceHint: 'Agora há vozes de homem. A voz de agora continua escolhida.',
  voiceHintClose: 'Entendi',
  cardsReset: (count) => (count === 1 ? '1 cartão foi zerado.' : `${count} cartões foram zerados.`),
  continueOn: 'Seguir para Aprender hoje',
  ifThen: 'Quando tomo café de manhã, abro Aprender hoje. Você pode pular isso.',
  everyPair: 'Há frases para cada combinação de duas línguas diferentes.',
  missingLine: 'Esta frase ainda não existe para esta combinação.',
  stepSlow: (index, total) => `Frase nova · ${index} de ${total}`,
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
  startLead: (fresh, due, afterWords = 0) =>
    `${fresh === 0 && afterWords > 0 ? (afterWords === 1 ? 'Até 1 frase nova depois das palavras' : `Até ${afterWords} frases novas depois das palavras`) : fresh === 1 ? '1 frase nova' : `${fresh} frases novas`}. ${due === 0 ? 'Nenhuma revisão.' : due === 1 ? '1 revisão.' : `${due} revisões.`}`,
  whoKicker: 'Neste aparelho',
  whoTitle: 'Quem aprende?',
  whoCount: (count) => `${count} de dez. O nome fica neste aparelho. Vozes e áudios são compartilhados.`,
  whoShared: 'Em comum, não copiado por pessoa: vozes baixadas, arquivos de áudio, as frases no programa.',
  personAdd: 'Adicionar pessoa',
  personNameAsk: 'Como devemos chamar você?',
  personNameHint: 'Um nome curto basta. O nome fica neste aparelho.',
  personNameEmpty: 'O nome precisa de um caractere visível.',
  personGone: 'Essa pessoa não está mais aqui.',
  personSave: 'Continuar',
  personRename: 'Mudar o nome',
  personDelete: 'Apagar pessoa',
  personDeleteAsk: 'O progresso desta pessoa é apagado. As outras ficam. Uma voz que ninguém mais usa sai do armazenamento offline.',
  personLimit: 'Dez pessoas. Este aparelho não guarda mais.',
  personLevel: 'Nível 0',
  personLearns: (language) => `aprende ${language}`,
  personNoLang: 'Línguas ainda não escolhidas',
  exportAll: 'Exportar todas as pessoas',
  importReplace: 'Substituir esta pessoa',
  importAdd: 'Como pessoa nova',
  importAddName: 'Nome da pessoa nova',
  importReplaceAll: 'Substituir todas as pessoas',
  importAllAsk: 'Isto substitui todas as pessoas neste aparelho. Nada é escrito antes desta confirmação.',
  importAllNotesCleared: 'O arquivo não tem nota. As notas de todas as pessoas neste aparelho são substituídas.',
  importAllNotesReplaced: 'As notas do arquivo substituem as notas de todas as pessoas neste aparelho.',
  importAllConfirmTitle: 'Substituir todas as pessoas?',
  importAllConfirmBody: 'As pessoas neste aparelho são apagadas e substituídas pelo arquivo. Isso não volta atrás aqui.',
  importAllConfirm: 'Sim, substituir todas',
  exportAllHint: 'Exportar todas as pessoas fica desligado enquanto uma pessoa não tem nome ou não tem as duas línguas.',
  importPeople: (count) => (count === 1 ? '1 pessoa.' : `${count} pessoas.`),
  moreTarget: 'Outra língua para aprender',
  moreTargetHint: 'Hoje pratica uma língua. Os cartões novos do dia contam todas as línguas desta pessoa.',
  resetPerson: 'Apagar o progresso desta pessoa',
  resetPersonAsk: 'O progresso desta pessoa é apagado. As outras ficam. Esta tela não o traz de volta.',
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
  tempoSlow: 'Chậm',
  tempoNormal: 'Bình thường',
  speedAutoHint: (percent) =>
    `Tự động, câu này ở ${percent} %. Câu mới hoặc chưa chắc bắt đầu ở 70 % và tăng lên 85 % rồi 100 % sau các lần nhớ chắc. Một mức cố định ở đây áp dụng cho mọi audio, cho đến khi bạn chọn Tự động.`,
  speedFixedHint: (percent) => `Cố định ${percent} % cho mọi audio, cho đến khi bạn chọn lại Tự động.`,
  speedShown: (percent) => `Tốc độ ${percent} %`,
  unchecked: 'Chưa được kiểm tra',
  audioVi: 'Giọng: Piper vais1000, giọng Bắc, một người nữ. Thanh điệu và chất lượng chưa được kiểm tra.',
  audioViMale:
    'Giọng: Piper vivos, nam, chất lượng rất thấp. Thẻ mô hình không ghi phương ngữ. Thanh điệu và chất lượng chưa được kiểm tra.',
  audioPt: 'Giọng: Piper faber, nam, tiếng Bồ Đào Nha Brasil. Thẻ mô hình không ghi giới tính. Bộ dữ liệu gọi người nói là nam. Chất lượng chưa được kiểm tra.',
  audioPtMale: 'Giọng: Piper cadu, nam, tiếng Bồ Đào Nha Brasil. Chất lượng chưa được kiểm tra.',
  audioPtDaisy: 'Giọng: XTTS-v2, Daisy Studious, nữ, tiếng Bồ Đào Nha. CPML, chỉ phi thương mại. Chất lượng chưa được kiểm tra.',
  audioPtGracie: 'Giọng: XTTS-v2, Gracie Wise, nữ, tiếng Bồ Đào Nha. CPML, chỉ phi thương mại. Chất lượng chưa được kiểm tra.',
  audioPtTammie: 'Giọng: XTTS-v2, Tammie Ema, nữ, tiếng Bồ Đào Nha. CPML, chỉ phi thương mại. Chất lượng chưa được kiểm tra.',
  audioPtClaribel: 'Giọng: XTTS-v2, Claribel Dervla, nữ, tiếng Bồ Đào Nha, thử. CPML, chỉ phi thương mại. Chất lượng chưa được kiểm tra.',
  audioDe: 'Giọng: Piper thorsten, chất lượng trung bình, nam. Tiếng Đức của Đức, không phải tiếng Đức Thụy Sĩ. Chất lượng chưa được kiểm tra.',
  audioDeHigh: 'Giọng: Piper thorsten, chất lượng cao, nam. Tiếng Đức của Đức, không phải tiếng Đức Thụy Sĩ. Chất lượng chưa được kiểm tra.',
  audioDeFemale:
    'Giọng: Piper mls, người nói 4576, nữ, chất lượng trung bình. Tiếng Đức của Đức, không phải tiếng Đức Thụy Sĩ. Multilingual LibriSpeech, CC BY 4.0. Chất lượng chưa được kiểm tra.',
  audioEn: 'Giọng: Piper LJSpeech, nữ, tiếng Anh (Mỹ). Chất lượng chưa được kiểm tra.',
  audioEnMale: 'Giọng: Piper joe, nam, tiếng Anh (Mỹ). Chất lượng chưa được kiểm tra.',
  audioOffline: 'Giọng chưa được tải để dùng offline',
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
  pitchEmpty: 'Bản ghi ít đoạn có thanh.',
  pitchNoModel: 'Không có tệp âm thanh thì không có đường mẫu.',
  repeatFeedback: {
    melody: 'Giai điệu',
    rhythm: 'Nhịp',
    pass: 'ổn',
    part: 'một phần',
    off: 'lệch',
    stars: (count) => `${count} trên 5 sao`,
    starsInfo: 'Sao có nghĩa là gì',
    starsTitle: 'Sao',
    starsHint:
      'Năm sao chỉ khi câu ổn và cột giai điệu xanh. Câu sai hoặc nói linh tinh nhiều nhất một sao. Câu ổn hoặc một phần thì ít nhất hai sao. Đúng từ mà giai điệu yếu là ba sao. Đúng từ và giai điệu tốt là bốn sao, và năm sao khi câu và giai điệu đều xanh. Khi đường thanh gần tệp, tiếng Đức không có cột xanh thì giữ hai sao. Nói ngược không có sao. Câu sai không bao giờ được năm sao. Với tiếng Bồ Đào Nha, trang đọc các từ khi có nhận dạng giọng nói.',
    barsFit: 'Bốn sao. Hai cột ổn, câu chưa hẳn.',
    unclear: 'Không xếp được. Nói cùng hướng với tệp, đừng dừng lâu trước khi nói.',
    noWordTimes: 'Giọng này không có thời điểm từng từ. Đường cong vẫn còn, các từ vẫn xám.',
    tooShort: 'Quá ngắn. Nói cả câu.',
    quiet: 'Quá nhỏ. Đưa lại gần micro và nói lại.',
    file: 'Tệp này ít thanh. Nói lại cũng không đổi tệp.',
    otherSentence: 'Nghe như một câu khác. Nghe lại tệp và nói đúng câu đó.',
    few: 'Chỉ một phần các từ được chấm. Cột chỉ tính phần đó.',
    modelGap: (word) => `«${word}» trong tệp ít thanh. Nói lại cũng không đổi.`,
    again: 'Lại',
    sequential: 'Lần lượt. Không phát cùng lúc.',
    backSentence: 'Về câu',
    back: 'Quay lại',
    northern: 'Giọng miền Bắc. Một gợi ý, không phải điểm.',
    toneTap: 'Chạm gợi ý thanh nếu bạn muốn xem sáu dạng.',
    creak: 'Đường cong không thấy tiếng ngắt của ngã và nặng. Ở miền Nam, hỏi và ngã là một thanh.',
    target: 'Đích',
    you: {
      rising: 'Bạn đã lên.',
      falling: 'Bạn đã xuống.',
      level: 'Bạn đã đi ngang.',
      dipping: 'Bạn đã xuống rồi lên.',
    },
    should: {
      rising: 'Thanh nên lên.',
      falling: 'Thanh nên xuống.',
      level: 'Thanh nên bằng.',
      dipping: 'Thanh nên lõm.',
    },
    expect: {
      rising: 'nên lên',
      falling: 'nên xuống',
      level: 'nên bằng',
      dipping: 'nên lõm',
    },
    tone: { ngang: 'ngang', huyen: 'huyền', sac: 'sắc', hoi: 'hỏi', nga: 'ngã', nang: 'nặng' },
    toneShape: { ngang: 'bằng', huyen: 'xuống', sac: 'lên', hoi: 'lõm', nga: 'ngắt', nang: 'nặng' },
  },
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
  study: {
    info: 'Các cột có nghĩa là gì',
    title: 'Tiến độ',
    learned: (sentences, words) => `${sentences} câu và ${words} từ đã học`,
    reviewed: (count) => `${count} ôn hôm nay`,
    kept: (percent) => `${percent} phần trăm còn nhớ`,
    learnedLabel: 'Đã học',
    reviewedLabel: 'Hôm nay',
    keptLabel: 'Còn nhớ',
    learnedHint: 'Cột thứ nhất đếm câu và từ đã được chấm ít nhất một lần. Xanh lam là câu, xanh lục là từ. Số là tổng.',
    reviewedHint: 'Cột thứ hai đếm thẻ đã biết và được ôn lại hôm nay. Lần gặp đầu trong ngày không tính là ôn.',
    keptHint: 'Cột thứ ba là phần thẻ đã học đang ở trạng thái ôn. Đó không phải điểm phát âm. Không có gì rời khỏi máy.',
  },
  forOther: 'Cho người kia đọc',
  showPurpose:
    'Chế độ Đưa hiển thị một câu lớn trên màn hình để bạn đưa cho người khác xem, ví dụ khi cấp cứu hoặc ở nhà thuốc, và có thể phát âm thanh.',
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
  voicesVi:
    'Người mới bắt đầu với giọng nam. Giọng cũ giữ nguyên cho đến khi đổi. Tiếng Việt: vais1000 (dữ liệu CC BY 4.0, nữ, miền Bắc; mô hình tinh chỉnh từ lessac) và vivos (CC BY-NC-SA 4.0, nam, chất lượng thấp, huấn luyện từ đầu). Audio tạo từ vivos cùng giấy phép đó. Tiếng Đức thorsten, tiếng Bồ Đào Nha cadu và faber, và tiếng Anh joe: bộ dữ liệu là CC0, bản thân giọng thì không. Giọng được tinh chỉnh từ lessac, và lessac chỉ dùng cho nghiên cứu. Tiếng Đức còn một giọng nữ, mls 4576, từ Multilingual LibriSpeech, CC BY 4.0, huấn luyện từ đầu. LJSpeech là phạm vi công cộng và huấn luyện từ đầu. Ghi nguồn nằm trong NOTICE.txt. Tiếng Bồ Đào Nha Brasil có thêm bốn giọng nữ từ XTTS-v2 (coqui/XTTS-v2, CPML, chỉ phi thương mại). Claribel là giọng thử. Mặc định vẫn là cadu.',
  voicesCc: 'CC BY 4.0',
  voicesNc: 'CC BY-NC-SA 4.0',
  voicesChanged: 'Tài liệu đã được thay đổi.',
  offlineLoad: 'Tải để dùng offline',
  offlineReload: 'Chưa tải đủ để dùng offline',
  highlightTitle: 'Theo từng tiếng',
  highlightHint: 'Khi giọng đọc, tiếng đang phát được đánh dấu. Bên dưới là nghĩa từng tiếng. Phần này chưa được kiểm tra.',
  skipWords: 'Bỏ qua các từ',
  skipWordsRemember: 'Nhớ cho tôi',
  skipWordsInfo: 'Bỏ qua nghĩa là gì',
  skipWordsTitle: 'Bỏ qua các từ',
  skipWordsHint:
    'Các từ của buổi này được bỏ qua. Chúng không tính là đã học và cũng không tính là sai. Câu nào cần một từ đó vẫn đóng.',
  skipWordsSetting: 'Bỏ qua các từ trước câu',
  wordDots: 'Đường chấm cho biết từ có nghĩa ở dòng dịch bên dưới. Từ không có đường chấm thì không có cặp.',
  glossUnchecked: 'Phần nối nghĩa từng tiếng chưa được kiểm tra.',
  offlineReady: 'sẵn sàng offline',
  offlineRetry: 'Thử lại',
  offlineFull: 'Bộ nhớ đã đầy. Giọng chưa được tải đủ.',
  offlineKeep: 'Giữ giọng trước',
  offlineMissing: (count) => (count === 1 ? 'Thiếu 1 tệp' : `Thiếu ${count} tệp`),
  offlineProgress: (have, total) => `${have}/${total}`,
  voicesSlow: '70 % và 85 % là tệp riêng (ffmpeg atempo). Độ cao giọng giữ nguyên. 100 % là tệp bình thường.',
  voicesNotice: 'NOTICE.txt',
  reset: 'Xóa tiến độ trên máy này',
  resetOk: 'Tiến độ trên máy đã được xoá.',
  persist: 'Xin trình duyệt giữ bộ nhớ',
  persistOk: 'Trình duyệt có thể giữ tiến độ trên máy.',
  persistNo: 'Trình duyệt không hứa điều đó. Hãy xuất thường xuyên.',
  installHome: 'Thêm vào Màn hình chính',
  installIos: 'Chạm Chia sẻ, rồi Thêm vào Màn hình chính.',
  privacy: 'Tiến độ, bản ghi và ghi chú ở trên máy này. Không tài khoản, không theo dõi, không phông từ mạng.',
  loading: 'Một lát.',
  speechProgress: (percent) => `Nhận dạng giọng nói tiếng Bồ Đào Nha, ${percent} phần trăm.`,
  speechFallback: 'Không có nhận dạng giọng nói. Điểm giữ cách cũ, không đọc từ.',
  storageError: 'Bộ nhớ trên máy không dùng được.',
  version: 'Version 0.11.0',
  exampleAudio: 'Audio đọc câu ví dụ.',
  aboutLine: 'Về câu này',
  infoOpen: 'Giải thích về câu này',
  infoClose: 'Đóng',
  readAloud: 'Đọc to',
  readAloudStop: 'Dừng',
  pairNote: 'Ghi chú của cặp này',
  noResults: 'Không thấy.',
  phrases: (count) => (count === 1 ? '1 câu' : `${count} câu`),
  learnToday: 'Học hôm nay',
  wordsFirst: 'Trước hết là từ của hôm nay.',
  wordPrompt: 'Từ này nghĩa là gì?',
  wordIntro: 'Từ mới',
  wordIntroStep: (index, total) => `Nghe · ${index} / ${total}`,
  wordGloss: 'Nghĩa',
  wordIpa: 'IPA',
  wordReplay: 'Nghe lại',
  wordSpeedTitle: 'Tốc độ của từ',
  wordSpeedHint: 'Áp dụng cho từ đơn của người này và được lưu. Câu giữ tốc độ riêng.',
  wordRight: 'Đúng rồi.',
  wordWrong: (meaning) => `Nghĩa là «${meaning}».`,
  todayWords: (count) => (count === 1 ? '1 từ mới.' : `${count} từ mới.`),
  sentencesAfterWords: (count) => `Tối đa ${count} câu mới sau các từ`,
  missingWord: (word) => `Câu tiếp theo chờ «${word}».`,
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
  onboardingTitle: 'Ngôn ngữ của bạn và ngôn ngữ bạn muốn học',
  sameChoice: 'Cùng một lựa chọn',
  sameChoiceLead: 'Ngôn ngữ của bạn ở đây. Ngôn ngữ bạn muốn học ở trên.',
  appLangTitle: 'Ngôn ngữ ứng dụng',
  appLangHint: 'Ngôn ngữ của bạn. Màn hình và bản dịch dùng ngôn ngữ này.',
  targetLangTitle: 'Ngôn ngữ bạn muốn học',
  targetLangHint: 'Ngôn ngữ bạn muốn học ở trên. Đây không phải ngôn ngữ của bạn. Giọng nói ở đây.',
  targetLangBody: 'Ngôn ngữ bạn muốn học. Đây không phải ngôn ngữ của màn hình.',
  sameLangHint: 'Đây là cùng một ngôn ngữ. Hãy chọn ngôn ngữ khác.',
  notSelected: 'chưa chọn',
  scriptTitle: 'Chữ và từ',
  scriptHint: 'Chỉ vì ngôn ngữ bạn học là tiếng Việt. Đây không phải giọng nói.',
  voiceTitle: 'Giọng',
  voiceMann1: 'Nam 1',
  voiceMann2: 'Nam 2',
  voiceFrauNorth: 'Nữ (miền Bắc)',
  voiceMann: 'Nam',
  voiceFrau: 'Nữ',
  voiceFrauDaisy: 'Nữ (Daisy)',
  voiceFrauGracie: 'Nữ (Gracie)',
  voiceFrauTammie: 'Nữ (Tammie)',
  voiceFrauClaribel: 'Nữ (Claribel)',
  voiceMannHigh: 'Nam (cao)',
  voiceMannMid: 'Nam (vừa)',
  voicePreview: 'Nghe thử',
  voiceViNote: 'Hai giọng nam, chất lượng rất thấp. Thẻ mô hình không ghi phương ngữ. Giọng nữ là miền Bắc.',
  voiceEnNote: 'Nam hoặc nữ. Tiếng Anh Mỹ.',
  voiceDeNote: 'Một giọng nam, chất lượng cao hoặc vừa, hoặc một giọng nữ. Tiếng Đức của Đức, không phải tiếng Đức Thụy Sĩ.',
  voicePtNote: 'Hai giọng nam, và cadu vẫn là mặc định. Thẻ của giọng thứ hai không ghi giới tính. Bộ dữ liệu gọi người nói là nam. Bốn giọng nữ từ XTTS-v2, ngôn ngữ pt, CPML, chỉ phi thương mại. Claribel là giọng thử. Giọng chưa được kiểm tra.',
  voiceHint: 'Đã có giọng nam. Giọng hiện tại vẫn được chọn.',
  voiceHintClose: 'Đã hiểu',
  cardsReset: (count) => (count === 1 ? '1 thẻ đã được đặt lại.' : `${count} thẻ đã được đặt lại.`),
  continueOn: 'Tiếp tục tới Học hôm nay',
  ifThen: 'Khi sáng uống cà phê, tôi mở Học hôm nay. Bạn có thể bỏ qua.',
  everyPair: 'Có câu cho mỗi cặp hai ngôn ngữ khác nhau.',
  missingLine: 'Câu này chưa có cho cặp ngôn ngữ này.',
  stepSlow: (index, total) => `Câu mới · ${index} / ${total}`,
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
  startLead: (fresh, due, afterWords = 0) =>
    `${fresh === 0 && afterWords > 0 ? `Tối đa ${afterWords} câu mới sau các từ` : fresh === 1 ? '1 câu mới' : `${fresh} câu mới`}. ${due === 0 ? 'Không có ôn lại.' : `${due} câu ôn.`}`,
  whoKicker: 'Trên máy này',
  whoTitle: 'Ai đang học?',
  whoCount: (count) => `${count} trong mười. Tên ở trên máy này. Giọng và tệp âm thanh dùng chung.`,
  whoShared: 'Dùng chung, không sao chép theo người: giọng đã tải, tệp âm thanh, các câu trong chương trình.',
  personAdd: 'Thêm người',
  personNameAsk: 'Chúng tôi nên gọi bạn là gì?',
  personNameHint: 'Một tên ngắn là đủ. Tên ở trên máy này.',
  personNameEmpty: 'Tên cần một ký tự nhìn thấy được.',
  personGone: 'Người này không còn ở đây.',
  personSave: 'Tiếp',
  personRename: 'Đổi tên',
  personDelete: 'Xoá người',
  personDeleteAsk: 'Tiến độ của người này bị xoá. Những người khác còn. Giọng không còn ai dùng thì bị lấy khỏi bộ nhớ ngoại tuyến.',
  personLimit: 'Mười người. Máy này không thêm được nữa.',
  personLevel: 'Bậc 0',
  personLearns: (language) => `học ${language}`,
  personNoLang: 'Chưa chọn ngôn ngữ',
  exportAll: 'Xuất mọi người',
  importReplace: 'Thay người này',
  importAdd: 'Thêm như người mới',
  importAddName: 'Tên người mới',
  importReplaceAll: 'Thay mọi người',
  importAllAsk: 'Việc này thay mọi người trên máy. Chưa ghi gì trước khi bạn xác nhận.',
  importAllNotesCleared: 'Tệp không có ghi chú. Ghi chú của mọi người trên máy này bị ghi đè.',
  importAllNotesReplaced: 'Ghi chú trong tệp thay ghi chú của mọi người trên máy này.',
  importAllConfirmTitle: 'Thay mọi người?',
  importAllConfirmBody: 'Mọi người trên máy này bị xoá và được thay bằng tệp. Không hoàn lại được ở đây.',
  importAllConfirm: 'Có, thay mọi người',
  exportAllHint: 'Xuất mọi người vẫn tắt khi còn người chưa có tên hoặc chưa có cả hai ngôn ngữ.',
  importPeople: (count) => (count === 1 ? '1 người.' : `${count} người.`),
  moreTarget: 'Thêm một ngôn ngữ để học',
  moreTargetHint: 'Hôm nay luyện một ngôn ngữ. Thẻ mới trong ngày tính mọi ngôn ngữ của người này.',
  resetPerson: 'Xoá tiến độ của người này',
  resetPersonAsk: 'Tiến độ của người này bị xoá. Những người khác còn. Màn hình này không lấy lại được.',
}

export const dictionaries = { de, en, 'pt-BR': pt, vi } as const
