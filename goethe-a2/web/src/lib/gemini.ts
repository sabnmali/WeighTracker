import type { WritingTask } from '../data/writingTasks';
import type { Question, QuestionCategory, QuestionType, Settings, Word, WritingEvaluation } from '../types';
import { httpPost } from './native';
import { headword } from './words';

/** Orijinal spesifikasyondaki ana sistem direktifi (kısaltılmış ve JSON çıktısına uyarlanmış). */
export const MASTER_SYSTEM_PROMPT = `You are the Lead Examination Author and Chief Pedagogical Officer for official Goethe-Institut A2/A2+ certification. You generate rigorous, authentic and diverse examination materials, writing evaluations and typewriter-style worksheets in German, with all explanations in Turkish.

CORE PRINCIPLES & ANTI-MONOTONY MANDATE:
1. NEVER produce monotonous questions that only ask for articles (der/die/das) or simple one-to-one translations.
2. For a mixed ("Karma") exam distribute questions: Fehleranalyse 25-30%, Kasus & Präpositionen 20-25%, Grammatik & Konnektoren 20-25%, Situationsdialoge 15-20%, Leseverstehen & Satzbau 10-15%.

REALISTIC GERMAN LEARNER ERRORS (FEHLERANALYSE):
Use REAL errors A2/B1 learners make, e.g. "Ich habe gestern nach München gefahren." (sein!), "...weil er hat heute Fieber." (verb end), "Ich warte für den Bus." (auf), "mit die Straßenbahn" (Dativ), "Ich lege das Buch auf dem Tisch." (wohin → Akk), "Er anruft seine Kollegin." (separable), "Obwohl es regnet, aber wir gehen spazieren." (double conjunction).
Exactly ONE option must be wrong in "Welcher Satz ist falsch?" questions and all other options must be 100% grammatically correct German.

QUALITY RULES:
- Every German sentence must be natural, correct, CEFR A2 level (A2+ allowed).
- correctAnswer must be EXACTLY one of the options (character by character).
- Distractors must be plausible but unambiguously wrong.
- explanation and errorTrap are in supportive, clear TURKISH.`;

export class GeminiError extends Error {}

function describeError(status: number, body: string): string {
  if (status === 0) return 'İnternet bağlantısı kurulamadı. Bağlantınızı kontrol edin.';
  let msg = '';
  try {
    msg = JSON.parse(body)?.error?.message || '';
  } catch {
    msg = body.slice(0, 200);
  }
  if (status === 400 && /API key/i.test(msg)) return 'API anahtarı geçersiz. Ayarlar’dan kontrol edin.';
  if (status === 400) return `İstek reddedildi: ${msg}`;
  if (status === 401 || status === 403) return 'API anahtarı yetkisiz veya geçersiz. Ayarlar’dan kontrol edin.';
  if (status === 404) return `Model bulunamadı (${msg}). Ayarlar’dan model adını değiştirin (ör. gemini-2.5-flash).`;
  if (status === 429) return 'Gemini kullanım kotası doldu. Biraz bekleyip tekrar deneyin.';
  if (status >= 500) return 'Gemini sunucusu şu an yanıt veremiyor. Daha sonra tekrar deneyin.';
  return `Beklenmeyen hata (${status}): ${msg}`;
}

interface CallOpts {
  system?: string;
  user: string;
  json?: boolean;
  temperature?: number;
}

export async function callGemini(settings: Settings, opts: CallOpts): Promise<string> {
  const key = settings.apiKey.trim();
  if (!key) throw new GeminiError('Yapay zeka özellikleri için Ayarlar’dan bir Gemini API anahtarı girin.');
  const model = (settings.model || 'gemini-2.5-flash').trim();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const body: Record<string, unknown> = {
    contents: [{ role: 'user', parts: [{ text: opts.user }] }],
    generationConfig: {
      temperature: opts.temperature ?? 0.8,
      ...(opts.json ? { responseMimeType: 'application/json' } : {}),
    },
  };
  if (opts.system) body.systemInstruction = { parts: [{ text: opts.system }] };
  const res = await httpPost(url, { 'Content-Type': 'application/json', 'x-goog-api-key': key }, JSON.stringify(body));
  if (res.status < 200 || res.status >= 300) throw new GeminiError(describeError(res.status, res.body));
  let data: { candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[] };
  try {
    data = JSON.parse(res.body);
  } catch {
    throw new GeminiError('Gemini yanıtı okunamadı.');
  }
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
  if (!text) throw new GeminiError('Gemini boş yanıt döndürdü (içerik filtresi olabilir). Tekrar deneyin.');
  return text;
}

function parseJson<T>(text: string): T {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/, '')
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1)) as T;
    throw new GeminiError('Yapay zekanın ürettiği JSON çözümlenemedi. Tekrar deneyin.');
  }
}

export async function testApiKey(settings: Settings): Promise<string> {
  const t = await callGemini(settings, { user: 'Antworte nur mit: Hallo!', temperature: 0 });
  return t.trim();
}

const CATS: QuestionCategory[] = [
  'error_detection',
  'prepositions_kasus',
  'grammar',
  'dialogue',
  'reading',
  'sentence_syntax',
  'vocabulary',
];
const TYPES: QuestionType[] = ['multiple_choice', 'cloze', 'reading', 'sentence_build', 'error_correction', 'dialogue_completion'];

const MODE_BRIEF: Record<string, string> = {
  karma: 'a MIXED exam following the distribution rules',
  error: 'an exam with ONLY Fehleranalyse questions (error spotting: "Welcher Satz ist falsch?" or "In welchem Satz ist ein Fehler?")',
  kasus: 'an exam ONLY about cases and prepositions (Wechselpräpositionen wo/wohin, Dativ/Akkusativ prepositions, verbs with prepositions)',
  grammar: 'an exam ONLY about grammar & connectors (weil, dass, obwohl, wenn, deshalb, trotzdem, Perfekt haben/sein, Modalverben im Präteritum, Komparativ, Adjektivdeklination)',
  dialogue: 'an exam ONLY with authentic everyday dialogues (doctor, train station, restaurant, flat hunting, office, authorities)',
  reading: 'an exam with reading comprehension (short authentic notices, ads, e-mails as readingText) and sentence_build questions',
  vocab: 'a vocabulary exam using words IN CONTEXT (cloze sentences, meaning in context, collocations) – not only articles',
  mistakes: 'a remedial exam that targets the learner’s weak rules and words listed below',
};

interface AiQuestion {
  type?: string;
  category?: string;
  difficulty?: string;
  readingText?: string | null;
  question?: string;
  questionTr?: string;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  targetWord?: string;
  errorTrap?: string;
  targetRule?: string;
  sentenceParts?: string[];
}

export async function generateExamAI(
  settings: Settings,
  mode: string,
  count: number,
  theme: string | undefined,
  weakRules: string[],
  weakWords: string[],
): Promise<Question[]> {
  const user = `Create ${MODE_BRIEF[mode] || MODE_BRIEF.karma} with exactly ${count} questions${theme ? ` on the Goethe A2 theme "${theme}"` : ''}.
${weakRules.length ? `Learner's weak grammar rules (prioritise them, mark isErrorPriority=true): ${weakRules.join('; ')}.` : ''}
${weakWords.length ? `Learner's weak vocabulary (use in sentences): ${weakWords.join(', ')}.` : ''}

Respond ONLY with JSON: {"title": string, "questions": [ {
 "type": one of ${TYPES.join('|')},
 "category": one of ${CATS.join('|')},
 "difficulty": "A2.1"|"A2.2"|"A2+",
 "readingText": string or null (only for reading questions, 40-120 words),
 "question": German prompt (use ___ for blanks),
 "questionTr": Turkish translation of the prompt/instruction,
 "options": 3-4 strings (omit for sentence_build),
 "sentenceParts": for sentence_build only: the correct sentence split into 4-8 chunks IN CORRECT ORDER (punctuation attached to the chunk),
 "correctAnswer": exact correct option (for sentence_build: the chunks joined with single spaces),
 "explanation": Turkish explanation of the rule and why the trap is wrong,
 "errorTrap": Turkish description of the common trap,
 "targetRule": short German rule name, e.g. "Wechselpräpositionen: wohin → Akkusativ",
 "targetWord": a Goethe A2 word used
} ] }`;
  const text = await callGemini(settings, { system: MASTER_SYSTEM_PROMPT, user, json: true, temperature: 0.9 });
  const data = parseJson<{ title?: string; questions?: AiQuestion[] }>(text);
  const stamp = Date.now().toString(36);
  const out: Question[] = [];
  (data.questions || []).forEach((q, i) => {
    if (!q.question || !q.correctAnswer) return;
    const type = (TYPES.includes(q.type as QuestionType) ? q.type : 'multiple_choice') as QuestionType;
    const category = (CATS.includes(q.category as QuestionCategory) ? q.category : 'grammar') as QuestionCategory;
    const base: Question = {
      id: `ai-${stamp}-${i}`,
      type,
      category,
      difficulty: (['A2.1', 'A2.2', 'A2+'].includes(q.difficulty || '') ? q.difficulty : 'A2.2') as Question['difficulty'],
      readingText: q.readingText || undefined,
      question: q.question,
      questionTr: q.questionTr,
      correctAnswer: q.correctAnswer.trim(),
      explanation: q.explanation || '',
      errorTrap: q.errorTrap,
      targetRule: q.targetRule,
      targetWord: q.targetWord,
      source: 'ai',
    };
    if (type === 'sentence_build') {
      const parts = (q.sentenceParts || []).map((p) => String(p).trim()).filter(Boolean);
      if (parts.length < 3) return;
      base.sentenceParts = parts;
      base.correctAnswer = parts.join(' ');
      out.push(base);
      return;
    }
    const opts = (q.options || []).map((o) => String(o).trim()).filter(Boolean);
    if (opts.length < 2) return;
    let correct = opts.find((o) => o === base.correctAnswer);
    if (!correct) correct = opts.find((o) => o.toLowerCase() === base.correctAnswer.toLowerCase());
    if (!correct) return;
    base.options = Array.from(new Set(opts));
    base.correctAnswer = correct;
    out.push(base);
  });
  if (!out.length) throw new GeminiError('Yapay zeka geçerli soru üretemedi. Tekrar deneyin veya yerel motoru kullanın.');
  return out;
}

export async function explainRuleAI(settings: Settings, q: Question, userAnswer: string): Promise<string> {
  const user = `Ein Lernender (Muttersprache Türkisch, Niveau A2) hat diese Aufgabe bearbeitet:
Aufgabe: ${q.question}
${q.readingText ? `Text: ${q.readingText}\n` : ''}${q.options ? `Optionen: ${q.options.join(' | ')}\n` : ''}Richtige Antwort: ${q.correctAnswer}
Antwort des Lernenden: ${userAnswer || '(keine)'}
Regel: ${q.targetRule || '-'}

Erkläre die Grammatikregel ausführlich auf TÜRKISCH (max. 200 Wörter): 1) Kural, 2) Neden doğru cevap bu, 3) Öğrencinin cevabı neden yanlış (veya doğruysa onayla), 4) 3 yeni Almanca örnek cümle (Türkçe çevirisiyle), 5) Akılda tutma ipucu. Düz metin, Markdown başlıkları kullanma; madde işareti olarak "•" kullan.`;
  return callGemini(settings, { system: MASTER_SYSTEM_PROMPT, user, temperature: 0.4 });
}

export async function evaluateWritingAI(settings: Settings, task: WritingTask, text: string): Promise<WritingEvaluation> {
  const user = `Bewerte den folgenden Text eines Lernenden (Goethe-Zertifikat A2, Schreiben Teil ${task.teil}, ${task.register}).
Aufgabe: ${task.situation}
Inhaltspunkte: ${task.bullets.map((b) => b.de).join(' / ')}
Empfohlene Länge: ${task.minWords}-${task.maxWords} Wörter.

Text des Lernenden:
"""${text}"""

Bewerte streng nach den 4 Goethe-Kriterien (je 0-5 Punkte): aufgabe (Erfüllung der Aufgabenstellung – alle 3 Punkte behandelt?), kohaerenz (Kohärenz & Textaufbau, Anrede/Gruß, Konnektoren), wortschatz (Wortschatz), formal (Formale Richtigkeit: Grammatik, Verbposition, Kasus, Rechtschreibung). Bestehensgrenze 12/20.
Alle Rückmeldungen auf TÜRKISCH, unterstützend und konkret.
Antworte NUR mit JSON:
{"scores":{"aufgabe":0-5,"kohaerenz":0-5,"wortschatz":0-5,"formal":0-5},"total":0-20,"passed":boolean,"summaryTr":string,"correctedText":"fehlerfreie, natürliche A2-Version des Textes (Deutsch)","errors":[{"wrong":"fehlerhafter Ausdruck","correct":"korrekter Ausdruck","reasonTr":"Türkçe gerekçe"}],"suggestedWords":[{"de":"Goethe-A2-Wort","tr":"Türkçe"}] (genau 5),"tipsTr":[2-3 konkrete Tipps]}`;
  const out = parseJson<WritingEvaluation>(await callGemini(settings, { system: MASTER_SYSTEM_PROMPT, user, json: true, temperature: 0.2 }));
  const s = out.scores || { aufgabe: 0, kohaerenz: 0, wortschatz: 0, formal: 0 };
  const clamp5 = (n: unknown) => Math.max(0, Math.min(5, Number(n) || 0));
  const scores = { aufgabe: clamp5(s.aufgabe), kohaerenz: clamp5(s.kohaerenz), wortschatz: clamp5(s.wortschatz), formal: clamp5(s.formal) };
  const total = scores.aufgabe + scores.kohaerenz + scores.wortschatz + scores.formal;
  return {
    scores,
    total,
    passed: total >= 12,
    summaryTr: out.summaryTr || '',
    correctedText: out.correctedText || '',
    errors: Array.isArray(out.errors) ? out.errors : [],
    suggestedWords: Array.isArray(out.suggestedWords) ? out.suggestedWords.slice(0, 5) : [],
    tipsTr: Array.isArray(out.tipsTr) ? out.tipsTr : [],
  };
}

export async function generateWorksheetAI(
  settings: Settings,
  words: Word[],
  theme: string,
): Promise<{ html: string; answerKey: string }> {
  const list = words.map((w) => `${w.de} = ${w.tr}`).join('\n');
  const user = `Erstelle ein „Tagesarbeitsblatt“ (Goethe A2) im Schreibmaschinen-Stil zum Thema „${theme}“ mit genau diesen 15 Wörtern:
${list}

Gib NUR reines HTML zurück (nur <h2>, <h3>, <p>, <ul>, <ol>, <li>, <br>, <strong>, <em>; KEIN Markdown, KEINE Codeblöcke, kein <html>/<body>).
Regeln:
1. <h3>Teil 1 – Wortschatz und Artikel</h3>: alle 15 Wörter. Bei Nomen den Artikel NIEMALS verraten: "<li>1. [ ] Teppich, -e = __________________</li>". Andere Wörter: "<li>2. abholen = __________________</li>".
2. <h3>Teil 2 – Lückentext</h3>: zuerst ein <p><strong>Wortkasten:</strong> …</p> mit genau den Wörtern, die in die Lücken gehören; dann 8 Sätze mit "______". Keine Übersetzungen, keine Hinweise in den Sätzen.
3. <h3>Teil 3 – Übersetzung</h3>: 5 authentische A2-Sätze mit den Tageswörtern zum Übersetzen ins Türkische.
4. <h3>Teil 4 – Satzbau &amp; Anwendung</h3>: 5 logische Aufgaben (eigener Satz, Gegenteil – sachlich korrekt, z. B. hässlich ↔ schön –, Alltagssituation).
5. <h3>Teil 5 – Lesetext &amp; Vertiefung</h3>: flüssiger Text (180-250 Wörter; E-Mail, Dialog, Aushang oder Blog; NICHT mit „Gestern“ beginnen), dann 4 Verständnisfragen und 3 nützliche Redemittel aus dem Text.
6. Lösungsschlüssel für alle Teile strikt zwischen <!-- CEVAP_ANAHTARI_START --> und <!-- CEVAP_ANAHTARI_END --> (Türkisch/Deutsch).
Arbeitsanweisungen auf Deutsch mit kurzer türkischer Übersetzung in Klammern.`;
  const raw = await callGemini(settings, { system: MASTER_SYSTEM_PROMPT, user, temperature: 0.7 });
  const cleaned = raw.replace(/^```(?:html)?/i, '').replace(/```\s*$/, '').trim();
  const start = cleaned.indexOf('<!-- CEVAP_ANAHTARI_START -->');
  const end = cleaned.indexOf('<!-- CEVAP_ANAHTARI_END -->');
  let html = cleaned;
  let answerKey = '';
  if (start >= 0) {
    answerKey = cleaned.slice(start + '<!-- CEVAP_ANAHTARI_START -->'.length, end > start ? end : undefined);
    html = cleaned.slice(0, start) + (end > start ? cleaned.slice(end + '<!-- CEVAP_ANAHTARI_END -->'.length) : '');
  }
  return { html: sanitizeHtml(html), answerKey: sanitizeHtml(answerKey) };
}

export async function memoryHookAI(settings: Settings, w: Word): Promise<string> {
  const user = `Erstelle für Türkisch sprechende A2-Lernende eine kurze, einprägsame Eselsbrücke (hafıza çengeli) für das deutsche Wort „${headword(w)}“ (${w.tr})${w.type === 'Nomen' && w.article ? ` – besonders für den Artikel „${w.article}“` : ''}. Auf Türkisch, max. 60 Wörter, plus 1 Beispielsatz auf Deutsch mit Übersetzung. Kein Markdown.`;
  return callGemini(settings, { user, temperature: 0.9 });
}

const DROP = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'TEMPLATE', 'NOSCRIPT', 'SVG', 'MATH', 'FORM', 'INPUT', 'BUTTON', 'TEXTAREA', 'SELECT']);
const ALLOWED = new Set(['H2', 'H3', 'H4', 'P', 'UL', 'OL', 'LI', 'BR', 'STRONG', 'EM', 'B', 'I', 'U', 'HR', 'TABLE', 'TR', 'TD', 'TH', 'TBODY', 'THEAD']);

/** Yapay zekadan gelen HTML’i yalnızca izinli etiketlere indirger (öznitelik yok). */
export function sanitizeHtml(html: string): string {
  if (!html.trim()) return '';
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
  const walk = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return (node.textContent || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return '';
    const el = node as Element;
    if (DROP.has(el.tagName)) return '';
    const inner = Array.from(el.childNodes).map(walk).join('');
    if (ALLOWED.has(el.tagName)) {
      const t = el.tagName.toLowerCase();
      return t === 'br' || t === 'hr' ? `<${t}>` : `<${t}>${inner}</${t}>`;
    }
    return inner;
  };
  return Array.from(doc.body.firstChild?.childNodes || []).map(walk).join('');
}
