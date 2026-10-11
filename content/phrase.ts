export const LANGS = ['de', 'en', 'pt-BR', 'vi'] as const
export type Lang = (typeof LANGS)[number]
export type Region = 'south' | 'north'
export type Register = 'formal' | 'neutral' | 'informal'
export type Depth = 'core' | 'sample' | 'starter'

export type Variant = {
  id: string
  label: string
  text: string
  speech?: string
  note?: string
}

export type Realization = {
  lang: Lang
  region?: Region
  text: string
  speech?: string
  geprueft: boolean
  variants?: Variant[]
}

export type Concept = {
  id: string
  situationIds: string[]
  priority: number
  register: Register
  tags: string[]
  context: Record<Lang, string>
  realizations: Realization[]
}

export type Situation = {
  id: string
  order: number
  depth: Depth
  title: Record<Lang, string>
  summary: Record<Lang, string>
  /** One plain sentence about what the learner can say after this situation. */
  canDo: Record<Lang, string>
}

export type Source = {
  title: string
  url: string
  accessed: string
}

export type CultureNote = {
  id: string
  situationIds: string[]
  regions: Array<'VN' | 'BR' | 'DE-CH' | 'EN'>
  title: Record<Lang, string>
  body: Record<Lang, string>
  sources: Source[]
  geprueft: boolean
}

export type InfoCard = {
  id: string
  situationId: string
  country: 'VN' | 'BR' | 'DE-CH' | 'EN'
  checkedAt: string
  title: Record<Lang, string>
  body: Record<Lang, string>
  sources: Source[]
  geprueft: boolean
}

export type PairNote = {
  id: string
  sourceLang: Lang
  targetLang: Lang
  conceptId?: string
  text: Record<Lang, string>
}

type Side =
  | string
  | {
      text: string
      speech?: string
      variants?: Variant[]
    }

function realization(lang: Lang, side: Side, region?: Region): Realization {
  if (typeof side === 'string') {
    return { lang, ...(region ? { region } : {}), text: side, speech: side, geprueft: false }
  }
  return {
    lang,
    ...(region ? { region } : {}),
    text: side.text,
    speech: side.speech ?? side.text,
    geprueft: false,
    ...(side.variants ? { variants: side.variants } : {}),
  }
}

export function phrase(input: {
  id: string
  situationIds: string[]
  priority?: number
  register?: Register
  tags?: string[]
  context: Record<Lang, string>
  de: Side
  en: Side
  pt: Side
  vi: Side
  viNorth?: Side
}): Concept {
  const realizations: Realization[] = [
    realization('de', input.de),
    realization('en', input.en),
    realization('pt-BR', input.pt),
    realization('vi', input.vi, input.viNorth ? 'south' : undefined),
  ]
  if (input.viNorth) realizations.push(realization('vi', input.viNorth, 'north'))
  return {
    id: input.id,
    situationIds: input.situationIds,
    priority: input.priority ?? 2,
    register: input.register ?? 'neutral',
    tags: input.tags ?? [],
    context: input.context,
    realizations,
  }
}
