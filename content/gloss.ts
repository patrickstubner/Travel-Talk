import { transportGloss } from './gloss-transport'
import type { Lang } from './phrase'

/**
 * Word links between the existing sentences.
 * Every group is unchecked: no native-speaker review, same as `geprueft: false` on the lines.
 * A group is omitted at runtime when the tokens are not in that wording, so a variant is not given a wrong link.
 */
export const GLOSS_CHECKED = false

export type GlossSide = Partial<Record<'de' | 'en' | 'pt' | 'vi' | 'viN', readonly string[]>>

export type WordLink = { target: number[]; gloss: number[] }

export const GLOSS: Record<string, readonly GlossSide[]> = {
  'emergency.help': [{ de: ['Hilfe!'], en: ['Help!'], pt: ['Socorro!'], vi: ['Cứu', 'với!'] }],
  'emergency.ambulance': [
    { de: ['Rufen'], en: ['Please', 'call'], pt: ['Pode', 'chamar'], vi: ['Làm', 'ơn', 'gọi'] },
    { de: ['Krankenwagen.'], en: ['ambulance.'], pt: ['ambulância,'], vi: ['xe', 'cấp', 'cứu.'] },
    { de: ['bitte'], pt: ['por', 'favor?'] },
  ],
  'emergency.police': [
    { de: ['Rufen'], en: ['Please', 'call'], pt: ['Pode', 'chamar'], vi: ['Làm', 'ơn', 'gọi'] },
    { de: ['Polizei.'], en: ['police.'], pt: ['polícia,'], vi: ['cảnh', 'sát.'] },
  ],
  'emergency.doctor': [
    { de: ['Ich'], en: ['I'], pt: ['Eu'], vi: ['Tôi'] },
    { de: ['brauche'], en: ['need'], pt: ['preciso'], vi: ['cần'] },
    { de: ['Ärztin', 'oder', 'einen', 'Arzt.'], en: ['doctor.'], pt: ['médico.'], vi: ['bác', 'sĩ.'] },
  ],
  'emergency.hurt': [
    { de: ['weh.'], en: ['hurts'], pt: ['Dói'], vi: ['đau'] },
    { de: ['hier'], en: ['here.'], pt: ['aqui.'], vi: ['đây.'] },
  ],
  'emergency.breathe': [
    { de: ['Ich'], en: ['I'], pt: ['Eu'], vi: ['Tôi'] },
    { de: ['nicht'], en: ['cannot'], pt: ['não'], vi: ['không'] },
    { de: ['atmen.'], en: ['breathe.'], pt: ['respirar.'], vi: ['thở', 'được.'] },
  ],
  'emergency.allergic': [
    { de: ['Ich'], en: ['I'], pt: ['Eu'], vi: ['Tôi'] },
    { de: ['allergisch.'], en: ['allergic.'], pt: ['alergia.'], vi: ['dị', 'ứng.'] },
  ],
  'emergency.peanut': [
    { de: ['Ich'], en: ['I'], pt: ['Eu'], vi: ['Tôi'] },
    { de: ['allergisch'], en: ['allergic'], pt: ['alergia'], vi: ['dị', 'ứng'] },
    { de: ['Erdnüsse.'], en: ['peanuts.'], pt: ['amendoim.'], vi: ['đậu', 'phộng.'], viN: ['lạc.'] },
  ],
  'emergency.pharmacy': [
    { de: ['Wo'], en: ['Where'], pt: ['Onde'], vi: ['đâu?'] },
    { de: ['Apotheke?'], en: ['pharmacy?'], pt: ['farmácia?'], vi: ['Nhà', 'thuốc'] },
  ],
  'emergency.hospital': [
    { de: ['Wo'], en: ['Where'], pt: ['Onde'], vi: ['đâu?'] },
    { de: ['Spital?'], en: ['hospital?'], pt: ['hospital?'], vi: ['Bệnh', 'viện'] },
  ],
  'emergency.lost': [
    { de: ['Ich'], en: ['I'], pt: ['Eu'], vi: ['Tôi'] },
    { de: ['verlaufen.'], en: ['lost.'], pt: ['perdi.'], vi: ['lạc', 'đường.'] },
  ],
  'emergency.passport': [
    { de: ['Ich'], en: ['I'], pt: ['Eu'], vi: ['Tôi'] },
    { de: ['verloren.'], en: ['lost'], pt: ['perdi'], vi: ['mất'] },
    { de: ['Pass'], en: ['passport.'], pt: ['passaporte.'], vi: ['hộ', 'chiếu.'] },
  ],
  'emergency.water': [
    { de: ['Wasser.'], en: ['water.'], pt: ['água.'], vi: ['nước.'] },
  ],
  'emergency.dizzy': [{ de: ['schwindlig.'], en: ['dizzy.'], pt: ['tontura.'], vi: ['chóng', 'mặt.'] }],
  'emergency.fever': [
    { de: ['Ich'], en: ['I'], pt: ['Eu'], vi: ['Tôi'] },
    { de: ['Fieber.'], en: ['fever.'], pt: ['febre.'], vi: ['sốt.'] },
  ],
  'emergency.slow': [
    { de: ['sprechen?'], en: ['speak'], pt: ['falar'], vi: ['nói'] },
    { de: ['langsamer'], en: ['slowly,'], pt: ['devagar,'], vi: ['chậm'] },
  ],
  'emergency.understand': [
    { de: ['Ich'], en: ['I'], pt: ['Eu'], vi: ['Tôi'] },
    { de: ['verstehe'], en: ['understand.'], pt: ['entendi.'], vi: ['hiểu.'] },
    { de: ['nicht.'], en: ['not'], pt: ['não'], vi: ['không'] },
  ],
  'emergency.write': [{ de: ['aufschreiben?'], en: ['write'], pt: ['escrever'], vi: ['viết'] }],
  'emergency.accident': [{ de: ['Unfall.'], en: ['accident.'], pt: ['acidente.'], vi: ['tai', 'nạn.'] }],
  'emergency.family': [
    { de: ['rufen'], en: ['call'], pt: ['ligar'], vi: ['gọi'] },
    { de: ['Angehörigen'], en: ['family.'], pt: ['família,'], vi: ['người', 'nhà'] },
  ],
  'meet.hello': [{ de: ['Guten', 'Tag.'], en: ['Hello.'], pt: ['Olá,'], vi: ['Chào'] }],
  'meet.nice': [
    { de: ['Freut', 'mich.'], en: ['Nice', 'to', 'meet'], pt: ['Prazer', 'em', 'conhecer'], vi: ['Rất', 'vui', 'được', 'gặp'] },
    { en: ['you.'], pt: ['{addr}.'], vi: ['{addr}.'] },
  ],
  'meet.name': [
    { de: ['heisse'], en: ['name'], pt: ['chamo'], vi: ['tên'] },
    { de: ['Anna.'], en: ['Anna.'], pt: ['Anna.'], vi: ['Anna.'] },
  ],
  'meet.your-name': [
    { de: ['heissen'], en: ['name?'], pt: ['chama?'], vi: ['tên'] },
    { de: ['Sie?'], en: ['your'], pt: ['{addr}'], vi: ['{Addr}'] },
  ],
  'meet.origin': [
    { de: ['Ich'], en: ['I'], pt: ['Eu'], vi: ['Tôi'] },
    { de: ['Schweiz.'], en: ['Switzerland.'], pt: ['Suíça.'], vi: ['Thụy', 'Sĩ.'] },
  ],
  'meet.where-from': [
    { de: ['Woher'], en: ['Where'], pt: ['onde'], vi: ['đâu'] },
    { de: ['Sie?'], en: ['you'], pt: ['{addr}'], vi: ['{Addr}'] },
  ],
  'meet.job': [
    { de: ['arbeite'], en: ['work'], pt: ['trabalho'], vi: ['làm', 'việc'] },
    { de: ['Büro.'], en: ['office.'], pt: ['escritório.'], vi: ['văn', 'phòng.'] },
  ],
  'meet.job-q': [
    { de: ['Sie'], en: ['you'], pt: ['{addr}'], vi: ['{Addr}'] },
    { de: ['beruflich?'], en: ['work?'], pt: ['faz?'], vi: ['nghề'] },
  ],
  'meet.family': [
    { de: ['Wir'], en: ['us.'], pt: ['família'], vi: ['Gia', 'đình'] },
    { de: ['viert.'], en: ['four'], pt: ['quatro'], vi: ['bốn'] },
  ],
  'meet.father': [{ de: ['Vater.'], en: ['father.'], pt: ['pai.'], vi: ['ba'], viN: ['bố'] }],
  'meet.family-q': [
    { de: ['Familie'], en: ['family'], pt: ['família'], vi: ['Gia', 'đình'] },
    { de: ['gross?'], en: ['large?'], pt: ['grande?'], vi: ['đông'] },
    { de: ['Ihre'], en: ['your'], pt: ['sua'], vi: ['{addr}'] },
  ],
  'meet.why': [
    { de: ['Ich'], en: ['I'], pt: ['Eu'], vi: ['Tôi'] },
    { de: ['Reisen'], en: ['travel.'], pt: ['viajar.'], vi: ['du', 'lịch.'] },
  ],
  'meet.stay': [
    { de: ['bleibe'], en: ['staying'], pt: ['ficar'], vi: ['ở'] },
    { de: ['zwei', 'Wochen.'], en: ['two', 'weeks.'], pt: ['duas', 'semanas.'], vi: ['hai', 'tuần.'] },
  ],
  'meet.stay-q': [
    { de: ['Wie', 'lange'], en: ['How', 'long'], pt: ['quanto', 'tempo?'], vi: ['bao', 'lâu'] },
    { de: ['Sie?'], en: ['you'], pt: ['{Addr}'], vi: ['{Addr}'] },
  ],
  'meet.hobby': [
    { de: ['Freizeit'], en: ['free', 'time'], pt: ['tempo', 'livre'], vi: ['rảnh'] },
    { de: ['koche'], en: ['cook.'], pt: ['cozinhar.'], vi: ['nấu', 'ăn.'] },
  ],
  'meet.hobby-q': [
    { de: ['Freizeit?'], en: ['free', 'time?'], pt: ['tempo', 'livre?'], vi: ['rảnh'] },
    { de: ['Sie'], en: ['you'], pt: ['{addr}'], vi: ['{Addr}'] },
  ],
  'meet.food': [
    { de: ['Essen'], en: ['food'], pt: ['comida'], vi: ['món', 'ăn'] },
    { de: ['hier.'], en: ['here.'], pt: ['daqui.'], vi: ['đây.'] },
  ],
  'meet.food-q': [
    { de: ['essen'], en: ['eat?'], pt: ['comida'], vi: ['ăn'] },
    { de: ['Sie'], en: ['you'], pt: ['{addr}'], vi: ['{Addr}'] },
  ],
  'meet.weather': [
    { de: ['Heute'], en: ['today.'], pt: ['Hoje'], vi: ['Hôm', 'nay'] },
    { de: ['Wetter.'], en: ['weather'], pt: ['tempo'], vi: ['trời'] },
  ],
  'meet.weather-q': [
    { de: ['Wetter'], en: ['weather'], pt: ['tempo'], vi: ['Thời', 'tiết'] },
    { de: ['Ihnen?'], en: ['you'], pt: ['sua'], vi: ['{addr}'] },
  ],
  'meet.goodbye': [
    { de: ['Auf', 'Wiedersehen.'], en: ['Goodbye.'], pt: ['Até', 'logo.'], vi: ['Tạm', 'biệt'] },
    { en: ['again.'], vi: ['lại.'] },
  ],
  'meet.thanks': [{ de: ['Danke.'], en: ['Thank', 'you.'], pt: ['Obrigado.'], vi: ['Cảm', 'ơn'] }],
  'meet.contact': [{ de: ['Telefonnummern'], en: ['phone', 'numbers?'], pt: ['contato?'], vi: ['số', 'điện', 'thoại'] }],
  'meet.repeat': [{ de: ['wiederholen?'], en: ['repeat'], pt: ['repetir,'], vi: ['nhắc', 'lại'] }],
  'meet.yes': [{ de: ['Ja,'], en: ['Yes,'], pt: ['Sim,'], vi: ['Dạ.'], viN: ['Vâng.'] }],
  'meet.address-ask': [
    { de: ['ansprechen?'], en: ['address'], pt: ['chamar'], vi: ['xưng', 'hô'] },
    { de: ['Sie'], en: ['you?'], pt: ['{addr}?'] },
  ],
  'arrival.tourist': [
    { de: ['Ich'], en: ['I'], pt: ['Eu'], vi: ['Tôi'] },
    { de: ['Tourist'], en: ['tourist.'], pt: ['turista.'], vi: ['khách', 'du', 'lịch.'] },
  ],
  'arrival.passport': [
    { de: ['Pass.'], en: ['passport.'], pt: ['passaporte.'], vi: ['hộ', 'chiếu'] },
  ],
  'arrival.days': [{ de: ['dreissig', 'Tage.'], en: ['thirty', 'days.'], pt: ['trinta', 'dias.'], vi: ['ba', 'mươi', 'ngày.'] }],
  'arrival.hotel': [{ de: ['Hotel.'], en: ['hotel.'], pt: ['hotel.'], vi: ['khách', 'sạn.'] }],
  'arrival.declare': [
    { de: ['nichts'], en: ['nothing'], pt: ['nada'], vi: ['không'] },
    { de: ['deklarieren.'], en: ['declare.'], pt: ['declarar.'], vi: ['khai', 'báo.'] },
  ],
  'arrival.purpose': [
    { de: ['Zweck'], en: ['purpose'], pt: ['motivo'], vi: ['Mục', 'đích'] },
    { de: ['Reise'], en: ['trip'], pt: ['viagem'], vi: ['chuyến', 'đi'] },
    { de: ['Tourismus.'], en: ['tourism.'], pt: ['turismo.'], vi: ['du', 'lịch.'] },
  ],
  'arrival.taxi': [
    { de: ['Wo'], en: ['Where'], pt: ['Onde'], vi: ['đâu?'] },
    { de: ['Taxistand?'], en: ['taxi', 'stand?'], pt: ['táxi?'], vi: ['taxi'] },
  ],
  'arrival.sim': [
    { de: ['SIM-Karte'], en: ['SIM', 'card.'], pt: ['chip.'], vi: ['SIM.'] },
    { de: ['kaufen.'], en: ['buy'], pt: ['comprar'], vi: ['mua'] },
  ],
  'arrival.luggage': [{ de: ['Gepäck.'], en: ['luggage.'], pt: ['bagagem.'], vi: ['hành', 'lý'] }],
  'arrival.exit': [
    { de: ['Wo'], en: ['Where'], pt: ['Onde'], vi: ['đâu?'] },
    { de: ['Ausgang?'], en: ['exit?'], pt: ['saída?'], vi: ['Lối', 'ra'] },
  ],
  'arrival.level': [
    { de: ['spreche'], en: ['speak'], pt: ['falo'], vi: ['nói'] },
    { de: ['gut.'], en: ['well'], pt: ['bem.'], vi: ['tốt.'] },
  ],
  'food.table': [
    { de: ['Tisch'], en: ['table'], pt: ['mesa'], vi: ['bàn'] },
    { de: ['zwei,'], en: ['two,'], pt: ['duas'], vi: ['hai'] },
  ],
  'food.menu': [{ de: ['Speisekarte,'], en: ['menu,'], pt: ['cardápio,'], vi: ['thực', 'đơn.'] }],
  'food.water': [
    { de: ['Flasche'], en: ['bottle'], pt: ['garrafa'], vi: ['chai'] },
    { de: ['Wasser,'], en: ['water,'], pt: ['água,'], vi: ['nước'] },
  ],
  'food.order': [{ de: ['hier,'], en: ['this', 'one,'], pt: ['este', 'aqui,'], vi: ['món', 'này.'] }],
  'food.meat': [
    { de: ['Ohne'], en: ['No'], pt: ['Sem'], vi: ['không'] },
    { de: ['Fleisch,'], en: ['meat,'], pt: ['carne,'], vi: ['thịt.'] },
  ],
  'food.spicy': [
    { de: ['Nicht'], en: ['Not'], vi: ['Không'] },
    { de: ['scharf,'], en: ['spicy,'], pt: ['apimentado,'], vi: ['cay,'] },
  ],
  'food.bill': [{ de: ['Rechnung,'], en: ['bill,'], pt: ['conta,'], vi: ['Tính', 'tiền'] }],
  'food.good': [{ de: ['schmeckt'], en: ['tastes'], pt: ['delícia.'], vi: ['Ngon'] }],
  'food.veg': [
    { de: ['Ich'], en: ['I'], pt: ['Eu'], vi: ['Tôi'] },
    { de: ['vegetarisch.'], en: ['vegetarian'], pt: ['vegetariana.'], vi: ['chay.'] },
  ],
  'food.recommend': [
    { de: ['empfehlen'], en: ['recommend?'], pt: ['recomenda?'], vi: ['gợi', 'ý'] },
    { de: ['Sie?'], en: ['you'], pt: ['{addr}'], vi: ['{Addr}'] },
  ],
  'food.bowl': [{ de: ['Schale,'], en: ['bowl,'], pt: ['tigela,'], vi: ['chén.'], viN: ['bát.'] }],
  'day.toilet': [
    { de: ['Wo'], en: ['Where'], pt: ['Onde'], vi: ['đâu'] },
    { de: ['Toilette?'], en: ['restroom?'], pt: ['banheiro?'], vi: ['Nhà', 'vệ', 'sinh'] },
  ],
  'visa.need': [
    { de: ['ich'], en: ['I'], pt: ['Eu'], vi: ['Tôi'] },
    { de: ['Visum?'], en: ['visa?'], pt: ['visto?'], vi: ['visa'] },
  ],
  'visa.days': [
    { de: ['Tage'], en: ['days'], pt: ['dias'], vi: ['ngày'] },
    { de: ['bleiben?'], en: ['stay?'], pt: ['ficar?'], vi: ['ở'] },
  ],
  'visa.evisa': [
    { de: ['E-Visum'], en: ['e-visa.'], pt: ['visto', 'eletrônico.'], vi: ['visa', 'điện', 'tử.'] },
  ],
  'visa.documents': [{ de: ['Dokumente'], en: ['documents'], pt: ['documentos'], vi: ['giấy', 'tờ'] }],
  'visa.extend': [
    { de: ['Visum'], en: ['visa.'], pt: ['visto.'], vi: ['visa.'] },
    { de: ['verlängern.'], en: ['extend'], pt: ['prorrogar'], vi: ['gia', 'hạn'] },
  ],
  'visa.photo': [{ de: ['Passfoto.'], en: ['passport', 'photo.'], pt: ['foto', 'de', 'passaporte.'], vi: ['ảnh', 'hộ', 'chiếu.'] }],
  'visa.where': [
    { de: ['Wo'], en: ['Where'], pt: ['Onde'], vi: ['đâu'] },
    { de: ['Gesuch'], en: ['application?'], pt: ['pedido?'], vi: ['hồ', 'sơ'] },
  ],
  'visa.rules': [
    { de: ['aktuelle'], en: ['current'], pt: ['atual?'], vi: ['hiện', 'hành.'] },
    { de: ['Regel'], en: ['rule?'], pt: ['regra'], vi: ['quy', 'định'] },
  ],
  'stay.reservation': [
    { de: ['Ich'], en: ['I'], pt: ['Eu'], vi: ['Tôi'] },
    { de: ['Reservierung.'], en: ['reservation.'], pt: ['reserva.'], vi: ['đặt', 'phòng.'] },
  ],
  'stay.name': [
    { de: ['Reservierung'], en: ['reservation'], pt: ['reserva'], vi: ['Đặt', 'phòng'] },
    { de: ['Anna.'], en: ['Anna.'], pt: ['Anna.'], vi: ['Anna.'] },
  ],
  'stay.wifi': [
    { de: ['WLAN'], en: ['wifi'], pt: ['wi-fi'], vi: ['Wifi'] },
    { de: ['nicht.'], en: ['not'], pt: ['não'], vi: ['không'] },
  ],
  'stay.checkout': [{ de: ['Check-out?'], en: ['check-out?'], pt: ['check-out?'], vi: ['trả', 'phòng'] }],
  'stay.problem': [
    { de: ['Problem'], en: ['problem'], pt: ['problema'], vi: ['sự', 'cố.'] },
    { de: ['Zimmer.'], en: ['room.'], pt: ['quarto.'], vi: ['phòng'] },
  ],
  'stay.key': [{ de: ['Schlüssel.'], en: ['key.'], pt: ['chave.'], vi: ['chìa', 'khoá.'] }],
  'stay.noisy': [{ de: ['laut.'], en: ['noisy.'], pt: ['barulho.'], vi: ['Ồn'] }],
  'stay.address': [
    { de: ['Adresse'], en: ['address'], pt: ['endereço'], vi: ['Địa', 'chỉ'] },
    { de: ['hier?'], en: ['here?'], pt: ['daqui?'], vi: ['đây'] },
  ],
  'shop.price': [
    { de: ['Wie', 'viel'], en: ['How', 'much'], pt: ['Quanto'], vi: ['bao', 'nhiêu'] },
    { de: ['das?'], en: ['this'], pt: ['isto?'], vi: ['Cái', 'này'] },
  ],
  'shop.expensive': [{ de: ['teuer.'], en: ['expensive.'], pt: ['caro'], vi: ['Đắt'] }],
  'shop.have': [
    { de: ['Sie'], en: ['you'], pt: ['Você'] },
    { de: ['das?'], en: ['this?'], pt: ['isto?'], vi: ['cái', 'này'] },
  ],
  'shop.look': [
    { de: ['Ich'], en: ['I'], pt: ['Eu'], vi: ['Tôi'] },
    { de: ['schaue'], en: ['looking.'], pt: ['olhando.'], vi: ['xem'] },
  ],
  'shop.card': [
    { de: ['Karte'], en: ['card?'], pt: ['cartão?'], vi: ['thẻ'] },
    { de: ['zahlen?'], en: ['pay'], pt: ['pagar'], vi: ['trả'] },
  ],
  'shop.receipt': [{ de: ['Quittung.'], en: ['receipt?'], pt: ['recibo,'], vi: ['hoá', 'đơn.'] }],
  'sight.tickets': [
    { de: ['Zwei'], en: ['Two'], pt: ['Dois'], vi: ['hai'] },
    { de: ['Eintritte,'], en: ['tickets,'], pt: ['ingressos,'], vi: ['vé.'] },
  ],
  'sight.price': [
    { de: ['Wie', 'viel'], en: ['How', 'much'], pt: ['Quanto'], vi: ['bao', 'nhiêu'] },
    { de: ['Eintritt?'], en: ['ticket?'], pt: ['ingresso?'], vi: ['Vé'] },
  ],
  'sight.where': [
    { de: ['Wo'], en: ['Where'], pt: ['Onde'], vi: ['đâu'] },
    { de: ['Museum?'], en: ['museum?'], pt: ['museu?'], vi: ['Bảo', 'tàng'] },
  ],
  'sight.open': [{ de: ['geöffnet?'], en: ['open?'], pt: ['abre?'], vi: ['mở', 'cửa'] }],
  'sight.photo': [{ de: ['fotografieren?'], en: ['photo?'], pt: ['foto?'], vi: ['chụp', 'ảnh'] }],
  'sight.close': [{ de: ['schliessen'], en: ['close?'], pt: ['fecha?'], vi: ['đóng', 'cửa'] }],
  'day.morning': [{ de: ['Guten', 'Morgen.'], en: ['Good', 'morning.'], pt: ['Bom', 'dia.'], vi: ['Chào', 'buổi', 'sáng.'] }],
  'day.excuse': [{ de: ['Entschuldigung.'], en: ['Excuse', 'me.'], pt: ['Com', 'licença.'], vi: ['Xin', 'lỗi.'] }],
  'day.please': [{ de: ['Bitte.'], en: ['Please.'], pt: ['Por', 'favor.'], vi: ['Làm', 'ơn.'] }],
  'day.today': [{ de: ['Heute.'], en: ['Today.'], pt: ['Hoje.'], vi: ['Hôm', 'nay.'] }],
  'day.tomorrow': [{ de: ['Morgen.'], en: ['Tomorrow.'], pt: ['Amanhã.'], vi: ['Ngày', 'mai.'] }],
  'day.numbers': [
    { de: ['eins,'], en: ['one,'], pt: ['um,'], vi: ['một,'] },
    { de: ['zwei,'], en: ['two,'], pt: ['dois,'], vi: ['hai,'] },
    { de: ['drei,'], en: ['three,'], pt: ['três,'], vi: ['ba,'] },
    { de: ['vier,'], en: ['four,'], pt: ['quatro,'], vi: ['bốn,'] },
    { de: ['fünf,'], en: ['five,'], pt: ['cinco,'], vi: ['năm,'] },
    { de: ['sechs,'], en: ['six,'], pt: ['seis,'], vi: ['sáu,'] },
    { de: ['sieben,'], en: ['seven,'], pt: ['sete,'], vi: ['bảy,'] },
    { de: ['acht,'], en: ['eight,'], pt: ['oito,'], vi: ['tám,'] },
    { de: ['neun,'], en: ['nine,'], pt: ['nove,'], vi: ['chín,'] },
    { de: ['zehn'], en: ['ten'], pt: ['dez'], vi: ['mười'] },
  ],
  ...transportGloss,
}

type SideKey = 'de' | 'en' | 'pt' | 'vi' | 'viN'

export function splitWords(text: string): string[] {
  return text.split(/\s+/).filter((word) => word.length > 0)
}

function sideKey(lang: Lang, region: 'south' | 'north'): SideKey {
  if (lang === 'pt-BR') return 'pt'
  if (lang === 'vi' && region === 'north') return 'viN'
  return lang
}

export function expandTokens(tokens: readonly string[], insert: string): string[] {
  const capital = insert.length > 0 ? insert.charAt(0).toLocaleUpperCase() + insert.slice(1) : insert
  const out: string[] = []
  for (const token of tokens) {
    if (!token.includes('{addr}') && !token.includes('{Addr}')) {
      out.push(token)
      continue
    }
    const replaced = token.replaceAll('{Addr}', capital).replaceAll('{addr}', insert)
    for (const part of replaced.split(/\s+/)) {
      if (part.length > 0) out.push(part)
    }
  }
  return out
}

function patternFor(group: GlossSide, key: SideKey): readonly string[] {
  if (key === 'viN') return group.viN ?? group.vi ?? []
  return group[key] ?? []
}

function findFree(words: readonly string[], pattern: readonly string[], used: ReadonlySet<number>): number {
  if (pattern.length === 0) return -1
  for (let start = 0; start + pattern.length <= words.length; start += 1) {
    let fits = true
    for (let offset = 0; offset < pattern.length; offset += 1) {
      if (used.has(start + offset) || words[start + offset] !== pattern[offset]) {
        fits = false
        break
      }
    }
    if (fits) return start
  }
  return -1
}

/**
 * Links that exist on both sentences. A group that does not match either wording is left out.
 * Tokens already used by an earlier group are not reused.
 */
export function linkWords(
  conceptId: string,
  targetLang: Lang,
  targetRegion: 'south' | 'north',
  targetSpeech: string,
  targetInsert: string,
  sourceLang: Lang,
  sourceRegion: 'south' | 'north',
  sourceSpeech: string,
  sourceInsert: string,
): WordLink[] {
  const groups = GLOSS[conceptId]
  if (!groups) return []
  const targetWords = splitWords(targetSpeech)
  const sourceWords = splitWords(sourceSpeech)
  const usedTarget = new Set<number>()
  const usedSource = new Set<number>()
  const links: WordLink[] = []
  for (const group of groups) {
    const targetPattern = expandTokens(patternFor(group, sideKey(targetLang, targetRegion)), targetInsert)
    const sourcePattern = expandTokens(patternFor(group, sideKey(sourceLang, sourceRegion)), sourceInsert)
    if (targetPattern.length === 0 || sourcePattern.length === 0) continue
    const targetAt = findFree(targetWords, targetPattern, usedTarget)
    const sourceAt = findFree(sourceWords, sourcePattern, usedSource)
    if (targetAt < 0 || sourceAt < 0) continue
    const target = targetPattern.map((_, offset) => targetAt + offset)
    const gloss = sourcePattern.map((_, offset) => sourceAt + offset)
    for (const index of target) usedTarget.add(index)
    for (const index of gloss) usedSource.add(index)
    links.push({ target, gloss })
  }
  return links
}
