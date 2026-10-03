/** Goethe-Zertifikat A2 Schreiben: Teil 1 (SMS, 20–30 Wörter) ve Teil 2 (E-Mail, 30–40 Wörter). */
export interface WritingTask {
  id: string;
  teil: 1 | 2;
  register: 'informell' | 'formell';
  title: string;
  situation: string;
  situationTr: string;
  bullets: { de: string; tr: string }[];
  minWords: number;
  maxWords: number;
  model: string;
  redemittel: string[];
}

export const WRITING_TASKS: WritingTask[] = [
  {
    id: 'w1-verspaetung',
    teil: 1,
    register: 'informell',
    title: 'SMS: Ich komme später',
    situation: 'Sie sind im Bus und kommen zu spät zu einem Treffen mit Ihrem Freund Max. Schreiben Sie Max eine SMS.',
    situationTr: 'Otobüstesiniz ve arkadaşınız Max ile buluşmaya geç kalıyorsunuz. Max’e bir SMS yazın.',
    bullets: [
      { de: 'Entschuldigen Sie sich.', tr: 'Özür dileyin.' },
      { de: 'Warum kommen Sie später?', tr: 'Neden geç kalıyorsunuz?' },
      { de: 'Schlagen Sie eine neue Uhrzeit oder einen Treffpunkt vor.', tr: 'Yeni bir saat veya buluşma yeri önerin.' },
    ],
    minWords: 20,
    maxWords: 30,
    model:
      'Hallo Max, es tut mir leid, aber ich komme etwa 20 Minuten später. Mein Bus hat Verspätung. Können wir uns um halb sieben vor dem Kino treffen? Bis gleich! Deniz',
    redemittel: ['Es tut mir leid, aber …', 'Mein Bus hat Verspätung.', 'Können wir uns um … treffen?', 'Bis gleich!'],
  },
  {
    id: 'w1-geburtstag',
    teil: 1,
    register: 'informell',
    title: 'SMS: Absage Geburtstag',
    situation:
      'Ihre Freundin Julia hat Sie zu ihrer Geburtstagsparty am Samstag eingeladen. Sie können nicht kommen. Schreiben Sie Julia eine SMS.',
    situationTr: 'Arkadaşınız Julia sizi cumartesi doğum günü partisine davet etti. Gidemiyorsunuz. Julia’ya bir SMS yazın.',
    bullets: [
      { de: 'Danken Sie für die Einladung.', tr: 'Davet için teşekkür edin.' },
      { de: 'Warum können Sie nicht kommen?', tr: 'Neden gelemiyorsunuz?' },
      { de: 'Machen Sie einen Vorschlag für ein anderes Treffen.', tr: 'Başka bir buluşma önerin.' },
    ],
    minWords: 20,
    maxWords: 30,
    model:
      'Liebe Julia, vielen Dank für deine Einladung! Leider kann ich am Samstag nicht kommen, weil ich arbeiten muss. Wollen wir am Sonntag zusammen frühstücken? Liebe Grüße, Emre',
    redemittel: ['Vielen Dank für deine Einladung!', 'Leider kann ich nicht kommen, weil …', 'Wollen wir …?', 'Liebe Grüße'],
  },
  {
    id: 'w1-krank',
    teil: 1,
    register: 'formell',
    title: 'Nachricht an die Kursleiterin',
    situation:
      'Sie sind krank und können morgen nicht zum Deutschkurs kommen. Schreiben Sie Ihrer Kursleiterin, Frau Weber, eine kurze Nachricht.',
    situationTr: 'Hastasınız ve yarın Almanca kursuna gidemiyorsunuz. Kurs öğretmeniniz Bayan Weber’e kısa bir mesaj yazın.',
    bullets: [
      { de: 'Warum kommen Sie nicht?', tr: 'Neden gelmiyorsunuz?' },
      { de: 'Bitten Sie um die Hausaufgaben.', tr: 'Ev ödevlerini rica edin.' },
      { de: 'Wann kommen Sie wieder?', tr: 'Ne zaman tekrar geleceksiniz?' },
    ],
    minWords: 20,
    maxWords: 30,
    model:
      'Liebe Frau Weber, leider kann ich morgen nicht zum Kurs kommen, weil ich krank bin. Können Sie mir bitte die Hausaufgaben schicken? Am Montag bin ich wieder da. Viele Grüße, Aylin',
    redemittel: ['Leider kann ich morgen nicht …', 'Können Sie mir bitte … schicken?', 'Am … bin ich wieder da.'],
  },
  {
    id: 'w1-schluessel',
    teil: 1,
    register: 'informell',
    title: 'SMS: Schlüssel vergessen',
    situation: 'Sie haben Ihren Schlüssel im Büro vergessen. Schreiben Sie Ihrem Kollegen Tim eine SMS.',
    situationTr: 'Anahtarınızı ofiste unuttunuz. İş arkadaşınız Tim’e bir SMS yazın.',
    bullets: [
      { de: 'Was ist passiert?', tr: 'Ne oldu?' },
      { de: 'Bitten Sie Tim um Hilfe.', tr: 'Tim’den yardım isteyin.' },
      { de: 'Wann und wo können Sie den Schlüssel holen?', tr: 'Anahtarı ne zaman ve nerede alabilirsiniz?' },
    ],
    minWords: 20,
    maxWords: 30,
    model:
      'Hallo Tim, ich habe meinen Schlüssel im Büro vergessen. Kannst du ihn bitte mitnehmen? Ich kann ihn heute um 19 Uhr bei dir abholen. Ist das okay? Danke! Can',
    redemittel: ['Ich habe … vergessen.', 'Kannst du bitte …?', 'Ich kann … abholen.', 'Ist das okay?'],
  },
  {
    id: 'w1-einkaufen',
    teil: 1,
    register: 'informell',
    title: 'SMS: Zusammen einkaufen',
    situation: 'Sie möchten am Samstag mit Ihrer Nachbarin Anna einkaufen gehen. Schreiben Sie Anna eine SMS.',
    situationTr: 'Cumartesi komşunuz Anna ile alışverişe gitmek istiyorsunuz. Anna’ya bir SMS yazın.',
    bullets: [
      { de: 'Fragen Sie, ob Anna Zeit hat.', tr: 'Anna’nın vakti olup olmadığını sorun.' },
      { de: 'Was möchten Sie kaufen?', tr: 'Ne almak istiyorsunuz?' },
      { de: 'Schlagen Sie eine Uhrzeit vor.', tr: 'Bir saat önerin.' },
    ],
    minWords: 20,
    maxWords: 30,
    model:
      'Hallo Anna, hast du am Samstag Zeit? Ich möchte in die Stadt fahren und eine neue Jacke kaufen. Kommst du mit? Wir können um 10 Uhr losfahren. Liebe Grüße, Sara',
    redemittel: ['Hast du am … Zeit?', 'Ich möchte … kaufen.', 'Kommst du mit?', 'Wir können um … Uhr …'],
  },
  {
    id: 'w2-firmenfest',
    teil: 2,
    register: 'formell',
    title: 'E-Mail: Einladung zum Firmenfest',
    situation:
      'Ihr Chef, Herr Klein, hat Sie zu einem Firmenfest am Freitagabend eingeladen. Schreiben Sie Herrn Klein eine E-Mail.',
    situationTr: 'Şefiniz Bay Klein sizi cuma akşamı bir şirket partisine davet etti. Bay Klein’a bir e-posta yazın.',
    bullets: [
      { de: 'Bedanken Sie sich für die Einladung.', tr: 'Davet için teşekkür edin.' },
      { de: 'Sagen Sie, dass Sie kommen.', tr: 'Geleceğinizi söyleyin.' },
      { de: 'Fragen Sie, ob Sie Ihren Partner / Ihre Partnerin mitbringen dürfen.', tr: 'Eşinizi getirip getiremeyeceğinizi sorun.' },
    ],
    minWords: 30,
    maxWords: 40,
    model:
      'Sehr geehrter Herr Klein, vielen Dank für Ihre Einladung zum Firmenfest am Freitag. Ich komme sehr gern. Darf ich meinen Mann mitbringen? Er möchte meine Kollegen gern kennenlernen. Mit freundlichen Grüßen Ayşe Demir',
    redemittel: ['Sehr geehrter Herr …,', 'Vielen Dank für Ihre Einladung zu …', 'Darf ich … mitbringen?', 'Mit freundlichen Grüßen'],
  },
  {
    id: 'w2-vhs',
    teil: 2,
    register: 'formell',
    title: 'E-Mail: Anfrage Kochkurs',
    situation:
      'Sie möchten an einem Kochkurs der Volkshochschule teilnehmen. Schreiben Sie eine E-Mail an Frau Berger von der Volkshochschule.',
    situationTr: 'Halk eğitim merkezinin (VHS) yemek kursuna katılmak istiyorsunuz. VHS’ten Bayan Berger’e bir e-posta yazın.',
    bullets: [
      { de: 'Wann beginnt der Kurs?', tr: 'Kurs ne zaman başlıyor?' },
      { de: 'Was kostet der Kurs?', tr: 'Kursun ücreti ne kadar?' },
      { de: 'Was müssen Sie mitbringen?', tr: 'Yanınızda ne getirmeniz gerekiyor?' },
    ],
    minWords: 30,
    maxWords: 40,
    model:
      'Sehr geehrte Frau Berger, ich interessiere mich für den Kochkurs an der Volkshochschule. Können Sie mir bitte sagen, wann der Kurs beginnt und was er kostet? Muss ich etwas mitbringen? Vielen Dank! Mit freundlichen Grüßen Mehmet Kaya',
    redemittel: ['Ich interessiere mich für …', 'Können Sie mir bitte sagen, wann …?', 'Muss ich etwas mitbringen?', 'Vielen Dank im Voraus!'],
  },
  {
    id: 'w2-vermieterin',
    teil: 2,
    register: 'formell',
    title: 'E-Mail: Neuer Termin für die Reparatur',
    situation:
      'Ihre Vermieterin, Frau Schulz, möchte am Dienstag die Heizung in Ihrer Wohnung reparieren lassen. Sie haben an diesem Tag keine Zeit. Schreiben Sie Frau Schulz eine E-Mail.',
    situationTr:
      'Ev sahibiniz Bayan Schulz salı günü dairenizdeki kaloriferi tamir ettirmek istiyor. O gün vaktiniz yok. Bayan Schulz’a bir e-posta yazın.',
    bullets: [
      { de: 'Entschuldigen Sie sich.', tr: 'Özür dileyin.' },
      { de: 'Erklären Sie, warum Sie keine Zeit haben.', tr: 'Neden vaktiniz olmadığını açıklayın.' },
      { de: 'Schlagen Sie einen anderen Termin vor.', tr: 'Başka bir tarih önerin.' },
    ],
    minWords: 30,
    maxWords: 40,
    model:
      'Sehr geehrte Frau Schulz, es tut mir leid, aber am Dienstag habe ich keine Zeit. Ich muss den ganzen Tag arbeiten und komme erst um 19 Uhr nach Hause. Geht es vielleicht am Donnerstagvormittag? Mit freundlichen Grüßen Ali Yıldız',
    redemittel: ['Es tut mir leid, aber …', 'Ich muss leider …', 'Geht es vielleicht am …?', 'Passt Ihnen …?'],
  },
  {
    id: 'w2-umzug',
    teil: 2,
    register: 'informell',
    title: 'E-Mail: Hilfe beim Umzug',
    situation: 'Ihr Freund Paul hat gefragt, ob Sie ihm am Samstag beim Umzug helfen können. Schreiben Sie Paul eine E-Mail.',
    situationTr: 'Arkadaşınız Paul, cumartesi taşınmasında ona yardım edip edemeyeceğinizi sordu. Paul’a bir e-posta yazın.',
    bullets: [
      { de: 'Sagen Sie, dass Sie gern helfen.', tr: 'Memnuniyetle yardım edeceğinizi söyleyin.' },
      { de: 'Fragen Sie: Wann und wo?', tr: 'Ne zaman ve nerede olduğunu sorun.' },
      { de: 'Bieten Sie an, etwas mitzubringen.', tr: 'Bir şey getirmeyi teklif edin.' },
    ],
    minWords: 30,
    maxWords: 40,
    model:
      'Lieber Paul, natürlich helfe ich dir gern beim Umzug! Wann soll ich am Samstag kommen und wie ist deine neue Adresse? Ich kann Kartons und Getränke mitbringen. Brauchst du sonst noch etwas? Bis Samstag! Viele Grüße Zeynep',
    redemittel: ['Natürlich helfe ich dir gern!', 'Wann soll ich kommen?', 'Ich kann … mitbringen.', 'Brauchst du sonst noch etwas?'],
  },
  {
    id: 'w2-onlineshop',
    teil: 2,
    register: 'formell',
    title: 'E-Mail: Reklamation Online-Shop',
    situation: 'Sie haben im Internet eine Jacke bestellt, aber sie ist zu klein. Schreiben Sie eine E-Mail an den Online-Shop.',
    situationTr: 'İnternetten bir ceket sipariş ettiniz ama küçük geldi. Online mağazaya bir e-posta yazın.',
    bullets: [
      { de: 'Was ist das Problem?', tr: 'Sorun ne?' },
      { de: 'Was möchten Sie (Umtausch oder Geld zurück)?', tr: 'Ne istiyorsunuz (değişim veya para iadesi)?' },
      { de: 'Fragen Sie, wie Sie die Jacke zurückschicken können.', tr: 'Ceketi nasıl geri gönderebileceğinizi sorun.' },
    ],
    minWords: 30,
    maxWords: 40,
    model:
      'Sehr geehrte Damen und Herren, ich habe bei Ihnen eine Jacke bestellt, aber sie ist leider zu klein. Ich möchte sie gern in Größe L umtauschen. Wie kann ich die Jacke zurückschicken? Mit freundlichen Grüßen Burak Şahin',
    redemittel: ['Sehr geehrte Damen und Herren,', 'Ich habe … bestellt, aber …', 'Ich möchte … umtauschen.', 'Wie kann ich …?'],
  },
];
