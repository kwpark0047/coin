import { describe, it, expect } from 'vitest';
import {
  pearsonCorrelation,
  getSeedCorrelations,
  getCorrelationMatrix,
  getPersonalizedCorrelations,
} from './correlationAnalysis';
import type { ClassBreakdown } from './aggregatePortfolio';

describe('pearsonCorrelation', () => {
  it('완전한 양의 상관관계에서 1을 반환해야 한다', () => {
    const x = [1, 2, 3, 4, 5];
    const y = [2, 4, 6, 8, 10];
    expect(pearsonCorrelation(x, y)).toBeCloseTo(1, 5);
  });

  it('완전한 음의 상관관계에서 -1을 반환해야 한다', () => {
    const x = [1, 2, 3, 4, 5];
    const y = [10, 8, 6, 4, 2];
    expect(pearsonCorrelation(x, y)).toBeCloseTo(-1, 5);
  });

  it('상관관계가 없을 때 0에 가까운 값을 반환해야 한다', () => {
    const x = [1, 2, 3, 4, 5];
    const y = [3, 3, 3, 3, 3];
    expect(pearsonCorrelation(x, y)).toBeCloseTo(0, 5);
  });

  it('데이터가 2개 미만이면 0을 반환해야 한다', () => {
    expect(pearsonCorrelation([1], [2])).toBe(0);
    expect(pearsonCorrelation([], [])).toBe(0);
  });

  it('길이가 다르면 0을 반환해야 한다', () => {
    expect(pearsonCorrelation([1, 2, 3], [1, 2])).toBe(0);
  });

  it('모든 값이 같으면 0을 반환해야 한다 (분산 0)', () => {
    expect(pearsonCorrelation([5, 5, 5], [5, 5, 5])).toBe(0);
  });

  it('결과가 -1과 1 사이여야 한다', () => {
    const x = Array.from({ length: 20 }, () => Math.random() * 100);
    const y = Array.from({ length: 20 }, () => Math.random() * 100);
    const r = pearsonCorrelation(x, y);
    expect(r).toBeGreaterThanOrEqual(-1);
    expect(r).toBeLessThanOrEqual(1);
  });
});

describe('getSeedCorrelations', () => {
  it('시드 상관관계 데이터를 반환해야 한다', () => {
    const seeds = getSeedCorrelations();
    expect(seeds.length).toBeGreaterThan(0);
  });

  it('각 항목에 필요한 필드가 있어야 한다', () => {
    const seeds = getSeedCorrelations();
    for (const s of seeds) {
      expect(s.assetA).toBeTruthy();
      expect(s.assetB).toBeTruthy();
      expect(typeof s.coefficient).toBe('number');
      expect(s.coefficient).toBeGreaterThanOrEqual(-1);
      expect(s.coefficient).toBeLessThanOrEqual(1);
      expect(s.label).toBeTruthy();
      expect(s.description).toBeTruthy();
    }
  });

  it('BTC-Nasdaq 상관관계가 포함되어 있어야 한다', () => {
    const seeds = getSeedCorrelations();
    const btcNasdaq = seeds.find((s) => s.assetA === 'BTC' && s.assetB === 'Nasdaq');
    expect(btcNasdaq).toBeDefined();
  });
});

describe('getCorrelationMatrix', () => {
  it('시드 데이터와 동일한 항목을 반환해야 한다', () => {
    const matrix = getCorrelationMatrix();
    const seeds = getSeedCorrelations();
    expect(matrix).toEqual(seeds);
  });
});

describe('getPersonalizedCorrelations', () => {
  it('빈 breakdown에서는 빈 배열을 반환해야 한다', () => {
    expect(getPersonalizedCorrelations([], 1000000)).toEqual([]);
  });

  it('totalValueKRW가 0이면 빈 배열을 반환해야 한다', () => {
    const breakdown: ClassBreakdown[] = [
      { assetClass: 'korean', label: '국내 자산', valueKRW: 500000, color: 'blue', holdings: [] },
    ];
    expect(getPersonalizedCorrelations(breakdown, 0)).toEqual([]);
  });

  it('단일 자산군만 있으면 빈 배열을 반환해야 한다', () => {
    const breakdown: ClassBreakdown[] = [
      { assetClass: 'crypto', label: '암호화폐', valueKRW: 1000000, color: 'gold', holdings: [] },
    ];
    expect(getPersonalizedCorrelations(breakdown, 1000000)).toEqual([]);
  });

  it('두 개 이상의 자산군이 있으면 상관관계 쌍을 반환해야 한다', () => {
    const breakdown: ClassBreakdown[] = [
      { assetClass: 'korean', label: '국내 자산', valueKRW: 500000, color: 'blue', holdings: [] },
      { assetClass: 'crypto', label: '암호화폐', valueKRW: 500000, color: 'gold', holdings: [] },
    ];
    const result = getPersonalizedCorrelations(breakdown, 1000000);
    expect(result.length).toBeGreaterThan(0);
    for (const r of result) {
      expect(r.coefficient).toBeGreaterThanOrEqual(-1);
      expect(r.coefficient).toBeLessThanOrEqual(1);
    }
  });

  it('세 자산군 모두 있으면 포트폴리오 종합 항목이 포함되어야 한다', () => {
    const breakdown: ClassBreakdown[] = [
      { assetClass: 'korean', label: '국내 자산', valueKRW: 300000, color: 'blue', holdings: [] },
      { assetClass: 'us', label: '미국 자산', valueKRW: 300000, color: 'purple', holdings: [] },
      { assetClass: 'crypto', label: '암호화폐', valueKRW: 400000, color: 'gold', holdings: [] },
    ];
    const result = getPersonalizedCorrelations(breakdown, 1000000);
    const portfolioSummary = result.find((r) => r.assetA === '내 포트폴리오');
    expect(portfolioSummary).toBeDefined();
  });
});
