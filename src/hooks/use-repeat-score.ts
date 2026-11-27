import { useEffect, useMemo, useState } from 'react'
import { splitWords } from '../../content/gloss'
import type { Lang } from '../../content/phrase'
import type { WordTime } from '../audio/align'
import { analyzeModel, analyzeUser, type ClipFeatures } from '../pitch/analyze'
import { analyzeModelCached, analyzeUserOnce, pitchWorker } from '../pitch/analyze-client'
import { analysisHop, type Contour } from '../pitch/contour'
import { scoreRepeat, type BarState, type RepeatScore } from '../pitch/feedback'
import { fiveStars, wordsBar, type Stars } from '../pitch/stars'
import { portugueseContentRate, wordErrorRate } from '../speech/text-match'
import { recognizeSpeech, speechModelsInThisRun, speechState, subscribeSpeech, type HeardSpeech } from '../speech/vosk'

/**
 * Pitch analysis. The default runs in the analysis worker and falls back to
 * the main thread. Tests inject a synchronous one.
 */
export type PitchAnalyzer = {
  model: (samples: Float32Array, rate: number) => ClipFeatures | Promise<ClipFeatures>
  user: (samples: Float32Array, rate: number, bands: ClipFeatures['bands'] | null) => ClipFeatures | Promise<ClipFeatures>
}

/** Local speech recognition. Null result means it failed or timed out. */
export type SpeechRecognizer = (lang: Lang, samples: Float32Array, rate: number, expected: string) => Promise<HeardSpeech | null>

export type ReferenceClip = { samples: Float32Array; sampleRate: number; words?: WordTime[] | null }

export type SpeechStatus = 'off' | 'pending' | 'ready' | 'failed'

export type RepeatScoreApi = {
  score: RepeatScore | null
  modelFeatures: ClipFeatures | null
  userFeatures: ClipFeatures | null
  /** Recognised text. Kept in memory only, never stored or exported. */
  heardText: string | null
  wer: number | null
  speech: SpeechStatus
  /** True while the recogniser is still working on this take. */
  speechPending: boolean
  /** True when the recogniser ran and gave no result. */
  speechFailed: boolean
  bars: { melody: BarState | null; rhythm: BarState | null; words: BarState | null }
  stars: Stars | null
}

export type RepeatScoreInput = {
  lang: Lang
  region: 'south' | 'north'
  speech: string
  words: WordTime[] | null
  modelSamples: Float32Array | null
  modelRate: number
  userSamples: Float32Array
  userRate: number
  referenceClips?: ReadonlyArray<ReferenceClip>
  analyzer?: PitchAnalyzer
  /** Null switches recognition off. Undefined uses Vosk when the run allows it. */
  recognizer?: SpeechRecognizer | null
}

const NO_REFERENCES: ReadonlyArray<ReferenceClip> = []

const workerAnalyzer: PitchAnalyzer = {
  model: async (samples, rate) => {
    try {
      return await analyzeModelCached(samples, rate)
    } catch {
      return analyzeModel(samples, rate)
    }
  },
  user: async (samples, rate, bands) => {
    try {
      return await analyzeUserOnce(samples, rate, bands)
    } catch {
      return analyzeUser(samples, rate, bands)
    }
  },
}

const syncAnalyzer: PitchAnalyzer = { model: analyzeModel, user: analyzeUser }

function defaultRecognizer(): SpeechRecognizer | null {
  return speechModelsInThisRun() ? recognizeSpeech : null
}

/**
 * Scoring for one repeat take: pitch analysis, optional local speech
 * recognition, the bars and the five stars. It draws nothing.
 */
export function useRepeatScore(input: RepeatScoreInput): RepeatScoreApi {
  const { lang, region, speech, words, modelSamples, modelRate, userSamples, userRate } = input
  const referenceClips = input.referenceClips ?? NO_REFERENCES
  const recognizer = input.recognizer === undefined ? defaultRecognizer() : input.recognizer
  const injected = input.analyzer
  const offThread = injected == null && pitchWorker() != null
  const analyzer = injected ?? (offThread ? workerAnalyzer : syncAnalyzer)
  const synchronous = injected == null && !offThread

  const [heard, setHeard] = useState<{ samples: Float32Array; text: string | null; confidence: number | null } | null>(null)
  const [modelPhase, setModelPhase] = useState(speechState(lang).phase)
  useEffect(() => subscribeSpeech(lang, (next) => setModelPhase(next.phase)), [lang])
  useEffect(() => {
    if (!recognizer) return undefined
    let cancel = false
    void recognizer(lang, userSamples, userRate, speech)
      .catch(() => null)
      .then((result) => {
        if (cancel) return
        setHeard({ samples: userSamples, text: result?.text ?? null, confidence: result?.confidence ?? null })
      })
    return () => {
      cancel = true
    }
  }, [lang, recognizer, speech, userRate, userSamples])

  const syncModel = useMemo(
    () => (synchronous && modelSamples && modelRate > 0 ? analyzeModel(modelSamples, modelRate) : null),
    [modelRate, modelSamples, synchronous],
  )
  const syncUser = useMemo(
    () => (synchronous && userRate > 0 ? analyzeUser(userSamples, userRate, syncModel?.bands ?? null) : null),
    [synchronous, syncModel, userRate, userSamples],
  )
  const [remote, setRemote] = useState<{ model: ClipFeatures | null; user: ClipFeatures | null } | null>(null)
  useEffect(() => {
    if (synchronous) return undefined
    let cancel = false
    setRemote(null)
    const run = async () => {
      const model = modelSamples && modelRate > 0 ? await analyzer.model(modelSamples, modelRate) : null
      if (cancel) return
      const user = userRate > 0 ? await analyzer.user(userSamples, userRate, model?.bands ?? null) : null
      if (!cancel) setRemote({ model, user })
    }
    void run().catch(() => {
      if (!cancel) setRemote({ model: null, user: null })
    })
    return () => {
      cancel = true
    }
  }, [analyzer, modelRate, modelSamples, synchronous, userRate, userSamples])
  const modelFeatures = synchronous ? syncModel : (remote?.model ?? null)
  const userFeatures = synchronous ? syncUser : (remote?.user ?? null)

  const [referenceContours, setReferenceContours] = useState<Array<{ contour: Contour; sampleRate: number; words: WordTime[] | null }>>([])
  useEffect(() => {
    if (referenceClips.length === 0) {
      setReferenceContours((current) => (current.length === 0 ? current : []))
      return undefined
    }
    let cancel = false
    const run = async () => {
      const contours: Array<{ contour: Contour; sampleRate: number; words: WordTime[] | null }> = []
      for (const clip of referenceClips) {
        if (!(clip.sampleRate > 0) || clip.samples.length === 0) continue
        let features: ClipFeatures
        try {
          features = await analyzer.model(clip.samples, clip.sampleRate)
        } catch {
          features = analyzeModel(clip.samples, clip.sampleRate)
        }
        if (cancel) return
        contours.push({ contour: features.contour, sampleRate: clip.sampleRate, words: clip.words ?? null })
      }
      if (!cancel) setReferenceContours(contours)
    }
    void run()
    return () => {
      cancel = true
    }
  }, [analyzer, referenceClips])

  const score = useMemo<RepeatScore | null>(() => {
    if (!modelFeatures || !userFeatures || modelRate <= 0 || userRate <= 0) return null
    const labels = splitWords(speech)
    const timed = words && words.length === labels.length ? words.map((word, index) => ({ ...word, text: labels[index] ?? '' })) : null
    return scoreRepeat({
      model: modelFeatures.contour,
      user: userFeatures.contour,
      modelHop: analysisHop(modelRate),
      userHop: analysisHop(userRate),
      words: timed,
      lang,
      region,
      userDuration: userSamples.length / userRate,
      modelEnergy: modelFeatures.energy,
      userEnergy: userFeatures.energy,
      modelBands: modelFeatures.bands,
      userBands: userFeatures.bands,
      userPlainBands: userFeatures.plainBands,
      modelSpeechBands: modelFeatures.speechBands,
      userSpeechBands: userFeatures.speechBands,
      references: referenceContours.map((reference) => ({
        contour: reference.contour,
        hop: analysisHop(reference.sampleRate),
        words: reference.words,
      })),
    })
  }, [lang, modelFeatures, modelRate, referenceContours, region, speech, userFeatures, userRate, userSamples, words])

  const speechKnown = heard?.samples === userSamples
  const heardText = speechKnown ? (heard?.text ?? null) : null
  const wer =
    heardText == null
      ? null
      : lang === 'pt-BR'
        ? portugueseContentRate(speech, heardText, heard?.confidence)
        : wordErrorRate(speech, heardText)
  const speechStatus: SpeechStatus = !recognizer ? 'off' : speechKnown ? (heardText == null ? 'failed' : 'ready') : 'pending'
  const speechPending = speechStatus === 'pending'
  const speechFailed = speechStatus === 'failed' && modelPhase !== 'failed'

  const coloured = score?.words?.some((word) => word.color != null) ?? false
  const melody = score?.melodyBar ?? null
  const rhythm = score?.rhythmBar ?? null
  const showBars = Boolean(melody && rhythm && coloured)
  const verdict = score?.verdict ?? null
  const words3 = wordsBar(wer)
  const stars =
    showBars && verdict
      ? fiveStars({ melody, rhythm, words: words3, verdict, backwards: score?.sentenceCheck?.backwards ?? false, lang })
      : null

  return {
    score,
    modelFeatures,
    userFeatures,
    heardText,
    wer,
    speech: speechStatus,
    speechPending,
    speechFailed,
    bars: { melody: showBars ? melody : null, rhythm: showBars ? rhythm : null, words: words3 },
    stars,
  }
}
