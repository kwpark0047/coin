export interface EmotionTag {
  id: string;
  label: string;
  category: '감정' | '행동' | '평가';
}

export const EMOTION_TAGS: EmotionTag[] = [
  { id: 'fomo', label: 'FOMO 추격매수', category: '감정' },
  { id: 'fear', label: '공포 패닉셀', category: '감정' },
  { id: 'greed', label: '탐욕 과배팅', category: '감정' },
  { id: 'anger', label: '분노 복수매매', category: '감정' },
  { id: 'regret', label: '후회 손절', category: '감정' },
  { id: 'principle', label: '원칙 분할매수', category: '행동' },
  { id: 'conviction', label: '확신 추가매수', category: '행동' },
  { id: 'confidence', label: '자신감 홀딩', category: '행동' },
  { id: 'analysis', label: '분석 기반 매도', category: '행동' },
  { id: 'plan', label: '계획적 익절', category: '행동' },
];

export const EMOTION_COLORS: Record<string, string> = {
  fomo: '#ef4444',
  fear: '#f59e0b',
  greed: '#dc2626',
  anger: '#991b1b',
  regret: '#ea580c',
  principle: '#22c55e',
  conviction: '#3b82f6',
  confidence: '#06b6d4',
  analysis: '#8b5cf6',
  plan: '#10b981',
};

export interface TradeEvaluation {
  targetPriceReached: boolean | null;
  stopLossRespected: boolean | null;
  planFollowed: boolean | null;
  review: string;
  rating: number; // 1-5
}

export interface TradeEntry {
  id: string;
  symbol: string;
  type: 'buy' | 'sell';
  amount: number;
  price: number;
  timestamp: number;
  emotionIds: string[];
  reason: string;
  newsLinks: string[];
  evaluation?: TradeEvaluation;
}

const STORAGE_KEY = 'wemarket-trade-journal';

export function loadJournal(): TradeEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) { console.warn('Failed to load journal:', err); }
  return [];
}

export function saveJournal(entries: TradeEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function addEntry(entry: TradeEntry): TradeEntry[] {
  const entries = loadJournal();
  entries.unshift(entry);
  saveJournal(entries);
  return entries;
}

export function updateEntry(id: string, updates: Partial<TradeEntry>): TradeEntry[] {
  const entries = loadJournal();
  const idx = entries.findIndex(e => e.id === id);
  if (idx === -1) return entries;
  entries[idx] = { ...entries[idx], ...updates };
  saveJournal(entries);
  return entries;
}

export function deleteEntry(id: string): TradeEntry[] {
  const entries = loadJournal().filter(e => e.id !== id);
  saveJournal(entries);
  return entries;
}

export function getEmotionTag(id: string): EmotionTag | undefined {
  return EMOTION_TAGS.find(t => t.id === id);
}

export function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
