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
import {
  observatoryEventHandler,
  ratingHandler,
  kpisHandler,
  configGetHandler,
  configPatchHandler,
  scanHandler,
  evalHandler,
  experimentsHandler,
  privacyDeleteHandler,
  memoryHandler,
} from './observatory/http.js';

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
app.post('/api/observatory/event', observatoryEventHandler);
app.post('/api/observatory/rating', ratingHandler);
app.get('/api/observatory/kpis', kpisHandler);
app.get('/api/observatory/config', configGetHandler);
app.patch('/api/observatory/config', configPatchHandler);
app.post('/api/observatory/scan', scanHandler);
app.get('/api/observatory/eval', evalHandler);
app.get('/api/observatory/experiments', experimentsHandler);
app.post('/api/privacy/delete', privacyDeleteHandler);
app.get('/api/observatory/memory', memoryHandler);
app.post('/api/observatory/memory', memoryHandler);

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
