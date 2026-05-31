export async function getBinancePrice(symbol: string): Promise<number> {
  try {
    const resp = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
    const data = await resp.json();
    return parseFloat(data.price);
  } catch (err) {
    console.warn(`getBinancePrice(${symbol}) failed, using fallback:`, err);
    return 65000;
  }
}
