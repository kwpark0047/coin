export interface PortfolioHolding {
  symbol: string;
  amount: number;
  priceKRW: number;
  valueKRW: number;
  exchange: string;
}

export interface PortfolioSummary {
  portfolioValueKRW: number;
  totalValueKRW: number;
  btcValueKRW: number;
  altValueKRW: number;
  btcRatio: number;
  altRatio: number;
  dailyPnL: number;
  trades24h: number;
  holdingCount: number;
  connectedExchanges: number;
}

export function summarizePortfolio(
  holdings: PortfolioHolding[],
  connectedCount: number
): PortfolioSummary {
  let totalValueKRW = 0;
  let btcValueKRW = 0;
  let altValueKRW = 0;
  let dailyPnL = 0;

  for (const h of holdings) {
    totalValueKRW += h.valueKRW;
    if (h.symbol === 'BTC') {
      btcValueKRW += h.valueKRW;
    } else {
      altValueKRW += h.valueKRW;
    }
  }

  const btcRatio = totalValueKRW > 0 ? (btcValueKRW / totalValueKRW) * 100 : 0;
  const altRatio = totalValueKRW > 0 ? (altValueKRW / totalValueKRW) * 100 : 0;

  return {
    portfolioValueKRW: Math.round(totalValueKRW),
    totalValueKRW: Math.round(totalValueKRW),
    btcValueKRW: Math.round(btcValueKRW),
    altValueKRW: Math.round(altValueKRW),
    btcRatio: Math.round(btcRatio),
    altRatio: Math.round(altRatio),
    dailyPnL: Math.round(dailyPnL),
    trades24h: 0,
    holdingCount: holdings.length,
    connectedExchanges: connectedCount,
  };
}
