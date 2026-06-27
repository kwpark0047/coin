import { Router } from 'express';
import CryptoJS from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';

export const binanceRouter = Router();

const BINANCE_API = 'https://api.binance.com';

// GET /api/binance/price?symbol=BTCUSDT
binanceRouter.get('/price', async (req, res) => {
  try {
    const { symbol } = req.query;
    if (!symbol) {
      return res.status(400).json({ error: 'symbol query parameter is required' });
    }
    const resp = await fetch(`${BINANCE_API}/api/v3/ticker/price?symbol=${symbol}`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!resp.ok) {
      return res.status(resp.status).json({ error: `Binance API error: ${resp.status}` });
    }
    const data = await resp.json();
    res.json(data);
  } catch (err) {
    console.error('Binance price proxy error:', err);
    res.status(502).json({ error: 'Failed to fetch Binance price', message: err.message });
  }
});

// POST /api/binance/balance
// Body: { apiKey, apiSecret }
binanceRouter.post('/balance', async (req, res) => {
  try {
    const { apiKey, apiSecret } = req.body;
    if (!apiKey || !apiSecret) {
      return res.status(400).json({ error: 'apiKey and apiSecret are required' });
    }

    // Binance signed endpoint: GET /api/v3/account
    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}`;
    const signature = CryptoJS.HmacSHA256(queryString, apiSecret).toString(CryptoJS.enc.Hex);

    const resp = await fetch(`${BINANCE_API}/api/v3/account?${queryString}&signature=${signature}`, {
      headers: { 'X-MBX-APIKEY': apiKey },
      signal: AbortSignal.timeout(15000),
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      return res.status(resp.status).json({ error: `Binance API error: ${errorText}` });
    }

    const data = await resp.json();
    res.json(data);
  } catch (err) {
    console.error('Binance balance proxy error:', err);
    res.status(502).json({ error: 'Failed to fetch Binance balance', message: err.message });
  }
});

// POST /api/binance/price-multi
// Body: { symbols: string[], apiKey?, apiSecret? }
// Fetches prices for multiple symbols via Binance ticker API
binanceRouter.post('/price-multi', async (req, res) => {
  try {
    const { symbols } = req.body;
    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return res.status(400).json({ error: 'symbols array is required' });
    }

    const results = await Promise.all(
      symbols.map(async (symbol) => {
        try {
          const resp = await fetch(
            `${BINANCE_API}/api/v3/ticker/price?symbol=${symbol}USDT`,
            { signal: AbortSignal.timeout(8000) }
          );
          if (!resp.ok) return { symbol, price: 0 };
          const data = await resp.json();
          return { symbol, price: parseFloat(data.price) || 0 };
        } catch {
          return { symbol, price: 0 };
        }
      })
    );

    const priceMap = {};
    for (const r of results) {
      priceMap[r.symbol] = r.price;
    }
    res.json(priceMap);
  } catch (err) {
    console.error('Binance price-multi proxy error:', err);
    res.status(502).json({ error: 'Failed to fetch Binance prices', message: err.message });
  }
});
