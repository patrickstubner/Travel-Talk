export type Dictionary = {
  appName: string
  skip: string
  nav: { home: string; practice: string; show: string; culture: string; settings: string }
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
  schemaTitle: string
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
}

export const de: Dictionary = {
  appName: 'Travel Talk',
  skip: 'Zum Inhalt',
  nav: { home: 'Start', practice: 'Üben', show: 'Zeigen', culture: 'Kultur', settings: 'Einstellungen' },
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
  schemaTitle: 'Schema der fünf südlichen Töne, keine Aufnahme. hỏi und ngã fallen im Süden häufig zusammen.',
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
  version: 'Version 0.2.1',
  exampleAudio: 'Das Audio spricht den Beispielsatz.',
  pairNote: 'Hinweis zum Sprachpaar',
  noResults: 'Keine Treffer.',
  phrases: (count) => (count === 1 ? '1 Satz' : `${count} Sätze`),
}

export const en: Dictionary = {
  ...de,
  skip: 'Skip to content',
  nav: { home: 'Home', practice: 'Practice', show: 'Show', culture: 'Culture', settings: 'Settings' },
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
  schemaTitle: 'A schema of the five southern tones, not a recording. hỏi and ngã often fall together in the south.',
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
}

export const pt: Dictionary = {
  ...en,
  skip: 'Ir ao conteúdo',
  nav: { home: 'Início', practice: 'Praticar', show: 'Mostrar', culture: 'Cultura', settings: 'Ajustes' },
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
  schemaTitle: 'Um esquema dos cinco tons do sul, não uma gravação. hỏi e ngã muitas vezes se juntam no sul.',
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
}

export const vi: Dictionary = {
  ...en,
  skip: 'Tới nội dung',
  nav: { home: 'Đầu', practice: 'Luyện', show: 'Đưa', culture: 'Văn hoá', settings: 'Cài đặt' },
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
  schemaTitle: 'Sơ đồ năm thanh miền Nam, không phải bản thu. hỏi và ngã ở miền Nam thường nhập làm một.',
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
}

export const dictionaries = { de, en, 'pt-BR': pt, vi } as const
