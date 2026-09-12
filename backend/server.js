import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { db, initDatabase } from './db/index.js';
import authRoutes from './routes/auth.js';
import personRoutes from './routes/persons.js';
import eventRoutes from './routes/events.js';
import specimenRoutes from './routes/specimens.js';
import linkageRoutes from './routes/linkages.js';
import contactRoutes from './routes/contacts.js';
import analyticsRoutes from './routes/analytics.js';
import labRoutes from './routes/lab.js';
import { requireAuth } from './middleware/rbac.js';
import { errorHandler } from './utils/response.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);

app.use('/api', requireAuth);

app.use('/api/persons', personRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/specimens', specimenRoutes);
app.use('/api/linkages', linkageRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/lab', labRoutes);

app.use(errorHandler);

async function start() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`Backend server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();