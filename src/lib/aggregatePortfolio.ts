import type { PortfolioHolding, PortfolioSummary } from './portfolioModel';
import { summarizePortfolio } from './portfolioModel';
import { fetchBinanceBalances, fetchUSDTPrices } from './exchange/binancePortfolio';
import { fetchCoinOneBalances, fetchCoinOneTicker } from './exchange/coinone';
import { loadConnections } from './exchanges';
import { getExchangeRate } from './exchangeRate';

export type AssetClass = 'korean' | 'us' | 'crypto';

export interface ClassBreakdown {
  assetClass: AssetClass;
  label: string;
  valueKRW: number;
  color: string;
  holdings: PortfolioHolding[];
}

export interface AggregateResult {
  holdings: PortfolioHolding[];
  summary: PortfolioSummary;
  classBreakdown: ClassBreakdown[];
  exchangeRate: number;
  exchangeRateTimestamp: number;
  errors: string[];
}

/** 거래소별 자산 분류 */
function classifyAsset(exchange: string, symbol: string): AssetClass {
  if (exchange === 'coinone' || exchange === 'upbit' || exchange === 'bithumb' || exchange === 'korbit') {
    if (symbol === 'KRW') return 'korean';
    return 'crypto';
  }
  if (exchange === 'binance' || exchange === 'bybit' || exchange === 'okx' || exchange === 'kraken') {
    if (symbol === 'USDT' || symbol === 'BUSD' || symbol === 'USDC') return 'us';
    return 'crypto';
  }
  return 'crypto';
}

const ASSET_CLASS_COLORS: Record<AssetClass, string> = {
  korean: 'hsl(var(--primary))',
  us: 'hsl(var(--accent))',
  crypto: 'hsl(var(--warning))',
};

const ASSET_CLASS_LABELS: Record<AssetClass, string> = {
  korean: '\uad6d\ub0b4 \uc790\uc0b0',
  us: '\ubbf8\uad6d \uc790\uc0b0',
  crypto: '\uc554\ud638\ud654\ud3d0',
};

export async function aggregatePortfolio(): Promise<AggregateResult> {
  const connections = loadConnections();
  const { krwPerUsdt } = await getExchangeRate();
  const holdings: PortfolioHolding[] = [];
  const errors: string[] = [];

  // --- Binance (USD 기반 글로벌 거래소) ---
  if (connections.binance?.status === 'connected') {
    try {
      const balances = await fetchBinanceBalances();
      const symbols = balances.map(b => b.asset);
      const prices = await fetchUSDTPrices(symbols);

      for (const balance of balances) {
        const amount = Number(balance.free) + Number(balance.locked);
        if (amount <= 0) continue;
        const priceUSDT = prices[balance.asset] ?? 0;
        const priceKRW = priceUSDT * krwPerUsdt;
        holdings.push({
          symbol: balance.asset,
          amount,
          priceKRW,
          valueKRW: amount * priceKRW,
          exchange: 'binance',
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Binance fetch failed';
      errors.push(`Binance: ${msg}`);
      console.error('aggregatePortfolio Binance error:', err);
    }
  }

  // --- CoinOne (KRW 기반 국내 거래소) ---
  if (connections.coinone?.status === 'connected') {
    try {
      const balances = await fetchCoinOneBalances();
      for (const bal of balances) {
        const amount = parseFloat(bal.available) + parseFloat(bal.limit);
        if (amount <= 0) continue;

        const symbol = bal.currency.toLowerCase();

        if (symbol === 'krw') {
          holdings.push({
            symbol: 'KRW',
            amount,
            priceKRW: 1,
            valueKRW: amount,
            exchange: 'coinone',
          });
          continue;
        }

        try {
          const { price } = await fetchCoinOneTicker(symbol);
          holdings.push({
            symbol: symbol.toUpperCase(),
            amount,
            priceKRW: price,
            valueKRW: amount * price,
            exchange: 'coinone',
          });
        } catch {
          console.warn(`aggregatePortfolio: CoinOne ticker fetch failed for ${symbol}`);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'CoinOne fetch failed';
      errors.push(`CoinOne: ${msg}`);
      console.error('aggregatePortfolio CoinOne error:', err);
    }
  }

  // --- 자산군 분류 ---
  const classMap = new Map<AssetClass, PortfolioHolding[]>();
  for (const holding of holdings) {
    const ac = classifyAsset(holding.exchange, holding.symbol);
    if (!classMap.has(ac)) classMap.set(ac, []);
    classMap.get(ac)!.push(holding);
  }

  const classBreakdown: ClassBreakdown[] = (['korean', 'us', 'crypto'] as AssetClass[]).map((ac) => {
    const h = classMap.get(ac) ?? [];
    return {
      assetClass: ac,
      label: ASSET_CLASS_LABELS[ac],
      valueKRW: h.reduce((sum, hh) => sum + hh.valueKRW, 0),
      color: ASSET_CLASS_COLORS[ac],
      holdings: h,
    };
  });

  const connectedCount = Object.values(connections).filter(c => c.status === 'connected').length;
  const summary = summarizePortfolio(holdings, connectedCount);

  return {
    holdings,
    summary,
    classBreakdown,
    exchangeRate: krwPerUsdt,
    exchangeRateTimestamp: Date.now(),
    errors,
  };
}
