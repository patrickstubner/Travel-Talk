import type { GlossSide } from './gloss'

/** Unchecked word links for the transport lines. Tokens must occur in the spoken wording. */
export const transportGloss: Record<string, readonly GlossSide[]> = {
  'transport.01.taxi': [{ de: ['Taxi.'], en: ['taxi.'], pt: ['táxi.'], vi: ['taxi.'] }],
  'transport.02.where': [{ de: ['Wohin?'], en: ['Where', 'to?'], pt: ['Para', 'onde?'], vi: ['Đi', 'đâu?'] }],
  'transport.03.hotel': [{ de: ['Hotel.'], en: ['hotel.'], pt: ['hotel.'], vi: ['khách', 'sạn.'] }],
  'transport.04.airport': [{ de: ['Flughafen.'], en: ['airport.'], pt: ['aeroporto.'], vi: ['sân', 'bay.'] }],
  'transport.05.price': [{ de: ['Wie', 'viel?'], en: ['How', 'much?'], pt: ['Quanto?'], vi: ['Bao', 'nhiêu?'] }],
  'transport.06.meter': [{ de: ['Taxameter.'], en: ['meter.'], pt: ['taxímetro.'], vi: ['đồng', 'hồ.'] }],
  'transport.07.here': [{ de: ['hier', 'halten.'], en: ['stop', 'here.'], pt: ['pare', 'aqui.'], vi: ['dừng'] }],
  'transport.08.plate': [{ de: ['Kennzeichen?'], en: ['plate?'], pt: ['placa?'], vi: ['Biển', 'số'] }],
  'transport.09.app': [{ de: ['App'], en: ['app.'], pt: ['aplicativo.'], vi: ['ứng', 'dụng.'] }],
  'transport.10.ticket': [{ de: ['Ticket.'], en: ['ticket.'], pt: ['passagem.'], vi: ['vé.'] }],
  'transport.11.stop': [{ de: ['Haltestelle?'], en: ['stop?'], pt: ['ponto?'], vi: ['Trạm'] }],
  'transport.12.off': [{ de: ['aus?'], en: ['off?'], pt: ['desço?'], vi: ['xuống'] }],
  'transport.13.line': [{ de: ['Linie?'], en: ['line?'], pt: ['linha?'], vi: ['Tuyến'] }],
  'transport.14.platform': [{ de: ['Gleis?'], en: ['platform?'], pt: ['plataforma?'], vi: ['ga'] }],
  'transport.15.long': [{ de: ['lange'], en: ['long'], pt: ['tempo'], vi: ['lâu?'] }],
  'transport.16.gate': [{ de: ['Gate?'], en: ['gate?'], pt: ['portão?'], vi: ['Cửa'] }],
  'transport.17.delay': [{ de: ['Verspätung.'], en: ['delayed.'], pt: ['atrasado.'], vi: ['trễ.'] }],
  'transport.18.missed': [{ de: ['Anschluss'], en: ['connection.'], pt: ['conexão.'], vi: ['nối.'] }],
  'transport.19.ferry': [
    { de: ['Fähre'], en: ['ferry'], pt: ['balsa'], vi: ['phà'] },
    { de: ['Insel?'], en: ['island?'], pt: ['ilha?'], vi: ['đảo'] },
  ],
  'transport.20.seasick': [{ de: ['übel.'], en: ['seasick.'], pt: ['enjoo.'], vi: ['say', 'sóng.'] }],
}
