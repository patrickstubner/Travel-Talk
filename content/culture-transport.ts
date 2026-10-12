import type { CultureNote } from './phrase'

const accessed = '2026-10-11'

export const transportNotes: CultureNote[] = [
  {
    id: 'vn-transport',
    situationIds: ['transport'],
    regions: ['VN'],
    geprueft: false,
    title: {
      de: 'Taxi, App und Metro in Vietnam',
      en: 'Taxi, apps and the metro in Vietnam',
      'pt-BR': 'Táxi, aplicativos e metrô no Vietnã',
      vi: 'Taxi, ứng dụng và metro ở Việt Nam',
    },
    body: {
      de: 'Nghị định 158/2024/NĐ-CP gilt seit dem 1. Januar 2025. Für ein Taxi mit Taxameter verlangt der Text ein geprüftes und verplombtes Messgerät, sichtbar für die Fahrgäste, und am Ende eine elektronische Rechnung. Die Rechnung nennt mindestens den Betrieb, das Kennzeichen, die Kilometer und den Betrag. Eine App ist im selben Artikel ein eigener Weg: vor der Fahrt zeigt die Oberfläche mindestens den Betrieb, den Namen der fahrenden Person, das Kennzeichen, die Strecke, die Kilometer, den Preis und eine Telefonnummer für Rückmeldungen. Ein dritter Weg im selben Artikel ist ein vereinbarter Preis nach einer ausgehängten Liste oder über die App. «Bitte den Taxameter» passt also nur, wenn diese Fahrt über das Messgerät läuft. Grab nennt auf der eigenen Seite für Vietnam GrabTaxi, GrabCar, JustGrab und GrabBike. GrabBike ist ein Motorrad über die App. Ein xe ôm am Strassenrand ist damit nicht beschrieben. Ob man den Preis dafür vorher aushandelt: noch nicht geprüft. Die Hà Nội Metro schreibt, seit dem 18. November 2025 laufe ein Einzelticket anders: in der App erst nach einer Identifikation mit einer CCCD, oder am Schalter mit einem QR-Code für ein einzelnes Durchgehen. Ob ein ausländischer Pass in der App gilt: noch nicht geprüft. Das ist diese Bahn, nicht jede Stadt.',
      en: 'Decree 158/2024/NĐ-CP has been in force since 1 January 2025. For a taxi that uses a meter, the text requires a verified and sealed meter, visible to passengers, and an electronic invoice at the end. The receipt names at least the operator, the plate, the kilometres and the amount. An app is a separate path in the same article: before the trip the screen shows at least the operator, the driver’s name, the plate, the route, the kilometres, the price and a phone number for complaints. A third path in the same article is an agreed price against a posted list or through the app. “Please use the meter” fits only when this trip runs on the meter. Grab’s own Vietnam page names GrabTaxi, GrabCar, JustGrab and GrabBike. GrabBike is a motorbike through the app. A street xe ôm is not what that page describes. Whether the price for one is agreed first: not checked yet. Hanoi Metro writes that from 18 November 2025 a single ticket works differently: in the app only after identification with a CCCD, or at the counter with a QR code for one passage. Whether a foreign passport works in the app: not checked yet. This is that railway, not every city.',
      'pt-BR': 'O Decreto 158/2024/NĐ-CP vale desde 1º de janeiro de 2025. Para um táxi com taxímetro, o texto pede um medidor verificado e lacrado, visível para os passageiros, e uma nota eletrônica no fim. O recibo traz pelo menos a empresa, a placa, os quilômetros e o valor. Um aplicativo é outro caminho no mesmo artigo: antes da corrida a tela mostra pelo menos a empresa, o nome de quem dirige, a placa, o trajeto, os quilômetros, o preço e um telefone para reclamação. Um terceiro caminho no mesmo artigo é um preço combinado segundo uma lista afixada ou pelo aplicativo. «Por favor, use o taxímetro» cabe só quando esta corrida segue o medidor. A página da Grab para o Vietnã cita GrabTaxi, GrabCar, JustGrab e GrabBike. GrabBike é uma moto pelo aplicativo. Um xe ôm na rua não é o que essa página descreve. Se o preço dele se combina antes: ainda não verificado. A Hà Nội Metro escreve que desde 18 de novembro de 2025 um bilhete avulso funciona de outro modo: no aplicativo só depois de uma identificação com CCCD, ou no balcão com um código QR para uma passagem. Se um passaporte estrangeiro vale no aplicativo: ainda não verificado. É essa linha, não toda cidade.',
      vi: 'Nghị định 158/2024/NĐ-CP có hiệu lực từ ngày 1 tháng 1 năm 2025. Với taxi tính cước bằng đồng hồ, văn bản yêu cầu đồng hồ đã được kiểm định và kẹp chì, hành khách nhìn thấy, và hoá đơn điện tử khi kết thúc. Phiếu thu có ít nhất tên đơn vị, biển số, số km và số tiền. Ứng dụng là một đường riêng trong cùng điều: trước chuyến đi, màn hình cho hành khách thấy ít nhất tên đơn vị, tên người lái, biển số, hành trình, số km, số tiền và số điện thoại để phản ánh. Đường thứ ba trong cùng điều là giá thoả thuận theo bảng niêm yết hoặc qua ứng dụng. «Làm ơn bật đồng hồ» chỉ hợp khi chuyến đó đi theo đồng hồ. Trang của Grab cho Việt Nam nêu GrabTaxi, GrabCar, JustGrab và GrabBike. GrabBike là xe máy qua ứng dụng. Xe ôm đứng đường không phải điều trang đó mô tả. Giá xe ôm có chốt trước hay không: chưa kiểm tra. Hà Nội Metro viết, từ ngày 18 tháng 11 năm 2025 vé lượt đổi cách: trên ứng dụng phải định danh bằng CCCD trước, hoặc ở quầy nhận mã QR cho một lượt qua cổng. Hộ chiếu nước ngoài có dùng trên ứng dụng hay không: chưa kiểm tra. Đó là tuyến này, không phải mọi thành phố.',
    },
    sources: [
      {
        title: 'Bộ Tư pháp / Bộ Giao thông vận tải: Nghị định 158/2024/NĐ-CP, Điều 6, hiệu lực 01/01/2025',
        url: 'https://vbpl.moj.gov.vn/bogiaothong/Pages/vbpq-toanvan.aspx?ItemID=173412',
        accessed,
      },
      {
        title: 'Công báo: Nghị định 158/2024/NĐ-CP, ban hành 18/12/2024, hiệu lực 01/01/2025',
        url: 'https://congbao.chinhphu.vn/van-ban/nghi-dinh-so-158-2024-nd-cp-43540/53509.htm',
        accessed,
      },
      {
        title: 'Grab Vietnam: Ride Services (GrabTaxi, GrabCar, JustGrab, GrabBike)',
        url: 'https://www.grab.com/vn/en/transport/',
        accessed,
      },
      {
        title: 'Hà Nội Metro: mua vé lượt từ 18/11/2025',
        url: 'https://metrohanoi.vn/huong-dan-mua-ve-dung-1-lan-tren-he-thong-moi-cua-ha-noi-metro/',
        accessed,
      },
    ],
  },
  {
    id: 'br-transport',
    situationIds: ['transport'],
    regions: ['BR'],
    geprueft: false,
    title: {
      de: 'Taxi und Apps in São Paulo und Brasilien',
      en: 'Taxis and apps in São Paulo and Brazil',
      'pt-BR': 'Táxi e aplicativos em São Paulo e no Brasil',
      vi: 'Taxi và ứng dụng ở São Paulo và Brasil',
    },
    body: {
      de: 'Das Gemeindegesetz 7.329 der Stadt São Paulo von 1969 verlangt für das lizenzierte Taxi ein Taxameter oder ein Registriergerät, verplombt von der zuständigen Stelle, und eine Tarifliste im Wagen. Ob jede andere Stadt dieselbe Regel hat: noch nicht geprüft. 99 beschreibt auf der Seite für Fahrgäste unter anderem 99Pop, 99Táxi, 99Moto und 99Negocia. Bei 99Negocia lässt sich der Preis dieser Fahrt aushandeln. Das gilt für diese Kategorie, nicht für jede Fahrt in der App. Die brasilianische Seite von Uber beschreibt, eine Fahrt in der App zu bestellen, und ein Taxi dort, wo Uber Taxi angeboten wird. Nicht jede Stadt hat jede Kategorie.',
      en: 'Municipal law 7.329 of the city of São Paulo, from 1969, requires a licensed taxi to have a meter or a recording device, sealed by the competent authority, and a fare table in the vehicle. Whether every other city has the same rule: not checked yet. On its passenger page, 99 names among others 99Pop, 99Táxi, 99Moto and 99Negocia. In 99Negocia the price of that trip can be negotiated. That is this category, not every trip in the app. Uber’s Brazilian page describes booking a trip in the app, and a taxi where Uber Taxi is offered. Not every city has every category.',
      'pt-BR': 'A Lei municipal 7.329 da cidade de São Paulo, de 1969, exige para o táxi licenciado um taxímetro ou um aparelho registrador, lacrado pela autoridade competente, e uma tabela de tarifas no carro. Se toda outra cidade tem a mesma regra: ainda não verificado. Na página para passageiros, a 99 cita entre outras 99Pop, 99Táxi, 99Moto e 99Negocia. Na 99Negocia dá para negociar o preço daquela corrida. Isso vale para essa categoria, não para toda corrida no aplicativo. A página brasileira da Uber descreve pedir uma viagem no aplicativo, e um táxi onde o Uber Taxi é oferecido. Nem toda cidade tem toda categoria.',
      vi: 'Luật thành phố 7.329 của São Paulo, năm 1969, yêu cầu taxi được cấp phép có taxímetro hoặc máy ghi, được cơ quan có thẩm quyền niêm phong, và một bảng giá trong xe. Mọi thành phố khác có cùng quy tắc hay không: chưa kiểm tra. Trang cho hành khách của 99 nêu trong số các hạng 99Pop, 99Táxi, 99Moto và 99Negocia. Ở 99Negocia có thể thương lượng giá chuyến đó. Điều này cho hạng đó, không phải mọi chuyến trong ứng dụng. Trang Brasil của Uber mô tả gọi một chuyến trong ứng dụng, và taxi ở nơi có Uber Taxi. Không phải thành phố nào cũng có mọi hạng.',
    },
    sources: [
      {
        title: 'Lei municipal nº 7.329, de 11 de julho de 1969, São Paulo, art. 15',
        url: 'https://app-plpconsulta-prd.azurewebsites.net/Forms/MostrarArquivo?ANO=1969&DOCUMENTO=Atualizado&NUMERO=7329&TIPO=Lei',
        accessed,
      },
      {
        title: '99: página do passageiro (99Pop, 99Táxi, 99Moto, 99Negocia)',
        url: 'https://99app.com/passageiro/',
        accessed,
      },
      {
        title: 'Uber Brasil: solicitar uma viagem e táxi onde o Uber Taxi está disponível',
        url: 'https://www.uber.com/br/pt-br/ride/',
        accessed,
      },
    ],
  },
  {
    id: 'dech-transport',
    situationIds: ['transport'],
    regions: ['DE-CH'],
    geprueft: false,
    title: {
      de: 'Ticket und Schiff im ZVV',
      en: 'Tickets and boats in the ZVV',
      'pt-BR': 'Bilhete e barco no ZVV',
      vi: 'Vé và tàu trong ZVV',
    },
    body: {
      de: 'Der Zürcher Verkehrsverbund schreibt in der leichten Sprache: Personen ab 6 Jahren brauchen ein Ticket, bevor das Fahrzeug losfährt, und empfiehlt, es vor dem Einsteigen zu lösen. Ein Zonenticket gilt in der gelösten Zeit unter anderem für Tram, S-Bahn, Bus, Schiff oder Bergbahn. Das Kurzstrecken-Billett in Zürich oder Winterthur gilt nicht für die Schiffe auf dem Zürichsee und auf der Limmat. An den blauen Automaten gibt es Tickets für Bahn, Tram, Bus oder Schiff. Ein Taxameter in der Deutschschweiz: noch nicht geprüft.',
      en: 'The Zurich transport network writes, in its easy-language page: people from the age of 6 need a ticket before the vehicle leaves, and it recommends buying it before boarding. A zone ticket is valid for that time on, among others, tram, S-Bahn, bus, boat or mountain railway. The short-distance ticket in Zurich or Winterthur does not cover the boats on Lake Zurich or on the Limmat. The blue machines sell tickets for train, tram, bus or boat. A taxi meter in German-speaking Switzerland: not checked yet.',
      'pt-BR': 'A rede de transporte de Zurique escreve, na página em linguagem fácil: pessoas a partir de 6 anos precisam de um bilhete antes de o veículo partir, e recomenda comprá-lo antes de entrar. Um bilhete de zona vale nesse tempo, entre outros, para bonde, S-Bahn, ônibus, barco ou trem de montanha. O bilhete de trecho curto em Zurique ou Winterthur não vale para os barcos no lago de Zurique nem no Limmat. Nas máquinas azuis há bilhetes para trem, bonde, ônibus ou barco. Um taxímetro na Suíça alemã: ainda não verificado.',
      vi: 'Mạng giao thông Zurich viết, ở trang lời dễ: người từ 6 tuổi cần vé trước khi xe chạy, và khuyên mua vé trước khi lên. Vé theo vùng có giá trị trong thời gian đó cho, trong số khác, tàu điện, S-Bahn, xe buýt, tàu thuỷ hoặc tàu núi. Vé đoạn ngắn ở Zurich hoặc Winterthur không dùng cho tàu trên hồ Zurich và trên sông Limmat. Máy màu xanh bán vé cho tàu hoả, tàu điện, xe buýt hoặc tàu thuỷ. Đồng hồ taxi ở vùng tiếng Đức của Thụy Sĩ: chưa kiểm tra.',
    },
    sources: [
      {
        title: 'ZVV, leichte Sprache: Ticket- und Abokauf',
        url: 'https://www.zvv.ch/de/service/leichte-sprache/ticket--und-abokauf.html',
        accessed,
      },
    ],
  },
  {
    id: 'en-transport',
    situationIds: ['transport'],
    regions: ['EN'],
    geprueft: false,
    title: {
      de: 'Zahlen in London: Bus, Tube, Tram, Schiff',
      en: 'Paying in London: bus, Tube, tram, boat',
      'pt-BR': 'Pagar em Londres: ônibus, Tube, tram, barco',
      vi: 'Trả tiền ở Luân Đôn: xe buýt, Tube, tram, thuyền',
    },
    body: {
      de: 'Transport for London beschreibt Pay as you go mit kontaktloser Karte oder Oyster für Bus, Tube, Tram, DLR, London Overground, den grössten Teil der Elizabeth line, die London Cable Car, die Thames Clippers als River Bus und die meisten National-Rail-Züge in den Zonen 1 bis 9. Beim Bus und bei der Tram tippt man nur zu Beginn auf das gelbe Lesegerät. Bei Tube, DLR, Overground, Elizabeth line, National Rail, River Bus und Cable Car auch am Ende, mit derselben Karte oder demselben Gerät, auch wenn das Tor offen ist. Das ist London. Taxi und Fahr-Apps in anderen englischsprachigen Ländern: noch nicht geprüft.',
      en: 'Transport for London describes pay as you go with a contactless card or an Oyster card for bus, Tube, tram, DLR, London Overground, most of the Elizabeth line, the London Cable Car, Thames Clippers river buses and most National Rail trains in zones 1 to 9. On a bus or a tram you touch the yellow reader only at the start. On the Tube, DLR, Overground, Elizabeth line, National Rail, river bus and cable car you also touch at the end, with the same card or the same device, even if the gate is open. This is London. Taxis and ride apps in other English-speaking countries: not checked yet.',
      'pt-BR': 'A Transport for London descreve o pay as you go com cartão por aproximação ou Oyster para ônibus, Tube, tram, DLR, London Overground, a maior parte da Elizabeth line, o London Cable Car, os Thames Clippers como river bus e a maioria dos trens da National Rail nas zonas 1 a 9. No ônibus e no tram encosta-se o leitor amarelo só no começo. No Tube, DLR, Overground, Elizabeth line, National Rail, river bus e cable car também no fim, com o mesmo cartão ou o mesmo aparelho, mesmo se o portão estiver aberto. Isso é Londres. Táxi e aplicativos de corrida em outros países de língua inglesa: ainda não verificado.',
      vi: 'Transport for London mô tả pay as you go bằng thẻ không tiếp xúc hoặc thẻ Oyster cho xe buýt, Tube, tram, DLR, London Overground, phần lớn Elizabeth line, London Cable Car, Thames Clippers như river bus và hầu hết tàu National Rail trong vùng 1 đến 9. Trên xe buýt và tram chỉ chạm đầu đọc màu vàng lúc lên. Với Tube, DLR, Overground, Elizabeth line, National Rail, river bus và cable car còn chạm lúc xuống, cùng một thẻ hoặc cùng một thiết bị, kể cả khi cửa mở. Đây là Luân Đôn. Taxi và ứng dụng gọi xe ở các nước nói tiếng Anh khác: chưa kiểm tra.',
    },
    sources: [
      {
        title: 'Transport for London: Pay as you go',
        url: 'https://tfl.gov.uk/fares/ways-to-pay/pay-as-you-go',
        accessed,
      },
      {
        title: 'Transport for London: Touching in and out',
        url: 'https://tfl.gov.uk/fares/touching-in-and-out',
        accessed,
      },
    ],
  },
]
