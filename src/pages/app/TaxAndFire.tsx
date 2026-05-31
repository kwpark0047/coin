import { useEffect, useMemo, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  LineChart,
  Line,
  Area,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { calculateTaxes, DEFAULT_TAX_LOTS, addLot, removeLot, exportHoldingsCSV, POPULAR_STOCKS } from '@/lib/taxHarvesting';
import type { TaxLot } from '@/lib/taxHarvesting';
import {
  simulateDrip,
  simulatePostFireDrawdown,
  runMonteCarlo,
  runSensitivityAnalysis,
  exportProjectionCSV,
  DEFAULT_DRIP_INPUT,
} from '@/lib/dripSimulator';
import type { DripInput, DripResult, DrawdownResult, MonteCarloResult, SensitivityItem } from '@/lib/dripSimulator';
import { formatKRW } from '@/lib/utils';
import {
  Calculator,
  PiggyBank,
  TrendingUp,
  RefreshCw,
  DollarSign,
  Target,
  Plus,
  Trash2,
  Download,
  BarChart3,
  LineChart as LineChartIcon,
  AlertTriangle,
  ShieldCheck,
  Sliders,
} from 'lucide-react';

type Tab = 'tax' | 'fire';

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function useAnimatedNumber(target: number, duration = 600): number {
  const [displayValue, setDisplayValue] = useState(target);
  const prevRef = useRef(target);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const from = prevRef.current;
    prevRef.current = target;
    if (from === target) return;

    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      setDisplayValue(Math.round(from + (target - from) * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return displayValue;
}

function AnimatedKRW({ value, className }: { value: number; className?: string }) {
  const animated = useAnimatedNumber(value);
  return <span className={className}>{formatKRW(animated)}</span>;
}



const LS_LOTS = 'wemarket-tax-lots';
const LS_DRIP = 'wemarket-tax-drip-input';

function loadLots(): TaxLot[] | null {
  try {
    const raw = localStorage.getItem(LS_LOTS);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed as TaxLot[];
  } catch (err) {
    console.warn('Failed to load tax lots:', err);
    return null;
  }
}

function saveLots(lots: TaxLot[]) {
  try {
    localStorage.setItem(LS_LOTS, JSON.stringify(lots));
  } catch (err) {
    console.warn('Failed to save tax lots:', err);
  }
}

function loadDripInput(): DripInput | null {
  try {
    const raw = localStorage.getItem(LS_DRIP);
    if (!raw) return null;
    return JSON.parse(raw) as DripInput;
  } catch (err) {
    console.warn('Failed to load drip input:', err);
    return null;
  }
}

function saveDripInput(input: DripInput) {
  try {
    localStorage.setItem(LS_DRIP, JSON.stringify(input));
  } catch (err) {
    console.warn('Failed to save drip input:', err);
  }
}


function TaxCalculator() {
  const [lots, setLots] = useState<TaxLot[]>(() => {
    const saved = loadLots();
    return saved && saved.length > 0 ? saved : DEFAULT_TAX_LOTS.map((l) => ({ ...l }));
  });
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<TaxLot | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  const result = useMemo(() => calculateTaxes(lots), [lots]);

  useEffect(() => { saveLots(lots); }, [lots]);

  const startEdit = (idx: number) => {
    setEditingIdx(idx);
    setEditForm({ ...lots[idx] });
  };

  const saveEdit = () => {
    if (editingIdx == null || !editForm) return;
    const next = [...lots];
    next[editingIdx] = editForm;
    setLots(next);
    setEditingIdx(null);
    setEditForm(null);
  };

  const cancelEdit = () => {
    setEditingIdx(null);
    setEditForm(null);
  };

  const handleDelete = (idx: number) => {
    setLots((prev) => removeLot(prev, idx));
  };

  const handleAdd = (symbol?: string) => {
    const lot: Partial<TaxLot> = symbol
      ? { symbol, shares: 1, avgPurchasePriceKRW: 100000, currentPriceKRW: 100000 }
      : { symbol: '', shares: 0, avgPurchasePriceKRW: 0, currentPriceKRW: 0 };
    setLots((prev) => addLot(prev, lot));
    setShowPicker(false);
  };

  const handleExportCSV = () => {
    const csv = exportHoldingsCSV(lots);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tax-holdings.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass p-4">
          <div className="font-label text-xs">총 양도차익</div>
          <AnimatedKRW value={result.totalGainKRW} className={`mt-1 font-display text-lg font-semibold ${result.totalGainKRW > 0 ? 'text-bull' : ''}`} />
        </Card>
        <Card className="glass p-4">
          <div className="font-label text-xs">총 양도차손</div>
          <AnimatedKRW value={result.totalLossKRW} className="mt-1 font-display text-lg font-semibold text-bear" />
        </Card>
        <Card className="glass p-4">
          <div className="font-label text-xs">과세 대상 금액</div>
          <AnimatedKRW value={result.taxableGainKRW} className="mt-1 font-display text-lg font-semibold" />
          <div className="text-[10px] text-muted-foreground mt-0.5">
            연 {formatKRW(result.deductionKRW)} 공제 후
          </div>
        </Card>
        <Card className="glass p-4">
          <div className="font-label text-xs">예상 세금 (22%)</div>
          <AnimatedKRW value={result.taxDueKRW} className={`mt-1 font-display text-lg font-semibold ${result.taxDueKRW > 0 ? 'text-bear' : 'text-bull'}`} />
          <div className="text-[10px] text-muted-foreground mt-0.5">
            실효세율 {(result.effectiveRate * 100).toFixed(1)}%
          </div>
        </Card>
        <Card className="glass p-4">
          <div className="font-label text-xs">매수 총액</div>
          <AnimatedKRW value={result.totalCostBasisKRW} className="mt-1 font-display text-lg font-semibold" />
        </Card>
        <Card className="glass p-4">
          <div className="font-label text-xs">평가 금액</div>
          <AnimatedKRW value={result.totalMarketValueKRW} className="mt-1 font-display text-lg font-semibold" />
        </Card>
        <Card className="glass p-4">
          <div className="font-label text-xs">미실현 손익</div>
          <AnimatedKRW value={result.unrealizedGainKRW} className={`mt-1 font-display text-lg font-semibold ${result.unrealizedGainKRW >= 0 ? 'text-bull' : 'text-bear'}`} />
        </Card>
        <Card className="glass p-4">
          <div className="font-label text-xs">기본공제 잔여</div>
          <AnimatedKRW value={result.remainingDeductionKRW} className="mt-1 font-display text-lg font-semibold" />
          <div className="text-[10px] text-muted-foreground mt-0.5">
            {result.unusedLossKRW > 0 ? `미상계 손실 ${formatKRW(result.unusedLossKRW)}` : ''}
          </div>
        </Card>
      </div>

      <Card className="glass p-4 md:p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-primary" />
            <h3 className="font-display text-sm font-semibold">보유 종목 현황</h3>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="h-7 text-xs px-2" onClick={() => setShowPicker(!showPicker)}>
              <Plus className="h-3 w-3 mr-1" /> 종목 추가
            </Button>
            <Button variant="outline" className="h-7 text-xs px-2" onClick={handleExportCSV}>
              <Download className="h-3 w-3 mr-1" /> CSV
            </Button>
          </div>
        </div>

        {showPicker && (
          <div className="mb-4 p-3 rounded-lg border bg-muted/30">
            <div className="font-label text-xs mb-2">자주 거래되는 종목</div>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_STOCKS.map((s) => (
                <button
                  key={s.symbol}
                  type="button"
                  onClick={() => handleAdd(s.symbol)}
                  className="inline-flex items-center gap-1 rounded-md border bg-white px-2.5 py-1 text-xs font-medium hover:bg-primary/5 hover:border-primary/30 transition-colors"
                >
                  {s.symbol} <span className="text-muted-foreground">{s.name}</span>
                </button>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <Button variant="ghost" className="h-7 text-xs" onClick={() => handleAdd()}>
                직접 입력
              </Button>
              <Button variant="ghost" className="h-7 text-xs" onClick={() => setShowPicker(false)}>
                닫기
              </Button>
            </div>
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>종목</TableHead>
              <TableHead className="text-right">보유량</TableHead>
              <TableHead className="text-right">평균단가</TableHead>
              <TableHead className="text-right">현재가</TableHead>
              <TableHead className="text-right">매수총액</TableHead>
              <TableHead className="text-right">평가손익</TableHead>
              <TableHead className="text-right">수익률</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {lots.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-8">
                  등록된 종목이 없습니다. '종목 추가' 버튼을 눌러 주식을 추가하세요.
                </TableCell>
              </TableRow>
            )}
            {lots.map((lot, idx) => {
              const isEditing = editingIdx === idx;
              const h = result.holdings[idx];
              if (isEditing && editForm) {
                return (
                  <TableRow key={idx}>
                    <TableCell />
                    <TableCell>
                      <input
                        className="w-20 rounded border border-gray-200 px-2 py-1 text-xs"
                        value={editForm.symbol}
                        onChange={(e) => setEditForm({ ...editForm, symbol: e.target.value.toUpperCase() })}
                      />
                    </TableCell>
                    <TableCell>
                      <input
                        type="number"
                        className="w-20 rounded border border-gray-200 px-2 py-1 text-xs text-right"
                        value={editForm.shares}
                        onChange={(e) => setEditForm({ ...editForm, shares: Math.max(0, Number(e.target.value)) })}
                      />
                    </TableCell>
                    <TableCell>
                      <input
                        type="number"
                        className="w-24 rounded border border-gray-200 px-2 py-1 text-xs text-right"
                        value={editForm.avgPurchasePriceKRW}
                        onChange={(e) => setEditForm({ ...editForm, avgPurchasePriceKRW: Math.max(0, Number(e.target.value)) })}
                      />
                    </TableCell>
                    <TableCell>
                      <input
                        type="number"
                        className="w-24 rounded border border-gray-200 px-2 py-1 text-xs text-right"
                        value={editForm.currentPriceKRW}
                        onChange={(e) => setEditForm({ ...editForm, currentPriceKRW: Math.max(0, Number(e.target.value)) })}
                      />
                    </TableCell>
                    <TableCell colSpan={4}>
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={cancelEdit} className="h-7 text-xs px-2">취소</Button>
                        <Button onClick={saveEdit} className="h-7 text-xs px-2">저장</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              }
              return (
                <TableRow key={idx}>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => handleDelete(idx)}
                      className="text-muted-foreground hover:text-bear transition-colors"
                      title="삭제"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </TableCell>
                  <TableCell className="font-mono text-sm font-medium">{lot.symbol}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{lot.shares}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{formatKRW(lot.avgPurchasePriceKRW)}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{formatKRW(lot.currentPriceKRW)}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-muted-foreground">{formatKRW(lot.shares * lot.avgPurchasePriceKRW)}</TableCell>
                  <TableCell className={`text-right font-mono tabular-nums ${h?.gainKRW >= 0 ? 'text-bull' : 'text-bear'}`}>
                    {h ? `${h.gainKRW >= 0 ? '+' : ''}${formatKRW(h.gainKRW)}` : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {h && (
                      <Badge variant="default" className={`text-[11px] ${h.isLoss ? 'bg-red-100 text-red-700' : ''}`}>
                        {h.gainPercent >= 0 ? '+' : ''}{h.gainPercent.toFixed(1)}%
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => startEdit(idx)}
                      className="text-xs text-primary hover:text-primary/80"
                    >
                      수정
                    </button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {lots.length > 1 && (
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => setLots(DEFAULT_TAX_LOTS.map((l) => ({ ...l })))}
              className="text-[11px] text-muted-foreground hover:text-foreground underline"
            >
              기본 샘플로 초기화
            </button>
          </div>
        )}
      </Card>

      {result.netGainKRW > 0 && result.suggestions.length > 0 && (
        <Card className="glass p-4 md:p-5 border-primary/20">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-display text-sm font-semibold mb-1">Tax-loss Harvesting 제안</h3>
              <p className="text-xs text-muted-foreground mb-3">
                현재 손실 중인 종목을 매도하여 양도차익을 상계하면 세금을 절감할 수 있습니다.
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>종목</TableHead>
                    <TableHead className="text-right">추천 매도량</TableHead>
                    <TableHead className="text-right">예상 매도대금</TableHead>
                    <TableHead className="text-right">실현 손실</TableHead>
                    <TableHead className="text-right">상계 효과</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.suggestions.map((s, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-mono font-medium">{s.symbol}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">{s.sharesToSell}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">{formatKRW(s.proceedsKRW)}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-bear">{formatKRW(s.lossRealizedKRW)}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-bull">{formatKRW(s.gainOffsetKRW)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {result.canZeroOut && (
                <div className="mt-3 flex items-center gap-2 text-sm text-bull font-medium">
                  <ShieldCheck className="h-4 w-4" />
                  위 매도로 양도소득세를 0원으로 만들 수 있습니다.
                </div>
              )}
              {result.netGainKRW > result.deductionKRW && result.unusedLossKRW > 0 && (
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <AlertTriangle className="h-3 w-3" />
                  당해 상계하지 못한 손실 {formatKRW(result.unusedLossKRW)} — 해외주식 양도차손은 이월공제가 불가능합니다.
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}


function FieldInput({ label, value, step, onChange, suffix }: { label: string; value: number; step: number; onChange: (v: number) => void; suffix?: string }) {
  return (
    <div>
      <label className="font-label block mb-1">{label}</label>
      <div className="relative">
        <input
          type="number"
          step={step}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function RangeSlider({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="font-label block mb-1">{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        className="w-full"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div className="text-xs text-muted-foreground text-right mt-0.5">{value}년</div>
    </div>
  );
}


type FireTab = 'simulation' | 'montecarlo' | 'sensitivity' | 'drawdown';


function MonteCarloView({ result }: { result: MonteCarloResult }) {
  const chartData = result.yearlyPercentiles.map((p) => ({
    year: `${p.year}년`,
    p5: p.p5,
    median: p.median,
    p95: p.p95,
  }));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass p-4">
          <div className="font-label text-xs">Monte Carlo 성공률</div>
          <div className="mt-1 font-display text-2xl font-semibold text-bull">
            {result.successRate.toFixed(1)}%
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            {result.simulations}회 시뮬레이션 기준
          </div>
        </Card>
        <Card className="glass p-4">
          <div className="font-label text-xs">중간값 최종 포트폴리오</div>
          <div className="mt-1 font-display text-lg font-semibold">
            {formatKRW(result.medianFinalValueKRW)}
          </div>
        </Card>
        <Card className="glass p-4">
          <div className="font-label text-xs">하위 5%</div>
          <div className="mt-1 font-display text-lg font-semibold text-bear">
            {formatKRW(result.percentile5FinalValueKRW)}
          </div>
        </Card>
        <Card className="glass p-4">
          <div className="font-label text-xs">상위 5%</div>
          <div className="mt-1 font-display text-lg font-semibold text-bull">
            {formatKRW(result.percentile95FinalValueKRW)}
          </div>
        </Card>
      </div>

      <Card className="glass p-4 md:p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h3 className="font-display text-sm font-semibold">확률 분포 (Monte Carlo)</h3>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" fontSize={11} />
              <YAxis fontSize={11} tickFormatter={(v: number) => `${Math.round(v / 10000)}만`} />
              <Tooltip
                formatter={(value: unknown) => [formatKRW(Number(value)), '']}
              />
              <Legend />
              <Area type="monotone" dataKey="p95" fill="#22c55e" fillOpacity={0.15} stroke="none" />
              <Area type="monotone" dataKey="p5" fill="#22c55e" fillOpacity={0.15} stroke="none" />
              <Line type="monotone" dataKey="median" stroke="#22c55e" strokeWidth={2} dot={false} name="중간값" />
              <Line type="monotone" dataKey="p95" stroke="#22c55e" strokeWidth={1} strokeDasharray="4 4" dot={false} name="상위 5%" />
              <Line type="monotone" dataKey="p5" stroke="#22c55e" strokeWidth={1} strokeDasharray="4 4" dot={false} name="하위 5%" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          연 수익률 변동성 15% (표준편차) 기준 {result.simulations}회 무작위 시뮬레이션 결과입니다.
          초록 띠는 하위 5%~상위 5% 구간을 나타냅니다.
        </p>
      </Card>
    </div>
  );
}


function SensitivityView({ items }: { items: SensitivityItem[] }) {
  return (
    <Card className="glass p-4 md:p-5">
      <div className="flex items-center gap-2 mb-4">
        <Sliders className="h-4 w-4 text-primary" />
        <h3 className="font-display text-sm font-semibold">민감도 분석</h3>
        <span className="text-xs text-muted-foreground ml-1">각 변수 ±20% 변화가 FIRE 달성에 미치는 영향</span>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>순위</TableHead>
              <TableHead>변수</TableHead>
              <TableHead className="text-right">-20%</TableHead>
              <TableHead className="text-right">기준</TableHead>
              <TableHead className="text-right">+20%</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.variable}>
                <TableCell className="text-muted-foreground text-xs">#{item.impactRank}</TableCell>
                <TableCell className="font-medium">{item.label}</TableCell>
                <TableCell className={`text-right font-mono tabular-nums text-xs ${item.minus20Years !== item.baseYears ? 'text-bear' : ''}`}>
                  {item.minus20Years}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums text-xs font-semibold">{item.baseYears}</TableCell>
                <TableCell className={`text-right font-mono tabular-nums text-xs ${item.plus20Years !== item.baseYears ? 'text-bull' : ''}`}>
                  {item.plus20Years}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground mt-3">
        각 변수를 20% 증가/감소시켰을 때 재투자 시나리오의 FIRE 달성년도 변화를 보여줍니다.
        영향이 큰 변수일수록 상위에 표시됩니다.
      </p>
    </Card>
  );
}


function DrawdownView({ result }: { result: DrawdownResult | null }) {
  if (!result) {
    return (
      <Card className="glass p-8 text-center">
        <div className="text-sm text-muted-foreground">
          먼저 '시뮬레이션' 탭에서 FIRE 목표를 설정한 후 소진 시뮬레이션을 실행하세요.
        </div>
      </Card>
    );
  }

  const chartData = result.years.map((y) => ({
    year: `${y.year}년`,
    portfolio: y.portfolioValueKRW,
    withdrawal: y.withdrawalKRW,
  }));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass p-4">
          <div className="font-label text-xs">초기 포트폴리오</div>
          <div className="mt-1 font-display text-lg font-semibold">{formatKRW(result.initialPortfolioKRW)}</div>
        </Card>
        <Card className="glass p-4">
          <div className="font-label text-xs">인출율</div>
          <div className="mt-1 font-display text-lg font-semibold">{(result.withdrawalRate * 100).toFixed(1)}%</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">초기 포트폴리오 대비</div>
        </Card>
        <Card className="glass p-4">
          <div className="font-label text-xs">생존 기간</div>
          <div className="mt-1 font-display text-lg font-semibold">{result.survivedYears}년</div>
        </Card>
        <Card className="glass p-4">
          <div className="font-label text-xs">결과</div>
          <div className={`mt-1 font-display text-lg font-semibold ${result.success ? 'text-bull' : 'text-bear'}`}>
            {result.success ? '자금 유지' : '고갈'}
          </div>
        </Card>
      </div>

      <Card className="glass p-4 md:p-5">
        <div className="flex items-center gap-2 mb-4">
          <LineChartIcon className="h-4 w-4 text-primary" />
          <h3 className="font-display text-sm font-semibold">은퇴 후 포트폴리오 소진 시뮬레이션</h3>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" fontSize={11} />
              <YAxis fontSize={11} tickFormatter={(v: number) => `${Math.round(v / 10000)}만`} />
              <Tooltip
                formatter={(value: unknown) => [formatKRW(Number(value)), '']}
              />
              <Legend />
              <Line type="monotone" dataKey="portfolio" stroke="#22c55e" strokeWidth={2} dot={false} name="포트폴리오" />
              <Line type="monotone" dataKey="withdrawal" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="연 인출액" strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}


interface SavedScenario {
  name: string;
  input: DripInput;
}

const LS_SCENARIOS = 'wemarket-tax-scenarios';

function loadScenarios(): SavedScenario[] {
  try {
    const raw = localStorage.getItem(LS_SCENARIOS);
    return raw ? JSON.parse(raw) : [];
  } catch (err) { console.warn('Failed to load scenarios:', err); return []; }
}

function saveScenarios(scenarios: SavedScenario[]) {
  try {
    localStorage.setItem(LS_SCENARIOS, JSON.stringify(scenarios));
  } catch (err) {
    console.warn('Failed to save scenarios:', err);
  }
}

function ScenarioManager({
  currentInput,
  onLoad,
  result,
}: {
  currentInput: DripInput;
  onLoad: (input: DripInput) => void;
  result: DripResult;
}) {
  const [scenarios, setScenarios] = useState<SavedScenario[]>(loadScenarios);
  const [showSave, setShowSave] = useState(false);
  const [name, setName] = useState('');

  const handleSave = () => {
    if (!name.trim()) return;
    const updated = [...scenarios, { name: name.trim(), input: { ...currentInput } }];
    setScenarios(updated);
    saveScenarios(updated);
    setName('');
    setShowSave(false);
  };

  const handleLoad = (scenario: SavedScenario) => {
    onLoad(scenario.input);
  };

  const handleDelete = (idx: number) => {
    const updated = scenarios.filter((_, i) => i !== idx);
    setScenarios(updated);
    saveScenarios(updated);
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <Button variant="outline" className="h-7 text-xs px-2" onClick={() => setShowSave(!showSave)}>
          <Plus className="h-3 w-3 mr-1" /> 시나리오 저장
        </Button>
        <Button
          variant="outline"
          className="h-7 text-xs px-2"
          onClick={() => {
            const csv = exportProjectionCSV(result.projections);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'fire-projection.csv';
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          <Download className="h-3 w-3 mr-1" /> CSV
        </Button>
      </div>

      {showSave && (
        <div className="mt-2 flex gap-2">
          <input
            className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs outline-none focus:border-primary"
            placeholder="시나리오 이름 (예: 보수적, 공격적)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          <Button className="h-7 text-xs px-3" onClick={handleSave}>저장</Button>
        </div>
      )}

      {scenarios.length > 0 && (
        <div className="mt-2 space-y-1">
          {scenarios.map((s, idx) => (
            <div key={idx} className="flex items-center justify-between rounded-md border bg-white px-3 py-1.5">
              <span className="text-xs font-medium">{s.name}</span>
              <div className="flex gap-2">
                <button type="button" onClick={() => handleLoad(s)} className="text-[11px] text-primary hover:underline">불러오기</button>
                <button type="button" onClick={() => handleDelete(idx)} className="text-[11px] text-muted-foreground hover:text-bear">삭제</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


function FireSimulator() {
  const [input, setInput] = useState<DripInput>(() => {
    const saved = loadDripInput();
    return saved ?? { ...DEFAULT_DRIP_INPUT };
  });
  const [fireTab, setFireTab] = useState<FireTab>('simulation');
  const [drawdownReady, setDrawdownReady] = useState(false);

  const result = useMemo(() => simulateDrip(input), [input]);
  const monteCarlo = useMemo(() => runMonteCarlo(input, 500), [input]);
  const sensitivityItems = useMemo(() => runSensitivityAnalysis(input), [input]);

  useEffect(() => { saveDripInput(input); }, [input]);

  const [drawdownResult, setDrawdownResult] = useState<DrawdownResult | null>(null);

  const runDrawdown = () => {
    const fireTarget = input.monthlyExpensesKRW * 12 * 25;
    const estimatedPortfolioAtFire = Math.max(
      fireTarget,
      result.summary.reinvest.finalValueKRW,
    );
    const dd = simulatePostFireDrawdown(
      estimatedPortfolioAtFire,
      input.monthlyExpensesKRW,
      input.annualReturnRate * 0.7,
      input.annualDividendYield,
      input.dividendTaxRate,
      input.inflationRate,
      30,
    );
    setDrawdownResult(dd);
    setDrawdownReady(true);
  };

  const chartData = result.projections.map((p) => ({
    year: `${p.year}년`,
    재투자: p.reinvest.portfolioValueKRW,
    소비: p.spend.portfolioValueKRW,
    FIRE목표: p.fireTargetKRW,
  }));

  const setters = {
    setValue: (v: number) => setInput((p) => ({ ...p, currentValueKRW: v })),
    setYield: (v: number) => setInput((p) => ({ ...p, annualDividendYield: v / 100 })),
    setGrowth: (v: number) => setInput((p) => ({ ...p, dividendGrowthRate: v / 100 })),
    setExpenses: (v: number) => setInput((p) => ({ ...p, monthlyExpensesKRW: v })),
    setContribution: (v: number) => setInput((p) => ({ ...p, monthlyContributionKRW: v })),
    setReturn: (v: number) => setInput((p) => ({ ...p, annualReturnRate: v / 100 })),
    setInflation: (v: number) => setInput((p) => ({ ...p, inflationRate: v / 100 })),
    setDividendTax: (v: number) => setInput((p) => ({ ...p, dividendTaxRate: v / 100 })),
    setContributionGrowth: (v: number) => setInput((p) => ({ ...p, contributionGrowthRate: v / 100 })),
    setYears: (v: number) => setInput((p) => ({ ...p, years: v })),
  };

  const fmt = (v: number) => v.toLocaleString('ko-KR');

  const fireTabs: { key: FireTab; label: string; icon: typeof Calculator }[] = [
    { key: 'simulation', label: 'DRIP 시뮬레이션', icon: PiggyBank },
    { key: 'montecarlo', label: 'Monte Carlo', icon: BarChart3 },
    { key: 'sensitivity', label: '민감도 분석', icon: Sliders },
    { key: 'drawdown', label: '은퇴 후 소진', icon: LineChartIcon },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b overflow-x-auto">
        {fireTabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFireTab(key)}
            className={`shrink-0 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
              fireTab === key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="h-3 w-3 inline mr-1" />
            {label}
          </button>
        ))}
      </div>

      {fireTab === 'simulation' && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="glass p-4">
              <div className="flex items-center gap-2 mb-3">
                <PiggyBank className="h-4 w-4 text-primary" />
                <h3 className="font-display text-sm font-semibold">시뮬레이션 설정</h3>
              </div>
              <div className="space-y-3">
                <FieldInput label="현재 포트폴리오 가치" value={input.currentValueKRW} step={100000} onChange={setters.setValue} suffix="원" />
                <FieldInput label="연 배당률" value={input.annualDividendYield * 100} step={0.1} onChange={setters.setYield} suffix="%" />
                <FieldInput label="배당 성장률" value={input.dividendGrowthRate * 100} step={0.1} onChange={setters.setGrowth} suffix="%" />
                <FieldInput label="월 생활비 (FIRE 목표)" value={input.monthlyExpensesKRW} step={100000} onChange={setters.setExpenses} suffix="원" />
                <FieldInput label="월 추가 투자금" value={input.monthlyContributionKRW} step={100000} onChange={setters.setContribution} suffix="원" />
                <FieldInput label="연 수익률" value={input.annualReturnRate * 100} step={0.1} onChange={setters.setReturn} suffix="%" />
                <FieldInput label="인플레이션" value={input.inflationRate * 100} step={0.1} onChange={setters.setInflation} suffix="%" />
                <FieldInput label="배당소득세" value={input.dividendTaxRate * 100} step={0.1} onChange={setters.setDividendTax} suffix="%" />
                <FieldInput label="소득 성장률" value={input.contributionGrowthRate * 100} step={0.1} onChange={setters.setContributionGrowth} suffix="%" />
                <RangeSlider label="시뮬레이션 기간" value={input.years} min={1} max={50} step={1} onChange={setters.setYears} />
              </div>
            </Card>

            <div className="space-y-4">
              <Card className="glass p-4 border-primary/20">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="h-4 w-4 text-primary" />
                  <h3 className="font-display text-sm font-semibold">FIRE 목표</h3>
                </div>
                <div className="font-display text-2xl font-semibold">{formatKRW(result.fireTargetKRW)}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  월 생활비 {fmt(input.monthlyExpensesKRW)}원 × 12개월 × 25 (4% 규칙)
                  {input.inflationRate > 0 && ' — 인플레이션 반영'}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="default" className="bg-blue-100 text-blue-700 text-[10px]">
                    배당세 {fmt(Math.round(input.dividendTaxRate * 100))}% 차감
                  </Badge>
                  <Badge variant="default" className="bg-purple-100 text-purple-700 text-[10px]">
                    인플레이션 {fmt(Math.round(input.inflationRate * 100))}%
                  </Badge>
                </div>
              </Card>

              <div className="grid grid-cols-2 gap-3">
                <Card className="glass p-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <RefreshCw className="h-3.5 w-3.5 text-primary" />
                    <span className="font-label text-xs">재투자 시나리오</span>
                  </div>
                  <AnimatedKRW value={result.summary.reinvest.finalValueKRW} className="font-display text-lg font-semibold text-bull" />
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    FIRE: {result.summary.reinvest.yearsToFire}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    누적 배당: {formatKRW(result.summary.reinvest.totalDividendKRW)}
                  </div>
                </Card>
                <Card className="glass p-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <DollarSign className="h-3.5 w-3.5 text-warning" />
                    <span className="font-label text-xs">소비 시나리오</span>
                  </div>
                  <AnimatedKRW value={result.summary.spend.finalValueKRW} className="font-display text-lg font-semibold" />
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    FIRE: {result.summary.spend.yearsToFire}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    누적 배당: ₩ 0 (생활비 사용)
                  </div>
                </Card>
              </div>

              <div className="flex items-center gap-2">
                <ScenarioManager
                  currentInput={input}
                  onLoad={(loaded) => setInput({ ...loaded })}
                  result={result}
                />
                <Button variant="outline" className="h-7 text-xs px-2" onClick={() => setInput({ ...DEFAULT_DRIP_INPUT })}>
                  초기화
                </Button>
              </div>
            </div>
          </div>

          <Card className="glass p-4 md:p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h3 className="font-display text-sm font-semibold">포트폴리오 가치 시뮬레이션</h3>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" fontSize={11} />
                  <YAxis fontSize={11} tickFormatter={(v: number) => `${Math.round(v / 10000)}만`} />
                  <Tooltip
                    formatter={(value: unknown) => [formatKRW(Number(value)), '']}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="재투자"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="소비"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="FIRE목표"
                    stroke="#ef4444"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </>
      )}

      {fireTab === 'montecarlo' && (
        <MonteCarloView result={monteCarlo} />
      )}

      {fireTab === 'sensitivity' && (
        <SensitivityView items={sensitivityItems} />
      )}

      {fireTab === 'drawdown' && (
        <div className="space-y-4">
          {!drawdownReady && (
            <Card className="glass p-6 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                현재 설정을 기준으로 은퇴 후 30년 포트폴리오 소진 시뮬레이션을 실행합니다.
              </p>
              <Button onClick={runDrawdown}>
                <LineChartIcon className="h-4 w-4 mr-2" /> 소진 시뮬레이션 실행
              </Button>
            </Card>
          )}
          {drawdownReady && drawdownResult && (
            <>
              <DrawdownView result={drawdownResult} />
              <div className="flex gap-2">
                <Button variant="outline" className="h-7 text-xs px-2" onClick={runDrawdown}>
                  <RefreshCw className="h-3 w-3 mr-1" /> 재실행
                </Button>
                <Button
                  variant="outline"
                  className="h-7 text-xs px-2"
                  onClick={() => setDrawdownReady(false)}
                >
                  접기
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function TaxAndFire() {
  const [tab, setTab] = useState<Tab>('tax');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl md:text-2xl font-semibold tracking-tight">
          세금 및 FIRE 시뮬레이터
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          미국 주식 양도소득세 절세 계산과 배당 재투자(FIRE) 시뮬레이션
        </p>
      </div>

      <div className="flex gap-1 border-b">
        <button
          type="button"
          onClick={() => setTab('tax')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'tax'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Calculator className="h-3.5 w-3.5 inline mr-1.5" />
          세금 계산기
        </button>
        <button
          type="button"
          onClick={() => setTab('fire')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'fire'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <PiggyBank className="h-3.5 w-3.5 inline mr-1.5" />
          DRIP / FIRE 시뮬레이터
        </button>
      </div>

      {tab === 'tax' ? <TaxCalculator /> : <FireSimulator />}
    </div>
  );
}
