import { describe, it, expect } from 'vitest';
import {
  calculateTaxes,
  addLot,
  removeLot,
  updateLot,
  exportHoldingsCSV,
  DEFAULT_TAX_LOTS,
} from './taxHarvesting';
import type { TaxLot } from './taxHarvesting';

describe('calculateTaxes', () => {
  it('모든 종목이 손실일 때 총 손실이 올바르게 계산되어야 한다', () => {
    const lots: TaxLot[] = [
      { symbol: 'LOSS1', shares: 10, avgPurchasePriceKRW: 100000, currentPriceKRW: 50000 },
      { symbol: 'LOSS2', shares: 5, avgPurchasePriceKRW: 200000, currentPriceKRW: 100000 },
    ];
    const result = calculateTaxes(lots);
    expect(result.totalGainKRW).toBe(0);
    expect(result.totalLossKRW).toBeGreaterThan(0);
    expect(result.netGainKRW).toBeLessThan(0);
  });

  it('기본 공제 250만원이 적용되어야 한다', () => {
    const lots: TaxLot[] = [
      { symbol: 'GAIN', shares: 10, avgPurchasePriceKRW: 100000, currentPriceKRW: 120000 },
    ];
    const result = calculateTaxes(lots);
    const expectedGain = 10 * (120000 - 100000);
    expect(result.totalGainKRW).toBe(expectedGain);
    expect(result.deductionKRW).toBe(2_500_000);
  });

  it('250만원 이하는 과세되지 않아야 한다', () => {
    const lots: TaxLot[] = [
      { symbol: 'SMALL', shares: 1, avgPurchasePriceKRW: 1000000, currentPriceKRW: 1200000 },
    ];
    const result = calculateTaxes(lots);
    expect(result.taxableGainKRW).toBe(0);
    expect(result.taxDueKRW).toBe(0);
  });

  it('250만원 초과분에 22% 세율이 적용되어야 한다', () => {
    const lots: TaxLot[] = [
      { symbol: 'BIG', shares: 10, avgPurchasePriceKRW: 1000000, currentPriceKRW: 2000000 },
    ];
    const result = calculateTaxes(lots);
    const grossGain = 10 * (2000000 - 1000000);
    const taxable = grossGain - 2_500_000;
    expect(result.taxableGainKRW).toBe(taxable);
    expect(result.taxDueKRW).toBe(Math.round(taxable * 0.22));
  });

  it('손실이 이익을 상계해야 한다', () => {
    const lots: TaxLot[] = [
      { symbol: 'WIN', shares: 10, avgPurchasePriceKRW: 100000, currentPriceKRW: 200000 },
      { symbol: 'LOSE', shares: 10, avgPurchasePriceKRW: 200000, currentPriceKRW: 100000 },
    ];
    const result = calculateTaxes(lots);
    expect(result.netGainKRW).toBe(0);
    expect(result.taxDueKRW).toBe(0);
  });

  it('빈 배열이 들어오면 모든 값이 0이어야 한다', () => {
    const result = calculateTaxes([]);
    expect(result.totalGainKRW).toBe(0);
    expect(result.totalLossKRW).toBe(0);
    expect(result.netGainKRW).toBe(0);
    expect(result.taxDueKRW).toBe(0);
    expect(result.holdings).toHaveLength(0);
  });

  it('Tax-loss Harvesting 제안이 올바르게 생성되어야 한다', () => {
    const lots: TaxLot[] = [
      { symbol: 'WIN', shares: 10, avgPurchasePriceKRW: 100000, currentPriceKRW: 300000 },
      { symbol: 'LOSE', shares: 5, avgPurchasePriceKRW: 400000, currentPriceKRW: 200000 },
    ];
    const result = calculateTaxes(lots);
    expect(result.suggestions.length).toBeGreaterThan(0);
    const totalOffset = result.suggestions.reduce((s, sg) => s + sg.gainOffsetKRW, 0);
    expect(totalOffset).toBeGreaterThan(0);
  });

  it('모든 손실을 상계했을 때 canZeroOut이 true여야 한다', () => {
    const lots: TaxLot[] = [
      { symbol: 'WIN', shares: 10, avgPurchasePriceKRW: 100000, currentPriceKRW: 150000 },
      { symbol: 'LOSE', shares: 20, avgPurchasePriceKRW: 100000, currentPriceKRW: 50000 },
    ];
    const result = calculateTaxes(lots);
    const totalGain = 10 * (150000 - 100000);
    const totalLoss = 20 * (100000 - 50000);
    if (totalLoss >= totalGain) {
      expect(result.canZeroOut).toBe(true);
    }
  });

  it('기본 샘플 데이터로 세금 계산이 정상 동작해야 한다', () => {
    const result = calculateTaxes(DEFAULT_TAX_LOTS);
    expect(result.holdings).toHaveLength(DEFAULT_TAX_LOTS.length);
    expect(result.totalCostBasisKRW).toBeGreaterThan(0);
    expect(result.totalMarketValueKRW).toBeGreaterThan(0);
  });
});

describe('addLot', () => {
  it('기존 목록 끝에 새 항목을 추가해야 한다', () => {
    const lots: TaxLot[] = [{ symbol: 'TEST', shares: 1, avgPurchasePriceKRW: 1000, currentPriceKRW: 1000 }];
    const result = addLot(lots);
    expect(result).toHaveLength(2);
    expect(result[1].symbol).toBe('');
  });

  it('부분 객체로 새 항목을 추가할 수 있어야 한다', () => {
    const lots: TaxLot[] = [];
    const result = addLot(lots, { symbol: 'AAPL', shares: 10 });
    expect(result).toHaveLength(1);
    expect(result[0].symbol).toBe('AAPL');
    expect(result[0].shares).toBe(10);
    expect(result[0].avgPurchasePriceKRW).toBe(0);
  });
});

describe('removeLot', () => {
  it('특정 인덱스의 항목을 제거해야 한다', () => {
    const lots: TaxLot[] = [
      { symbol: 'A', shares: 1, avgPurchasePriceKRW: 100, currentPriceKRW: 100 },
      { symbol: 'B', shares: 1, avgPurchasePriceKRW: 200, currentPriceKRW: 200 },
    ];
    const result = removeLot(lots, 0);
    expect(result).toHaveLength(1);
    expect(result[0].symbol).toBe('B');
  });

  it('잘못된 인덱스는 원본을 반환해야 한다', () => {
    const lots: TaxLot[] = [{ symbol: 'A', shares: 1, avgPurchasePriceKRW: 100, currentPriceKRW: 100 }];
    expect(removeLot(lots, -1)).toBe(lots);
    expect(removeLot(lots, 5)).toBe(lots);
  });
});

describe('updateLot', () => {
  it('특정 인덱스의 항목을 부분 업데이트해야 한다', () => {
    const lots: TaxLot[] = [
      { symbol: 'A', shares: 1, avgPurchasePriceKRW: 100, currentPriceKRW: 100 },
    ];
    const result = updateLot(lots, 0, { shares: 10, currentPriceKRW: 200 });
    expect(result[0].shares).toBe(10);
    expect(result[0].currentPriceKRW).toBe(200);
    expect(result[0].symbol).toBe('A');
  });

  it('잘못된 인덱스는 원본을 반환해야 한다', () => {
    const lots: TaxLot[] = [{ symbol: 'A', shares: 1, avgPurchasePriceKRW: 100, currentPriceKRW: 100 }];
    expect(updateLot(lots, -1, {})).toBe(lots);
  });
});

describe('exportHoldingsCSV', () => {
  it('헤더를 포함한 CSV 문자열을 반환해야 한다', () => {
    const csv = exportHoldingsCSV(DEFAULT_TAX_LOTS);
    expect(csv).toContain('종목');
    expect(csv).toContain('보유량');
    expect(csv).toContain('평균단가');
  });

  it('데이터 행이 헤더보다 많아야 한다', () => {
    const csv = exportHoldingsCSV(DEFAULT_TAX_LOTS);
    const lines = csv.trim().split('\n');
    expect(lines.length).toBe(DEFAULT_TAX_LOTS.length + 1);
  });
});
