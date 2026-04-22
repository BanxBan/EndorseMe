import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../db';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_dev';

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  const { data, error } = await supabase.from('users').select('*').eq('username', username).single();
  if (error || !data) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }

  const validPassword = await bcrypt.compare(password, data.passwordHash);
  if (!validPassword) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }

  const token = jwt.sign({ username: data.username, id: data.id }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, username: data.username });
});

export default router;
