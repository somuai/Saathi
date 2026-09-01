import express from 'express';
import cors from 'cors';
import { chatHandler, waitlistHandler, healthHandler } from './handlers.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
app.use(express.json({ limit: '32kb' }));

app.get('/api/health', healthHandler);
app.post('/api/chat', chatHandler);
app.post('/api/waitlist', waitlistHandler);

app.listen(PORT, () => {
  console.log(`GriefCompanion server on http://localhost:${PORT}`);
});

export default app;
