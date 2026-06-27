import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { coinoneRouter } from './routes/coinone.js';
import { binanceRouter } from './routes/binance.js';
import { keysRouter } from './routes/keys.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true }));
app.use(express.json());

// API routes
app.use('/api/coinone', coinoneRouter);
app.use('/api/binance', binanceRouter);
app.use('/api/keys', keysRouter);

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`[Wemarket] API server running on http://localhost:${PORT}`);
});
