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
  };
}

export const DEFAULT_TAX_LOTS: TaxLot[] = [
  { symbol: 'AAPL', shares: 10, avgPurchasePriceKRW: 248000, currentPriceKRW: 265000 },
  { symbol: 'MSFT', shares: 5, avgPurchasePriceKRW: 385000, currentPriceKRW: 352000 },
  { symbol: 'NVDA', shares: 3, avgPurchasePriceKRW: 890000, currentPriceKRW: 945000 },
  { symbol: 'TSLA', shares: 8, avgPurchasePriceKRW: 320000, currentPriceKRW: 278000 },
  { symbol: 'AMD', shares: 15, avgPurchasePriceKRW: 152000, currentPriceKRW: 168000 },
];
