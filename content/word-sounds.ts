import type { Lang } from './phrase'
import { spokenCitation, type WordEntry } from './words'

/**
 * Learner pronunciation for the nineteen checked words.
 * IPA was drafted with espeak-ng 1.51 and then corrected by hand.
 * A Vietnamese tone name follows the spelling, one name per syllable.
 */

export type Tone = 'ngang' | 'huyen' | 'sac' | 'hoi' | 'nga' | 'nang'

const TONE_MARK: Record<string, Tone> = {
  '\u0300': 'huyen',
  '\u0301': 'sac',
  '\u0309': 'hoi',
  '\u0303': 'nga',
  '\u0323': 'nang',
}

/** Longer Chao sequences first, so a dipping tone is not read as a level tone. */
export const TONE_CHAO: Record<Tone, string> = {
  hoi: '˧˩˧',
  nga: '˧ˀ˥',
  nang: '˨˩ˀ',
  huyen: '˨˩',
  sac: '˧˥',
  ngang: '˧',
}

const TONE_LABEL: Record<Tone, Record<Lang, string>> = {
  ngang: { de: 'eben', en: 'level', 'pt-BR': 'plano', vi: 'ngang' },
  huyen: { de: 'fallend', en: 'falling', 'pt-BR': 'caindo', vi: 'huyền' },
  sac: { de: 'steigend', en: 'rising', 'pt-BR': 'subindo', vi: 'sắc' },
  hoi: { de: 'gesenkt', en: 'dipping', 'pt-BR': 'curvo', vi: 'hỏi' },
  nga: { de: 'gebrochen', en: 'broken', 'pt-BR': 'quebrado', vi: 'ngã' },
  nang: { de: 'schwer', en: 'heavy', 'pt-BR': 'pesado', vi: 'nặng' },
}

type Reads = Record<Lang, string>

type FormSound = { ipa: string; read: Reads }

const de = (ipa: string, read: Reads): FormSound => ({ ipa, read })

const SOUNDS: Record<string, Record<Lang, FormSound> & { north?: FormSound }> = {
  'w.i': {
    de: de('/ɪç/', { de: 'ich', en: 'ikh', 'pt-BR': 'ikh', vi: 'ích' }),
    en: de('/aɪ/', { de: 'ai', en: 'I', 'pt-BR': 'ái', vi: 'ai' }),
    'pt-BR': de('/ew/', { de: 'eu', en: 'eh-oo', 'pt-BR': 'eu', vi: 'êu' }),
    vi: de('/toj˧/', { de: 'toi', en: 'toy', 'pt-BR': 'toi', vi: 'tôi' }),
  },
  'w.yes': {
    de: de('/jaː/', { de: 'ja', en: 'yaa', 'pt-BR': 'iá', vi: 'da' }),
    en: de('/jɛs/', { de: 'jess', en: 'yes', 'pt-BR': 'iés', vi: 'dét' }),
    'pt-BR': de('/sĩ/', { de: 'sing', en: 'seeing', 'pt-BR': 'sim', vi: 'sim' }),
    vi: de('/jaː˨˩ˀ/', { de: 'ja', en: 'yah', 'pt-BR': 'ia', vi: 'dạ' }),
    north: de('/vəŋ˧/', { de: 'wöng', en: 'vung', 'pt-BR': 'vâng', vi: 'vâng' }),
  },
  'w.please': {
    de: de('/ˈbɪtə/', { de: 'BI-te', en: 'BIT-uh', 'pt-BR': 'BI-te', vi: 'BI-tơ' }),
    en: de('/pliːz/', { de: 'plis', en: 'please', 'pt-BR': 'plís', vi: 'plít' }),
    'pt-BR': de('/poʁ faˈvoʁ/', { de: 'por fa-WOR', en: 'por fa-VOR', 'pt-BR': 'por favor', vi: 'po fa-VO' }),
    vi: de('/laːm˨˩ əːn˧/', { de: 'lam · ön', en: 'lahm · uhn', 'pt-BR': 'lam · on', vi: 'làm · ơn' }),
  },
  'w.thanks': {
    de: de('/ˈdaŋkə/', { de: 'DAN-ke', en: 'DANG-kuh', 'pt-BR': 'DAN-ke', vi: 'ĐAN-kơ' }),
    en: de('/ˈθæŋk juː/', { de: 'THÄNK ju', en: 'thank you', 'pt-BR': 'fénc iú', vi: 'theng kiu' }),
    'pt-BR': de('/obɾiˈɡadu/', { de: 'o-bri-GA-du', en: 'o-bree-GAH-doo', 'pt-BR': 'obrigado', vi: 'o-bri-GA-đu' }),
    vi: de('/kaːm˧˩˧ əːn˧/', { de: 'kam · ön', en: 'kahm · uhn', 'pt-BR': 'cam · on', vi: 'cảm · ơn' }),
  },
  'w.not': {
    de: de('/nɪçt/', { de: 'nicht', en: 'nikht', 'pt-BR': 'nikht', vi: 'ních-t' }),
    en: de('/nɑt/', { de: 'not', en: 'not', 'pt-BR': 'nót', vi: 'nót' }),
    'pt-BR': de('/nɐ̃w̃/', { de: 'naung', en: 'nowng', 'pt-BR': 'não', vi: 'nãu' }),
    vi: de('/xəwŋ˨˩/', { de: 'khong', en: 'khawng', 'pt-BR': 'cong', vi: 'không' }),
  },
  'w.where': {
    de: de('/voː/', { de: 'wo', en: 'voh', 'pt-BR': 'vô', vi: 'vô' }),
    en: de('/wɛɹ/', { de: 'wär', en: 'where', 'pt-BR': 'uér', vi: 'ue' }),
    'pt-BR': de('/ˈõdʒi/', { de: 'ON-dschi', en: 'ON-jee', 'pt-BR': 'onde', vi: 'ôn-gi' }),
    vi: de('/ɗəw˨˩/', { de: 'dau', en: 'doh', 'pt-BR': 'dau', vi: 'đâu' }),
  },
  'w.here': {
    de: de('/hiːɐ/', { de: 'hir', en: 'heer', 'pt-BR': 'rir', vi: 'hia' }),
    en: de('/hɪɹ/', { de: 'hir', en: 'here', 'pt-BR': 'rír', vi: 'hia' }),
    'pt-BR': de('/aˈki/', { de: 'a-KI', en: 'ah-KEE', 'pt-BR': 'aqui', vi: 'a-KI' }),
    vi: de('/ɗəj˧˥/', { de: 'dai', en: 'die', 'pt-BR': 'dai', vi: 'đây' }),
  },
  'w.water': {
    de: de('/ˈvasɐ/', { de: 'VAS-sa', en: 'VAH-suh', 'pt-BR': 'VÁ-sa', vi: 'VA-xơ' }),
    en: de('/ˈwɔtɚ/', { de: 'WO-ter', en: 'water', 'pt-BR': 'uó-ter', vi: 'uo-tơ' }),
    'pt-BR': de('/ˈaɡwa/', { de: 'A-gwa', en: 'AH-gwah', 'pt-BR': 'água', vi: 'A-gua' }),
    vi: de('/nɨək˧˥/', { de: 'nüök', en: 'nuuk', 'pt-BR': 'nuoc', vi: 'nước' }),
  },
  'w.help': {
    de: de('/ˈhɪlfə/', { de: 'HIL-fe', en: 'HIL-fuh', 'pt-BR': 'HIL-fe', vi: 'HIN-fơ' }),
    en: de('/hɛlp/', { de: 'help', en: 'help', 'pt-BR': 'rélp', vi: 'help' }),
    'pt-BR': de('/soˈkoʁu/', { de: 'so-KO-ru', en: 'so-KO-roo', 'pt-BR': 'socorro', vi: 'so-CÔ-ru' }),
    vi: de('/kɨw˧˥ vəːj˧˥/', { de: 'küu · wöi', en: 'koo · voy', 'pt-BR': 'cuu · voi', vi: 'cứu · với' }),
  },
  'w.days': {
    de: de('/ˈtaːɡə/', { de: 'TA-ge', en: 'TAA-guh', 'pt-BR': 'TÁ-gue', vi: 'TA-gơ' }),
    en: de('/deɪz/', { de: 'deis', en: 'days', 'pt-BR': 'dêis', vi: 'đêi' }),
    'pt-BR': de('/ˈdʒiɐs/', { de: 'DSCHI-as', en: 'JEE-ahs', 'pt-BR': 'dias', vi: 'gi-a' }),
    vi: de('/ŋaj˨˩/', { de: 'ngai', en: 'ngai', 'pt-BR': 'ngai', vi: 'ngày' }),
  },
  'w.stay': {
    de: de('/ˈblaɪbən/', { de: 'BLAI-ben', en: 'BLY-ben', 'pt-BR': 'BLAI-ben', vi: 'BLAI-bơn' }),
    en: de('/steɪ/', { de: 'stei', en: 'stay', 'pt-BR': 'stêi', vi: 'têi' }),
    'pt-BR': de('/fiˈkaʁ/', { de: 'fi-KAR', en: 'fee-KAR', 'pt-BR': 'ficar', vi: 'fi-CA' }),
    vi: de('/əː˧˩˧/', { de: 'ö', en: 'uh', 'pt-BR': 'ơ', vi: 'ở' }),
  },
  'w.documents': {
    de: de('/dokuˈmɛntə/', { de: 'do-ku-MEN-te', en: 'doh-koo-MEN-tuh', 'pt-BR': 'do-cu-MEN-te', vi: 'đô-cu-MEN-tơ' }),
    en: de('/ˈdɑkjəmənts/', { de: 'DO-kju-ments', en: 'documents', 'pt-BR': 'DÓ-kiu-ments', vi: 'đo-kiu-mơn' }),
    'pt-BR': de('/dokuˈmẽtus/', { de: 'do-ku-MEN-tus', en: 'doh-koo-MEN-toos', 'pt-BR': 'documentos', vi: 'đo-cu-MEN-tu' }),
    vi: de('/zăj˧˥ təː˨˩/', { de: 'jai · tö', en: 'zai · tuh', 'pt-BR': 'zai · to', vi: 'giấy · tờ' }),
  },
  'w.evisa': {
    de: de('/ˈeːviːzʊm/', { de: 'E-vi-sum', en: 'AY-vee-zoom', 'pt-BR': 'Ê-vi-zum', vi: 'Ê-vi-dum' }),
    en: de('/ˈiː viːzə/', { de: 'i WI-sa', en: 'e-visa', 'pt-BR': 'í VI-za', vi: 'i VI-dơ' }),
    'pt-BR': de('/ˈvistu eleˈtɾõniku/', { de: 'WIS-tu e-le-TRO-ni-ku', en: 'VEES-too eh-leh-TRO-nee-koo', 'pt-BR': 'visto eletrônico', vi: 'VÍT-tu e-lê-TRÔ-ni-cu' }),
    vi: de('/vi˧ sa˧ ɗiən˨˩ˀ tɨ˧˩˧/', { de: 'wi-sa · diän · tü', en: 'vee-sah · dee-uhn · too', 'pt-BR': 'vi-sa · dien · tu', vi: 'visa · điện · tử' }),
  },
  'w.visa': {
    de: de('/ˈviːzʊm/', { de: 'VI-sum', en: 'VEE-zoom', 'pt-BR': 'VI-zum', vi: 'VI-dum' }),
    en: de('/ˈviːzə/', { de: 'WI-sa', en: 'visa', 'pt-BR': 'VI-za', vi: 'VI-dơ' }),
    'pt-BR': de('/ˈvistu/', { de: 'WIS-tu', en: 'VEES-too', 'pt-BR': 'visto', vi: 'VÍT-tu' }),
    vi: de('/vi˧ sa˧/', { de: 'wi-sa', en: 'vee-sah', 'pt-BR': 'vi-sa', vi: 'visa' }),
  },
  'w.extend': {
    de: de('/fɛɐˈlɛŋɐn/', { de: 'fer-LEN-gern', en: 'fer-LENG-ern', 'pt-BR': 'fer-LÉN-guern', vi: 'phe-LEN-gơn' }),
    en: de('/ɪkˈstɛnd/', { de: 'ik-STEND', en: 'extend', 'pt-BR': 'ecs-TÉND', vi: 'ik-TEN' }),
    'pt-BR': de('/pʁoʁoˈɡaʁ/', { de: 'pro-ro-GAR', en: 'pro-ho-GAR', 'pt-BR': 'prorrogar', vi: 'prô-rô-GA' }),
    vi: de('/za˧ haːn˨˩ˀ/', { de: 'ja · han', en: 'zah · hahn', 'pt-BR': 'za · han', vi: 'gia · hạn' }),
  },
  'w.application': {
    de: de('/ɡəˈzuːx/', { de: 'ge-SUCH', en: 'guh-ZOOKH', 'pt-BR': 'ge-ZÚKH', vi: 'gơ-DUKH' }),
    en: de('/ˌæplɪˈkeɪʃən/', { de: 'ap-li-KEI-schen', en: 'application', 'pt-BR': 'ép-li-QUEI-chon', vi: 'ep-li-KÊI-sơn' }),
    'pt-BR': de('/peˈdʒidu/', { de: 'pe-SCHI-du', en: 'peh-JEE-doo', 'pt-BR': 'pedido', vi: 'pê-GI-đu' }),
    vi: de('/ho˨˩ səː˧/', { de: 'ho · sö', en: 'haw · suh', 'pt-BR': 'hô · so', vi: 'hồ · sơ' }),
  },
  'w.current': {
    de: de('/aktuˈɛl/', { de: 'ak-tu-ELL', en: 'ak-too-ELL', 'pt-BR': 'ac-tu-ÉL', vi: 'ác-tu-EN' }),
    en: de('/ˈkɜɹənt/', { de: 'KÖR-ent', en: 'current', 'pt-BR': 'CÂ-rent', vi: 'cơ-rơn' }),
    'pt-BR': de('/aˈtuaw/', { de: 'a-TU-au', en: 'ah-TOO-ow', 'pt-BR': 'atual', vi: 'a-TU-ao' }),
    vi: de('/hiən˨˩ˀ hajŋ˨˩/', { de: 'hiän · hanj', en: 'hee-uhn · hine', 'pt-BR': 'hien · ranh', vi: 'hiện · hành' }),
  },
  'w.rule': {
    de: de('/ˈreːɡəl/', { de: 'RE-gel', en: 'RAY-gel', 'pt-BR': 'RÊ-guel', vi: 'RÊ-gơn' }),
    en: de('/ruːl/', { de: 'rul', en: 'rule', 'pt-BR': 'rúl', vi: 'run' }),
    'pt-BR': de('/ˈʁɛɡɾɐ/', { de: 'RE-gra', en: 'HEH-grah', 'pt-BR': 'regra', vi: 'HE-ga' }),
    vi: de('/kwi˧ ɗiŋ˨˩ˀ/', { de: 'kwi · dinj', en: 'kwee · din', 'pt-BR': 'qui · dinh', vi: 'quy · định' }),
  },
  'w.photo': {
    de: de('/ˈpasfoːtoː/', { de: 'PAS-fo-to', en: 'PAHS-foh-toh', 'pt-BR': 'PAS-fô-tô', vi: 'PAT-phô-tô' }),
    en: de('/ˈpæspɔɹt ˈfoʊtoʊ/', { de: 'PÄSS-port FO-to', en: 'passport photo', 'pt-BR': 'PÉS-port FÔU-tou', vi: 'pét-pot phô-tô' }),
    'pt-BR': de('/ˈfɔtu dʒi pasaˈpɔʁtʃi/', { de: 'FO-tu dschi pa-sa-POR-tschi', en: 'FAW-too jee pah-sah-POR-chee', 'pt-BR': 'foto de passaporte', vi: 'phô-tu gi pa-sa-PÔ-chi' }),
    vi: de('/aɲ˧˩˧ ho˨˩ˀ tɕiəw˧˥/', { de: 'anj · ho · chiäu', en: 'an · haw · chee-oh', 'pt-BR': 'anh · hô · chieu', vi: 'ảnh · hộ · chiếu' }),
  },
}

export function syllableTones(text: string): Tone[] {
  return text
    .split(/\s+/)
    .filter((part) => part.length > 0)
    .map((part) => {
      for (const ch of part.normalize('NFD')) {
        const tone = TONE_MARK[ch]
        if (tone) return tone
      }
      return 'ngang'
    })
}

export function chaoTones(ipa: string): Tone[] {
  const order: Tone[] = ['hoi', 'nga', 'nang', 'huyen', 'sac', 'ngang']
  const found: Tone[] = []
  let rest = ipa
  while (rest.length > 0) {
    let bestAt = -1
    let best: Tone | null = null
    for (const tone of order) {
      const at = rest.indexOf(TONE_CHAO[tone])
      if (at < 0) continue
      const longer = best != null && at === bestAt && TONE_CHAO[tone].length > TONE_CHAO[best].length
      if (bestAt < 0 || at < bestAt || longer) {
        bestAt = at
        best = tone
      }
    }
    if (!best || bestAt < 0) break
    found.push(best)
    rest = rest.slice(bestAt + TONE_CHAO[best].length)
  }
  return found
}

function withTones(body: string, tones: readonly Tone[], app: Lang): string {
  const parts = body.split(' · ')
  return parts.map((part, index) => `${part}, ${TONE_LABEL[tones[index] ?? 'ngang'][app]}`).join(' · ')
}

export function wordSound(word: WordEntry, target: Lang, app: Lang, viRegion: 'south' | 'north'): { ipa: string; read: string } {
  const entry = SOUNDS[word.id]
  if (!entry) throw new Error('WORD_SOUND')
  const form = target === 'vi' && viRegion === 'north' && entry.north ? entry.north : entry[target]
  if (target !== 'vi') return { ipa: form.ipa, read: form.read[app] }
  const tones = syllableTones(spokenCitation(word, 'vi', viRegion))
  return { ipa: form.ipa, read: withTones(form.read[app], tones, app) }
}
