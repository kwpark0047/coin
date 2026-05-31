import { useMemo, useState } from 'react';
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
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { calculateTaxes, DEFAULT_TAX_LOTS } from '@/lib/taxHarvesting';
import type { TaxLot } from '@/lib/taxHarvesting';
import { simulateDrip, DEFAULT_DRIP_INPUT } from '@/lib/dripSimulator';
import type { DripInput } from '@/lib/dripSimulator';
import { formatKRW } from '@/lib/utils';
import {
  Calculator,
  PiggyBank,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  DollarSign,
  Target,
} from 'lucide-react';

type Tab = 'tax' | 'fire';

function TaxCalculator() {
  const [lots, setLots] = useState<TaxLot[]>(() =>
    DEFAULT_TAX_LOTS.map((l) => ({ ...l })),
  );
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<TaxLot | null>(null);

  const result = useMemo(() => calculateTaxes(lots), [lots]);

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

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass p-4">
          <div className="font-label text-xs">총 양도차익</div>
          <div className={`mt-1 font-display text-lg font-semibold ${result.totalGainKRW > 0 ? 'text-bull' : ''}`}>
            {formatKRW(result.totalGainKRW)}
          </div>
        </Card>
        <Card className="glass p-4">
          <div className="font-label text-xs">총 양도차손</div>
          <div className="mt-1 font-display text-lg font-semibold text-bear">
            {formatKRW(result.totalLossKRW)}
          </div>
        </Card>
        <Card className="glass p-4">
          <div className="font-label text-xs">과세 대상 금액</div>
          <div className="mt-1 font-display text-lg font-semibold">
            {formatKRW(result.taxableGainKRW)}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            연 {formatKRW(result.deductionKRW)} 공제 후
          </div>
        </Card>
        <Card className="glass p-4">
          <div className="font-label text-xs">예상 세금 (22%)</div>
          <div className={`mt-1 font-display text-lg font-semibold ${result.taxDueKRW > 0 ? 'text-bear' : 'text-bull'}`}>
            {result.taxDueKRW > 0 ? formatKRW(result.taxDueKRW) : '₩ 0'}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            실효세율 {(result.effectiveRate * 100).toFixed(1)}%
          </div>
        </Card>
      </div>

      <Card className="glass p-4 md:p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="h-4 w-4 text-primary" />
          <h3 className="font-display text-sm font-semibold">보유 종목 현황</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>종목</TableHead>
              <TableHead className="text-right">보유량</TableHead>
              <TableHead className="text-right">평균단가</TableHead>
              <TableHead className="text-right">현재가</TableHead>
              <TableHead className="text-right">평가손익</TableHead>
              <TableHead className="text-right">수익률</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {lots.map((lot, idx) => {
              const isEditing = editingIdx === idx;
              const h = result.holdings[idx];
              if (isEditing && editForm) {
                return (
                  <TableRow key={idx}>
                    <TableCell>
                      <input
                        className="w-20 rounded border border-gray-200 px-2 py-1 text-xs"
                        value={editForm.symbol}
                        onChange={(e) => setEditForm({ ...editForm, symbol: e.target.value })}
                      />
                    </TableCell>
                    <TableCell>
                      <input
                        type="number"
                        className="w-20 rounded border border-gray-200 px-2 py-1 text-xs text-right"
                        value={editForm.shares}
                        onChange={(e) => setEditForm({ ...editForm, shares: Number(e.target.value) })}
                      />
                    </TableCell>
                    <TableCell>
                      <input
                        type="number"
                        className="w-24 rounded border border-gray-200 px-2 py-1 text-xs text-right"
                        value={editForm.avgPurchasePriceKRW}
                        onChange={(e) => setEditForm({ ...editForm, avgPurchasePriceKRW: Number(e.target.value) })}
                      />
                    </TableCell>
                    <TableCell>
                      <input
                        type="number"
                        className="w-24 rounded border border-gray-200 px-2 py-1 text-xs text-right"
                        value={editForm.currentPriceKRW}
                        onChange={(e) => setEditForm({ ...editForm, currentPriceKRW: Number(e.target.value) })}
                      />
                    </TableCell>
                    <TableCell colSpan={3}>
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={cancelEdit} className="h-7 text-xs px-2">
                          취소
                        </Button>
                        <Button onClick={saveEdit} className="h-7 text-xs px-2">
                          저장
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              }
              return (
                <TableRow key={idx}>
                  <TableCell className="font-mono text-sm font-medium">{lot.symbol}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{lot.shares}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {formatKRW(lot.avgPurchasePriceKRW)}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {formatKRW(lot.currentPriceKRW)}
                  </TableCell>
                  <TableCell className={`text-right font-mono tabular-nums ${h.gainKRW >= 0 ? 'text-bull' : 'text-bear'}`}>
                    {h.gainKRW >= 0 ? '+' : ''}{formatKRW(h.gainKRW)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="default" className={`text-[11px] ${h.isLoss ? 'bg-red-100 text-red-700' : ''}`}>
                      {h.gainPercent >= 0 ? '+' : ''}{h.gainPercent.toFixed(1)}%
                    </Badge>
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
                  <ArrowRight className="h-4 w-4" />
                  위 매도로 양도소득세를 0원으로 만들 수 있습니다.
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function FieldInput({ label, value, step, onChange }: { label: string; value: number; step: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="font-label block mb-1">{label}</label>
      <input
        type="number"
        step={step}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function FireSimulator() {
  const [input, setInput] = useState<DripInput>({ ...DEFAULT_DRIP_INPUT });

  const result = useMemo(() => simulateDrip(input), [input]);

  const chartData = result.projections.map((p) => ({
    year: `${p.year}년`,
    재투자: p.reinvest.portfolioValueKRW,
    소비: p.spend.portfolioValueKRW,
    FIRE목표: p.fireTargetKRW,
  }));

  const fmt = (v: number) => v.toLocaleString('ko-KR');

  const setters = {
    setValue: (v: number) => setInput((p) => ({ ...p, currentValueKRW: v })),
    setYield: (v: number) => setInput((p) => ({ ...p, annualDividendYield: v / 100 })),
    setGrowth: (v: number) => setInput((p) => ({ ...p, dividendGrowthRate: v / 100 })),
    setExpenses: (v: number) => setInput((p) => ({ ...p, monthlyExpensesKRW: v })),
    setContribution: (v: number) => setInput((p) => ({ ...p, monthlyContributionKRW: v })),
    setReturn: (v: number) => setInput((p) => ({ ...p, annualReturnRate: v / 100 })),
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="glass p-4">
          <div className="flex items-center gap-2 mb-3">
            <PiggyBank className="h-4 w-4 text-primary" />
            <h3 className="font-display text-sm font-semibold">시뮬레이션 설정</h3>
          </div>
          <div className="space-y-3">
            <FieldInput label="현재 포트폴리오 가치" value={input.currentValueKRW} step={100000} onChange={setters.setValue} />
            <FieldInput label="연 배당률 (%)" value={input.annualDividendYield * 100} step={0.1} onChange={setters.setYield} />
            <FieldInput label="배당 성장률 (%)" value={input.dividendGrowthRate * 100} step={0.1} onChange={setters.setGrowth} />
            <FieldInput label="월 생활비 (FIRE 목표)" value={input.monthlyExpensesKRW} step={100000} onChange={setters.setExpenses} />
            <FieldInput label="월 추가 투자금" value={input.monthlyContributionKRW} step={100000} onChange={setters.setContribution} />
            <FieldInput label="연 수익률 (%)" value={input.annualReturnRate * 100} step={0.1} onChange={setters.setReturn} />
            <div>
              <label className="font-label block mb-1">시뮬레이션 기간 (년)</label>
              <input
                type="range"
                min={1}
                max={30}
                className="w-full"
                value={input.years}
                onChange={(e) => setInput((prev) => ({ ...prev, years: Number(e.target.value) }))}
              />
              <div className="text-xs text-muted-foreground text-right mt-0.5">{input.years}년</div>
            </div>
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
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Card className="glass p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <RefreshCw className="h-3.5 w-3.5 text-primary" />
                <span className="font-label text-xs">재투자 시나리오</span>
              </div>
              <div className="font-display text-lg font-semibold text-bull">
                {formatKRW(result.summary.reinvest.finalValueKRW)}
              </div>
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
              <div className="font-display text-lg font-semibold">
                {formatKRW(result.summary.spend.finalValueKRW)}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                FIRE: {result.summary.spend.yearsToFire}
              </div>
              <div className="text-[11px] text-muted-foreground">
                누적 배당: ₩ 0 (생활비 사용)
              </div>
            </Card>
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
