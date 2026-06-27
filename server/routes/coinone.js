import { Router } from 'express';
import CryptoJS from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';

export const coinoneRouter = Router();

const COINONE_API = 'https://api.coinone.co.kr';

// GET /api/coinone/ticker?currency=btc
coinoneRouter.get('/ticker', async (req, res) => {
  try {
    const { currency } = req.query;
    if (!currency) {
      return res.status(400).json({ error: 'currency query parameter is required' });
    }
    const resp = await fetch(`${COINONE_API}/ticker?currency=${currency.toLowerCase()}`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!resp.ok) {
      return res.status(resp.status).json({ error: `CoinOne API error: ${resp.status}` });
    }
    const data = await resp.json();
    res.json(data);
  } catch (err) {
    console.error('CoinOne ticker proxy error:', err);
    res.status(502).json({ error: 'Failed to fetch CoinOne ticker', message: err.message });
  }
});

// POST /api/coinone/balance
// Body: { access_token, secret_key }
coinoneRouter.post('/balance', async (req, res) => {
  try {
    const { access_token, secret_key } = req.body;
    if (!access_token || !secret_key) {
      return res.status(400).json({ error: 'access_token and secret_key are required' });
    }

    const payload = { access_token, nonce: uuidv4() };
    const payloadString = JSON.stringify(payload);
    const payloadBase64 = Buffer.from(payloadString).toString('base64');
    const signature = CryptoJS.HmacSHA512(
      payloadBase64,
      secret_key.toUpperCase()
    ).toString(CryptoJS.enc.Hex);

    const resp = await fetch(`${COINONE_API}/v2.1/account/balance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-COINONE-PAYLOAD': payloadBase64,
        'X-COINONE-SIGNATURE': signature,
      },
      body: payloadString,
      signal: AbortSignal.timeout(15000),
    });

    const data = await resp.json();
    res.json(data);
  } catch (err) {
    console.error('CoinOne balance proxy error:', err);
    res.status(502).json({ error: 'Failed to fetch CoinOne balance', message: err.message });
  }
});
