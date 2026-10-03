"""Goethe A2 kelime listesini (data/goethe_a2_wortliste_turkce.json) uygulamanın
kullandığı normalize biçime (web/src/data/words.json) dönüştürür.

Her kelime için: id, de (görünen biçim), lemma, article, plural, type, tr,
examples, theme, (fiiller için) present3, perfektAux, partizip, reflexive.
"""
import json
import os
import re
import unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "data", "goethe_a2_wortliste_turkce.json")
OUT = os.path.join(ROOT, "web", "src", "data", "words.json")

PREPOSITIONS = {"ab", "an", "auf", "aus", "bei", "bis", "durch", "für", "gegen", "gegenüber", "hinter", "in",
                "mit", "nach", "neben", "ohne", "pro", "seit", "über", "um", "unter", "von", "vor", "wegen",
                "zu", "zwischen", "außer", "außerhalb"}
CONNECTORS = {"aber", "als", "also", "dass", "denn", "deshalb", "oder", "und", "weil", "wenn", "doch",
              "außerdem", "dann", "sonst", "trotzdem", "obwohl", "ob", "sondern", "damit"}
PRONOUNS = {"all-", "ander-", "beide", "eigen-", "einig-", "einzel-", "etwas", "jeder, e, s", "jemand",
            "kein, e", "man", "manch-", "meist-", "nichts", "niemand", "selbst", "welcher, -e, -s",
            "wer (wen, wem)", "was", "ein paar", "viel, e", "wenig, -e", "bisschen", "nächste, -er, -es",
            "letzt-", "lieb-", "geehrt-"}
QUESTION_WORDS = {"wann", "warum", "wie", "wie viel, -e", "wo", "woher", "wohin"}
INTERJECTIONS = {"bitte", "danke", "hallo", "ja", "nein", "tschüs", "willkommen", "schade", "Achtung (Sg.)"}
ADVERBS = {
    "allein", "anders", "auch", "bald", "besonders", "da", "da(r) (darauf, darüber)", "damals", "daneben",
    "dort, -her, -hin", "draußen", "drinnen", "drüben", "eigentlich", "einmal", "endlich", "erst", "fast",
    "früher", "ganz", "genau", "genug", "gerade", "geradeaus", "gern, lieber, am liebsten", "gestern",
    "gleich", "her/her-/-her", "heraus/raus", "herein/rein", "heute", "hier", "hin/hin-/-hin", "hinten",
    "hoffentlich", "immer", "jetzt", "lange", "leider", "links", "mal / das Mal", "manchmal", "mehr",
    "meistens", "mindestens", "morgen", "natürlich", "nebenan", "nicht", "nie", "nirgends", "noch", "nur",
    "oben", "oft", "plötzlich", "rechts", "schon", "sehr", "so", "sofort", "sogar", "später", "überall",
    "übermorgen", "unbedingt", "unten", "vielleicht", "vorbei", "vorgestern", "vorher", "vorn(e)", "vorwärts",
    "wahrscheinlich", "weg/weg-", "weiter", "wenigstens", "wieder", "wirklich", "zuerst", "zuletzt", "zurück",
    "zusammen", "einfach", "total", "echt", "online", "sicher",
}
PHRASES_EXTRA = {"Lieblings-"}

THEMES = [
    ("Gesundheit & Körper", ["arzt", "ärzt", "krank", "apothek", "medikament", "tablette", "fieber", "schmerz",
                             "gesund", "bauch", "kopf", "hals", "arm", "bein", "auge", "ohr", "nase", "mund",
                             "zahn", "rücken", "hand", "fuß", "körper", "verletz", "unfall", "notarzt", "notfall",
                             "pflege", "praxis", "termin", "erkältet", "husten", "schnupfen", "grippe", "blut",
                             "versicherung", "rezept", "sprechstunde", "wehtun", "weh", "schwanger", "tot",
                             "sterben", "operation", "kranken"]),
    ("Essen & Trinken", ["essen", "trink", "kaffee", "tee", "bier", "wein", "wasser", "saft", "milch", "brot",
                         "brötchen", "butter", "käse", "wurst", "fleisch", "fisch", "gemüse", "obst", "apfel",
                         "banane", "birne", "kartoffel", "reis", "nudel", "suppe", "salat", "kuchen", "zucker",
                         "salz", "pfeffer", "ei,", "frühstück", "mittagessen", "abendessen", "restaurant",
                         "kellner", "speise", "koch", "back", "lebensmittel", "getränk", "tomate", "zitrone",
                         "schokolade", "eis", "glas", "flasche", "tasse", "teller", "löffel", "messer", "gabel",
                         "hunger", "durst", "lecker", "schmeck", "süß", "sauer", "bitter", "scharf", "fett",
                         "mahlzeit", "rechnung", "trinkgeld", "bestell", "imbiss", "kantine", "café", "hähnchen",
                         "huhn", "marmelade", "honig", "pizza", "vegetar", "frisch"]),
    ("Einkaufen & Kleidung", ["kauf", "geschäft", "laden", "supermarkt", "markt", "preis", "kosten", "billig",
                              "teuer", "günstig", "angebot", "kasse", "geld", "bar", "euro", "kleid", "hose",
                              "hemd", "bluse", "rock", "mantel", "jacke", "schuh", "anzug", "pullover", "mütze",
                              "tasche", "größe", "anprobier", "anzieh", "ausziehen", "umtausch", "zahl", "verkäuf",
                              "kunde", "kundin", "sonderangebot", "rabatt", "bezahl", "preiswert", "mode", "farbe",
                              "kostenlos", "quittung", "kassenbon", "packung", "stück", "kilo", "gramm", "liter",
                              "t-shirt", "brille", "uhr", "schmuck", "regenschirm"]),
    ("Wohnen", ["wohn", "zimmer", "miete", "vermiet", "küche", "bad", "balkon", "haus", "möbel", "tisch", "stuhl",
                "bett", "schrank", "sofa", "regal", "lampe", "garten", "aufzug", "heizung", "keller", "nachbar",
                "umzug", "umzieh", "einzieh", "dusche", "toilette", "wc", "fenster", "tür", "treppe", "stock",
                "etage", "garage", "schlüssel", "teppich", "kühlschrank", "herd", "waschmaschine", "spülmaschine",
                "aufräum", "putz", "sauber", "schmutz", "müll", "nebenkosten", "hausmeister", "licht", "strom",
                "boden", "wand", "decke", "dach", "eingang", "flur", "möbliert", "hof", "klingel", "anschluss",
                "baustelle", "bauen"]),
    ("Arbeit & Beruf", ["arbeit", "beruf", "job", "firma", "büro", "chef", "kolleg", "stelle", "bewerb", "gehalt",
                        "lohn", "verdien", "kündig", "meeting", "besprechung", "praktikum", "termin", "aufgabe",
                        "projekt", "kunde", "betrieb", "fabrik", "werkstatt", "mitarbeit", "angestellt",
                        "selbstständig", "teilzeit", "vollzeit", "überstunde", "pause", "urlaub", "lebenslauf",
                        "zeugnis", "erfahrung", "team", "leiter", "sekretär", "drucker", "computer", "kopier",
                        "firma", "unternehmen", "industrie", "handwerk", "techniker", "mechaniker", "verkäufer",
                        "polizist", "journalist", "kellner", "lehrer", "babysitter", "rentner", "rente",
                        "arbeitslos", "schicht"]),
    ("Schule & Ausbildung", ["schul", "schüler", "lehrer", "unterricht", "kurs", "prüfung", "test", "lern",
                             "studi", "universität", "uni", "ausbildung", "klasse", "hausaufgabe", "note",
                             "zeugnis", "abitur", "fach", "lesen", "schreib", "rechn", "wörterbuch", "heft",
                             "kuli", "bleistift", "papier", "seite", "satz", "wort", "sprache", "fehler",
                             "übung", "aufgabe", "lösung", "erklär", "bedeut", "buchstab", "frage", "antwort",
                             "kindergarten", "bibliothek", "semester", "student", "bestehen", "wiederhol"]),
    ("Reisen & Verkehr", ["reise", "fahr", "flug", "flieg", "zug", "bahn", "bus", "taxi", "auto", "rad", "verkehr",
                          "straße", "ampel", "kreuzung", "haltestelle", "gleis", "bahnsteig", "ticket", "fahrkarte",
                          "koffer", "gepäck", "hotel", "pension", "zimmer frei", "urlaub", "ferien", "ausland",
                          "pass", "ausweis", "visum", "grenze", "zoll", "abfahrt", "ankunft", "ankommen", "abflug",
                          "verspät", "umsteig", "einsteig", "aussteig", "anschluss", "parkplatz", "parken",
                          "tankstelle", "benzin", "führerschein", "stadtplan", "karte", "weg", "richtung",
                          "brücke", "u-bahn", "s-bahn", "straßenbahn", "motorrad", "lkw", "schiff", "hafen",
                          "flughafen", "ausflug", "tourist", "sehenswürdigkeit", "besichtig", "camping", "zelt",
                          "autobahn", "bahnhof", "stau", "unterwegs", "abholen", "gefahr"]),
    ("Freizeit & Hobbys", ["freizeit", "hobby", "sport", "fußball", "tennis", "schwimm", "spiel", "musik",
                           "konzert", "kino", "film", "theater", "museum", "ausstellung", "party", "fest",
                           "feier", "geburtstag", "einladung", "einlad", "tanz", "sing", "lied", "band", "gitarre",
                           "klavier", "malen", "foto", "wander", "spazier", "joggen", "verein", "mitglied",
                           "club", "freund", "treffen", "verabred", "basteln", "lesen", "buch", "ball",
                           "basketball", "fitness", "radfahren", "urlaub", "zoo", "zirkus", "spaß", "geschenk",
                           "hochzeit", "weihnacht", "ostern", "karneval", "picknick", "grill", "programm",
                           "eintritt", "ticket", "spannend", "langweilig", "lustig", "witzig", "comic"]),
    ("Natur & Wetter", ["wetter", "sonne", "sonnig", "regen", "schnee", "wind", "wolke", "bewölkt", "neblig",
                        "gewitter", "temperatur", "grad", "warm", "kalt", "heiß", "kühl", "natur", "wald",
                        "baum", "blume", "pflanze", "tier", "hund", "katze", "vogel", "pferd", "kuh", "schwein",
                        "see", "meer", "fluss", "berg", "insel", "strand", "land", "himmel", "umwelt",
                        "jahreszeit", "frühling", "sommer", "herbst", "winter", "trocken", "nass", "klima"]),
    ("Kommunikation & Medien", ["telefon", "handy", "anruf", "anrufen", "nachricht", "sms", "e-mail", "mail",
                                "brief", "post", "paket", "internet", "computer", "laptop", "blog", "zeitung",
                                "zeitschrift", "radio", "fernseh", "sendung", "medien", "app", "online",
                                "anrufbeantworter", "kontakt", "adresse", "absender", "empfänger", "briefmarke",
                                "artikel", "anzeige", "information", "informier", "mitteil", "sagen", "sprech",
                                "erzähl", "bescheid", "berichten", "gespräch", "diskut", "meinung", "drucken",
                                "passwort", "foto", "kamera", "apparat"]),
    ("Dienstleistungen & Behörden", ["bank", "konto", "amt", "behörde", "formular", "anmeld", "ausfüll",
                                     "unterschrift", "unterschreib", "polizei", "post", "schalter", "auskunft",
                                     "service", "reparatur", "reparier", "kaputt", "werkstatt", "termin",
                                     "gebühr", "versicherung", "vertrag", "kündig", "beschwer", "beratung",
                                     "berat", "rathaus", "botschaft", "pass", "ausweis", "führerschein", "ämter",
                                     "geldautomat", "automat", "rechnung", "überweis", "bezahl", "kredit",
                                     "karte", "staatsangehörigkeit", "familienname", "vorname", "geburts",
                                     "bestätig", "erlaubt", "verbot", "gültig"]),
    ("Person & Familie", ["familie", "eltern", "mutter", "vater", "kind", "sohn", "tochter", "bruder",
                          "schwester", "geschwister", "oma", "opa", "großmutter", "großvater", "enkel", "onkel",
                          "tante", "cousin", "verwandt", "mann", "frau", "ehe", "heirat", "verheiratet",
                          "ledig", "geschieden", "baby", "junge", "mädchen", "name", "alter", "geboren",
                          "geburt", "liebe", "lieben", "freundin", "partner", "leute", "mensch", "person",
                          "herr", "dame", "erwachsen", "jugendlich", "nett", "freundlich", "sympathisch",
                          "blond", "groß", "klein", "dick", "dünn", "jung", "alt", "männlich", "weiblich",
                          "nachname", "nationalität", "herkunft", "heimat"]),
]

GROUP_THEMES = {
    "Abkuerzungen": "Allgemein",
    "Anweisungssprache_zur_Pruefung": "Schule & Ausbildung",
    "Berufe": "Arbeit & Beruf",
    "Familienmitglieder": "Person & Familie",
    "Familienstand": "Person & Familie",
    "Farben": "Einkaufen & Kleidung",
    "Himmelsrichtungen": "Natur & Wetter",
    "Laender_und_Nationalitaeten": "Person & Familie",
    "Waehrungen_und_Masse": "Zeit & Zahlen",
    "Schule_und_Schulfaecher": "Schule & Ausbildung",
    "Zeitangaben_Datum": "Zeit & Zahlen",
    "Feiertage": "Freizeit & Hobbys",
    "Jahreszeiten": "Natur & Wetter",
    "Monate": "Zeit & Zahlen",
    "Tageszeiten": "Zeit & Zahlen",
    "Zahlen": "Zeit & Zahlen",
    "Uhrzeit": "Zeit & Zahlen",
    "Wochentage": "Zeit & Zahlen",
    "Zeitmasse": "Zeit & Zahlen",
}

# Kelime gruppalarındaki isimlerin artikelleri (kaynak listede verilmemiş).
GROUP_ARTICLES = {
    "Antwortbogen": "der", "Aufgabe": "die", "Beispiel": "das", "Durchsage": "die", "Lösung": "die",
    "Prüfer": "der", "Prüfung": "die", "Punkt": "der", "Teil": "der", "Test": "der", "Text": "der",
    "Wörterbuch": "das", "Bruder": "der", "Cousin": "der", "Cousine": "die", "Eltern": "die", "Enkel": "der",
    "Enkelin": "die", "Geschwister": "die", "Großeltern": "die", "Großmutter": "die", "Großvater": "der",
    "Kind": "das", "Mutter": "die", "Onkel": "der", "Schwester": "die", "Sohn": "der", "Tante": "die",
    "Tochter": "die", "Vater": "der", "Norden": "der", "Süden": "der", "Osten": "der", "Westen": "der",
    "Abitur": "das", "Direktor": "der", "Hausaufgabe": "die", "Klasse": "die", "Klassenfahrt": "die",
    "Sekretariat": "das", "Stundenplan": "der", "Biologie": "die", "Chemie": "die", "Geografie": "die",
    "Geschichte": "die", "Mathematik": "die", "Musik": "die", "Physik": "die", "Religion": "die",
    "Sozialkunde": "die", "Sport": "der", "Latein": "das", "Frühling": "der", "Frühjahr": "das",
    "Sommer": "der", "Herbst": "der", "Winter": "der", "Januar": "der", "Februar": "der", "März": "der",
    "April": "der", "Mai": "der", "Juni": "der", "Juli": "der", "August": "der", "September": "der",
    "Oktober": "der", "November": "der", "Dezember": "der", "Tag": "der", "Morgen": "der",
    "Vormittag": "der", "Mittag": "der", "Nachmittag": "der", "Abend": "der", "Nacht": "die",
    "Mitternacht": "die", "Sekunde": "die", "Minute": "die", "Stunde": "die", "Woche": "die", "Jahr": "das",
    "Karneval": "der", "Antwortbogen,": "der", "ICE": "der", "Lkw": "der", "PC": "der", "WC": "das",
    "SMS": "die", "Meter": "der", "Zentimeter": "der", "Kilometer": "der", "Prozent": "das", "Liter": "der",
    "Feiertag": "der", "Babysitter": "der", "Model": "das", "Deutschland": "", "Europa": "",
}


def slug(s: str) -> str:
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:40]


def theme_for(lemma: str, tr: str) -> str:
    low = lemma.lower()
    for name, stems in THEMES:
        for st in stems:
            if low.startswith(st) or (len(st) >= 4 and st in low):
                return name
    return "Allgemein"


def parse_noun(raw: str):
    m = re.match(r"^(der/die|der/das|der|die|das)\s+(.+)$", raw)
    article, rest = m.group(1), m.group(2)
    rest = rest.split(" / ")[0]
    rest_main = rest
    sg_only = "(Sg.)" in rest
    pl_only = "(Pl.)" in rest
    rest_main = rest_main.replace("(Sg.)", "").replace("(Pl.)", "").strip()
    parts = [p.strip() for p in rest_main.split(",")]
    lemma = parts[0]
    plural_code = parts[1] if len(parts) > 1 else ""
    plural = build_plural(lemma, plural_code) if plural_code and not sg_only else ""
    if pl_only:
        plural = lemma
    return article, lemma, plural_code, plural, sg_only, pl_only


UML = {"a": "ä", "o": "ö", "u": "ü", "A": "Ä", "O": "Ö", "U": "Ü"}


def umlaut(word: str) -> str:
    # 'au' -> 'äu', aksi halde son kök ünlüsü (a/o/u) umlautlanır
    idx = word.rfind("au")
    cands = [i for i, c in enumerate(word) if c in "aouAOU"]
    if not cands:
        return word
    last = cands[-1]
    if idx != -1 and idx + 1 == last and word[last] == "u":
        return word[:idx] + ("ä" if word[idx] == "a" else "Ä") + word[idx + 1:]
    # 'Mutter' -> 'Mütter', 'Bruder' -> 'Brüder' (son hecedeki -er/-el/-en atlanır)
    core = word
    for suf in ("er", "el", "en"):
        if word.endswith(suf):
            core = word[: -len(suf)]
            break
    cands = [i for i, c in enumerate(core) if c in "aouAOU"]
    if not cands:
        return word
    last = cands[-1]
    if last > 0 and core[last - 1] in "aA" and core[last] == "u":
        last -= 1
        return word[:last] + UML[word[last]] + word[last + 1:]
    return word[:last] + UML[word[last]] + word[last + 1:]


def build_plural(lemma: str, code: str) -> str:
    code = code.strip()
    if not code or code.startswith("("):
        return ""
    if " " in lemma:
        return ""
    if code == "-":
        return lemma
    if code.startswith("¨"):
        base = umlaut(lemma)
        suf = code[1:].lstrip("-")
        return base + suf
    if code.startswith("-"):
        suf = code[1:]
        if lemma.endswith("um") and suf == "en":  # Zentrum -> Zentren, Museum -> Museen
            return lemma[:-2] + "en"
        return lemma + suf
    return ""


def parse_verb(raw: str):
    parts = [p.strip() for p in raw.split(",")]
    head = parts[0]
    reflexive = "(sich)" in head
    lemma = re.sub(r"\s*\(sich\)", "", head)
    lemma = re.sub(r"\s*\(.*?\)\s*", " ", lemma).strip()
    lemma = re.sub(r"^\((\w+)-\)", r"\1", lemma)  # (an-)ziehen -> anziehen
    present3 = parts[1] if len(parts) > 1 else ""
    perf = next((p for p in parts[2:] if re.match(r"^(hat|ist)[ /]", p)), "")
    aux, partizip = "", ""
    m = re.match(r"^(hat/ist|ist/hat|hat|ist)\s+(.+)$", perf)
    if m:
        aux = {"hat": "haben", "ist": "sein"}.get(m.group(1), "haben/sein")
        partizip = m.group(2).strip()
    praet = parts[2] if len(parts) >= 4 else ""
    return lemma, present3, aux, partizip, reflexive, praet


def classify_other(raw: str):
    if raw in PREPOSITIONS:
        return "Präposition"
    if raw in CONNECTORS:
        return "Konnektor"
    if raw in PRONOUNS:
        return "Pronomen"
    if raw in QUESTION_WORDS:
        return "Fragewort"
    if raw in INTERJECTIONS:
        return "Redewendung"
    if raw in ADVERBS:
        return "Adverb"
    if " " in raw or raw in PHRASES_EXTRA:
        return "Redewendung"
    if re.match(r"^[a-zäöüß]+$", raw) and (raw.endswith("en") or raw.endswith("ern") or raw.endswith("eln")) \
            and raw not in {"trocken", "selten", "offen", "verschieden", "zufrieden", "modern", "geboren", "eigen"}:
        return "Verb"
    if raw[:1].isupper():
        return "Nomen"
    return "Adjektiv"


def main():
    data = json.load(open(SRC, encoding="utf-8"))
    words = []
    seen_ids = set()
    seen_lemmas = set()

    def add(entry):
        base = slug(entry["lemma"]) or "w"
        wid = base
        n = 2
        while wid in seen_ids:
            wid = f"{base}-{n}"
            n += 1
        seen_ids.add(wid)
        entry["id"] = wid
        words.append(entry)

    for e in data["alfabetik_wortschatz"]:
        raw = e["almanca"].strip()
        tr = e["turkce"].strip()
        ex = [s.strip() for s in e.get("cumle_almanca", []) if s.strip()]
        entry = {"de": raw, "tr": tr, "examples": ex, "source": "A2"}
        if raw.startswith("fit sein") or raw.startswith("recht haben"):
            entry.update({"type": "Redewendung", "lemma": raw.split(",")[0]})
        elif re.match(r"^(der/die|der/das|der|die|das)\s+", raw):
            article, lemma, plural_code, plural, sg, pl = parse_noun(raw)
            entry.update({"type": "Nomen", "article": article, "lemma": lemma, "pluralCode": plural_code,
                          "plural": plural})
            if sg:
                entry["sgOnly"] = True
            if pl:
                entry["plOnly"] = True
        elif re.search(r",\s*(hat|ist|hat/ist|ist/hat)\s", raw) or re.match(r"^müssen,", raw):
            lemma, p3, aux, part, refl, praet = parse_verb(raw)
            if raw.startswith("müssen"):
                aux, part = "haben", "gemusst"
            entry.update({"type": "Verb", "lemma": lemma, "present3": p3, "perfektAux": aux, "partizip": part})
            if refl:
                entry["reflexive"] = True
            if praet:
                entry["praeteritum"] = praet
        else:
            t = classify_other(raw)
            lemma = raw
            if t == "Verb":
                reflexive = "(sich)" in raw
                lemma = re.sub(r"\s*\(.*?\)", "", raw).strip()
                entry.update({"lemma": lemma, "reflexive": reflexive} if reflexive else {"lemma": lemma})
            else:
                entry["lemma"] = re.sub(r"\s*\(Sg\.\)", "", raw).strip()
            entry["type"] = t
            if raw == "Achtung (Sg.)":
                entry.update({"type": "Nomen", "article": "die", "lemma": "Achtung", "sgOnly": True})
        entry["theme"] = theme_for(entry["lemma"], tr)
        seen_lemmas.add(entry["lemma"].lower())
        add(entry)

    for group, items in data["wortgruppen"].items():
        for it in items:
            raw = it["almanca"].strip()
            tr = it["turkce"].strip()
            first = re.split(r"[ ,/(]", raw)[0]
            if first.lower() in seen_lemmas:
                continue
            entry = {"de": raw, "tr": tr, "examples": [], "source": "Gruppe", "group": group,
                     "theme": GROUP_THEMES.get(group, "Allgemein")}
            art = GROUP_ARTICLES.get(first)
            if first[:1].isupper() and art is not None:
                entry["type"] = "Nomen"
                if art:
                    entry["article"] = art
                parts = [p.strip() for p in raw.split("/")[0].split(",")]
                entry["lemma"] = re.sub(r"\s*\(.*?\)", "", parts[0]).strip()
                if len(parts) > 1 and "(" not in parts[1]:
                    entry["pluralCode"] = parts[1]
                    entry["plural"] = build_plural(entry["lemma"], parts[1])
                if "/" in raw and group == "Berufe":
                    entry["article"] = "der/die"
            elif first[:1].isupper():
                entry["type"] = "Nomen" if group in ("Berufe", "Laender_und_Nationalitaeten") else "Redewendung"
                entry["lemma"] = re.sub(r"\s*\(.*?\)", "", raw.split(",")[0]).strip()
                if group == "Berufe":
                    entry["article"] = "der/die"
            else:
                entry["type"] = "Adjektiv" if group in ("Farben", "Familienstand") else "Redewendung"
                entry["lemma"] = raw
            seen_lemmas.add(first.lower())
            add(entry)

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(words, f, ensure_ascii=False, separators=(",", ":"))

    from collections import Counter
    print("toplam", len(words))
    print(Counter(w["type"] for w in words))
    print(Counter(w["theme"] for w in words))


if __name__ == "__main__":
    main()
