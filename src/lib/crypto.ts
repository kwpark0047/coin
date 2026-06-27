const SESSION_KEY_ID = 'wemarket-session-key-v2';
const PBKDF2_SALT = 'wemarket-coin-salt';

function keyToString(key: CryptoKey): Promise<string> {
  return crypto.subtle.exportKey('raw', key).then((raw) =>
    btoa(String.fromCharCode(...new Uint8Array(raw)))
  );
}

function stringToKey(base64: string): Promise<CryptoKey> {
  const raw = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

async function getSessionKey(): Promise<CryptoKey> {
  const existing = sessionStorage.getItem(SESSION_KEY_ID);
  if (existing) {
    try {
      return await stringToKey(existing);
    } catch {
      sessionStorage.removeItem(SESSION_KEY_ID);
    }
  }
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  sessionStorage.setItem(SESSION_KEY_ID, await keyToString(key));
  return key;
}

async function deriveKeyFromPassphrase(passphrase: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(passphrase), 'PBKDF2', false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: encoder.encode(PBKDF2_SALT), iterations: 600_000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptWithKey(key: CryptoKey, plaintext: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);
  return btoa(String.fromCharCode(...combined));
}

async function decryptWithKey(key: CryptoKey, encryptedBase64: string): Promise<string | null> {
  try {
    const combined = Uint8Array.from(atob(encryptedBase64), (c) => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
    return new TextDecoder().decode(decrypted);
  } catch (err) {
    console.warn('Failed to decrypt value:', err);
    return null;
  }
}

export async function encryptValue(plaintext: string, passphrase?: string): Promise<string> {
  const key = passphrase ? await deriveKeyFromPassphrase(passphrase) : await getSessionKey();
  return encryptWithKey(key, plaintext);
}

export async function decryptValue(encryptedBase64: string, passphrase?: string): Promise<string | null> {
  const key = passphrase ? await deriveKeyFromPassphrase(passphrase) : await getSessionKey();
  return decryptWithKey(key, encryptedBase64);
}

export function isSessionKeyAvailable(): boolean {
  return !!sessionStorage.getItem(SESSION_KEY_ID);
}

export function clearSessionKey(): void {
  sessionStorage.removeItem(SESSION_KEY_ID);
}
