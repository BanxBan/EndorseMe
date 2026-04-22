import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import apiRoutes from './routes/api';

const app = express();
app.use(cors());
app.use(express.json());

// Mount with prefix (for local dev with Vite proxy)
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);

// Mount without prefix (for Vercel, which strips /api prefix)
app.use('/', authRoutes);
app.use('/', apiRoutes);



if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
  });
}

export default app;
