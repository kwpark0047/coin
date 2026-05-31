export interface DripInput {
  currentValueKRW: number;
  annualDividendYield: number;
  dividendGrowthRate: number;
  monthlyExpensesKRW: number;
  monthlyContributionKRW: number;
  years: number;
  annualReturnRate: number;
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

export const FIRE_MULTIPLIER = 25;

export function simulateDrip(input: DripInput): DripResult {
  const {
    currentValueKRW,
    annualDividendYield,
    dividendGrowthRate,
    monthlyExpensesKRW,
    monthlyContributionKRW,
    years,
    annualReturnRate,
  } = input;

  const fireTargetKRW = monthlyExpensesKRW * 12 * FIRE_MULTIPLIER;

  let reinvestValue = currentValueKRW;
  let spendValue = currentValueKRW;
  let reinvestDividend = 0;
  let spendDividend = 0;
  let fireYearReinvest: number | null = null;
  let fireYearSpend: number | null = null;

  const projections: DripYearData[] = [];
  let cumulativeDividendReinvest = 0;
  let cumulativeDividendSpend = 0;

  for (let y = 1; y <= years; y++) {
    const currentYield = annualDividendYield * Math.pow(1 + dividendGrowthRate, y - 1);

    const divRateReinvest = reinvestValue * currentYield;
    const divRateSpend = spendValue * currentYield;

    reinvestDividend = Math.round(divRateReinvest);
    spendDividend = Math.round(divRateSpend);

    cumulativeDividendReinvest += reinvestDividend;
    cumulativeDividendSpend += spendDividend;

    const annualContribution = monthlyContributionKRW * 12;
    const annualReturnReinvest = Math.round(reinvestValue * annualReturnRate);

    reinvestValue = Math.round(
      reinvestValue + annualReturnReinvest + reinvestDividend + annualContribution,
    );

    const annualReturnSpend = Math.round(spendValue * annualReturnRate);
    spendValue = Math.round(
      spendValue + annualReturnSpend + annualContribution,
    );
    spendDividend = 0;

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
        annualDividendKRW: spendDividend,
        cumulativeDividendKRW: cumulativeDividendSpend,
      },
      reinvest: {
        portfolioValueKRW: reinvestValue,
        annualDividendKRW: reinvestDividend,
        cumulativeDividendKRW: cumulativeDividendReinvest,
      },
      fireTargetKRW,
      isFireAchieved: reinvestValue >= fireTargetKRW,
    });
  }

  const last = projections[projections.length - 1];
  return {
    projections,
    fireTargetKRW,
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

export const DEFAULT_DRIP_INPUT: DripInput = {
  currentValueKRW: 50_000_000,
  annualDividendYield: 0.035,
  dividendGrowthRate: 0.03,
  monthlyExpensesKRW: 2_000_000,
  monthlyContributionKRW: 1_000_000,
  years: 10,
  annualReturnRate: 0.05,
};
