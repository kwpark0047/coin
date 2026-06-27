import { encryptValue, decryptValue, isSessionKeyAvailable } from './crypto';

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

export type Connections = Record<ExchangeId, ExchangeConnection>;

const STORAGE_KEY = 'exchange-connections';

function defaultConnections(): Connections {
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

let cachedConnections: Connections | null = null;

export async function loadConnections(passphrase?: string): Promise<Connections> {
  if (cachedConnections && !passphrase) return cachedConnections;

  try {
    const encrypted = localStorage.getItem(STORAGE_KEY);
    if (!encrypted) return defaultConnections();

    if (encrypted.startsWith('enc:')) {
      if (!passphrase && !isSessionKeyAvailable()) {
        console.warn('Session key not available - encrypted keys cannot be decrypted');
        return defaultConnections();
      }
      const decrypted = await decryptValue(encrypted.slice(4), passphrase);
      if (decrypted) {
        cachedConnections = JSON.parse(decrypted);
        return cachedConnections!;
      }
      if (!passphrase) {
        console.warn('Failed to decrypt connections, session key may have changed');
      }
      return defaultConnections();
    }

    cachedConnections = JSON.parse(encrypted) as Connections;
    return cachedConnections;
  } catch (err) {
    console.warn('Failed to load exchange connections:', err);
    return defaultConnections();
  }
}

export function getCachedConnections(): Connections {
  if (cachedConnections) return cachedConnections;
  return defaultConnections();
}

export async function saveConnections(connections: Connections, passphrase?: string): Promise<void> {
  cachedConnections = connections;
  try {
    const plaintext = JSON.stringify(connections);
    const encrypted = await encryptValue(plaintext, passphrase);
    localStorage.setItem(STORAGE_KEY, 'enc:' + encrypted);
  } catch (err) {
    console.warn('Failed to save exchange connections:', err);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(connections));
  }
}
