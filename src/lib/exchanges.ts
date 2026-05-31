export type ExchangeId = 'coinone' | 'upbit' | 'bithumb' | 'korbit' | 'binance' | 'bybit' | 'okx' | 'kraken';

interface ExchangeKeys {
  access_token?: string;
  secret_key?: string;
  apiKey?: string;
  apiSecret?: string;
}

interface ExchangeConnection {
  status: 'connected' | 'disconnected';
  keys?: ExchangeKeys;
}

type Connections = Record<ExchangeId, ExchangeConnection>;

export function loadConnections(): Connections {
  try {
    const raw = localStorage.getItem('exchange-connections');
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to load exchange connections:', err);
  }
  return {
    coinone: { status: 'disconnected' },
    upbit: { status: 'disconnected' },
    bithumb: { status: 'disconnected' },
    korbit: { status: 'disconnected' },
    binance: { status: 'disconnected' },
    bybit: { status: 'disconnected' },
    okx: { status: 'disconnected' },
    kraken: { status: 'disconnected' },
  };
}
