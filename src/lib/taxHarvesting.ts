export interface TaxLot {
  symbol: string;
  shares: number;
  avgPurchasePriceKRW: number;
  currentPriceKRW: number;
}

export interface HarvestSuggestion {
  symbol: string;
  sharesToSell: number;
  lossRealizedKRW: number;
  gainOffsetKRW: number;
  proceedsKRW: number;
}

export interface TaxLotResult {
  symbol: string;
  shares: number;
  avgPurchasePriceKRW: number;
  currentPriceKRW: number;
  totalCostKRW: number;
  currentValueKRW: number;
  gainKRW: number;
  gainPercent: number;
  isLoss: boolean;
}

export interface TaxResult {
  holdings: TaxLotResult[];
  totalGainKRW: number;
  totalLossKRW: number;
  netGainKRW: number;
  deductionKRW: number;
  taxableGainKRW: number;
  taxRate: number;
  taxDueKRW: number;
  effectiveRate: number;
  suggestions: HarvestSuggestion[];
  canZeroOut: boolean;
  totalCostBasisKRW: number;
  totalMarketValueKRW: number;
  unrealizedGainKRW: number;
  unusedLossKRW: number;
  remainingDeductionKRW: number;
}

const DEDUCTION_KRW = 2_500_000;
const TAX_RATE = 0.22;

function calcLotResult(lot: TaxLot): TaxLotResult {
  const totalCost = lot.shares * lot.avgPurchasePriceKRW;
  const currentValue = lot.shares * lot.currentPriceKRW;
  const gain = currentValue - totalCost;
  return {
    symbol: lot.symbol,
    shares: lot.shares,
    avgPurchasePriceKRW: lot.avgPurchasePriceKRW,
    currentPriceKRW: lot.currentPriceKRW,
    totalCostKRW: totalCost,
    currentValueKRW: currentValue,
    gainKRW: gain,
    gainPercent: totalCost > 0 ? (gain / totalCost) * 100 : 0,
    isLoss: gain < 0,
  };
}

export function calculateTaxes(lots: TaxLot[]): TaxResult {
  const holdings = lots.map(calcLotResult);

  const totalGain = holdings.filter((h) => !h.isLoss).reduce((s, h) => s + h.gainKRW, 0);
  const totalLoss = holdings.filter((h) => h.isLoss).reduce((s, h) => s + Math.abs(h.gainKRW), 0);
  const netGain = totalGain - totalLoss;
  const taxable = Math.max(0, netGain - DEDUCTION_KRW);
  const taxDue = taxable * TAX_RATE;

  const losers = holdings.filter((h) => h.isLoss).sort((a, b) => b.gainKRW - a.gainKRW);
  let remainingOffset = Math.max(0, netGain);
  const suggestions: HarvestSuggestion[] = [];
  let totalLossRealized = 0;

  for (const loser of losers) {
    if (remainingOffset <= 0) break;
    const lossAvailable = Math.abs(loser.gainKRW);
    const needed = Math.min(lossAvailable, remainingOffset);
    const sellRatio = needed / lossAvailable;
    const sharesToSell = Math.round(loser.shares * sellRatio * 100) / 100;
    if (sharesToSell <= 0) continue;
    const proceeds = sharesToSell * loser.currentPriceKRW;
    suggestions.push({
      symbol: loser.symbol,
      sharesToSell,
      lossRealizedKRW: Math.round(needed),
      gainOffsetKRW: Math.round(needed),
      proceedsKRW: Math.round(proceeds),
    });
    totalLossRealized += needed;
    remainingOffset -= needed;
  }

  const unusedLoss = totalLoss - totalLossRealized;
  const remainingDeduction = netGain > 0
    ? Math.max(0, DEDUCTION_KRW - netGain)
    : DEDUCTION_KRW + netGain;
  const totalCostBasisKRW = holdings.reduce((s, h) => s + h.totalCostKRW, 0);
  const totalMarketValueKRW = holdings.reduce((s, h) => s + h.currentValueKRW, 0);

  return {
    holdings,
    totalGainKRW: Math.round(totalGain),
    totalLossKRW: Math.round(totalLoss),
    netGainKRW: Math.round(netGain),
    deductionKRW: DEDUCTION_KRW,
    taxableGainKRW: Math.round(taxable),
    taxRate: TAX_RATE,
    taxDueKRW: Math.round(taxDue),
    effectiveRate: netGain > 0 ? taxDue / netGain : 0,
    suggestions,
    canZeroOut: remainingOffset <= 0,
    totalCostBasisKRW: Math.round(totalCostBasisKRW),
    totalMarketValueKRW: Math.round(totalMarketValueKRW),
    unrealizedGainKRW: Math.round(totalMarketValueKRW - totalCostBasisKRW),
    unusedLossKRW: Math.round(unusedLoss),
    remainingDeductionKRW: Math.round(Math.max(0, remainingDeduction)),
  };
}

export function addLot(lots: TaxLot[], lot?: Partial<TaxLot>): TaxLot[] {
  const defaults: TaxLot = {
    symbol: '',
    shares: 0,
    avgPurchasePriceKRW: 0,
    currentPriceKRW: 0,
  };
  return [...lots, { ...defaults, ...lot }];
}

export function removeLot(lots: TaxLot[], index: number): TaxLot[] {
  if (index < 0 || index >= lots.length) return lots;
  return lots.filter((_, i) => i !== index);
}

export function updateLot(lots: TaxLot[], index: number, patch: Partial<TaxLot>): TaxLot[] {
  if (index < 0 || index >= lots.length) return lots;
  return lots.map((lot, i) => (i === index ? { ...lot, ...patch } : lot));
}

export interface PriceUpdate {
  symbol: string;
  currentPriceKRW: number;
}

export function updatePrices(lots: TaxLot[], updates: PriceUpdate[]): TaxLot[] {
  const map = new Map(updates.map((u) => [u.symbol, u.currentPriceKRW]));
  return lots.map((lot) => {
    const price = map.get(lot.symbol);
    return price !== undefined ? { ...lot, currentPriceKRW: price } : lot;
  });
}

export function exportHoldingsCSV(lots: TaxLot[]): string {
  const header = '종목,보유량,평균단가(KRW),현재가(KRW),매수총액,평가금액,손익,수익률(%)';
  const rows = lots.map((lot) => {
    const cost = lot.shares * lot.avgPurchasePriceKRW;
    const value = lot.shares * lot.currentPriceKRW;
    const gain = value - cost;
    const pct = cost > 0 ? ((gain / cost) * 100).toFixed(1) : '0.0';
    return [lot.symbol, lot.shares, lot.avgPurchasePriceKRW, lot.currentPriceKRW, cost, value, gain, pct].join(',');
  });
  return [header, ...rows].join('\n');
}

export const DEFAULT_TAX_LOTS: TaxLot[] = [
  { symbol: 'AAPL', shares: 10, avgPurchasePriceKRW: 248000, currentPriceKRW: 265000 },
  { symbol: 'MSFT', shares: 5, avgPurchasePriceKRW: 385000, currentPriceKRW: 352000 },
  { symbol: 'NVDA', shares: 3, avgPurchasePriceKRW: 890000, currentPriceKRW: 945000 },
  { symbol: 'TSLA', shares: 8, avgPurchasePriceKRW: 320000, currentPriceKRW: 278000 },
  { symbol: 'AMD', shares: 15, avgPurchasePriceKRW: 152000, currentPriceKRW: 168000 },
];

export const POPULAR_STOCKS = [
  { symbol: 'AAPL', name: 'Apple' },
  { symbol: 'MSFT', name: 'Microsoft' },
  { symbol: 'NVDA', name: 'NVIDIA' },
  { symbol: 'TSLA', name: 'Tesla' },
  { symbol: 'AMD', name: 'AMD' },
  { symbol: 'AMZN', name: 'Amazon' },
  { symbol: 'GOOGL', name: 'Alphabet' },
  { symbol: 'META', name: 'Meta' },
  { symbol: 'TSM', name: 'TSMC' },
  { symbol: 'AVGO', name: 'Broadcom' },
  { symbol: 'COST', name: 'Costco' },
  { symbol: 'NFLX', name: 'Netflix' },
  { symbol: 'JPM', name: 'JPMorgan' },
  { symbol: 'V', name: 'Visa' },
  { symbol: 'KO', name: 'Coca-Cola' },
  { symbol: 'DIS', name: 'Disney' },
  { symbol: 'QQQ', name: 'Invesco QQQ' },
  { symbol: 'SPY', name: 'SPDR S&P 500' },
] as const;

export interface ExchangeRate {
  rate: number;
  label: string;
}

export const DEFAULT_RATE: ExchangeRate = { rate: 1350, label: '1350원/USD' };

export function convertCurrency(amountKRW: number, rate: number, toUSD: boolean): number {
  return toUSD ? Math.round(amountKRW / rate) : Math.round(amountKRW * rate);
}

export function findLotsBySymbol(lots: TaxLot[], symbol: string): TaxLot[] {
  const s = symbol.toUpperCase();
  return lots.filter((l) => l.symbol.toUpperCase() === s);
}
