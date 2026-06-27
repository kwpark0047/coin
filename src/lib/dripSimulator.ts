export interface DripInput {
  currentValueKRW: number;
  annualDividendYield: number;
  dividendGrowthRate: number;
  monthlyExpensesKRW: number;
  monthlyContributionKRW: number;
  years: number;
  annualReturnRate: number;
  inflationRate: number;
  dividendTaxRate: number;
  contributionGrowthRate: number;
}

export interface DripYearData {
  year: number;
  spend: {
    portfolioValueKRW: number;
    annualDividendKRW: number;
    cumulativeDividendKRW: number;
  };
  reinvest: {
    portfolioValueKRW: number;
    annualDividendKRW: number;
    cumulativeDividendKRW: number;
  };
  fireTargetKRW: number;
  isFireAchieved: boolean;
}

export interface DripResult {
  projections: DripYearData[];
  fireTargetKRW: number;
  fireYearReinvest: number | null;
  fireYearSpend: number | null;
  summary: {
    reinvest: { finalValueKRW: number; totalDividendKRW: number; yearsToFire: string };
    spend: { finalValueKRW: number; totalDividendKRW: number; yearsToFire: string };
  };
}

export interface DrawdownYearData {
  year: number;
  portfolioValueKRW: number;
  withdrawalKRW: number;
  annualReturnKRW: number;
  annualDividendKRW: number;
}

export interface DrawdownResult {
  years: DrawdownYearData[];
  survivedYears: number;
  initialPortfolioKRW: number;
  withdrawalRate: number;
  success: boolean;
}

export interface MonteCarloPercentile {
  year: number;
  p5: number;
  p25: number;
  median: number;
  p75: number;
  p95: number;
}

export interface MonteCarloResult {
  simulations: number;
  successRate: number;
  medianFinalValueKRW: number;
  percentile5FinalValueKRW: number;
  percentile95FinalValueKRW: number;
  yearlyPercentiles: MonteCarloPercentile[];
}

export interface SensitivityItem {
  variable: keyof DripInput;
  label: string;
  baseYears: string;
  plus20Years: string;
  minus20Years: string;
  impactRank: number;
}

export const FIRE_MULTIPLIER = 25;
export const DEFAULT_RETURN_STD = 0.15;

function boxMullerRandom(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function normalRandom(mean: number, std: number): number {
  return mean + std * boxMullerRandom();
}

function simulateYear(args: {
  value: number;
  annualReturnRate: number;
  dividendYield: number;
  contribution: number;
  dividendTaxRate: number;
  randomReturn?: number;
}): { value: number; dividendKRW: number } {
  const { value, annualReturnRate, dividendYield, contribution, dividendTaxRate } = args;
  const returnRate = args.randomReturn ?? annualReturnRate;
  const grossDividend = value * dividendYield;
  const netDividend = grossDividend * (1 - dividendTaxRate);
  const valueEnd = Math.round(value * (1 + returnRate) + netDividend + contribution);
  return { value: valueEnd, dividendKRW: Math.round(grossDividend) };
}

export function simulateDrip(input: DripInput): DripResult {
  const {
    currentValueKRW,
    annualDividendYield,
    dividendGrowthRate,
    monthlyExpensesKRW,
    monthlyContributionKRW,
    years,
    annualReturnRate,
    inflationRate,
    dividendTaxRate,
    contributionGrowthRate,
  } = input;

  const baseFireTargetKRW = monthlyExpensesKRW * 12 * FIRE_MULTIPLIER;

  if (years <= 0) {
    return {
      projections: [],
      fireTargetKRW: baseFireTargetKRW,
      fireYearReinvest: null,
      fireYearSpend: null,
      summary: {
        reinvest: { finalValueKRW: currentValueKRW, totalDividendKRW: 0, yearsToFire: '시뮬레이션 기간 없음' },
        spend: { finalValueKRW: currentValueKRW, totalDividendKRW: 0, yearsToFire: '시뮬레이션 기간 없음' },
      },
    };
  }

  let reinvestValue = currentValueKRW;
  let spendValue = currentValueKRW;
  let fireYearReinvest: number | null = null;
  let fireYearSpend: number | null = null;

  const projections: DripYearData[] = [];
  let cumulativeDividendReinvest = 0;
  let cumulativeDividendSpend = 0;

  for (let y = 1; y <= years; y++) {
    const fireTargetKRW = Math.round(baseFireTargetKRW * Math.pow(1 + inflationRate, y));
    const currentYield = annualDividendYield * Math.pow(1 + dividendGrowthRate, y - 1);
    const annualContribution = Math.round(monthlyContributionKRW * 12 * Math.pow(1 + contributionGrowthRate, y - 1));

    const reinvestResult = simulateYear({
      value: reinvestValue,
      annualReturnRate,
      dividendYield: currentYield,
      contribution: annualContribution,
      dividendTaxRate,
    });
    reinvestValue = reinvestResult.value;
    cumulativeDividendReinvest += reinvestResult.dividendKRW;

    const spendResult = simulateYear({
      value: spendValue,
      annualReturnRate,
      dividendYield: currentYield,
      contribution: annualContribution,
      dividendTaxRate: 1,
    });
    spendValue = spendResult.value;
    cumulativeDividendSpend += 0;

    if (!fireYearReinvest && reinvestValue >= fireTargetKRW) {
      fireYearReinvest = y;
    }
    if (!fireYearSpend && spendValue >= fireTargetKRW) {
      fireYearSpend = y;
    }

    projections.push({
      year: y,
      spend: {
        portfolioValueKRW: spendValue,
        annualDividendKRW: 0,
        cumulativeDividendKRW: cumulativeDividendSpend,
      },
      reinvest: {
        portfolioValueKRW: reinvestValue,
        annualDividendKRW: reinvestResult.dividendKRW,
        cumulativeDividendKRW: cumulativeDividendReinvest,
      },
      fireTargetKRW,
      isFireAchieved: reinvestValue >= fireTargetKRW,
    });
  }

  const last = projections[projections.length - 1];
  return {
    projections,
    fireTargetKRW: baseFireTargetKRW,
    fireYearReinvest,
    fireYearSpend,
    summary: {
      reinvest: {
        finalValueKRW: last.reinvest.portfolioValueKRW,
        totalDividendKRW: last.reinvest.cumulativeDividendKRW,
        yearsToFire: fireYearReinvest ? `${fireYearReinvest}년` : `${years}년 내 도달 못함`,
      },
      spend: {
        finalValueKRW: last.spend.portfolioValueKRW,
        totalDividendKRW: last.spend.cumulativeDividendKRW,
        yearsToFire: fireYearSpend ? `${fireYearSpend}년` : `${years}년 내 도달 못함`,
      },
    },
  };
}

export function simulatePostFireDrawdown(
  portfolioValueKRW: number,
  monthlyExpensesKRW: number,
  annualReturnRate: number,
  annualDividendYield: number,
  dividendTaxRate: number,
  inflationRate: number,
  maxYears: number,
): DrawdownResult {
  let value = portfolioValueKRW;
  let expenses = monthlyExpensesKRW * 12;
  const years: DrawdownYearData[] = [];
  let survivedYears = 0;

  for (let y = 1; y <= maxYears; y++) {
    const annualReturn = Math.round(value * annualReturnRate);
    const grossDividend = Math.round(value * annualDividendYield);
    const netDividend = Math.round(grossDividend * (1 - dividendTaxRate));
    const inflatedExpenses = Math.round(expenses * Math.pow(1 + inflationRate, y - 1));

    value = Math.round(value + annualReturn + netDividend - inflatedExpenses);

    years.push({
      year: y,
      portfolioValueKRW: value,
      withdrawalKRW: inflatedExpenses,
      annualReturnKRW: annualReturn + netDividend,
      annualDividendKRW: grossDividend,
    });

    if (value > 0) survivedYears = y;
    if (value <= 0) break;
  }

  return {
    years,
    survivedYears,
    initialPortfolioKRW: portfolioValueKRW,
    withdrawalRate: (monthlyExpensesKRW * 12) / portfolioValueKRW,
    success: value > 0,
  };
}

export function runMonteCarlo(
  input: DripInput,
  simulations: number = 1000,
  returnStd: number = DEFAULT_RETURN_STD,
): MonteCarloResult {
  const allFinalValues: number[] = [];
  const yearlyValues: Map<number, number[]> = new Map();

  let successes = 0;

  for (let s = 0; s < simulations; s++) {
    let value = input.currentValueKRW;
    const baseTarget = input.monthlyExpensesKRW * 12 * FIRE_MULTIPLIER;
    let reachedFire = false;

    for (let y = 1; y <= input.years; y++) {
      const randomReturn = normalRandom(input.annualReturnRate, returnStd);
      const fireTarget = Math.round(baseTarget * Math.pow(1 + input.inflationRate, y));
      const currentYield = input.annualDividendYield * Math.pow(1 + input.dividendGrowthRate, y - 1);
      const annualContribution = Math.round(
        input.monthlyContributionKRW * 12 * Math.pow(1 + input.contributionGrowthRate, y - 1),
      );

      const result = simulateYear({
        value,
        annualReturnRate: input.annualReturnRate,
        dividendYield: currentYield,
        contribution: annualContribution,
        dividendTaxRate: input.dividendTaxRate,
        randomReturn,
      });
      value = result.value;

      if (!reachedFire && value >= fireTarget) {
        reachedFire = true;
      }

      if (!yearlyValues.has(y)) yearlyValues.set(y, []);
      yearlyValues.get(y)!.push(value);
    }

    allFinalValues.push(value);
    if (reachedFire) successes++;
  }

  const sorted = [...allFinalValues].sort((a, b) => a - b);
  const p5Idx = Math.round(simulations * 0.05);
  const p50Idx = Math.round(simulations * 0.5);
  const p95Idx = Math.round(simulations * 0.95);

  const yearlyPercentiles: MonteCarloPercentile[] = [];
  for (let y = 1; y <= input.years; y++) {
    const vals = yearlyValues.get(y) ?? [];
    vals.sort((a, b) => a - b);
    yearlyPercentiles.push({
      year: y,
      p5: vals[Math.round(vals.length * 0.05)] ?? 0,
      p25: vals[Math.round(vals.length * 0.25)] ?? 0,
      median: vals[Math.round(vals.length * 0.5)] ?? 0,
      p75: vals[Math.round(vals.length * 0.75)] ?? 0,
      p95: vals[Math.round(vals.length * 0.95)] ?? 0,
    });
  }

  return {
    simulations,
    successRate: (successes / simulations) * 100,
    medianFinalValueKRW: sorted[p50Idx] ?? 0,
    percentile5FinalValueKRW: sorted[p5Idx] ?? 0,
    percentile95FinalValueKRW: sorted[p95Idx] ?? 0,
    yearlyPercentiles,
  };
}

export function runSensitivityAnalysis(input: DripInput): SensitivityItem[] {
  const variables: { key: keyof DripInput; label: string }[] = [
    { key: 'annualReturnRate', label: '연 수익률' },
    { key: 'annualDividendYield', label: '배당률' },
    { key: 'dividendGrowthRate', label: '배당 성장률' },
    { key: 'monthlyExpensesKRW', label: '월 생활비' },
    { key: 'monthlyContributionKRW', label: '월 추가 투자금' },
    { key: 'inflationRate', label: '인플레이션' },
  ];

  function getFireYear(input: DripInput): string {
    const result = simulateDrip(input);
    return result.summary.reinvest.yearsToFire;
  }

  const baseYears = getFireYear(input);

  const items: SensitivityItem[] = variables.map(({ key, label }) => {
    const base = input[key] as number;

    const plus = { ...input, [key]: base * 1.2 };
    const minus = { ...input, [key]: base * 0.8 };

    const plusYears = getFireYear(plus);
    const minusYears = getFireYear(minus);

    return {
      variable: key,
      label,
      baseYears,
      plus20Years: plusYears,
      minus20Years: minusYears,
      impactRank: 0,
    };
  });

  items.sort((a, b) => {
    const aDiff = Math.abs(diffWeight(a.plus20Years, a.minus20Years, baseYears));
    const bDiff = Math.abs(diffWeight(b.plus20Years, b.minus20Years, baseYears));
    return bDiff - aDiff;
  });

  items.forEach((item, idx) => {
    item.impactRank = idx + 1;
  });

  return items;
}

function diffWeight(p: string, m: string, base: string): number {
  const extract = (s: string) => {
    const m2 = s.match(/(\d+)/);
    return m2 ? parseInt(m2[1]) : 0;
  };
  return Math.abs(extract(p) - extract(base)) + Math.abs(extract(m) - extract(base));
}

export function exportProjectionCSV(projections: DripYearData[]): string {
  const header = '년차,재투자_포트폴리오,재투자_연배당,재투자_누적배당,소비_포트폴리오,FIRE목표,FIRE달성여부';
  const rows = projections.map((p) =>
    [
      p.year,
      p.reinvest.portfolioValueKRW,
      p.reinvest.annualDividendKRW,
      p.reinvest.cumulativeDividendKRW,
      p.spend.portfolioValueKRW,
      p.fireTargetKRW,
      p.isFireAchieved ? 'Y' : 'N',
    ].join(','),
  );
  return [header, ...rows].join('\n');
}

export const DEFAULT_DRIP_INPUT: DripInput = {
  currentValueKRW: 50_000_000,
  annualDividendYield: 0.035,
  dividendGrowthRate: 0.03,
  monthlyExpensesKRW: 2_000_000,
  monthlyContributionKRW: 1_000_000,
  years: 10,
  annualReturnRate: 0.05,
  inflationRate: 0.03,
  dividendTaxRate: 0.154,
  contributionGrowthRate: 0.03,
};
