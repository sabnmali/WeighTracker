import type { Question } from '../types';

/** 180–250 kelimelik A2 okuma metinleri (çalışma kağıdı Bölüm 5 ve sınav okuma soruları). */
export interface LongText {
  id: string;
  title: string;
  format: 'E-Mail' | 'Erzählung' | 'Blog' | 'Bericht';
  theme: string;
  text: string;
  questions: { q: string; tr: string; o: string[]; a: string; ex: string }[];
  trueFalse: { s: string; correct: boolean }[];
  phrases: { de: string; tr: string }[];
}

export const LONG_TEXTS: LongText[] = [
  {
    id: 'lt-hamburg',
    title: 'Eine E-Mail aus Hamburg',
    format: 'E-Mail',
    theme: 'Wohnen',
    text: `Liebe Selin,

wie geht es dir? Ich hoffe, du hast deine Prüfung gut geschafft! Bei mir gibt es viele Neuigkeiten: Seit drei Wochen wohne ich in Hamburg. Meine neue Wohnung liegt im Stadtteil Altona, nicht weit vom Bahnhof. Sie hat zwei Zimmer, eine kleine Küche und einen Balkon. Leider gibt es keinen Aufzug, und ich wohne im vierten Stock. Am Anfang war das anstrengend, besonders mit den schweren Kartons! Zum Glück haben mir zwei Kollegen beim Umzug geholfen.

Meine Nachbarn sind sehr nett. Die alte Dame von nebenan hat mir am ersten Tag einen Kuchen gebracht. Der junge Mann unter mir spielt abends manchmal Gitarre, aber das stört mich nicht. Ich finde es sogar schön.

Die Arbeit in der neuen Firma macht mir Spaß. Ich fahre jeden Morgen zwanzig Minuten mit der S-Bahn ins Büro. Das ist viel besser als früher, denn in München musste ich jeden Tag eine Stunde mit dem Auto fahren und stand oft im Stau.

Hast du im Mai Zeit? Dann kannst du mich besuchen! Wir können zusammen an der Elbe spazieren gehen und Fischbrötchen essen. Das Gästebett ist schon da.

Schreib mir bald!
Viele Grüße
deine Lena`,
    questions: [
      {
        q: 'Seit wann wohnt Lena in Hamburg?',
        tr: 'Lena ne zamandan beri Hamburg’da yaşıyor?',
        o: ['Seit drei Wochen.', 'Seit drei Monaten.', 'Seit Mai.', 'Seit einem Jahr.'],
        a: 'Seit drei Wochen.',
        ex: '„Seit drei Wochen wohne ich in Hamburg.“',
      },
      {
        q: 'Was ist ein Problem in der Wohnung?',
        tr: 'Dairedeki sorun ne?',
        o: [
          'Es gibt keinen Aufzug.',
          'Die Küche ist zu groß.',
          'Die Nachbarn sind unfreundlich.',
          'Die Wohnung ist weit vom Bahnhof.',
        ],
        a: 'Es gibt keinen Aufzug.',
        ex: '„Leider gibt es keinen Aufzug, und ich wohne im vierten Stock.“',
      },
      {
        q: 'Wie fährt Lena jetzt zur Arbeit?',
        tr: 'Lena şimdi işe nasıl gidiyor?',
        o: ['Mit der S-Bahn.', 'Mit dem Auto.', 'Mit dem Fahrrad.', 'Zu Fuß.'],
        a: 'Mit der S-Bahn.',
        ex: '„Ich fahre jeden Morgen zwanzig Minuten mit der S-Bahn ins Büro.“',
      },
      {
        q: 'Was schlägt Lena vor?',
        tr: 'Lena ne öneriyor?',
        o: [
          'Selin soll sie im Mai besuchen.',
          'Selin soll nach München fahren.',
          'Sie wollen zusammen umziehen.',
          'Selin soll einen Kuchen backen.',
        ],
        a: 'Selin soll sie im Mai besuchen.',
        ex: '„Hast du im Mai Zeit? Dann kannst du mich besuchen!“',
      },
    ],
    trueFalse: [
      { s: 'Zwei Kollegen haben Lena beim Umzug geholfen.', correct: true },
      { s: 'Die Gitarrenmusik stört Lena sehr.', correct: false },
      { s: 'In München ist Lena mit dem Auto zur Arbeit gefahren.', correct: true },
    ],
    phrases: [
      { de: 'Zum Glück haben mir zwei Kollegen geholfen.', tr: 'Neyse ki iki iş arkadaşım bana yardım etti.' },
      { de: 'Das stört mich nicht.', tr: 'Bu beni rahatsız etmiyor.' },
      { de: 'Die Arbeit macht mir Spaß.', tr: 'İş hoşuma gidiyor.' },
      { de: 'Schreib mir bald!', tr: 'Bana yakında yaz!' },
    ],
  },
  {
    id: 'lt-arzt',
    title: 'Ein Tag beim Arzt',
    format: 'Erzählung',
    theme: 'Gesundheit & Körper',
    text: `Am Montagmorgen ist Murat mit starken Halsschmerzen aufgewacht. Er hatte auch Fieber und war sehr müde. Deshalb hat er sofort seine Chefin angerufen und gesagt, dass er nicht zur Arbeit kommen kann. Seine Chefin war sehr verständnisvoll: „Bleiben Sie zu Hause und gehen Sie zum Arzt. Gute Besserung!“

Dann hat Murat in der Praxis von Dr. Becker angerufen. Die Frau am Telefon hat gesagt, dass er um halb elf kommen kann. Er sollte seine Versichertenkarte mitbringen. Im Wartezimmer saßen schon viele Leute, und Murat musste fast eine Stunde warten.

Dr. Becker hat ihn genau untersucht. „Sie haben eine Grippe“, hat sie gesagt. „Sie müssen viel trinken und mindestens drei Tage im Bett bleiben. Ich schreibe Ihnen ein Rezept für ein Medikament gegen das Fieber.“ Außerdem hat Murat eine Krankmeldung für seinen Arbeitgeber bekommen.

Auf dem Weg nach Hause ist er noch zur Apotheke gegangen und hat das Medikament geholt. Zu Hause hat er sich einen heißen Tee mit Honig gemacht und ist sofort ins Bett gegangen. Am Abend hat seine Schwester angerufen und gefragt, ob sie ihm etwas zu essen bringen soll. Murat hat sich sehr gefreut. Nach vier Tagen war er wieder gesund.`,
    questions: [
      {
        q: 'Was hat Murat zuerst gemacht?',
        tr: 'Murat ilk olarak ne yaptı?',
        o: [
          'Er hat seine Chefin angerufen.',
          'Er ist zur Apotheke gegangen.',
          'Er hat Tee getrunken.',
          'Er hat seine Schwester angerufen.',
        ],
        a: 'Er hat seine Chefin angerufen.',
        ex: '„Deshalb hat er sofort seine Chefin angerufen …“',
      },
      {
        q: 'Wie lange musste Murat im Wartezimmer warten?',
        tr: 'Murat bekleme odasında ne kadar beklemek zorunda kaldı?',
        o: ['Fast eine Stunde.', 'Eine halbe Stunde.', 'Drei Stunden.', 'Gar nicht.'],
        a: 'Fast eine Stunde.',
        ex: '„… Murat musste fast eine Stunde warten.“',
      },
      {
        q: 'Was hat die Ärztin gesagt?',
        tr: 'Doktor ne dedi?',
        o: [
          'Er soll mindestens drei Tage im Bett bleiben.',
          'Er soll sofort wieder arbeiten.',
          'Er braucht kein Medikament.',
          'Er soll ins Krankenhaus gehen.',
        ],
        a: 'Er soll mindestens drei Tage im Bett bleiben.',
        ex: '„Sie müssen viel trinken und mindestens drei Tage im Bett bleiben.“',
      },
      {
        q: 'Was wollte seine Schwester machen?',
        tr: 'Kız kardeşi ne yapmak istedi?',
        o: ['Ihm etwas zu essen bringen.', 'Ihn zum Arzt fahren.', 'Seine Chefin anrufen.', 'Das Medikament holen.'],
        a: 'Ihm etwas zu essen bringen.',
        ex: '„… gefragt, ob sie ihm etwas zu essen bringen soll.“',
      },
    ],
    trueFalse: [
      { s: 'Murats Chefin war böse, weil er nicht kommen konnte.', correct: false },
      { s: 'Murat hat das Medikament in der Apotheke geholt.', correct: true },
      { s: 'Murat war nach zwei Tagen wieder gesund.', correct: false },
    ],
    phrases: [
      { de: 'Ich kann heute nicht zur Arbeit kommen.', tr: 'Bugün işe gelemiyorum.' },
      { de: 'Bringen Sie bitte Ihre Versichertenkarte mit.', tr: 'Lütfen sigorta kartınızı getirin.' },
      { de: 'Ich schreibe Ihnen ein Rezept.', tr: 'Size bir reçete yazıyorum.' },
      { de: 'Gute Besserung!', tr: 'Geçmiş olsun!' },
    ],
  },
  {
    id: 'lt-berge',
    title: 'Ein Wochenende in den Bergen',
    format: 'Blog',
    theme: 'Reisen & Verkehr',
    text: `Mein Blog: Unterwegs mit Jana

Letztes Wochenende waren mein Freund Paul und ich in den Alpen. Wir sind am Freitagnachmittag mit dem Zug nach Garmisch-Partenkirchen gefahren. Die Fahrt von München hat nur eineinhalb Stunden gedauert. Unsere Pension war klein, aber sehr gemütlich, und das Frühstück war fantastisch: frisches Brot, Käse aus der Region und selbst gemachte Marmelade.

Am Samstag wollten wir eigentlich auf die Zugspitze wandern. Aber das Wetter war leider schlecht: Es war neblig und es hat viel geregnet. Deshalb sind wir mit der Bahn auf den Berg gefahren. Oben war es sehr kalt, nur zwei Grad! Wir haben fast nichts gesehen, aber im Restaurant haben wir eine heiße Schokolade getrunken und viel gelacht.

Am Sonntag war das Wetter dann perfekt. Die Sonne hat geschienen und der Himmel war blau. Wir haben eine lange Wanderung um einen See gemacht. Unterwegs haben wir ein Picknick gemacht und viele Fotos gemacht. Am Abend sind wir müde, aber glücklich nach Hause gefahren.

Mein Tipp für euch: Nehmt immer eine warme Jacke und eine Regenjacke mit, auch im Sommer! In den Bergen kann sich das Wetter sehr schnell ändern.`,
    questions: [
      {
        q: 'Wie sind Jana und Paul nach Garmisch-Partenkirchen gefahren?',
        tr: 'Jana ve Paul Garmisch-Partenkirchen’e nasıl gittiler?',
        o: ['Mit dem Zug.', 'Mit dem Auto.', 'Mit dem Bus.', 'Mit dem Fahrrad.'],
        a: 'Mit dem Zug.',
        ex: '„Wir sind am Freitagnachmittag mit dem Zug … gefahren.“',
      },
      {
        q: 'Warum sind sie am Samstag nicht gewandert?',
        tr: 'Cumartesi neden yürüyüş yapmadılar?',
        o: ['Das Wetter war schlecht.', 'Paul war krank.', 'Die Bahn war kaputt.', 'Sie waren zu müde.'],
        a: 'Das Wetter war schlecht.',
        ex: '„Aber das Wetter war leider schlecht: Es war neblig und es hat viel geregnet.“',
      },
      {
        q: 'Was haben sie am Sonntag gemacht?',
        tr: 'Pazar günü ne yaptılar?',
        o: [
          'Sie sind um einen See gewandert.',
          'Sie sind auf die Zugspitze gefahren.',
          'Sie sind in der Pension geblieben.',
          'Sie sind einkaufen gegangen.',
        ],
        a: 'Sie sind um einen See gewandert.',
        ex: '„Wir haben eine lange Wanderung um einen See gemacht.“',
      },
      {
        q: 'Was ist Janas Tipp?',
        tr: 'Jana’nın tavsiyesi ne?',
        o: [
          'Immer eine warme Jacke und eine Regenjacke mitnehmen.',
          'Nie im Sommer in die Berge fahren.',
          'Immer mit dem Auto fahren.',
          'In den Bergen kein Picknick machen.',
        ],
        a: 'Immer eine warme Jacke und eine Regenjacke mitnehmen.',
        ex: '„Nehmt immer eine warme Jacke und eine Regenjacke mit …“',
      },
    ],
    trueFalse: [
      { s: 'Die Fahrt von München hat eineinhalb Stunden gedauert.', correct: true },
      { s: 'Auf der Zugspitze war es sehr warm.', correct: false },
      { s: 'Am Sonntag hat die Sonne geschienen.', correct: true },
    ],
    phrases: [
      { de: 'Die Fahrt hat nur eineinhalb Stunden gedauert.', tr: 'Yolculuk sadece bir buçuk saat sürdü.' },
      { de: 'Wir wollten eigentlich wandern.', tr: 'Aslında yürüyüş yapmak istiyorduk.' },
      { de: 'Das Wetter kann sich schnell ändern.', tr: 'Hava çabuk değişebilir.' },
      { de: 'Wir sind müde, aber glücklich nach Hause gefahren.', tr: 'Yorgun ama mutlu eve döndük.' },
    ],
  },
  {
    id: 'lt-stelle',
    title: 'Die neue Stelle',
    format: 'E-Mail',
    theme: 'Arbeit & Beruf',
    text: `Sehr geehrte Frau Hoffmann,

vielen Dank für das freundliche Gespräch am letzten Dienstag. Ich freue mich sehr, dass ich die Stelle als Verkäufer in Ihrem Sportgeschäft bekomme.

Sie haben mich gebeten, Ihnen noch einige Informationen zu schicken. Im Anhang finden Sie meinen Lebenslauf, eine Kopie von meinem Zeugnis und meine Kontodaten. Die Kopie von meinem Ausweis bringe ich am ersten Arbeitstag mit.

Ich habe noch eine Frage zu den Arbeitszeiten. Im Gespräch haben Sie gesagt, dass ich manchmal auch am Samstag arbeiten muss. Das ist kein Problem für mich. Aber am Mittwochnachmittag besuche ich bis Ende Juni einen Deutschkurs an der Volkshochschule. Wäre es möglich, dass ich an diesem Tag nur vormittags arbeite? Natürlich kann ich die Stunden an einem anderen Tag nacharbeiten.

Außerdem möchte ich fragen, ob ich am ersten Tag besondere Kleidung brauche oder ob ich von Ihnen ein T-Shirt mit dem Logo bekomme. Und wo kann ich mein Fahrrad abstellen? Ich wohne nicht weit vom Geschäft und möchte gern mit dem Rad zur Arbeit fahren.

Ich freue mich auf die Arbeit in Ihrem Team und auf meinen ersten Arbeitstag am 1. Juli.

Mit freundlichen Grüßen
Kerem Aydın`,
    questions: [
      {
        q: 'Welche Stelle bekommt Kerem?',
        tr: 'Kerem hangi işi alıyor?',
        o: [
          'Verkäufer in einem Sportgeschäft.',
          'Lehrer an der Volkshochschule.',
          'Koch in einem Restaurant.',
          'Mechaniker in einer Werkstatt.',
        ],
        a: 'Verkäufer in einem Sportgeschäft.',
        ex: '„… die Stelle als Verkäufer in Ihrem Sportgeschäft …“',
      },
      {
        q: 'Was schickt Kerem mit der E-Mail?',
        tr: 'Kerem e-postayla ne gönderiyor?',
        o: [
          'Seinen Lebenslauf, sein Zeugnis und seine Kontodaten.',
          'Eine Kopie von seinem Ausweis.',
          'Ein T-Shirt mit Logo.',
          'Seinen Arbeitsvertrag.',
        ],
        a: 'Seinen Lebenslauf, sein Zeugnis und seine Kontodaten.',
        ex: '„Im Anhang finden Sie meinen Lebenslauf, eine Kopie von meinem Zeugnis und meine Kontodaten.“',
      },
      {
        q: 'Warum möchte Kerem am Mittwochnachmittag nicht arbeiten?',
        tr: 'Kerem çarşamba öğleden sonra neden çalışmak istemiyor?',
        o: ['Er besucht einen Deutschkurs.', 'Er arbeitet samstags.', 'Er hat einen Arzttermin.', 'Er hat einen zweiten Job.'],
        a: 'Er besucht einen Deutschkurs.',
        ex: '„… am Mittwochnachmittag besuche ich … einen Deutschkurs …“',
      },
      {
        q: 'Wann beginnt Kerem mit der Arbeit?',
        tr: 'Kerem işe ne zaman başlıyor?',
        o: ['Am 1. Juli.', 'Am letzten Dienstag.', 'Ende Juni.', 'Am Mittwoch.'],
        a: 'Am 1. Juli.',
        ex: '„… auf meinen ersten Arbeitstag am 1. Juli.“',
      },
    ],
    trueFalse: [
      { s: 'Kerem kann am Samstag nicht arbeiten.', correct: false },
      { s: 'Kerem bringt die Kopie von seinem Ausweis am ersten Tag mit.', correct: true },
      { s: 'Kerem möchte die fehlenden Stunden an einem anderen Tag arbeiten.', correct: true },
    ],
    phrases: [
      { de: 'Vielen Dank für das freundliche Gespräch.', tr: 'Nazik görüşme için çok teşekkürler.' },
      { de: 'Im Anhang finden Sie meinen Lebenslauf.', tr: 'Ekte özgeçmişimi bulabilirsiniz.' },
      { de: 'Wäre es möglich, dass …?', tr: '… mümkün olur mu?' },
      { de: 'Mit freundlichen Grüßen', tr: 'Saygılarımla' },
    ],
  },
  {
    id: 'lt-markt',
    title: 'Samstag auf dem Wochenmarkt',
    format: 'Bericht',
    theme: 'Essen & Trinken',
    text: `Jeden Samstagvormittag geht Familie Schneider auf den Wochenmarkt am Rathausplatz. Für die Kinder Mia und Leon ist das immer ein kleines Abenteuer. Auf dem Markt gibt es viel zu sehen: Obst und Gemüse aus der Region, frischen Fisch, Blumen, Käse und Brot.

Frau Schneider kauft am liebsten bei Bauer Krüger ein. Seine Kartoffeln und Tomaten sind nicht billig, aber sie schmecken viel besser als die Tomaten aus dem Supermarkt. Außerdem kennt sie Herrn Krüger schon lange, und die beiden sprechen immer ein bisschen über das Wetter und die Familie.

Herr Schneider kauft den Käse. Er probiert gern neue Sorten und lässt sich von der Verkäuferin beraten. Die Kinder dürfen sich jede Woche etwas aussuchen. Mia nimmt meistens Erdbeeren, Leon möchte immer eine Brezel.

Seit einem Jahr bringen die Schneiders ihre eigenen Taschen und Gläser mit. „Wir möchten weniger Plastik benutzen“, sagt Frau Schneider. „Das ist besser für die Umwelt.“ Nur das Bezahlen ist manchmal ein Problem: Viele Verkäufer auf dem Markt nehmen keine Karte, deshalb muss man genug Bargeld dabeihaben.

Nach dem Einkaufen trinken die Eltern noch einen Kaffee im Café am Markt, und die Kinder spielen auf dem Spielplatz. Danach gehen alle zusammen nach Hause und kochen das Mittagessen.`,
    questions: [
      {
        q: 'Warum kauft Frau Schneider bei Bauer Krüger?',
        tr: 'Bayan Schneider neden çiftçi Krüger’den alışveriş yapıyor?',
        o: [
          'Seine Produkte schmecken besser.',
          'Seine Produkte sind sehr billig.',
          'Er nimmt Kreditkarten.',
          'Er verkauft frischen Fisch.',
        ],
        a: 'Seine Produkte schmecken besser.',
        ex: '„… nicht billig, aber sie schmecken viel besser …“',
      },
      {
        q: 'Was kauft Herr Schneider auf dem Markt?',
        tr: 'Bay Schneider pazardan ne alıyor?',
        o: ['Käse.', 'Blumen.', 'Erdbeeren.', 'Fisch.'],
        a: 'Käse.',
        ex: '„Herr Schneider kauft den Käse.“',
      },
      {
        q: 'Warum bringt die Familie eigene Taschen mit?',
        tr: 'Aile neden kendi çantalarını getiriyor?',
        o: [
          'Sie möchte weniger Plastik benutzen.',
          'Auf dem Markt gibt es keine Taschen.',
          'Taschen sind dort sehr teuer.',
          'Die Kinder tragen gern Taschen.',
        ],
        a: 'Sie möchte weniger Plastik benutzen.',
        ex: '„Wir möchten weniger Plastik benutzen.“',
      },
      {
        q: 'Was ist auf dem Markt manchmal ein Problem?',
        tr: 'Pazarda bazen sorun olan ne?',
        o: [
          'Viele Verkäufer nehmen keine Karte.',
          'Es gibt keine Erdbeeren.',
          'Der Markt ist sehr laut.',
          'Die Verkäufer sind unfreundlich.',
        ],
        a: 'Viele Verkäufer nehmen keine Karte.',
        ex: '„Viele Verkäufer auf dem Markt nehmen keine Karte …“',
      },
    ],
    trueFalse: [
      { s: 'Die Tomaten von Bauer Krüger sind sehr billig.', correct: false },
      { s: 'Leon möchte immer eine Brezel.', correct: true },
      { s: 'Nach dem Markt essen die Schneiders im Restaurant.', correct: false },
    ],
    phrases: [
      { de: 'Sie kauft am liebsten bei Bauer Krüger ein.', tr: 'En çok çiftçi Krüger’den alışveriş yapmayı sever.' },
      { de: 'Er lässt sich von der Verkäuferin beraten.', tr: 'Satıcıdan tavsiye alır.' },
      { de: 'Man muss genug Bargeld dabeihaben.', tr: 'Yanında yeterince nakit olmalı.' },
      { de: 'Das ist besser für die Umwelt.', tr: 'Bu çevre için daha iyi.' },
    ],
  },
  {
    id: 'lt-kurs',
    title: 'Mein Deutschkurs in Leipzig',
    format: 'Erzählung',
    theme: 'Schule & Ausbildung',
    text: `Mein Name ist Elif, ich bin 27 Jahre alt und komme aus Izmir. Seit acht Monaten lebe ich in Leipzig, weil mein Mann hier eine Stelle als Ingenieur bekommen hat. Am Anfang war alles schwierig. Ich konnte nur „Hallo“ und „Danke“ sagen und habe fast nichts verstanden – nicht beim Bäcker, nicht im Bus und nicht auf dem Amt.

Deshalb habe ich mich sofort für einen Deutschkurs angemeldet. Der Kurs findet viermal pro Woche von 9 bis 12:30 Uhr statt. In meiner Klasse sind Leute aus zwölf Ländern, zum Beispiel aus Syrien, Brasilien, Polen und Vietnam. Wir sprechen alle zusammen Deutsch, denn das ist unsere einzige gemeinsame Sprache. Unsere Lehrerin, Frau Wolf, ist sehr geduldig und erklärt die Grammatik immer mit vielen Beispielen.

Am schwierigsten finde ich die Artikel. Warum heißt es „der Löffel“, aber „die Gabel“ und „das Messer“? Meine Lehrerin sagt, ich soll jedes neue Wort immer mit Artikel und Plural lernen. Das mache ich jetzt mit Karteikarten.

Nach dem Kurs gehe ich oft mit Ana aus Brasilien in die Bibliothek. Wir machen zusammen die Hausaufgaben und üben für die Prüfung. Im Juni möchten wir beide die A2-Prüfung machen. Ich bin ein bisschen nervös, aber ich lerne jeden Tag. Ana ist inzwischen meine beste Freundin in Leipzig.`,
    questions: [
      {
        q: 'Warum lebt Elif in Leipzig?',
        tr: 'Elif neden Leipzig’de yaşıyor?',
        o: ['Ihr Mann arbeitet dort.', 'Sie studiert dort.', 'Ihre Eltern wohnen dort.', 'Sie macht dort Urlaub.'],
        a: 'Ihr Mann arbeitet dort.',
        ex: '„… weil mein Mann hier eine Stelle als Ingenieur bekommen hat.“',
      },
      {
        q: 'Wie oft hat Elif Deutschkurs?',
        tr: 'Elif’in ne sıklıkla Almanca kursu var?',
        o: ['Viermal pro Woche.', 'Jeden Tag.', 'Zweimal pro Woche.', 'Nur am Wochenende.'],
        a: 'Viermal pro Woche.',
        ex: '„Der Kurs findet viermal pro Woche … statt.“',
      },
      {
        q: 'Was findet Elif am schwierigsten?',
        tr: 'Elif en çok neyi zor buluyor?',
        o: ['Die Artikel.', 'Die Aussprache.', 'Das Schreiben.', 'Die Zahlen.'],
        a: 'Die Artikel.',
        ex: '„Am schwierigsten finde ich die Artikel.“',
      },
      {
        q: 'Was machen Elif und Ana nach dem Kurs?',
        tr: 'Elif ve Ana kurstan sonra ne yapıyor?',
        o: [
          'Sie lernen zusammen in der Bibliothek.',
          'Sie gehen zusammen einkaufen.',
          'Sie arbeiten in einem Café.',
          'Sie fahren zusammen nach Hause.',
        ],
        a: 'Sie lernen zusammen in der Bibliothek.',
        ex: '„Nach dem Kurs gehe ich oft mit Ana … in die Bibliothek. Wir machen zusammen die Hausaufgaben …“',
      },
    ],
    trueFalse: [
      { s: 'In Elifs Klasse sprechen alle Türkisch.', correct: false },
      { s: 'Elif lernt neue Wörter mit Artikel und Plural.', correct: true },
      { s: 'Elif und Ana möchten im Juni die Prüfung machen.', correct: true },
    ],
    phrases: [
      { de: 'Der Kurs findet viermal pro Woche statt.', tr: 'Kurs haftada dört kez yapılıyor.' },
      { de: 'Am schwierigsten finde ich die Artikel.', tr: 'En zor bulduğum şey artikeller.' },
      { de: 'Ich habe mich für einen Kurs angemeldet.', tr: 'Bir kursa kaydoldum.' },
      { de: 'Ich bin ein bisschen nervös.', tr: 'Biraz gerginim.' },
    ],
  },
];

/** Uzun metinlerin sorularını sınav motoru için Question’a çevirir. */
export const LONG_READING_QUESTIONS: Question[] = LONG_TEXTS.flatMap((t) =>
  t.questions.map((q, i) => ({
    id: `${t.id}-q${i + 1}`,
    type: 'reading' as const,
    category: 'reading' as const,
    difficulty: 'A2.2' as const,
    readingTitle: t.title,
    readingText: t.text,
    question: q.q,
    questionTr: q.tr,
    options: q.o,
    correctAnswer: q.a,
    explanation: q.ex,
    targetRule: 'Lesen: längere Texte verstehen',
    source: 'bank' as const,
  })),
);
