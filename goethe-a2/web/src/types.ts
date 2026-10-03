export type WordType =
  | 'Nomen'
  | 'Verb'
  | 'Adjektiv'
  | 'Präposition'
  | 'Konnektor'
  | 'Adverb'
  | 'Redewendung'
  | 'Pronomen'
  | 'Fragewort'
  | 'Andere';

export interface Word {
  id: string;
  de: string;
  lemma: string;
  tr: string;
  type: WordType;
  theme: string;
  examples: string[];
  source: 'A2' | 'Gruppe' | 'Eigene';
  group?: string;
  article?: string;
  pluralCode?: string;
  plural?: string;
  sgOnly?: boolean;
  plOnly?: boolean;
  present3?: string;
  praeteritum?: string;
  perfektAux?: string;
  partizip?: string;
  reflexive?: boolean;
}

export type QuestionType =
  | 'multiple_choice'
  | 'cloze'
  | 'reading'
  | 'sentence_build'
  | 'error_correction'
  | 'dialogue_completion';

export type QuestionCategory =
  | 'error_detection'
  | 'prepositions_kasus'
  | 'grammar'
  | 'dialogue'
  | 'reading'
  | 'sentence_syntax'
  | 'vocabulary';

export type Difficulty = 'A2.1' | 'A2.2' | 'A2+' | 'B1-Prep';

export interface Question {
  id: string;
  type: QuestionType;
  category: QuestionCategory;
  difficulty?: Difficulty;
  readingText?: string;
  readingTitle?: string;
  question: string;
  questionTr?: string;
  options?: string[];
  correctAnswer: string;
  acceptedAnswers?: string[];
  explanation: string;
  targetWord?: string;
  wordId?: string;
  errorTrap?: string;
  targetRule?: string;
  sentenceParts?: string[];
  isErrorPriority?: boolean;
  errorRateContext?: number;
  source?: 'bank' | 'gen' | 'ai';
}

export interface UserAnswerRecord {
  questionId: string;
  question: Question;
  userAnswer: string;
  isCorrect: boolean;
  timeMs: number;
}

export interface CategoryScore {
  name: string;
  category: QuestionCategory;
  correct: number;
  total: number;
  percentage: number;
  ratingLabel: string;
}

export interface DetailedEvaluation {
  cefrLevel: string;
  cefrStatusBadge: string;
  overallAssessmentTr: string;
  categoryBreakdown: CategoryScore[];
  strengths: string[];
  weaknesses: string[];
  actionableTips: string[];
}

export interface TestSummary {
  id: string;
  title: string;
  theme: string;
  date: string;
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  passed: boolean;
  timeSpentSeconds: number;
  records: UserAnswerRecord[];
  evaluation?: DetailedEvaluation;
  source: 'local' | 'ai';
}

export interface WordProgress {
  box: number; // 0 = yeni, 1..6 Leitner kutusu
  due: number; // epoch ms
  seen: number;
  correct: number;
  wrong: number;
  last: number;
}

export interface RuleProgress {
  correct: number;
  wrong: number;
  last: number;
}

export interface MistakeEntry {
  questionId: string;
  question: Question;
  userAnswer: string;
  count: number;
  last: number;
  fixedStreak: number;
}

export interface WritingEvaluation {
  scores: { aufgabe: number; kohaerenz: number; wortschatz: number; formal: number };
  total: number;
  passed: boolean;
  summaryTr: string;
  correctedText: string;
  errors: { wrong: string; correct: string; reasonTr: string }[];
  suggestedWords: { de: string; tr: string }[];
  tipsTr: string[];
}

export interface WritingAttempt {
  id: string;
  taskId: string;
  date: string;
  text: string;
  wordCount: number;
  evaluation?: WritingEvaluation;
}

export interface Settings {
  apiKey: string;
  model: string;
  ttsRate: number;
  dailyGoal: number;
  examDate: string;
  theme: 'system' | 'light' | 'dark';
  instantFeedback: boolean;
  showTranslations: boolean;
  newCardsPerDay: number;
  userName: string;
}

export interface DayStat {
  cards: number;
  questions: number;
  correct: number;
}

export interface WordNote {
  note?: string;
  hook?: string;
}

export interface AppState {
  version: number;
  words: Record<string, WordProgress>;
  rules: Record<string, RuleProgress>;
  bookmarks: string[];
  customWords: Word[];
  notes: Record<string, WordNote>;
  mistakes: MistakeEntry[];
  tests: TestSummary[];
  writings: WritingAttempt[];
  worksheetQueue: string[];
  daily: Record<string, DayStat>;
  settings: Settings;
  lastWorksheet?: { html: string; answerKey: string; date: string; source: 'local' | 'ai' };
}
