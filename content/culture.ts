import type { CultureNote, InfoCard, PairNote } from './phrase'

const accessed = '2026-10-10'

export const cultureNotes: CultureNote[] = [
  {
    id: 'vn-address',
    situationIds: ['meeting'],
    regions: ['VN'],
    geprueft: false,
    title: {
      de: 'Anrede in Vietnam',
      en: 'Address forms in Vietnam',
      'pt-BR': 'Tratamento no Vietnã',
      vi: 'Xưng hô ở Việt Nam',
    },
    body: {
      de: 'Im Vietnamesischen stehen häufig Verwandtschaftswörter dort, wo andere Sprachen ich und du sagen. Welche Form passt, hängt vielerorts vom Alter, vom Geschlecht und von der Beziehung ab. Eine einzelne Höflichkeitsstufe wie Sie oder du deckt das nicht ab. Häufig, und nur als grobe Orientierung: anh für einen etwas älteren Mann, chị für eine etwas ältere Frau, em für eine jüngere Person, cô und chú ungefähr im Alter der Eltern, bác für die Generation der älteren Geschwister der Eltern, ông und bà für deutlich ältere Menschen. Dieselbe Person wählt oft auch für sich selbst eine Form aus diesem Netz, zum Beispiel em gegenüber einer älteren Person. Im Zweifel die Frage aus dieser Situation stellen, statt zu raten. Die Übersicht ist nicht muttersprachlich geprüft.',
      en: 'Vietnamese often uses kinship words where other languages say I and you. Which one fits frequently depends on age, gender and the relationship. One level such as formal or informal you does not cover it. As a rough guide only: anh for a man a little older, chị for a woman a little older, em for a younger person, cô and chú about the age of one’s parents, bác for the generation of a parent’s older siblings, ông and bà for people much older. The same speaker often picks a word for themself from this set, for example em toward an older person. If unsure, ask the question in this situation instead of guessing. This note has not been checked by a native speaker.',
      'pt-BR': 'No vietnamita, palavras de parentesco ocupam muitas vezes o lugar de eu e você. Qual cabe depende com frequência da idade, do gênero e da relação. Um único nível, como você ou o senhor, não cobre isso. Só como orientação grosseira: anh para um homem um pouco mais velho, chị para uma mulher um pouco mais velha, em para uma pessoa mais nova, cô e chú mais ou menos na idade dos pais, bác na geração dos irmãos mais velhos dos pais, ông e bà para pessoas bem mais velhas. A mesma pessoa muitas vezes escolhe uma forma para si, por exemplo em diante de alguém mais velho. Na dúvida, faça a pergunta desta situação em vez de adivinhar. Esta nota não foi revisada por uma pessoa nativa.',
      vi: 'Trong tiếng Việt, từ họ hàng thường đứng ở chỗ các ngôn ngữ khác dùng tôi và bạn. Chọn từ nào thường tuỳ tuổi, giới và quan hệ, không chỉ một bậc như bạn hoặc ông. Chỉ là hướng thô: anh với người nam hơn một chút, chị với người nữ hơn một chút, em với người ít tuổi hơn, cô và chú cỡ tuổi bố mẹ, bác cỡ anh chị của bố mẹ, ông và bà với người lớn tuổi rõ. Người nói cũng hay chọn một từ cho chính mình, ví dụ tự xưng em với người lớn hơn. Khi chưa chắc, hãy hỏi câu trong tình huống này, đừng đoán. Phần này chưa được người bản ngữ kiểm tra.',
    },
    sources: [
      {
        title: 'Vietnamese pronouns (Übersichtsartikel, kein Lehrbuch)',
        url: 'https://en.wikipedia.org/wiki/Vietnamese_pronouns',
        accessed,
      },
    ],
  },
  {
    id: 'vn-tones',
    situationIds: ['meeting'],
    regions: ['VN'],
    geprueft: false,
    title: {
      de: 'Töne, Süd und Nord',
      en: 'Tones, south and north',
      'pt-BR': 'Tons, sul e norte',
      vi: 'Thanh điệu, Nam và Bắc',
    },
    body: {
      de: 'Für Hanoi werden sechs Töne beschrieben. Für den Süden beschreibt Brunelle (2009) ein System mit fünf Tönen: hỏi und ngã fallen dort häufig zusammen, und die Stimmqualität spielt für südliche Hörerinnen und Hörer eine kleinere Rolle als im Norden. Die App nimmt Süd als Standard für die Schriftwahl bei abweichenden Wörtern (zum Beispiel đậu phộng, ba, chén, dạ). Das mitgelieferte Audio ist trotzdem eine nördliche Frauenstimme aus dem Korpus VAIS-1000. Eine südliche Piper-Stimme mit einer Lizenz, die wir ins öffentliche Repo legen können, haben wir nicht gefunden. Die Tonkurve zeigt also das Modell, nicht eine geprüfte südliche Aufnahme. Ob ein Ton trifft, muss eine muttersprachliche Person hören.',
      en: 'Hanoi Vietnamese is described with six tones. For the south, Brunelle (2009) describes a five-tone system: hỏi and ngã often fall together there, and voice quality matters less for southern listeners than in the north. The app treats the south as the default where words differ (for example đậu phộng, ba, chén, dạ). The bundled audio is still a northern woman’s voice from the VAIS-1000 corpus. We did not find a southern Piper voice with a licence we can put in the public repo. The pitch curve is the model, not a checked southern recording. Whether a tone is right has to be heard by a native speaker.',
      'pt-BR': 'O vietnamita de Hanói é descrito com seis tons. Para o sul, Brunelle (2009) descreve um sistema de cinco tons: hỏi e ngã muitas vezes se juntam, e a qualidade da voz pesa menos para ouvintes do sul do que no norte. O aplicativo usa o sul como padrão onde as palavras divergem (por exemplo đậu phộng, ba, chén, dạ). O áudio incluso ainda é uma voz feminina do norte, do corpus VAIS-1000. Não achamos uma voz Piper do sul com licença que dê para colocar no repositório público. A curva de tom é o modelo, não uma gravação sulista revisada. Se o tom está certo, só uma pessoa nativa ouve.',
      vi: 'Tiếng Hà Nội được mô tả với sáu thanh. Với miền Nam, Brunelle (2009) mô tả hệ năm thanh: hỏi và ngã thường nhập, và chất giọng ít quyết định hơn với người nghe miền Nam so với miền Bắc. Ứng dụng lấy miền Nam làm mặc định ở những từ khác nhau (ví dụ đậu phộng, ba, chén, dạ). Audio kèm theo vẫn là giọng nữ miền Bắc từ kho VAIS-1000. Chúng tôi không thấy giọng Piper miền Nam với giấy phép có thể đưa vào kho công khai. Đường thanh điệu là của mô hình, không phải bản thu miền Nam đã được kiểm tra. Thanh đúng hay sai cần người bản ngữ nghe.',
    },
    sources: [
      {
        title: 'Brunelle, Marc (2009). Tone perception in Northern and Southern Vietnamese. Journal of Phonetics 37.',
        url: 'https://doi.org/10.1016/j.wocn.2008.09.003',
        accessed,
      },
      {
        title: 'Kirby, James (2011). Vietnamese (Hanoi Vietnamese). Journal of the International Phonetic Association 41.',
        url: 'https://doi.org/10.1017/S0025100311000181',
        accessed,
      },
    ],
  },
  {
    id: 'vn-emergency',
    situationIds: ['emergency'],
    regions: ['VN'],
    geprueft: false,
    title: {
      de: 'Notfall und Nummern in Vietnam',
      en: 'Emergencies and numbers in Vietnam',
      'pt-BR': 'Emergência e números no Vietnã',
      vi: 'Khẩn cấp và số điện thoại ở Việt Nam',
    },
    body: {
      de: 'In einem medizinischen Notfall ist eine kurze, direkte Aussage vielerorts angemessener als eine lange Höflichkeitsformel. Die Anrede kann kurz bleiben. Eine Meldung der Voice of Vietnam vom September 2025 zur Entscheidung 2023/QĐ-TTg nennt die bestehenden Nummern 113 für die Polizei, 114 für Feuerwehr und Rettung und 115 für medizinische Notfälle, und beschreibt zusätzlich eine Hotline 112 für Unglück, Naturgefahren und Hilfeersuchen, die mit diesen Stellen verbunden wird. Ob 112 an einem bestimmten Ort schon die erste Wahl ist, bitte vor Ort prüfen. Die App ist keine Notrufzentrale.',
      en: 'In a medical emergency, a short direct sentence is often more useful than a long polite formula. The address form can stay short. A Voice of Vietnam report from September 2025 on Decision 2023/QĐ-TTg names 113 for the police, 114 for fire and rescue and 115 for medical emergencies, and also describes a 112 hotline for accidents, natural hazards and requests for help, connected to those services. Whether 112 is already the first number in a given place should be checked locally. The app is not an emergency service.',
      'pt-BR': 'Numa emergência médica, uma frase curta e direta muitas vezes serve mais do que uma fórmula longa. O tratamento pode ficar curto. Uma notícia da Voice of Vietnam de setembro de 2025 sobre a Decisão 2023/QĐ-TTg cita 113 para a polícia, 114 para bombeiros e resgate e 115 para emergência médica, e descreve ainda uma linha 112 para acidentes, desastres e pedidos de ajuda, ligada a esses serviços. Se 112 já é o primeiro número num lugar, confira no local. O aplicativo não é um serviço de emergência.',
      vi: 'Lúc cấp cứu, một câu ngắn và thẳng thường hữu ích hơn một câu lịch sự dài. Xưng hô có thể ngắn. Một bản tin Voice of Vietnam tháng 9 năm 2025 về Quyết định 2023/QĐ-TTg nêu 113 là công an, 114 là cứu hỏa và cứu nạn, 115 là cấp cứu, và mô tả thêm đường dây 112 cho tai nạn, thiên tai và yêu cầu trợ giúp, nối với các số đó. 112 đã là số gọi đầu tiên ở một nơi hay chưa thì nên hỏi tại chỗ. Ứng dụng không phải tổng đài cứu hộ.',
    },
    sources: [
      {
        title: 'Voice of Vietnam: New emergency hotline (Decision 2023/QĐ-TTg, September 2025)',
        url: 'https://vov.gov.vn/new-emergency-hotline-launched-to-receive-disaster-related-information-dtnew-1113530',
        accessed,
      },
    ],
  },
  {
    id: 'vn-nonverbal',
    situationIds: ['meeting', 'food'],
    regions: ['VN'],
    geprueft: false,
    title: {
      de: 'Gesten, Abstand, Essen',
      en: 'Gestures, distance, meals',
      'pt-BR': 'Gestos, distância, refeição',
      vi: 'Cử chỉ, khoảng cách, bữa ăn',
    },
    body: {
      de: 'Beschreibungen vietnamesischer Umgangsformen, etwa im Cultural Atlas von SBS, nennen häufig ein paar Punkte, die nicht für jede Person gelten: den Kopf einer anderen Person nicht zu berühren, Dinge mit beiden Händen oder mit der rechten Hand zu geben, und Stäbchen nicht senkrecht in den Reis zu stecken, weil das an Räucherstäbchen erinnern kann. Blickkontakt und körperlicher Abstand sind je nach Alter, Ort und Beziehung verschieden. In vielen Städten ist ein Händedruck üblich, anderswo eine leichte Verneigung oder nur der Gruss. Beim Essen ist eine Einladung oft höflich, auch wenn jemand schon gegessen hat. Das sind häufige Beschreibungen, keine Regeln über alle Menschen in Vietnam.',
      en: 'Descriptions of Vietnamese manners, for example the SBS Cultural Atlas, often mention a few points that do not hold for every person: not touching another person’s head, passing things with both hands or with the right hand, and not standing chopsticks upright in rice because that can recall incense. Eye contact and distance vary with age, place and relationship. In many cities a handshake is usual; elsewhere a small nod or only the greeting. At a meal, an invitation is often polite even if someone has already eaten. These are frequent descriptions, not rules about everyone in Vietnam.',
      'pt-BR': 'Descrições de modos vietnamitas, por exemplo o Cultural Atlas da SBS, citam com frequência alguns pontos que não valem para toda pessoa: não tocar a cabeça de outra pessoa, passar objetos com as duas mãos ou com a mão direita, e não fincar os hashis em pé no arroz, porque isso pode lembrar incenso. Olhar e distância mudam com a idade, o lugar e a relação. Em muitas cidades um aperto de mão é comum; em outros lugares, um aceno leve ou só o cumprimento. Na refeição, um convite costuma ser educado mesmo se a pessoa já comeu. São descrições frequentes, não regras sobre todas as pessoas no Vietnã.',
      vi: 'Các bản mô tả phép lịch sự, ví dụ Cultural Atlas của SBS, thường nêu vài điểm không đúng với mọi người: không sờ đầu người khác, đưa đồ bằng hai tay hoặc tay phải, và không cắm đũa thẳng vào bát cơm vì dễ gợi hương. Ánh mắt và khoảng cách đổi theo tuổi, nơi và quan hệ. Ở nhiều thành phố bắt tay là thường; nơi khác chỉ gật hoặc chào. Khi ăn, mời một tiếng thường là lịch sự dù người kia đã ăn. Đó là mô tả hay gặp, không phải quy tắc cho mọi người ở Việt Nam.',
    },
    sources: [
      {
        title: 'SBS Cultural Atlas: Vietnamese culture, business culture and etiquette',
        url: 'https://culturalatlas.sbs.com.au/vietnamese-culture/vietnamese-culture-business-culture',
        accessed,
      },
    ],
  },
  {
    id: 'br-address',
    situationIds: ['meeting'],
    regions: ['BR'],
    geprueft: false,
    title: {
      de: 'você, o senhor, a senhora',
      en: 'você, o senhor, a senhora',
      'pt-BR': 'você, o senhor, a senhora',
      vi: 'você, o senhor, a senhora',
    },
    body: {
      de: 'Im brasilianischen Portugiesisch ist você in vielen Alltagssituationen üblich, auch gegenüber unbekannten Personen im ähnlichen Alter. o senhor und a senhora hört man häufiger gegenüber älteren Menschen, in Geschäften und in formelleren Lagen. Es gibt keine feste Altersgrenze, und Regionen sowie Familien handhaben das verschieden. Das Verb bleibt in diesen drei Formen in der dritten Person, anders als beim europäischen tu. Körperlicher Abstand ist in vielen Gesprächen kleiner, als viele Menschen aus der Deutschschweiz erwarten, und ein Kuss auf die Wange zur Begrüssung ist je nach Stadt, Geschlecht und Beziehung üblich oder eben nicht. Im Zweifel mit você beginnen und wechseln, wenn die andere Person o senhor oder a senhora verwendet.',
      en: 'In Brazilian Portuguese, você is usual in many everyday situations, including with strangers of a similar age. o senhor and a senhora are more frequent with older people, in shops and in more formal settings. There is no fixed age line, and regions and families differ. The verb stays in the third person for all three, unlike European tu. Physical distance in many conversations is smaller than many people from German-speaking Switzerland expect, and a cheek kiss as a greeting is usual or not depending on the city, gender and relationship. If unsure, start with você and switch if the other person uses o senhor or a senhora.',
      'pt-BR': 'No português do Brasil, você é comum em muitas situações do dia a dia, também com desconhecidos de idade parecida. o senhor e a senhora aparecem mais com gente mais velha, no comércio e em situações formais. Não há uma idade fixa, e região e família mudam o uso. O verbo fica na terceira pessoa nas três formas, diferente do tu europeu. A distância física em muitas conversas é menor do que muita gente da Suíça alemã espera, e um beijo no rosto na saudação é comum ou não conforme a cidade, o gênero e a relação. Na dúvida, comece com você e mude se a outra pessoa usar o senhor ou a senhora.',
      vi: 'Trong tiếng Bồ Đào Nha Brasil, você thường gặp trong nhiều tình huống hằng ngày, cả với người lạ cùng lứa. o senhor và a senhora hay hơn với người lớn tuổi, ở cửa hàng và lúc trang trọng. Không có mốc tuổi cố định, vùng và gia đình dùng khác nhau. Động từ ở ngôi thứ ba cho cả ba cách, khác tu kiểu châu Âu. Khoảng cách lúc nói chuyện nhiều khi gần hơn mức nhiều người từ vùng tiếng Đức của Thụy Sĩ chờ, và hôn má khi chào tuỳ thành phố, giới và quan hệ. Khi chưa chắc, bắt đầu bằng você rồi đổi nếu người kia dùng o senhor hoặc a senhora.',
    },
    sources: [
      {
        title: 'Brazilian Portuguese (Übersicht zu Pronomen und Anrede)',
        url: 'https://en.wikipedia.org/wiki/Brazilian_Portuguese',
        accessed,
      },
    ],
  },
  {
    id: 'br-food',
    situationIds: ['food', 'emergency'],
    regions: ['BR'],
    geprueft: false,
    title: {
      de: 'Rechnung, serviço und SAMU',
      en: 'The bill, serviço and SAMU',
      'pt-BR': 'A conta, o serviço e o SAMU',
      vi: 'Hoá đơn, serviço và SAMU',
    },
    body: {
      de: 'Auf vielen Rechnungen in Brasilien steht ein Posten serviço, häufig um die zehn Prozent. Ob er verpflichtend ist, steht nicht überall gleich. Die Rechnung lesen und im Zweifel nachfragen ist sicherer als eine pauschale Regel. Für medizinische Notfälle nennt das Gesundheitsministerium den SAMU unter der Nummer 192, gratis, rund um die Uhr. 190 und 193 werden vielerorts für Polizei und Feuerwehr genannt. Diese beiden bitte vor Ort prüfen. Die App ersetzt keinen Anruf.',
      en: 'Many bills in Brazil include an item called serviço, often around ten percent. Whether it is compulsory is not the same everywhere. Reading the bill and asking if unsure is safer than one national rule. For medical emergencies the health ministry names SAMU on 192, free, at all hours. 190 and 193 are widely mentioned for police and fire. Please check those two locally. The app does not replace a call.',
      'pt-BR': 'Em muitas contas no Brasil aparece um item serviço, frequentemente em torno de dez por cento. Se é obrigatório, não é igual em todo lugar. Ler a conta e perguntar na dúvida é mais seguro do que uma regra única. Para emergência médica, o Ministério da Saúde indica o SAMU no 192, gratuito, o tempo todo. 190 e 193 são citados em muitos lugares para polícia e bombeiros. Esses dois, confira no local. O aplicativo não substitui a ligação.',
      vi: 'Trên nhiều hoá đơn ở Brasil có khoản serviço, thường khoảng mười phần trăm. Có bắt buộc hay không thì không nơi nào giống nơi nào. Đọc hoá đơn và hỏi khi chưa chắc an toàn hơn một quy tắc chung. Cấp cứu y tế: Bộ Y tế nêu SAMU số 192, miễn phí, suốt ngày. 190 và 193 nhiều nơi nhắc cho cảnh sát và cứu hỏa. Hai số đó nên hỏi tại chỗ. Ứng dụng không thay cuộc gọi.',
    },
    sources: [
      {
        title: 'Ministério da Saúde: SAMU 192',
        url: 'https://www.gov.br/saude/pt-br/composicao/saes/samu-192/samu-192',
        accessed,
      },
      {
        title: 'Gorjeta (Übersicht, serviço auf der Rechnung prüfen)',
        url: 'https://pt.wikipedia.org/wiki/Gorjeta',
        accessed,
      },
    ],
  },
  {
    id: 'dech-greeting',
    situationIds: ['meeting', 'emergency'],
    regions: ['DE-CH'],
    geprueft: false,
    title: {
      de: 'Sie, Grüezi und Notruf in der Deutschschweiz',
      en: 'Sie, Grüezi and emergency numbers in German-speaking Switzerland',
      'pt-BR': 'Sie, Grüezi e emergência na Suíça alemã',
      vi: 'Sie, Grüezi và số khẩn cấp ở vùng tiếng Đức của Thụy Sĩ',
    },
    body: {
      de: 'Gegenüber unbekannten Erwachsenen ist Sie in der Deutschschweiz häufig der Anfang, bis jemand das Du anbietet. Unter jüngeren Leuten ist du früher üblich, je nach Kreis. Grüezi ist ein häufiger gesprochener Gruss im Schweizerdeutschen, nicht die einzige schriftliche Form. Die Schriftsprache in der Schweiz setzt ss, wo Deutschland oft das scharfe s schreibt, zum Beispiel Strasse und gross. Die Audio-Stimme dieser App ist Hochdeutsch aus Deutschland, nicht Schweizerdeutsch. Notrufe laut BAKOM und der Karte des Bundes: Polizei 117, Feuerwehr 118, Sanität 144, dazu die europäische Nummer 112. Die App ist keine Notrufzentrale.',
      en: 'With adult strangers, Sie is often the start in German-speaking Switzerland until someone offers du. Among younger people du comes earlier, depending on the circle. Grüezi is a frequent spoken greeting in Swiss German, not the only written form. Written German in Switzerland uses ss where Germany often writes the sharp s, for example Strasse and gross. This app’s German voice is standard German from Germany, not Swiss German. Emergency numbers according to BAKOM and the federal map: police 117, fire 118, ambulance 144, plus the European number 112. The app is not an emergency service.',
      'pt-BR': 'Com adultos desconhecidos, Sie costuma ser o começo na Suíça alemã até alguém oferecer o du. Entre gente mais nova, du aparece mais cedo, conforme o círculo. Grüezi é um cumprimento falado frequente no suíço-alemão, não a única forma escrita. O alemão escrito na Suíça usa ss onde a Alemanha muitas vezes escreve o eszett, por exemplo Strasse e gross. A voz alemã deste aplicativo é alemão padrão da Alemanha, não suíço-alemão. Emergência segundo a BAKOM e o mapa federal: polícia 117, bombeiros 118, ambulância 144, e o número europeu 112. O aplicativo não é um serviço de emergência.',
      vi: 'Với người lớn chưa quen, Sie thường là cách mở đầu ở vùng tiếng Đức của Thụy Sĩ cho đến khi được mời xưng du. Giữa người trẻ, du có thể sớm hơn, tuỳ nhóm. Grüezi là lời chào nói hay gặp trong tiếng Đức Thụy Sĩ, không phải dạng viết duy nhất. Chữ viết ở Thụy Sĩ dùng ss ở chỗ Đức hay viết chữ eszett, ví dụ Strasse và gross. Giọng tiếng Đức trong ứng dụng là tiếng Đức chuẩn của Đức, không phải tiếng Đức Thụy Sĩ. Số khẩn cấp theo BAKOM và bản đồ liên bang: cảnh sát 117, cứu hỏa 118, xe cứu thương 144, thêm số châu Âu 112. Ứng dụng không phải tổng đài.',
    },
    sources: [
      {
        title: 'BAKOM: Notrufdienste (117, 118, 144)',
        url: 'https://www.bakom.admin.ch/de/notrufdienste',
        accessed,
      },
      {
        title: 'swisstopo / OFCOM: Who receives my emergency call? (112, 117, 118, 144)',
        url: 'https://www.geo.admin.ch/en/dataset-21072025',
        accessed,
      },
      {
        title: 'Swiss Standard German (ss statt scharfes s)',
        url: 'https://en.wikipedia.org/wiki/Swiss_Standard_German',
        accessed,
      },
    ],
  },
  {
    id: 'en-politeness',
    situationIds: ['meeting', 'emergency'],
    regions: ['EN'],
    geprueft: false,
    title: {
      de: 'Englischsprachige Länder: Bitte, Abstand, Notruf',
      en: 'English-speaking countries: please, distance, emergency',
      'pt-BR': 'Países de língua inglesa: please, distância, emergência',
      vi: 'Các nước nói tiếng Anh: please, khoảng cách, khẩn cấp',
    },
    body: {
      de: 'Please und thank you stehen in vielen englischsprachigen Alltagssätzen, auch bei kleinen Bitten. Wie direkt eine Bitte klingt, ist verschieden: in Teilen des Vereinigten Königreichs sind indirekte Formen häufig, in vielen Situationen in den USA ist eine höfliche direkte Bitte ebenfalls üblich. Smalltalk über Wetter oder Reise ist in vielen Begegnungen mit Unbekannten üblich und nicht in allen. Persönlicher Abstand ist häufig grösser als in vielen Gesprächen in Brasilien. Notruf: 911 in den USA, 999 im Vereinigten Königreich, 000 in Australien. 112 funktioniert in grossen Teilen Europas und wird im Vereinigten Königreich ebenfalls genannt. Die Stimme in der App ist amerikanisches Englisch. Die App ist keine Notrufzentrale.',
      en: 'Please and thank you appear in many everyday English sentences, including small requests. How direct a request sounds varies: in parts of the United Kingdom indirect forms are frequent, and in many situations in the United States a polite direct request is also usual. Small talk about weather or travel is usual in many encounters with strangers and not in all. Personal distance is often larger than in many conversations in Brazil. Emergency numbers: 911 in the United States, 999 in the United Kingdom, 000 in Australia. 112 works in much of Europe and is also listed in the United Kingdom. The voice in the app is American English. The app is not an emergency service.',
      'pt-BR': 'Please e thank you aparecem em muitas frases do dia a dia, também em pedidos pequenos. O quanto um pedido soa direto varia: em partes do Reino Unido, formas indiretas são frequentes, e em muitas situações nos Estados Unidos um pedido direto e educado também é comum. Conversa sobre tempo ou viagem é comum em muitos encontros com desconhecidos e não em todos. A distância pessoal costuma ser maior do que em muitas conversas no Brasil. Emergência: 911 nos Estados Unidos, 999 no Reino Unido, 000 na Austrália. 112 funciona em boa parte da Europa e também é citado no Reino Unido. A voz no aplicativo é inglês americano. O aplicativo não é um serviço de emergência.',
      vi: 'Please và thank you đứng trong nhiều câu hằng ngày, cả khi nhờ việc nhỏ. Câu nhờ trực tiếp đến mức nào thì khác nhau: ở nhiều nơi tại Vương quốc Anh, cách nói vòng hay gặp, còn ở nhiều tình huống tại Hoa Kỳ một câu nhờ thẳng nhưng lịch sự cũng thường. Chuyện thời tiết hoặc chuyến đi hay gặp khi gặp người lạ, không phải lúc nào cũng vậy. Khoảng cách cá nhân thường rộng hơn nhiều cuộc nói chuyện ở Brasil. Số khẩn cấp: 911 ở Hoa Kỳ, 999 ở Vương quốc Anh, 000 ở Úc. 112 dùng ở phần lớn châu Âu và cũng được nêu ở Vương quốc Anh. Giọng trong ứng dụng là tiếng Anh Mỹ. Ứng dụng không phải tổng đài.',
    },
    sources: [
      {
        title: 'UK government: Call 999',
        url: 'https://www.gov.uk/contact-999',
        accessed,
      },
      {
        title: 'FCC: 9-1-1 and E9-1-1',
        url: 'https://www.fcc.gov/general/9-1-1-and-e9-1-1-services',
        accessed,
      },
      {
        title: 'Australia: Triple Zero (000)',
        url: 'https://www.triplezero.gov.au/',
        accessed,
      },
    ],
  },
  {
    id: 'arrival-desk',
    situationIds: ['arrival', 'visa'],
    regions: ['VN', 'BR', 'DE-CH', 'EN'],
    geprueft: false,
    title: {
      de: 'Am Schalter: kurz, Unterlagen bereit',
      en: 'At the counter: short, papers ready',
      'pt-BR': 'No balcão: curto, papéis à mão',
      vi: 'Ở quầy: ngắn, giấy tờ sẵn',
    },
    body: {
      de: 'An vielen Grenzen sind kurze Antworten und griffbereite Unterlagen üblich: Pass, Adresse, Zweck, Weiter- oder Rückreise. Was genau gefragt wird, hängt vom Land und von der Person am Schalter ab. Scherze über den Inhalt des Gepäcks sind fehl am Platz. Die Infokarten in dieser App geben Quellen und ein Datum wieder. Sie sind keine Rechtsauskunft. Das EDA schreibt für Brasilien selbst, dass sich Regeln ändern und die zuständige Vertretung verbindlich auskunftet. Dieselbe Vorsicht gilt für Vietnam und für jedes andere Land.',
      en: 'At many borders, short answers and papers in hand are the usual pattern: passport, address, purpose, onward or return travel. What is actually asked depends on the country and the officer. Jokes about the luggage are a bad idea. The info cards in this app repeat sources and a date. They are not legal advice. For Brazil, the Swiss foreign ministry itself writes that rules change and that the competent mission gives binding information. The same caution applies to Vietnam and to every other country.',
      'pt-BR': 'Em muitas fronteiras, respostas curtas e papéis na mão são o usual: passaporte, endereço, motivo, continuação ou volta. O que perguntam depende do país e de quem está no balcão. Piada sobre a bagagem não cabe. Os cartões neste aplicativo repetem fontes e uma data. Não são orientação jurídica. Para o Brasil, o Departamento Federal de Relações Exteriores da Suíça escreve que as regras mudam e que a representação competente informa de modo vinculante. O mesmo cuidado vale para o Vietnã e para qualquer outro país.',
      vi: 'Ở nhiều cửa khẩu, câu trả lời ngắn và giấy tờ trong tay là cách thường gặp: hộ chiếu, địa chỉ, mục đích, vé đi tiếp hoặc vé về. Hỏi gì còn tuỳ nước và tuỳ người ở quầy. Đừng đùa về đồ trong hành lý. Thẻ thông tin trong ứng dụng chỉ nhắc nguồn và ngày. Không phải tư vấn pháp lý. Với Brasil, Bộ Ngoại giao Thụy Sĩ tự viết rằng quy định đổi và cơ quan đại diện có thẩm quyền mới trả lời có giá trị. Cùng sự thận trọng đó cho Việt Nam và mọi nước khác.',
    },
    sources: [
      {
        title: 'EDA: Brasilien, Einreise und Aufenthalt (Stand der Seite: 1. Februar 2026)',
        url: 'https://www.eda.admin.ch/de/laenderdossier-brasilien-einreise-und-aufenthalt',
        accessed,
      },
      {
        title: 'Vietnam e-visa portal',
        url: 'https://evisa.gov.vn/',
        accessed,
      },
    ],
  },
]

export const infoCards: InfoCard[] = [
  {
    id: 'br-visa',
    situationId: 'visa',
    country: 'BR',
    checkedAt: '2026-10-10',
    geprueft: false,
    title: {
      de: 'Brasilien: Einreise, Quelle EDA',
      en: 'Brazil: entry, EDA source',
      'pt-BR': 'Brasil: entrada, fonte EDA',
      vi: 'Brasil: nhập cảnh, nguồn EDA',
    },
    body: {
      de: 'Das Länderdossier des EDA, veröffentlicht am 1. Februar 2026 und hier am 10. Oktober 2026 erneut gelesen, schreibt: Schweizerische Staatsangehörige brauchen für einen Aufenthalt von bis zu 90 Tagen innerhalb von 180 Tagen kein Touristen- oder Geschäftsvisum für Brasilien. Zur Einreise nennt die Seite einen gültigen Reisepass und ein Rück- oder Weiterreiseticket. Wer länger bleibt, braucht ein Visum. Das EDA sagt auf derselben Seite, dass sich Regeln ändern, dass die Auskunft ohne Gewähr ist und dass die brasilianische Vertretung verbindlich informiert. Keine Rechtsauskunft.',
      en: 'The Swiss foreign ministry country page, published on 1 February 2026 and read again here on 10 October 2026, says: Swiss citizens do not need a tourist or business visa for Brazil for a stay of up to 90 days within 180 days. The page names a valid passport and a return or onward ticket. A longer stay needs a visa. On the same page the ministry says rules change, the information is without guarantee, and the Brazilian mission gives binding information. Not legal advice.',
      'pt-BR': 'A página do EDA, publicada em 1º de fevereiro de 2026 e lida de novo aqui em 10 de outubro de 2026, diz: cidadãos suíços não precisam de visto de turismo ou negócios para o Brasil num período de até 90 dias dentro de 180 dias. A página cita passaporte válido e passagem de volta ou de continuação. Uma estada mais longa precisa de visto. Na mesma página o EDA diz que as regras mudam, que a informação é sem garantia e que a representação do Brasil informa de modo vinculante. Não é orientação jurídica.',
      vi: 'Trang của EDA, đăng ngày 1 tháng 2 năm 2026 và được đọc lại ở đây ngày 10 tháng 10 năm 2026, viết: người mang quốc tịch Thụy Sĩ không cần visa du lịch hoặc công vụ cho Brasil nếu ở đến 90 ngày trong vòng 180 ngày. Trang nêu hộ chiếu còn hạn và vé về hoặc vé đi tiếp. Ở lâu hơn thì cần visa. Cùng trang đó, EDA nói quy định thay đổi, thông tin không bảo đảm, và cơ quan đại diện của Brasil mới trả lời có giá trị. Không phải tư vấn pháp lý.',
    },
    sources: [
      {
        title: 'EDA: Brasilien, Einreise und Aufenthalt',
        url: 'https://www.eda.admin.ch/de/laenderdossier-brasilien-einreise-und-aufenthalt',
        accessed,
      },
      {
        title: 'Polícia Federal: Imigração',
        url: 'https://www.gov.br/pf/pt-br/assuntos/imigracao',
        accessed,
      },
    ],
  },
  {
    id: 'vn-visa',
    situationId: 'visa',
    country: 'VN',
    checkedAt: '2026-10-10',
    geprueft: false,
    title: {
      de: 'Vietnam: Visum, Quellen prüfen',
      en: 'Vietnam: visa, check the sources',
      'pt-BR': 'Vietnã: visto, confira as fontes',
      vi: 'Việt Nam: visa, hãy xem nguồn',
    },
    body: {
      de: 'Eine Mitteilung der vietnamesischen Botschaft in Japan zur Resolution 229/NQ-CP beschreibt für eine Liste von Ländern, darunter die Schweiz, eine visumfreie touristische Einreise von bis zu 45 Tagen, in der Quelle begrenzt auf den 15. August 2025 bis den 14. August 2028. Das Portal evisa.gov.vn ist der offizielle Weg für ein E-Visum, wenn eines nötig ist. Diese Karte gibt die genannte Mitteilung wieder und ist kein eigener Rechtsentscheid. Für einen Schweizer Pass: das EDA schreibt auf der Seite «Reisedokumente, Visum und Einreise» (veröffentlicht am 29. März 2026, hier gelesen am 10. Oktober 2026), dass viele Länder einen Pass verlangen, der sechs Monate über das Ausreisedatum hinaus gültig ist. Die Seite nennt Vietnam dabei nicht einzeln und verweist an die Botschaft des Ziellandes. Vor der Reise prüfen, ob für den Schweizer Pass gilt: Pass mindestens 6 Monate gültig. Die vietnamesische Vertretung und die Fluggesellschaft sind massgebend. Keine Rechtsauskunft.',
      en: 'A notice from the Vietnamese embassy in Japan on Resolution 229/NQ-CP describes, for a list of countries including Switzerland, visa-free tourist entry of up to 45 days, limited in that source to 15 August 2025 through 14 August 2028. The portal evisa.gov.vn is the official route for an e-visa when one is required. This card repeats that notice and is not a legal decision of its own. For a Swiss passport: the Swiss foreign ministry page “Travel documents, visa and entry”, published on 29 March 2026 and read here on 10 October 2026, says many countries require a passport that is valid for six months beyond the date of departure. That page does not name Vietnam on its own and points to the destination embassy. Before the trip, check whether a Swiss passport must still be valid for at least six months. The Vietnamese mission and the airline are the ones that decide. Not legal advice.',
      'pt-BR': 'Um comunicado da embaixada do Vietnã no Japão sobre a Resolução 229/NQ-CP descreve, para uma lista de países inclusive a Suíça, entrada turística sem visto de até 45 dias, limitada nessa fonte de 15 de agosto de 2025 a 14 de agosto de 2028. O portal evisa.gov.vn é o caminho oficial para o visto eletrônico quando ele é necessário. Este cartão repete esse comunicado e não é uma decisão jurídica própria. Para um passaporte suíço: a página do EDA «Reisedokumente, Visum und Einreise», publicada em 29 de março de 2026 e lida aqui em 10 de outubro de 2026, diz que muitos países pedem um passaporte válido por seis meses além da data de saída. A página não cita o Vietnã sozinho e manda perguntar à embaixada do destino. Antes da viagem, confira se para o passaporte suíço vale: passaporte válido por pelo menos 6 meses. A representação vietnamita e a companhia aérea é que decidem. Não é orientação jurídica.',
      vi: 'Một thông báo của đại sứ quán Việt Nam tại Nhật về Nghị quyết 229/NQ-CP mô tả, với một danh sách nước trong đó có Thụy Sĩ, nhập cảnh du lịch miễn visa đến 45 ngày, trong nguồn đó giới hạn từ 15 tháng 8 năm 2025 đến 14 tháng 8 năm 2028. Cổng evisa.gov.vn là đường chính thức khi cần visa điện tử. Thẻ này chỉ nhắc thông báo đó, không phải một quyết định pháp lý riêng. Với hộ chiếu Thụy Sĩ: trang EDA «Reisedokumente, Visum und Einreise», đăng ngày 29 tháng 3 năm 2026 và được đọc lại ở đây ngày 10 tháng 10 năm 2026, nói nhiều nước đòi hộ chiếu còn hạn sáu tháng sau ngày rời đi. Trang đó không nêu riêng Việt Nam và bảo hỏi sứ quán nước đến. Trước chuyến đi, kiểm tra hộ chiếu Thụy Sĩ có cần còn hạn ít nhất 6 tháng hay không. Cơ quan đại diện Việt Nam và hãng bay mới là chỗ chốt. Không phải tư vấn pháp lý.',
    },
    sources: [
      {
        title: 'Embassy notice on Resolution 229/NQ-CP',
        url: 'https://vnembassy-jp.org/en/vietnam-exempts-visas-under-tourism-development-stimulus-program-citizens-12-countries-belgium',
        accessed,
      },
      {
        title: 'Vietnam e-visa portal',
        url: 'https://evisa.gov.vn/',
        accessed,
      },
      {
        title: 'EDA: Reisedokumente, Visum und Einreise (veröffentlicht 29. März 2026)',
        url: 'https://www.schweiz-vietnam.eda.admin.ch/de/reisedokumente-visum-einreise',
        accessed,
      },
    ],
  },
]

export const pairNotes: PairNote[] = [
  {
    id: 'de-vi-address',
    sourceLang: 'de',
    targetLang: 'vi',
    conceptId: 'meet.hello',
    text: {
      de: 'Sie und du lassen sich nicht auf eine vietnamesische Anrede abbilden. Alter und Geschlecht entscheiden häufiger mit als eine formale Stufe.',
      en: 'Sie and du do not map onto one Vietnamese address form. Age and gender usually matter more than one formal level.',
      'pt-BR': 'Sie e du não cabem numa única forma vietnamita. Idade e gênero pesam mais do que um nível formal.',
      vi: 'Sie và du không khớp một cách xưng hô tiếng Việt. Tuổi và giới thường nặng hơn một bậc trang trọng.',
    },
  },
  {
    id: 'pt-de-voce',
    sourceLang: 'pt-BR',
    targetLang: 'de',
    conceptId: 'meet.hello',
    text: {
      de: 'você ist nicht immer du. Mit unbekannten Erwachsenen ist Sie am Anfang häufig sicherer.',
      en: 'você is not always du. With adult strangers, Sie is often safer at the start.',
      'pt-BR': 'você nem sempre é du. Com adultos desconhecidos, Sie no começo costuma ser mais seguro.',
      vi: 'você không phải lúc nào cũng là du. Với người lớn chưa quen, bắt đầu bằng Sie thường an toàn hơn.',
    },
  },
  {
    id: 'pt-en-thanks',
    sourceLang: 'pt-BR',
    targetLang: 'en',
    conceptId: 'meet.thanks',
    text: {
      de: 'Obrigado und obrigada folgen der sprechenden Person. Thank you unterscheidet das nicht.',
      en: 'Obrigado and obrigada follow the speaker. Thank you does not make that distinction.',
      'pt-BR': 'Obrigado e obrigada seguem quem fala. Thank you não faz essa distinção.',
      vi: 'Obrigado và obrigada theo người nói. Thank you không phân biệt điều đó.',
    },
  },
  {
    id: 'pt-vi-address',
    sourceLang: 'pt-BR',
    targetLang: 'vi',
    conceptId: 'meet.hello',
    text: {
      de: 'você, o senhor und a senhora decken die vietnamesischen Anreden nicht ab. Die Form neu wählen, nicht übersetzen.',
      en: 'você, o senhor and a senhora do not cover Vietnamese address forms. Choose the form again. Do not translate it.',
      'pt-BR': 'você, o senhor e a senhora não cobrem as formas vietnamitas. Escolha de novo. Não traduza.',
      vi: 'você, o senhor và a senhora không phủ các cách xưng hô tiếng Việt. Chọn lại, đừng dịch nguyên.',
    },
  },
]
