// src/lib/exchange/coinone.ts
import CryptoJS from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';
import { loadConnections } from '@/lib/exchanges';

export interface CoinOneTickerResponse {
  currency: string;
  price: string;
  yesterday_last: string;
  last: string;
  timestamp: number;
}

export async function fetchCoinOneTicker(
  symbol: string
): Promise<{ price: number; changePercent: number }> {
  const url = `/coinone/ticker?currency=${symbol.toLowerCase()}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`CoinOne ticker request failed with status ${resp.status}`);
  }
  const data: CoinOneTickerResponse = await resp.json();
  const price = parseFloat(data.price);
  const prev = parseFloat(data.yesterday_last);
  const changePercent = prev ? ((price - prev) / prev) * 100 : 0;
  return { price, changePercent };
}

/**
 * Fetch CoinOne Balances via Private API V2.1
 */
export async function fetchCoinOneBalances() {
  const connections = loadConnections();
  const coinoneKeys = connections.coinone?.keys;
  
  if (!coinoneKeys?.access_token || !coinoneKeys?.secret_key) {
    console.warn('CoinOne API is not configured.');
    return [];
  }

  const { access_token, secret_key } = coinoneKeys;
  const url = '/coinone/v2.1/account/balance';
  const payload = {
    access_token,
    nonce: uuidv4()
  };

  const payloadString = JSON.stringify(payload);
  const payloadBase64 = btoa(payloadString);
  const signature = CryptoJS.HmacSHA512(payloadBase64, secret_key.toUpperCase()).toString(CryptoJS.enc.Hex);

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-COINONE-PAYLOAD': payloadBase64,
      'X-COINONE-SIGNATURE': signature
    },
    body: payloadString
  });

  if (!resp.ok) {
    throw new Error(`CoinOne balance request failed with status ${resp.status}`);
  }

  const data = await resp.json();
  if (data.result !== 'success') {
    if (data.error_msg && data.error_msg.includes('IP address is not allowed')) {
       throw new Error(`코인원 API 오류: 등록되지 않은 IP 주소입니다`);
    }
    throw new Error(`CoinOne API Error: ${data.error_msg}`);
  }
  
  return data.balances || [];
}

/**
 * Generate actual portfolio summary using CoinOne Balances and Tickers
 */
export async function getCoinOnePortfolioSummary() {
  try {
    const balances = await fetchCoinOneBalances();
    if (!balances || balances.length === 0) {
      return {
        portfolioValueKRW: 0,
        btcRatio: 0,
        altRatio: 0,
        dailyPnL: 0,
        trades24h: 0,
      };
    }

    let btcValue = 0;
    let altValue = 0;
    let totalValue = 0;
    let dailyPnL = 0;

    for (const bal of balances) {
      // Coinone balance structure: { currency: 'btc', available: '0.1', limit: '0.0' }
      const amount = parseFloat(bal.available) + parseFloat(bal.limit); 
      if (amount <= 0) continue;

      const symbol = bal.currency.toLowerCase();
      
      if (symbol === 'krw') {
        totalValue += amount;
        altValue += amount;
        continue;
      }

      try {
        const { price, changePercent } = await fetchCoinOneTicker(symbol);
        const valueKRW = amount * price;
        totalValue += valueKRW;
        dailyPnL += valueKRW * (changePercent / 100);

        if (symbol === 'btc') {
          btcValue += valueKRW;
        } else {
          altValue += valueKRW;
        }
      } catch (err) {
        console.warn(`Failed to fetch ticker for ${symbol}`);
      }
    }

    const btcRatio = totalValue > 0 ? (btcValue / totalValue) * 100 : 0;
    const altRatio = totalValue > 0 ? (altValue / totalValue) * 100 : 0;

    return {
      portfolioValueKRW: Math.round(totalValue),
      btcRatio: Math.round(btcRatio),
      altRatio: Math.round(altRatio),
      dailyPnL: Math.round(dailyPnL),
      trades24h: 0,
    };
  } catch (error) {
    console.error('Failed to fetch CoinOne summary:', error);
    return {
      portfolioValueKRW: 0,
      btcRatio: 0,
      altRatio: 0,
      dailyPnL: 0,
      trades24h: 0,
    };
  }
}
