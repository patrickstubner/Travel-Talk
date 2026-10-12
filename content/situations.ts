import type { Situation } from './phrase'

export const situations: Situation[] = [
  {
    id: 'visa',
    order: 1,
    depth: 'starter',
    title: {
      de: 'Visum vor der Reise',
      en: 'Visa before the trip',
      'pt-BR': 'Visto antes da viagem',
      vi: 'Visa trước chuyến đi',
    },
    summary: {
      de: 'Fragen am Schalter und eine Karte mit Quellen. Keine Rechtsauskunft.',
      en: 'Counter questions and a sourced card. Not legal advice.',
      'pt-BR': 'Perguntas no balcão e um cartão com fontes. Não é orientação jurídica.',
      vi: 'Câu hỏi ở quầy và một thẻ có nguồn. Không phải tư vấn pháp lý.',
    },
  
    canDo: {
      de: 'Du kannst am Schalter nach dem Visum fragen.',
      en: 'You can ask about the visa at the counter.',
      'pt-BR': 'Você pode perguntar do visto no balcão.',
      vi: 'Bạn có thể hỏi visa ở quầy.',
    },
  },
  {
    id: 'arrival',
    order: 2,
    depth: 'sample',
    title: {
      de: 'Ankunft und Einreise',
      en: 'Arrival and immigration',
      'pt-BR': 'Chegada e imigração',
      vi: 'Đến nơi và nhập cảnh',
    },
    summary: {
      de: 'Kurze Sätze für Passkontrolle, Gepäck und den Weg nach draussen.',
      en: 'Short lines for passport control, luggage and the way out.',
      'pt-BR': 'Frases curtas para o controle, a bagagem e a saída.',
      vi: 'Câu ngắn cho kiểm tra hộ chiếu, hành lý và lối ra.',
    },
  
    canDo: {
      de: 'Du kannst sagen, warum du hier bist.',
      en: 'You can say why you are here.',
      'pt-BR': 'Você pode dizer por que está aqui.',
      vi: 'Bạn có thể nói vì sao bạn ở đây.',
    },
  },
  {
    id: 'stay',
    order: 3,
    depth: 'starter',
    title: {
      de: 'Unterkunft',
      en: 'Accommodation',
      'pt-BR': 'Hospedagem',
      vi: 'Chỗ ở',
    },
    summary: {
      de: 'Hotel, Privatunterkunft oder Airbnb: Ankommen, WLAN, Problem.',
      en: 'Hotel, private room or rental: arrival, wifi, a problem.',
      'pt-BR': 'Hotel, casa ou aluguel: chegada, wi-fi, um problema.',
      vi: 'Khách sạn, nhà riêng hoặc thuê: đến, wifi, sự cố.',
    },
  
    canDo: {
      de: 'Du kannst in der Unterkunft ankommen.',
      en: 'You can arrive at the place you are staying.',
      'pt-BR': 'Você pode chegar na hospedagem.',
      vi: 'Bạn có thể nhận phòng.',
    },
  },
  {
    id: 'shop',
    order: 4,
    depth: 'starter',
    title: {
      de: 'Einkaufen',
      en: 'Shopping',
      'pt-BR': 'Compras',
      vi: 'Mua sắm',
    },
    summary: {
      de: 'Preis, Karte, Quittung. Handeln bleibt eine spätere Erweiterung.',
      en: 'Price, card, receipt. Bargaining can grow later.',
      'pt-BR': 'Preço, cartão, recibo. Pechincha fica para depois.',
      vi: 'Giá, thẻ, hoá đơn. Mặc cả có thể thêm sau.',
    },
  
    canDo: {
      de: 'Du kannst nach dem Preis fragen.',
      en: 'You can ask the price.',
      'pt-BR': 'Você pode perguntar o preço.',
      vi: 'Bạn có thể hỏi giá.',
    },
  },
  {
    id: 'sight',
    order: 5,
    depth: 'starter',
    title: {
      de: 'Sehenswürdigkeiten',
      en: 'Sights and activities',
      'pt-BR': 'Passeios',
      vi: 'Tham quan',
    },
    summary: {
      de: 'Ticket, Öffnungszeit, Foto, Weg.',
      en: 'Ticket, opening time, photo, the way.',
      'pt-BR': 'Ingresso, horário, foto, caminho.',
      vi: 'Vé, giờ mở cửa, chụp ảnh, đường đi.',
    },
  
    canDo: {
      de: 'Du kannst nach einem Ticket fragen.',
      en: 'You can ask for a ticket.',
      'pt-BR': 'Você pode pedir um ingresso.',
      vi: 'Bạn có thể hỏi vé.',
    },
  },
  {
    id: 'food',
    order: 6,
    depth: 'sample',
    title: {
      de: 'Restaurant, Essen und Trinken',
      en: 'Restaurant, food and drink',
      'pt-BR': 'Restaurante, comida e bebida',
      vi: 'Quán ăn, đồ ăn và thức uống',
    },
    summary: {
      de: 'Bestellen, Allergie, Rechnung. Ein kleiner fester Satz, kein volles Menü.',
      en: 'Order, allergy, the bill. A small fixed set, not a full menu.',
      'pt-BR': 'Pedir, alergia, a conta. Um conjunto pequeno, não um cardápio inteiro.',
      vi: 'Gọi món, dị ứng, tính tiền. Một nhóm nhỏ, chưa phải cả thực đơn.',
    },
  
    canDo: {
      de: 'Du kannst etwas bestellen.',
      en: 'You can order something.',
      'pt-BR': 'Você pode pedir alguma coisa.',
      vi: 'Bạn có thể gọi món.',
    },
  },
  {
    id: 'day',
    order: 7,
    depth: 'starter',
    title: {
      de: 'Alltag',
      en: 'Everyday life',
      'pt-BR': 'Dia a dia',
      vi: 'Sinh hoạt hằng ngày',
    },
    summary: {
      de: 'Gruss, Bitte, Zahlen, heute und morgen.',
      en: 'Greeting, please, numbers, today and tomorrow.',
      'pt-BR': 'Cumprimento, por favor, números, hoje e amanhã.',
      vi: 'Chào, làm ơn, số, hôm nay và ngày mai.',
    },
  
    canDo: {
      de: 'Du kannst grüssen und bitten.',
      en: 'You can greet someone and ask for something.',
      'pt-BR': 'Você pode cumprimentar e pedir.',
      vi: 'Bạn có thể chào và nhờ.',
    },
  },
  {
    id: 'emergency',
    order: 8,
    depth: 'core',
    title: {
      de: 'Notfall',
      en: 'Emergency',
      'pt-BR': 'Emergência',
      vi: 'Khẩn cấp',
    },
    summary: {
      de: 'Hilfe, Arzt, Allergie, Ausweis weg. Grosser Zeigen-Modus, offline.',
      en: 'Help, a doctor, an allergy, a missing passport. Large show mode, offline.',
      'pt-BR': 'Ajuda, médico, alergia, passaporte perdido. Modo mostrar, offline.',
      vi: 'Cứu, bác sĩ, dị ứng, mất hộ chiếu. Chế độ đưa màn hình, dùng offline.',
    },
  
    canDo: {
      de: 'Du kannst um Hilfe bitten.',
      en: 'You can ask for help.',
      'pt-BR': 'Você pode pedir ajuda.',
      vi: 'Bạn có thể gọi giúp.',
    },
  },
  {
    id: 'meeting',
    order: 9,
    depth: 'core',
    title: {
      de: 'Menschen treffen',
      en: 'Meeting people',
      'pt-BR': 'Conhecer pessoas',
      vi: 'Gặp gỡ',
    },
    summary: {
      de: 'Vorstellen, nachfragen, Smalltalk, Abschied, Kontakt. Anrede wählbar.',
      en: 'Introduce yourself, follow up, small talk, goodbye, contact. Address forms you can choose.',
      'pt-BR': 'Apresentar-se, perguntar, conversa fiada, despedida, contato. Tratamento à escolha.',
      vi: 'Giới thiệu, hỏi lại, chuyện phiếm, tạm biệt, số điện thoại. Chọn cách xưng hô.',
    },
  
    canDo: {
      de: 'Du kannst dich vorstellen.',
      en: 'You can introduce yourself.',
      'pt-BR': 'Você pode se apresentar.',
      vi: 'Bạn có thể giới thiệu bản thân.',
    },
  },
  {
    id: 'transport',
    order: 10,
    depth: 'sample',
    title: {
      de: 'Transport',
      en: 'Transport',
      'pt-BR': 'Transporte',
      vi: 'Đi lại',
    },
    summary: {
      de: 'Taxi, App, Bus, Tram, Metro, Flug und Fähre. Kurze Sätze, vom kurzen zum längeren.',
      en: 'Taxi, app, bus, tram, metro, flight and ferry. Short lines, from short to longer.',
      'pt-BR': 'Táxi, aplicativo, ônibus, VLT, metrô, voo e balsa. Frases curtas, da curta à mais longa. No Rio e na Baixada Santista, VLT; em outras cidades o nome muda.',
      vi: 'Taxi, ứng dụng, xe buýt, tàu điện, metro, máy bay và phà. Câu ngắn, từ ngắn đến dài.',
    },
    canDo: {
      de: 'Du kannst nach dem Weg, dem Preis und dem Ticket fragen.',
      en: 'You can ask the way, the price and for a ticket.',
      'pt-BR': 'Você pode perguntar o caminho, o preço e uma passagem.',
      vi: 'Bạn có thể hỏi đường, hỏi giá và hỏi vé.',
    },
  },
]
