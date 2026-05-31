interface BinanceBalance {
  asset: string;
  free: string;
  locked: string;
}

export async function fetchBinanceBalances(): Promise<BinanceBalance[]> {
  // Binance API requires server-side proxy for security
  // Returning empty array as placeholder
  return [];
}

export async function fetchUSDTPrices(symbols: string[]): Promise<Record<string, number>> {
  // Mock prices for development
  const prices: Record<string, number> = {};
  for (const sym of symbols) {
    if (sym === 'BTC') prices[sym] = 65000;
    else if (sym === 'ETH') prices[sym] = 3500;
    else if (sym === 'SOL') prices[sym] = 145;
    else prices[sym] = 0;
  }
  return prices;
}
