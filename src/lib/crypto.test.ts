import { describe, it, expect, beforeEach } from 'vitest';
import { encryptValue, decryptValue, isSessionKeyAvailable, clearSessionKey } from './crypto';

beforeEach(() => {
  clearSessionKey();
});

describe('encryptValue / decryptValue', () => {
  it('문자열을 암호화한 후 복호화하면 원본과 같아야 한다', async () => {
    const original = 'test-api-key-12345';
    const encrypted = await encryptValue(original);
    expect(encrypted).not.toBe(original);
    const decrypted = await decryptValue(encrypted);
    expect(decrypted).toBe(original);
  });

  it('한글 문자열도 암호화/복호화가 가능해야 한다', async () => {
    const original = '코인원 API 키 테스트';
    const encrypted = await encryptValue(original);
    const decrypted = await decryptValue(encrypted);
    expect(decrypted).toBe(original);
  });

  it('특수 문자가 포함된 문자열도 처리 가능해야 한다', async () => {
    const original = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
    const encrypted = await encryptValue(original);
    const decrypted = await decryptValue(encrypted);
    expect(decrypted).toBe(original);
  });

  it('빈 문자열을 암호화/복호화할 수 있어야 한다', async () => {
    const original = '';
    const encrypted = await encryptValue(original);
    const decrypted = await decryptValue(encrypted);
    expect(decrypted).toBe(original);
  });

  it('변조된 암호문은 복호화에 실패하고 null을 반환해야 한다', async () => {
    const encrypted = await encryptValue('secret');
    const tampered = encrypted.slice(0, -1) + 'X';
    const decrypted = await decryptValue(tampered);
    expect(decrypted).toBeNull();
  });

  it('잘못된 Base64 문자열은 복호화에 실패하고 null을 반환해야 한다', async () => {
    const decrypted = await decryptValue('this-is-not-valid-base64!!!');
    expect(decrypted).toBeNull();
  });
});

describe('isSessionKeyAvailable', () => {
  it('암호화 후 세션 키가 존재해야 한다', async () => {
    expect(isSessionKeyAvailable()).toBe(false);
    await encryptValue('test');
    expect(isSessionKeyAvailable()).toBe(true);
  });

  it('clearSessionKey 호출 후 세션 키가 제거되어야 한다', async () => {
    await encryptValue('test');
    expect(isSessionKeyAvailable()).toBe(true);
    clearSessionKey();
    expect(isSessionKeyAvailable()).toBe(false);
  });

  it('이전 키로 암호화된 데이터를 새 키로 복호화할 수 없어야 한다', async () => {
    const encrypted = await encryptValue('secret');
    clearSessionKey();
    await encryptValue('dummy');
    const decrypted = await decryptValue(encrypted);
    expect(decrypted).toBeNull();
  });
});
