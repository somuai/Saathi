import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  chatHandler,
  waitlistHandler,
  healthHandler,
  eventHandler,
  pulseHandler,
  avatarSessionHandler,
  conversationStatusHandler,
  conversationEndHandler,
  conversationSummaryHandler,
} from './handlers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

const origins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
if (process.env.PUBLIC_ORIGIN) origins.push(process.env.PUBLIC_ORIGIN);
if (process.env.RENDER_EXTERNAL_URL) origins.push(process.env.RENDER_EXTERNAL_URL);

app.use(cors({ origin: origins }));
app.use(express.json({ limit: '32kb' }));

app.get('/api/health', healthHandler);
app.get('/api/pulse', pulseHandler);
app.post('/api/chat', chatHandler);
app.post('/api/waitlist', waitlistHandler);
app.post('/api/event', eventHandler);
app.post('/api/avatar-session', avatarSessionHandler);
app.get('/api/conversation/:id', conversationStatusHandler);
app.post('/api/conversation/:id/end', conversationEndHandler);
app.post('/api/conversation/:id/summary', conversationSummaryHandler);

if (process.env.NODE_ENV === 'production') {
  const dist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(dist));
  app.get(/^(?!\/api).*/, (req, res, next) => {
    if (req.method !== 'GET') return next();
    res.sendFile(path.join(dist, 'index.html'), (err) => {
      if (err) next();
    });
  });
}

app.listen(PORT, () => {
  console.log(`Saathi server on http://localhost:${PORT}`);
});

export default app;
