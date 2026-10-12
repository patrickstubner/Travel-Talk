import { useEffect, useMemo, useRef, useState } from 'react'
import { splitWords } from '../../content/gloss'
import type { Lang } from '../../content/phrase'
import type { WordTime } from '../audio/align'
import { playSequence, stopSlices } from '../audio/slice'
import type { Dictionary } from '../i18n/dictionary'
import { analyzeModelCached, analyzeUserOnce, pitchWorker } from '../pitch/analyze-client'
import { analyzeModel, analyzeUser, type ClipFeatures } from '../pitch/analyze'
import { analysisHop, voicedValues, type Contour } from '../pitch/contour'
import {
  MIN_VOICED,
  SHORT_SECONDS,
  scoreRepeat,
  type Band,
  type BarState,
  type FeedbackWord,
  type RepeatScore,
  type ToneId,
  type ToneShape,
} from '../pitch/feedback'

const TONE_ORDER: ToneId[] = ['ngang', 'huyen', 'sac', 'hoi', 'nga', 'nang']

function drawPair(canvas: HTMLCanvasElement, model: Contour, user: Contour, wash: string): void {
  const context = canvas.getContext('2d')
  if (!context) return
  const width = canvas.width
  const height = canvas.height
  context.clearRect(0, 0, width, height)
  context.fillStyle = wash
  context.fillRect(0, 0, width, height)
  context.strokeStyle = '#e2d5c3'
  context.lineWidth = 1
  context.beginPath()
  context.moveTo(8, height / 2)
  context.lineTo(width - 8, height / 2)
  context.stroke()
  stroke(context, model, '#0e6b66', width, height)
  stroke(context, user, '#9c3b2e', width, height)
}

function stroke(context: CanvasRenderingContext2D, contour: Contour, color: string, width: number, height: number): void {
  if (!contour.some((value) => value != null)) return
  context.strokeStyle = color
  context.lineWidth = 3
  context.lineJoin = 'round'
  context.lineCap = 'round'
  context.beginPath()
  let started = false
  contour.forEach((value, index) => {
    if (value == null) {
      started = false
      return
    }
    const x = (index / Math.max(1, contour.length - 1)) * (width - 16) + 8
    const y = height / 2 - (value / 8) * (height / 2 - 10)
    if (!started) {
      context.moveTo(x, y)
      started = true
    } else context.lineTo(x, y)
  })
  context.stroke()
}

function wash(color: Band | null): string {
  if (color === 'red') return '#f8e4df'
  if (color === 'yellow') return '#f8efd8'
  if (color === 'green') return '#e7f4ee'
  return '#fffaf3'
}

function Curve({ model, user, color }: { model: Contour; user: Contour; color: Band | null }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (canvas) drawPair(canvas, model, user, wash(color))
  }, [color, model, user])
  return <canvas ref={ref} className="pitch-canvas" width={280} height={140} />
}

function barWidth(state: BarState): string {
  if (state === 'passt') return '100%'
  if (state === 'teilweise') return '62%'
  return '34%'
}

export function RepeatFeedback({
  copy,
  lang,
  region,
  speech,
  words,
  modelSamples,
  modelRate,
  userSamples,
  userRate,
  modelMissing,
  voiceId,
  timingsPending = false,
}: {
  copy: Dictionary
  lang: Lang
  region: 'south' | 'north'
  speech: string
  words: WordTime[] | null
  modelSamples: Float32Array | null
  modelRate: number
  userSamples: Float32Array
  userRate: number
  modelMissing: boolean
  voiceId: string
  /** True while the timing file is still loading. The missing-times line waits. */
  timingsPending?: boolean
}) {
  const [view, setView] = useState<'result' | 'word' | 'tones'>('result')
  const [selected, setSelected] = useState(0)
  const offThread = pitchWorker() != null
  const [remote, setRemote] = useState<{ model: ClipFeatures | null; user: ClipFeatures | null } | null>(null)
  const syncModel = useMemo(
    () => (!offThread && modelSamples && modelRate > 0 ? analyzeModel(modelSamples, modelRate) : null),
    [modelRate, modelSamples, offThread],
  )
  const syncUser = useMemo(
    () => (!offThread && userRate > 0 ? analyzeUser(userSamples, userRate, syncModel?.bands ?? null) : null),
    [offThread, syncModel, userRate, userSamples],
  )
  useEffect(() => {
    if (!offThread) return undefined
    let cancel = false
    setRemote(null)
    const run = async () => {
      try {
        const model = modelSamples && modelRate > 0 ? await analyzeModelCached(modelSamples, modelRate) : null
        if (cancel) return
        const user = userRate > 0 ? await analyzeUserOnce(userSamples, userRate, model?.bands ?? null) : null
        if (cancel) return
        setRemote({ model, user })
      } catch {
        if (cancel) return
        const model = modelSamples && modelRate > 0 ? analyzeModel(modelSamples, modelRate) : null
        const user = userRate > 0 ? analyzeUser(userSamples, userRate, model?.bands ?? null) : null
        setRemote({ model, user })
      }
    }
    void run()
    return () => {
      cancel = true
    }
  }, [modelRate, modelSamples, offThread, userRate, userSamples])
  const modelFeatures = offThread ? (remote?.model ?? null) : syncModel
  const userFeatures = offThread ? (remote?.user ?? null) : syncUser
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
    })
  }, [lang, modelFeatures, modelRate, region, speech, userFeatures, userRate, userSamples, words])

  useEffect(() => {
    setView('result')
    setSelected(0)
  }, [userSamples])

  useEffect(() => () => stopSlices(), [])

  const word = score?.words?.[selected] ?? null
  const feedback = copy.repeatFeedback
  const userDuration = userRate > 0 ? userSamples.length / userRate : 0
  const userQuiet = userFeatures != null && voicedValues(userFeatures.contour).length < MIN_VOICED

  function playWord(item: FeedbackWord, which: 'both' | 'model' | 'user'): void {
    const parts = []
    if ((which === 'both' || which === 'model') && modelSamples && modelRate > 0) {
      parts.push({ samples: modelSamples, sampleRate: modelRate, start: item.start, end: item.end })
    }
    if (which === 'both' || which === 'user') {
      parts.push({ samples: userSamples, sampleRate: userRate, start: item.userStart, end: item.userEnd })
    }
    if (parts.length > 0) void playSequence(parts)
  }

  return (
    <section className="pitch repeat-feedback" data-testid="repeat-feedback" aria-label={copy.pitchTitle}>
      {view === 'result' ? (
        <Result
          copy={copy}
          lang={lang}
          voiceId={voiceId}
          score={score}
          modelMissing={modelMissing}
          tooShort={userDuration < SHORT_SECONDS || score?.tooShort === true}
          timingMissing={!timingsPending && words == null && !modelMissing && modelSamples != null}
          tooQuiet={! (userDuration < SHORT_SECONDS) && (score?.tooLittleVoice === true || (modelMissing && userQuiet))}
          onWord={(index) => {
            setSelected(index)
            setView('word')
            const item = score?.words?.[index]
            if (item) playWord(item, 'both')
          }}
        />
      ) : null}
      {view === 'word' && word ? (
        <div className="stack">
          <p className="eyebrow">{copy.record}</p>
          <h2 className="repeat-word" lang={lang}>
            {word.text}
          </h2>
          {word.sentence ? (
            <p>
              {feedback.tone[word.sentence.tone]} · {feedback.expect[word.sentence.should]}
            </p>
          ) : null}
          <div className="repeat-pair">
            <article className="card pad">
              <h3>{copy.pitchModel}</h3>
              <Curve model={score?.model.slice(word.modelFrame, word.modelFrameEnd) ?? []} user={[]} color={null} />
              <button type="button" className="play-row" onClick={() => playWord(word, 'model')}>
                <span className="play-mark" aria-hidden="true" />
                {copy.listen}
              </button>
            </article>
            <article className="card pad">
              <h3>{copy.pitchYou}</h3>
              <Curve model={[]} user={score?.user.slice(word.userFrame, word.userFrameEnd) ?? []} color={word.color} />
              <button type="button" className="play-row" onClick={() => playWord(word, 'user')}>
                <span className="play-mark" aria-hidden="true" />
                {copy.listen}
              </button>
            </article>
          </div>
          <p>{feedback.sequential}</p>
          {word.sentence ? (
            <p data-testid="tone-sentence">
              {feedback.you[word.sentence.you]} {feedback.should[word.sentence.should]}
            </p>
          ) : null}
          {lang === 'vi' && word.tone ? (
            <button type="button" className="button wide" onClick={() => setView('tones')}>
              {feedback.toneTap}
            </button>
          ) : null}
          <button type="button" className="button wide" onClick={() => setView('result')}>
            {feedback.backSentence}
          </button>
        </div>
      ) : null}
      {view === 'tones' && word?.sentence ? (
        <ToneSheet
          copy={copy}
          word={word}
          user={score?.user.slice(word.userFrame, word.userFrameEnd) ?? []}
          model={score?.model.slice(word.modelFrame, word.modelFrameEnd) ?? []}
          onBack={() => setView('word')}
        />
      ) : null}
    </section>
  )
}

function Result({
  copy,
  lang,
  voiceId,
  score,
  modelMissing,
  timingMissing,
  tooShort,
  tooQuiet,
  onWord,
}: {
  copy: Dictionary
  lang: Lang
  voiceId: string
  score: RepeatScore | null
  modelMissing: boolean
  timingMissing: boolean
  tooShort: boolean
  tooQuiet: boolean
  onWord: (index: number) => void
}) {
  const feedback = copy.repeatFeedback
  const coloured = score?.words?.some((word) => word.color) ?? false
  return (
    <div className="stack">
      <p className="legend">
        <span className="swatch model">{copy.pitchModel}</span>
        <span className="swatch you">{copy.pitchYou}</span>
      </p>
      {tooShort ? <p role="status">{feedback.tooShort}</p> : null}
      {tooQuiet ? <p role="status">{copy.pitchEmpty}</p> : null}
      {score?.unclear ? <p role="status">{feedback.unclear}</p> : null}
      {score?.fewWords ? <p role="status">{feedback.fewWords}</p> : null}
      {timingMissing ? <p role="status">{feedback.noWordTimes}</p> : null}
      {modelMissing ? <p>{copy.pitchNoModel}</p> : null}
      {score && !score.tooShort && !score.tooLittleVoice ? (
        score.words && score.words.length > 0 ? (
          <div className="repeat-plots">
            {score.words.map((word) => (
              <div key={`${word.text}-${word.start}`} style={{ flex: Math.max(0.2, word.end - word.start) }}>
                <Curve
                  model={score.model.slice(word.modelFrame, word.modelFrameEnd)}
                  user={score.userOnModel.slice(word.modelFrame, word.modelFrameEnd)}
                  color={word.color}
                />
              </div>
            ))}
          </div>
        ) : (
          <Curve model={score.model} user={score.userOnModel} color={null} />
        )
      ) : null}
      {coloured && score?.words ? (
        <div className="repeat-words">
          {score.words.map((word, index) => (
            <button
              key={`${word.text}-${word.start}`}
              type="button"
              className={`word-chip ${word.color ?? 'plain'}`}
              data-color={word.color ?? 'none'}
              style={{ flex: Math.max(0.2, word.end - word.start) }}
              onClick={() => onWord(index)}
            >
              {word.text}
            </button>
          ))}
        </div>
      ) : null}
      {score?.melodyBar && score.rhythmBar ? (
        <div className="repeat-bars">
          <ScoreBar label={feedback.melody} state={score.melodyBar} copy={copy} testId="melody-bar" />
          <ScoreBar label={feedback.rhythm} state={score.rhythmBar} copy={copy} testId="rhythm-bar" />
        </div>
      ) : null}
      {score && score.stars > 0 ? (
        <p className="stars" data-testid="repeat-stars">
          <span aria-hidden="true">{`${'★'.repeat(score.stars)}${'☆'.repeat(3 - score.stars)}`}</span> {feedback.stars(score.stars)}
        </p>
      ) : null}
      {lang === 'vi' && voiceId === 'vais1000' ? <p className="hint">{feedback.northern}</p> : null}
      {score?.words?.map((word) =>
        word.sentence ? (
          <p key={`${word.text}-${word.start}-tone`} data-testid="tone-sentence">
            {feedback.you[word.sentence.you]} {feedback.should[word.sentence.should]}
          </p>
        ) : null,
      )}
    </div>
  )
}

function ScoreBar({ label, state, copy, testId }: { label: string; state: BarState; copy: Dictionary; testId: string }) {
  const text = state === 'passt' ? copy.repeatFeedback.pass : state === 'teilweise' ? copy.repeatFeedback.part : copy.repeatFeedback.off
  return (
    <p className="score-bar" data-testid={testId} data-state={state}>
      <span>{label}</span>
      <span className={`score-track ${state}`} aria-hidden="true">
        <span className="score-fill" style={{ width: barWidth(state) }} />
      </span>
      <span>{text}</span>
    </p>
  )
}

function ToneSheet({
  copy,
  word,
  user,
  model,
  onBack,
}: {
  copy: Dictionary
  word: FeedbackWord
  user: Contour
  model: Contour
  onBack: () => void
}) {
  const feedback = copy.repeatFeedback
  const sentence = word.sentence
  if (!sentence) return null
  const shapeLabel = (shape: ToneShape): string => feedback.toneShape[shape === 'level' ? 'ngang' : shape === 'falling' ? 'huyen' : shape === 'rising' ? 'sac' : 'hoi']
  return (
    <div className="stack">
      <p className="eyebrow">
        {feedback.tone[sentence.tone]} · {word.text}
      </p>
      <h2>{feedback.you[sentence.you]}</h2>
      <p>{feedback.should[sentence.should]}</p>
      <div className="repeat-pair">
        <article className="card pad">
          <Curve model={model} user={[]} color={null} />
          <p>
            {feedback.target}
            <br />
            {shapeLabel(sentence.should)}
          </p>
        </article>
        <article className={`card pad ${word.color === 'red' ? 'tone-you' : ''}`}>
          <Curve model={[]} user={user} color={word.color} />
          <p>
            {copy.pitchYou}
            <br />
            {word.userShape === 'rising' || word.userShape === 'falling' || word.userShape === 'level' || word.userShape === 'dipping'
              ? shapeLabel(word.userShape)
              : copy.shape.unknown}
          </p>
        </article>
      </div>
      <div className="tone-grid">
        {TONE_ORDER.map((tone) => (
          <p key={tone} className={tone === sentence.tone ? 'tone-tile on' : 'tone-tile'}>
            <strong>{feedback.tone[tone]}</strong>
            <span>{feedback.toneShape[tone]}</span>
          </p>
        ))}
      </div>
      <p className="hint">{feedback.creak}</p>
      <button type="button" className="button wide" onClick={onBack}>
        {feedback.back}
      </button>
    </div>
  )
}
