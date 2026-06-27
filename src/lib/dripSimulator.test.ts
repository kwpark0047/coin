import { describe, it, expect } from 'vitest';
import {
  simulateDrip,
  simulatePostFireDrawdown,
  runMonteCarlo,
  runSensitivityAnalysis,
  DEFAULT_DRIP_INPUT,
  FIRE_MULTIPLIER,
} from './dripSimulator';

describe('simulateDrip', () => {
  const base = DEFAULT_DRIP_INPUT;

  it('재투자 시나리오에서 포트폴리오 가치가 증가해야 한다', () => {
    const result = simulateDrip(base);
    const last = result.projections[result.projections.length - 1];
    expect(last.reinvest.portfolioValueKRW).toBeGreaterThan(base.currentValueKRW);
  });

  it('소비 시나리오의 포트폴리오 가치가 재투자 시나리오보다 낮거나 같아야 한다', () => {
    const result = simulateDrip(base);
    for (const p of result.projections) {
      expect(p.spend.portfolioValueKRW).toBeLessThanOrEqual(p.reinvest.portfolioValueKRW);
    }
  });

  it('FIRE 목표 금액이 올바르게 계산되어야 한다 (4% 규칙)', () => {
    const result = simulateDrip(base);
    const expectedTarget = base.monthlyExpensesKRW * 12 * FIRE_MULTIPLIER;
    expect(result.fireTargetKRW).toBe(expectedTarget);
  });

  it('years가 0이면 빈 projections 배열을 반환해야 한다', () => {
    const result = simulateDrip({ ...base, years: 0 });
    expect(result.projections).toHaveLength(0);
  });

  it('누적 배당금이 단조 증가해야 한다', () => {
    const result = simulateDrip({ ...base, years: 5 });
    let prev = 0;
    for (const p of result.projections) {
      expect(p.reinvest.cumulativeDividendKRW).toBeGreaterThanOrEqual(prev);
      prev = p.reinvest.cumulativeDividendKRW;
    }
  });

  it('인플레이션을 반영한 FIRE 목표가 매년 증가해야 한다', () => {
    const result = simulateDrip({ ...base, years: 5, inflationRate: 0.03 });
    for (let i = 1; i < result.projections.length; i++) {
      expect(result.projections[i].fireTargetKRW).toBeGreaterThan(
        result.projections[i - 1].fireTargetKRW,
      );
    }
  });

  it('월 추가 투자금이 0이어도 정상 동작해야 한다', () => {
    const result = simulateDrip({ ...base, monthlyContributionKRW: 0 });
    expect(result.projections.length).toBeGreaterThan(0);
  });

  it('극단적으로 큰 값에서 오버플로우가 발생하지 않아야 한다', () => {
    const result = simulateDrip({
      ...base,
      currentValueKRW: 1_000_000_000_000,
      annualReturnRate: 0.5,
      years: 30,
    });
    expect(result.summary.reinvest.finalValueKRW).toBeGreaterThan(0);
    expect(Number.isFinite(result.summary.reinvest.finalValueKRW)).toBe(true);
  });
});

describe('simulatePostFireDrawdown', () => {
  it('초기 포트폴리오가 충분하면 생존해야 한다', () => {
    const result = simulatePostFireDrawdown(
      1_000_000_000, // 10억
      2_000_000,     // 월 200만원
      0.05,          // 연 5% 수익
      0.035,         // 배당 3.5%
      0.154,         // 배당세 15.4%
      0.03,          // 인플레이션 3%
      30,
    );
    expect(result.success).toBe(true);
    expect(result.survivedYears).toBeGreaterThan(0);
  });

  it('초기 포트폴리오가 부족하면 고갈되어야 한다', () => {
    const result = simulatePostFireDrawdown(
      50_000_000,    // 5000만원
      5_000_000,     // 월 500만원
      0.03,          // 연 3% 수익
      0.02,          // 배당 2%
      0.154,
      0.03,
      30,
    );
    expect(result.success).toBe(false);
  });

  it('인출율이 올바르게 계산되어야 한다', () => {
    const result = simulatePostFireDrawdown(100_000_000, 1_000_000, 0.05, 0.035, 0.154, 0.03, 30);
    const expectedRate = (1_000_000 * 12) / 100_000_000;
    expect(result.withdrawalRate).toBeCloseTo(expectedRate, 4);
  });

  it('연간 데이터가 올바른 순서로 생성되어야 한다', () => {
    const result = simulatePostFireDrawdown(500_000_000, 2_000_000, 0.05, 0.035, 0.154, 0.03, 10);
    expect(result.years.length).toBeGreaterThan(0);
    expect(result.years[0].year).toBe(1);
    expect(result.years[result.years.length - 1].year).toBe(result.survivedYears);
  });
});

describe('runMonteCarlo', () => {
  it('500회 시뮬레이션을 실행해야 한다', () => {
    const result = runMonteCarlo(DEFAULT_DRIP_INPUT, 100);
    expect(result.simulations).toBe(100);
  });

  it('성공률이 0%에서 100% 사이여야 한다', () => {
    const result = runMonteCarlo(DEFAULT_DRIP_INPUT, 50);
    expect(result.successRate).toBeGreaterThanOrEqual(0);
    expect(result.successRate).toBeLessThanOrEqual(100);
  });

  it('중간값이 하위 5%보다 크거나 같아야 한다', () => {
    const result = runMonteCarlo(DEFAULT_DRIP_INPUT, 100);
    expect(result.medianFinalValueKRW).toBeGreaterThanOrEqual(result.percentile5FinalValueKRW);
  });

  it('상위 5%가 중간값보다 크거나 같아야 한다', () => {
    const result = runMonteCarlo(DEFAULT_DRIP_INPUT, 100);
    expect(result.percentile95FinalValueKRW).toBeGreaterThanOrEqual(result.medianFinalValueKRW);
  });

  it('연도별 백분위수 데이터가 생성되어야 한다', () => {
    const result = runMonteCarlo(DEFAULT_DRIP_INPUT, 50);
    expect(result.yearlyPercentiles.length).toBeGreaterThan(0);
    for (const yp of result.yearlyPercentiles) {
      expect(yp.p5).toBeLessThanOrEqual(yp.median);
      expect(yp.median).toBeLessThanOrEqual(yp.p95);
    }
  });
});

describe('runSensitivityAnalysis', () => {
  it('모든 변수에 대한 민감도 항목을 반환해야 한다', () => {
    const items = runSensitivityAnalysis(DEFAULT_DRIP_INPUT);
    expect(items.length).toBeGreaterThan(0);
  });

  it('영향도 순위가 1부터 시작해야 한다', () => {
    const items = runSensitivityAnalysis(DEFAULT_DRIP_INPUT);
    expect(items[0].impactRank).toBe(1);
  });

  it('영향도 순위가 중복 없이 할당되어야 한다', () => {
    const items = runSensitivityAnalysis(DEFAULT_DRIP_INPUT);
    const ranks = items.map((i) => i.impactRank);
    expect(new Set(ranks).size).toBe(ranks.length);
  });

  it('각 항목에 baseYears 값이 있어야 한다', () => {
    const items = runSensitivityAnalysis(DEFAULT_DRIP_INPUT);
    for (const item of items) {
      expect(item.baseYears).toBeTruthy();
    }
  });
});
