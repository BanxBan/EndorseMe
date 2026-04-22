import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import apiRoutes from './routes/api';

const app = express();
app.use(cors());
app.use(express.json());

// Standard mounts
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);

// Fallback mounts for Vercel (in case /api or /auth is stripped)
app.use('/', authRoutes);
app.use('/', apiRoutes);

// Version check to verify deployment
app.get('/api/version', (req, res) => {
  res.json({ version: '1.1.0', status: 'ready' });
});

// Debug: catch-all to see what Express receives on Vercel
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Route not found',
    method: req.method,
    url: req.url,
    path: req.path,
    msg: 'If you see this JSON, the latest backend code IS deployed.'
  });
});



if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
  });
}

export default app;
