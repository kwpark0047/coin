import { loadConnections } from '@/lib/exchanges';

interface BinanceBalance {
  asset: string;
  free: string;
  locked: string;
}

export async function fetchBinanceBalances(): Promise<BinanceBalance[]> {
  const connections = await loadConnections();
  const binanceKeys = connections.binance?.keys;

  if (!binanceKeys?.apiKey || !binanceKeys?.apiSecret) {
    console.warn('Binance API is not configured.');
    return [];
  }

  try {
    const resp = await fetch('/api/binance/balance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: binanceKeys.apiKey,
        apiSecret: binanceKeys.apiSecret,
      }),
    });

    if (!resp.ok) {
      const errData = await resp.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${resp.status}`);
    }

    const data = await resp.json();
    return data.balances || [];
  } catch (err) {
    console.error('fetchBinanceBalances error:', err);
    return [];
  }
}

export async function fetchUSDTPrices(symbols: string[]): Promise<Record<string, number>> {
  try {
    const resp = await fetch('/api/binance/price-multi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbols }),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return await resp.json();
  } catch (err) {
    console.warn('fetchUSDTPrices failed, using fallback:', err);
    const prices: Record<string, number> = {};
    for (const sym of symbols) {
      if (sym === 'BTC') prices[sym] = 65000;
      else if (sym === 'ETH') prices[sym] = 3500;
      else if (sym === 'SOL') prices[sym] = 145;
      else prices[sym] = 0;
    }
    return prices;
  }
}
