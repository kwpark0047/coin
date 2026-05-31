interface JournalEntry {
  id: string;
  timestamp: number;
  type: 'trade' | 'sync' | 'error';
  message: string;
  data?: Record<string, unknown>;
}

const entries: JournalEntry[] = [];

export function logToJournal(type: JournalEntry['type'], message: string, data?: Record<string, unknown>) {
  entries.push({
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    type,
    message,
    data,
  });
  if (entries.length > 1000) entries.shift();
}

export function getJournal(limit = 50): JournalEntry[] {
  return entries.slice(-limit);
}
