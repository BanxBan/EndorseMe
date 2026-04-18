import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { readDb } from '../db';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const db = readDb();
  
  const user = db.users.find((u: any) => u.username === username);
  if (!user) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }

  const token = jwt.sign({ username: user.username, id: user.id }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, username: user.username });
});

export default router;
