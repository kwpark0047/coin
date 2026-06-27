import { Router } from 'express';
import CryptoJS from 'crypto-js';

export const keysRouter = Router();

keysRouter.post('/encrypt', (req, res) => {
  try {
    const { plaintext, passphrase } = req.body;
    if (!plaintext || !passphrase) {
      return res.status(400).json({ error: 'plaintext and passphrase are required' });
    }
    const encrypted = CryptoJS.AES.encrypt(plaintext, passphrase).toString();
    res.json({ encrypted });
  } catch (err) {
    console.error('Encryption error:', err);
    res.status(500).json({ error: 'Encryption failed' });
  }
});

keysRouter.post('/decrypt', (req, res) => {
  try {
    const { encrypted, passphrase } = req.body;
    if (!encrypted || !passphrase) {
      return res.status(400).json({ error: 'encrypted and passphrase are required' });
    }
    const bytes = CryptoJS.AES.decrypt(encrypted, passphrase);
    const plaintext = bytes.toString(CryptoJS.enc.Utf8);
    if (!plaintext) {
      return res.status(400).json({ error: 'Decryption failed - invalid passphrase' });
    }
    res.json({ plaintext });
  } catch (err) {
    console.error('Decryption error:', err);
    res.status(500).json({ error: 'Decryption failed' });
  }
});
