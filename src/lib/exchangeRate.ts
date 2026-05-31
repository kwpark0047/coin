import { fetchCoinOneTicker } from './exchange/coinone';
import { getBinancePrice } from './exchange/binancePrice';

export interface ExchangeRate {
  krwPerUsdt: number;
  timestamp: number;
  btcKrw: number;
  btcUsdt: number;
}

let cached: ExchangeRate | null = null;
let lastFetch = 0;
const CACHE_TTL_MS = 60_000; // 1분 캐시

export async function getExchangeRate(force = false): Promise<ExchangeRate> {
  const now = Date.now();
  if (!force && cached && now - lastFetch < CACHE_TTL_MS) {
    return cached;
  }

  const [coinoneTicker, binanceBtcPrice] = await Promise.all([
    fetchCoinOneTicker('btc'),
    getBinancePrice('BTCUSDT'),
  ]);

  const btcKrw = coinoneTicker.price;
  const btcUsdt = binanceBtcPrice;
  const krwPerUsdt = btcUsdt > 0 ? btcKrw / btcUsdt : 0;

  cached = { krwPerUsdt, timestamp: now, btcKrw, btcUsdt };
  lastFetch = now;
  return cached;
}

export function clearExchangeRateCache() {
  cached = null;
  lastFetch = 0;
}
