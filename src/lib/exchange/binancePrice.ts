export async function getBinancePrice(symbol: string): Promise<number> {
  try {
    const resp = await fetch(`/binance/api/v3/ticker/price?symbol=${symbol}`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    return parseFloat(data.price);
  } catch (err) {
    console.warn(`getBinancePrice(${symbol}) failed, using fallback:`, err);
    return 65000;
  }
}
