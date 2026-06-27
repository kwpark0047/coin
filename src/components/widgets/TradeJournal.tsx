import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatKRW, formatNumber } from '@/lib/utils';
import {
  type TradeEntry,
  type EmotionTag,
  EMOTION_TAGS,
  EMOTION_COLORS,
  loadJournal,
  addEntry,
  updateEntry,
  deleteEntry,
  generateId,
} from '@/lib/tradeJournal';
import {
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Search,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Trash2,
  Star,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Emotion chip                                                       */
/* ------------------------------------------------------------------ */
function EmotionChip({ tag, selected, onClick }: { tag: EmotionTag; selected: boolean; onClick: () => void }) {
  const color = EMOTION_COLORS[tag.id] ?? '#6b7280';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all cursor-pointer
        ${selected ? 'text-white ring-2 ring-offset-1' : 'text-gray-600 bg-gray-100 hover:bg-gray-200'}
      `}
      style={selected ? { background: color } : undefined}
    >
      {selected ? null : <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />}
      {tag.label}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Star rating                                                        */
/* ------------------------------------------------------------------ */
function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className="p-0.5 cursor-pointer"
        >
          <Star
            className={`h-4 w-4 ${s <= value ? 'fill-warning text-warning' : 'text-gray-300'}`}
          />
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Entry form                                                         */
/* ------------------------------------------------------------------ */
function EntryForm({ onClose }: { onClose: () => void }) {
  const [symbol, setSymbol] = useState('');
  const [type, setType] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [emotionIds, setEmotionIds] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [linkInput, setLinkInput] = useState('');
  const [newsLinks, setNewsLinks] = useState<string[]>([]);

  const toggleEmotion = (id: string) => {
    setEmotionIds((prev) => (prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]));
  };

  const addLink = () => {
    const trimmed = linkInput.trim();
    if (trimmed && !newsLinks.includes(trimmed)) {
      setNewsLinks([...newsLinks, trimmed]);
      setLinkInput('');
    }
  };

  const removeLink = (url: string) => setNewsLinks(newsLinks.filter((l) => l !== url));

  const handleSubmit = () => {
    if (!symbol.trim() || !amount || !price) return;
    const entry: TradeEntry = {
      id: generateId(),
      symbol: symbol.trim().toUpperCase(),
      type,
      amount: parseFloat(amount),
      price: parseFloat(price),
      timestamp: Date.now(),
      emotionIds,
      reason,
      newsLinks,
    };
    addEntry(entry);
    onClose();
  };

  const valid = symbol.trim() && amount && price;

  return (
    <div className="space-y-4">
      {/* Symbol + Type */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="font-label block mb-1.5">자산 심볼</label>
          <input
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder="BTC"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label className="font-label block mb-1.5">유형</label>
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              type="button"
              onClick={() => setType('buy')}
              className={`px-4 py-2 text-sm font-medium cursor-pointer ${
                type === 'buy' ? 'bg-bull text-white' : 'bg-white text-gray-600'
              }`}
            >
              매수
            </button>
            <button
              type="button"
              onClick={() => setType('sell')}
              className={`px-4 py-2 text-sm font-medium cursor-pointer ${
                type === 'sell' ? 'bg-bear text-white' : 'bg-white text-gray-600'
              }`}
            >
              매도
            </button>
          </div>
        </div>
      </div>

      {/* Amount + Price */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="font-label block mb-1.5">수량</label>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.1"
            type="number"
            step="any"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex-1">
          <label className="font-label block mb-1.5">가격 (KRW)</label>
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="65000000"
            type="number"
            step="any"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Emotion tags */}
      <div>
        <label className="font-label block mb-1.5">감정/행동 태그 (중복 선택 가능)</label>
        <div className="flex flex-wrap gap-1.5">
          {EMOTION_TAGS.map((tag) => (
            <EmotionChip key={tag.id} tag={tag} selected={emotionIds.includes(tag.id)} onClick={() => toggleEmotion(tag.id)} />
          ))}
        </div>
      </div>

      {/* Reason */}
      <div>
        <label className="font-label block mb-1.5">매매 명분</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="투자 아이디어, 참고한 분석 내용, 체결 내역 등을 기록하세요..."
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* News links */}
      <div>
        <label className="font-label block mb-1.5">참고 링크</label>
        <div className="flex gap-2 mb-1.5">
          <input
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addLink()}
            placeholder="뉴스 URL 입력 후 Enter"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <Button variant="outline" onClick={addLink} disabled={!linkInput.trim()} className="h-9 text-xs">
            추가
          </Button>
        </div>
        {newsLinks.length > 0 && (
          <div className="space-y-1">
            {newsLinks.map((url) => (
              <div key={url} className="flex items-center gap-2 text-xs text-muted-foreground">
                <ExternalLink className="h-3 w-3 shrink-0" />
                <span className="truncate flex-1">{url}</span>
                <button type="button" onClick={() => removeLink(url)} className="text-bear hover:text-bear/70 cursor-pointer">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose} className="text-xs">
          취소
        </Button>
        <Button onClick={handleSubmit} disabled={!valid} className="text-xs gap-1">
          <Plus className="h-3.5 w-3.5" />
          기록 저장
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Evaluation section (inline)                                        */
/* ------------------------------------------------------------------ */
function EvaluationSection({ entry, onUpdate }: { entry: TradeEntry; onUpdate: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const ev = entry.evaluation;

  const setEval = (partial: Partial<TradeEntry['evaluation']>) => {
    updateEntry(entry.id, {
      evaluation: { ...(ev ?? { targetPriceReached: null, stopLossRespected: null, planFollowed: null, review: '', rating: 0 }), ...partial },
    });
    onUpdate();
  };

  return (
    <div className="mt-3 border-t pt-3">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-gray-700 cursor-pointer"
      >
        {ev ? '복기 수정' : '복기 등록'}
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {expanded && (
        <div className="mt-3 space-y-3 pl-0">
          {/* O/X checklist */}
          <div className="space-y-2">
            {[
              { key: 'targetPriceReached' as const, label: '목표가 도달' },
              { key: 'stopLossRespected' as const, label: '손절선 준수' },
              { key: 'planFollowed' as const, label: '계획대로 실행' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center gap-3 text-sm">
                <span className="w-24 text-muted-foreground">{label}</span>
                <div className="flex gap-1">
                  {[true, false].map((v) => (
                    <button
                      key={String(v)}
                      type="button"
                      onClick={() => setEval({ [key]: v })}
                      className={`px-3 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                        (ev?.[key]) === v
                          ? v ? 'bg-bull text-white' : 'bg-bear text-white'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {v ? 'O' : 'X'}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Rating */}
          <div className="flex items-center gap-3 text-sm">
            <span className="w-24 text-muted-foreground">자체 평가</span>
            <StarRating value={ev?.rating ?? 0} onChange={(v) => setEval({ rating: v })} />
          </div>

          {/* Review text */}
          <div>
            <textarea
              value={ev?.review ?? ''}
              onChange={(e) => setEval({ review: e.target.value })}
              placeholder="복기 내용을 작성하세요. 무엇이 잘되었고, 무엇을 개선할 수 있을까요?"
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
      )}

      {/* Summary when collapsed */}
      {!expanded && ev && (
        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
          <span>목표가 {ev.targetPriceReached === null ? '미평가' : ev.targetPriceReached ? 'O' : 'X'}</span>
          <span>손절선 {ev.stopLossRespected === null ? '미평가' : ev.stopLossRespected ? 'O' : 'X'}</span>
          {ev.rating > 0 && <StarRating value={ev.rating} onChange={() => {}} />}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main widget                                                        */
/* ------------------------------------------------------------------ */
export function TradeJournal() {
  const [entries, setEntries] = useState<TradeEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'buy' | 'sell'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const refresh = () => setEntries(loadJournal());

  useEffect(() => { refresh(); }, []);

  const filtered = useMemo(() => {
    let result = entries;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((e) => e.symbol.toLowerCase().includes(q) || e.reason.toLowerCase().includes(q));
    }
    if (typeFilter !== 'all') {
      result = result.filter((e) => e.type === typeFilter);
    }
    return result;
  }, [entries, search, typeFilter]);

  const stats = useMemo(() => {
    const buys = entries.filter((e) => e.type === 'buy').length;
    const sells = entries.filter((e) => e.type === 'sell').length;
    const evaluated = entries.filter((e) => e.evaluation?.rating && e.evaluation.rating > 0);
    const avgRating = evaluated.length
      ? evaluated.reduce((sum, e) => sum + (e.evaluation?.rating ?? 0), 0) / evaluated.length
      : 0;
    const emotionCount: Record<string, number> = {};
    entries.forEach((e) => e.emotionIds.forEach((id) => { emotionCount[id] = (emotionCount[id] ?? 0) + 1; }));
    const topEmotion = Object.entries(emotionCount).sort((a, b) => b[1] - a[1])[0];
    return { buys, sells, total: entries.length, avgRating, topEmotion };
  }, [entries]);

  return (
    <Card className="glass p-4 md:p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display text-sm font-semibold">매매 일지</h3>
          <p className="font-label mt-0.5">감정과 명분을 기록하는 투자 다이어리</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-1.5 h-8 text-xs px-3">
          <Plus className="h-3.5 w-3.5" />
          {showForm ? '닫기' : '새 기록'}
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-5 p-4 bg-gray-50 rounded-xl border">
          <EntryForm onClose={() => { setShowForm(false); refresh(); }} />
        </div>
      )}

      {/* Stats */}
      {entries.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-4 text-xs">
          <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-3 py-1.5">
            <span className="text-muted-foreground">전체</span>
            <span className="font-display font-semibold">{stats.total}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-bull/10 rounded-lg px-3 py-1.5">
            <TrendingUp className="h-3 w-3 text-bull" />
            <span className="text-muted-foreground">매수</span>
            <span className="font-display font-semibold text-bull">{stats.buys}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-bear/10 rounded-lg px-3 py-1.5">
            <TrendingDown className="h-3 w-3 text-bear" />
            <span className="text-muted-foreground">매도</span>
            <span className="font-display font-semibold text-bear">{stats.sells}</span>
          </div>
          {stats.avgRating > 0 && (
            <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-3 py-1.5">
              <Star className="h-3 w-3 text-warning" />
              <span className="text-muted-foreground">평점</span>
              <span className="font-display font-semibold">{stats.avgRating.toFixed(1)}</span>
            </div>
          )}
          {stats.topEmotion && (
            <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: EMOTION_COLORS[stats.topEmotion[0]] ?? '#6b7280' }} />
              <span className="text-muted-foreground">최다 태그</span>
              <span className="font-medium">{stats.topEmotion[1]}회</span>
            </div>
          )}
        </div>
      )}

      {/* Filter */}
      {entries.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className="relative flex-1 min-w-[140px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="심볼 또는 내용 검색"
              className="w-full rounded-lg border border-gray-300 pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            {(['all', 'buy', 'sell'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setTypeFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium cursor-pointer ${
                  typeFilter === f ? (f === 'buy' ? 'bg-bull text-white' : f === 'sell' ? 'bg-bear text-white' : 'bg-primary text-white') : 'bg-white text-gray-600'
                }`}
              >
                {f === 'all' ? '전체' : f === 'buy' ? '매수' : '매도'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {entries.length === 0 && !showForm && (
        <div className="py-8 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            아직 기록된 매매 일지가 없습니다.
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            거래할 때마다 감정과 명분을 기록하면 더 나은 투자자가 될 수 있습니다.
          </p>
          <Button onClick={() => setShowForm(true)} variant="outline" className="gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" />
            첫 매매 기록하기
          </Button>
        </div>
      )}

      {/* Entry list */}
      {filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map((entry) => {
            const expanded = expandedId === entry.id;
            return (
              <div key={entry.id} className="rounded-xl border bg-white p-3 md:p-4">
                <div className="flex items-start justify-between gap-3">
                  {/* Left: main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-display text-base font-semibold">{entry.symbol}</span>
                      <Badge variant="outline" className={entry.type === 'buy' ? 'text-bull border-bull/30 bg-bull/5' : 'text-bear border-bear/30 bg-bear/5'}>
                        {entry.type === 'buy' ? '매수' : '매도'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm font-mono text-muted-foreground">
                      <span>{formatNumber(entry.amount)}개</span>
                      <span>@ {formatKRW(entry.price)}</span>
                      <span className="font-semibold text-gray-700">= {formatKRW(entry.amount * entry.price)}</span>
                    </div>
                    {/* Emotion chips in entry */}
                    {entry.emotionIds.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {entry.emotionIds.map((id) => {
                          const tag = EMOTION_TAGS.find((t) => t.id === id);
                          if (!tag) return null;
                          return (
                            <span
                              key={id}
                              className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                              style={{ background: EMOTION_COLORS[id] ?? '#6b7280' }}
                            >
                              {tag.label}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Right: actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {entry.evaluation && entry.evaluation.rating > 0 && (
                      <div className="flex items-center gap-0.5 mr-1">
                        {Array.from({ length: entry.evaluation.rating }).map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-warning text-warning" />
                        ))}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setExpandedId(expanded ? null : entry.id)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer"
                      aria-label={expanded ? '상세 정보 접기' : '상세 정보 펼치기'}
                    >
                      {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => { deleteEntry(entry.id); refresh(); }}
                      className="p-1.5 rounded-lg hover:bg-red-50 cursor-pointer"
                      aria-label="매매 기록 삭제"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-bear" />
                    </button>
                  </div>
                </div>

                {/* Expanded detail */}
                {expanded && (
                  <div className="mt-3 pt-3 border-t space-y-3">
                    {/* Reason */}
                    {entry.reason && (
                      <div>
                        <span className="font-label block mb-1">매매 명분</span>
                        <p className="text-sm text-gray-700 leading-relaxed">{entry.reason}</p>
                      </div>
                    )}

                    {/* News links */}
                    {entry.newsLinks.length > 0 && (
                      <div>
                        <span className="font-label block mb-1">참고 링크</span>
                        <div className="space-y-1">
                          {entry.newsLinks.map((url) => (
                            <a
                              key={url}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" />
                              {url.length > 60 ? url.slice(0, 60) + '...' : url}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Evaluation */}
                    <EvaluationSection entry={entry} onUpdate={refresh} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
