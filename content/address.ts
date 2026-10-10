import type { Lang } from './phrase'

export type AddressForm = {
  id: string
  label: string
  insert: string
  note: Record<Lang, string>
}

export const VI_ADDRESS: AddressForm[] = [
  {
    id: 'anh',
    label: 'anh',
    insert: 'anh',
    note: {
      de: 'Häufig ein Mann, der etwas älter ist als die sprechende Person, oder ungefähr gleich alt. Die Grenze ist unscharf.',
      en: 'Often a man a little older than the speaker, or about the same age. The line is fuzzy.',
      'pt-BR': 'Com frequência um homem um pouco mais velho, ou da mesma idade. O limite é frouxo.',
      vi: 'Thường dùng cho người nam lớn hơn một chút hoặc ngang tuổi. Ranh giới không cố định.',
    },
  },
  {
    id: 'chi',
    label: 'chị',
    insert: 'chị',
    note: {
      de: 'Häufig eine Frau, die etwas älter ist als die sprechende Person.',
      en: 'Often a woman a little older than the speaker.',
      'pt-BR': 'Com frequência uma mulher um pouco mais velha.',
      vi: 'Thường dùng cho người nữ lớn hơn một chút.',
    },
  },
  {
    id: 'em',
    label: 'em',
    insert: 'em',
    note: {
      de: 'Häufig eine jüngere Person. Wer selbst jünger ist, nennt sich oft auch em.',
      en: 'Often a younger person. A younger speaker often calls themself em as well.',
      'pt-BR': 'Com frequência uma pessoa mais nova. Quem é mais novo muitas vezes também se chama de em.',
      vi: 'Thường dùng cho người ít tuổi hơn. Người nói trẻ hơn cũng hay tự xưng em.',
    },
  },
  {
    id: 'co',
    label: 'cô',
    insert: 'cô',
    note: {
      de: 'Häufig eine Frau ungefähr im Alter der Eltern, in der Schule auch eine Lehrerin. Je nach Ort verschieden.',
      en: 'Often a woman about the age of one’s parents, and at school a teacher. It varies by place.',
      'pt-BR': 'Com frequência uma mulher da idade dos pais; na escola, também uma professora. Varia conforme o lugar.',
      vi: 'Thường là phụ nữ cỡ tuổi bố mẹ, ở trường cũng là cô giáo. Mỗi nơi dùng khác nhau.',
    },
  },
  {
    id: 'chu',
    label: 'chú',
    insert: 'chú',
    note: {
      de: 'Häufig ein Mann, der deutlich älter ist, aber noch nicht zur Grosselterngeneration gehört.',
      en: 'Often a man clearly older, but not of a grandparent’s generation.',
      'pt-BR': 'Com frequência um homem bem mais velho, ainda não da geração dos avós.',
      vi: 'Thường là người nam lớn tuổi hơn rõ, nhưng chưa đến thế hệ ông bà.',
    },
  },
  {
    id: 'bac',
    label: 'bác',
    insert: 'bác',
    note: {
      de: 'Häufig eine Person im Alter der älteren Geschwister der Eltern. Gilt für Männer und Frauen.',
      en: 'Often someone about the age of a parent’s older sibling. Used for men and women.',
      'pt-BR': 'Com frequência alguém da idade dos irmãos mais velhos dos pais. Vale para homens e mulheres.',
      vi: 'Thường là người cỡ anh chị của bố mẹ. Dùng cho cả nam và nữ.',
    },
  },
  {
    id: 'ong',
    label: 'ông',
    insert: 'ông',
    note: {
      de: 'Häufig ein deutlich älterer Mann. In Behörden kann es auch formeller klingen.',
      en: 'Often a much older man. In offices it can also sound more formal.',
      'pt-BR': 'Com frequência um homem bem mais velho. Em repartições também pode soar mais formal.',
      vi: 'Thường là người nam lớn tuổi. Ở cơ quan cũng có thể nghe trang trọng hơn.',
    },
  },
  {
    id: 'ba',
    label: 'bà',
    insert: 'bà',
    note: {
      de: 'Häufig eine deutlich ältere Frau. Nicht verwechseln mit ba für Vater im Süden.',
      en: 'Often a much older woman. Not the same as ba for “father” in the south.',
      'pt-BR': 'Com frequência uma mulher bem mais velha. Não é o ba de “pai” no sul.',
      vi: 'Thường là người nữ lớn tuổi. Khác với ba là “bố” ở miền Nam.',
    },
  },
]

export const PT_ADDRESS: AddressForm[] = [
  {
    id: 'voce',
    label: 'você',
    insert: 'você',
    note: {
      de: 'In vielen Alltagssituationen in Brasilien üblich, auch gegenüber unbekannten Personen im ähnlichen Alter. Regional verschieden.',
      en: 'Common in many everyday situations in Brazil, including with strangers of a similar age. It varies by region.',
      'pt-BR': 'Em muitas situações do dia a dia no Brasil, também com desconhecidos de idade parecida. Varia por região.',
      vi: 'Ở Brasil nhiều lúc dùng hàng ngày, cả với người lạ cùng lứa. Từng vùng một khác.',
    },
  },
  {
    id: 'senhor',
    label: 'o senhor',
    insert: 'o senhor',
    note: {
      de: 'Häufiger gegenüber älteren Männern oder in formelleren Lagen. Keine feste Altersgrenze.',
      en: 'More frequent with older men or in more formal settings. There is no fixed age line.',
      'pt-BR': 'Mais frequente com homens mais velhos ou em situações formais. Não há uma idade fixa.',
      vi: 'Hay dùng với người nam lớn tuổi hoặc lúc trang trọng hơn. Không có mốc tuổi cố định.',
    },
  },
  {
    id: 'senhora',
    label: 'a senhora',
    insert: 'a senhora',
    note: {
      de: 'Häufiger gegenüber älteren Frauen oder in formelleren Lagen. Keine feste Altersgrenze.',
      en: 'More frequent with older women or in more formal settings. There is no fixed age line.',
      'pt-BR': 'Mais frequente com mulheres mais velhas ou em situações formais. Não há uma idade fixa.',
      vi: 'Hay dùng với người nữ lớn tuổi hoặc lúc trang trọng hơn. Không có mốc tuổi cố định.',
    },
  },
]

export const DE_ADDRESS: AddressForm[] = [
  {
    id: 'sie',
    label: 'Sie',
    insert: 'Sie',
    note: {
      de: 'Gegenüber unbekannten Erwachsenen in Deutschland und der Deutschschweiz häufig die erste Wahl, bis jemand das Du anbietet.',
      en: 'Often the first choice with adult strangers in Germany and German-speaking Switzerland, until someone offers du.',
      'pt-BR': 'Muitas vezes a primeira escolha com adultos desconhecidos na Alemanha e na Suíça alemã, até alguém oferecer o du.',
      vi: 'Với người lớn chưa quen ở Đức và vùng tiếng Đức của Thụy Sĩ, thường bắt đầu bằng Sie cho đến khi được mời xưng du.',
    },
  },
  {
    id: 'du',
    label: 'du',
    insert: 'du',
    note: {
      de: 'Unter jüngeren Leuten und nach einem Angebot häufig. Nicht von sich aus mit älteren Unbekannten beginnen.',
      en: 'Frequent among younger people and after an offer. Do not start with it toward older strangers on your own.',
      'pt-BR': 'Frequente entre gente mais nova e depois de um convite. Não comece sozinho com pessoas mais velhas que você não conhece.',
      vi: 'Hay gặp giữa người trẻ và sau khi được mời. Đừng tự mở đầu với người lạ lớn tuổi.',
    },
  },
]

export const PT_SPEAKER = [
  {
    id: 'obrigado',
    label: 'obrigado',
    note: {
      de: 'Obrigado sagt häufig eine männliche sprechende Person, unabhängig vom Gegenüber.',
      en: 'Obrigado is what a male speaker often says, regardless of the listener.',
      'pt-BR': 'Obrigado é o que um homem costuma dizer, independente de quem ouve.',
      vi: 'Obrigado thường là lời của người nói là nam, không phụ thuộc người nghe.',
    },
  },
  {
    id: 'obrigada',
    label: 'obrigada',
    note: {
      de: 'Obrigada sagt häufig eine weibliche sprechende Person, unabhängig vom Gegenüber.',
      en: 'Obrigada is what a female speaker often says, regardless of the listener.',
      'pt-BR': 'Obrigada é o que uma mulher costuma dizer, independente de quem ouve.',
      vi: 'Obrigada thường là lời của người nói là nữ, không phụ thuộc người nghe.',
    },
  },
] as const

const BY_LANG: Record<Lang, AddressForm[]> = {
  vi: VI_ADDRESS,
  'pt-BR': PT_ADDRESS,
  de: DE_ADDRESS,
  en: [],
}

export function addressForms(lang: Lang): AddressForm[] {
  return BY_LANG[lang]
}

export function hasAddressToken(text: string): boolean {
  return text.includes('{addr}') || text.includes('{Addr}')
}

export function applyAddress(text: string, insert: string): string {
  const capital = insert.charAt(0).toLocaleUpperCase() + insert.slice(1)
  return text.replaceAll('{Addr}', capital).replaceAll('{addr}', insert)
}
