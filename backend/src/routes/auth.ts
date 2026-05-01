import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { supabase } from '../db';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_dev';

router.post('/register', async (req, res) => {
  const { name, licenseNo, email, password } = req.body;
  const normalizedName = String(name || '').trim();
  const normalizedLicenseNo = String(licenseNo || '').trim();
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedPassword = String(password || '');

  if (!normalizedName || !normalizedLicenseNo || !normalizedEmail || !normalizedPassword) {
    return res.status(400).json({ message: 'Please complete all registration fields' });
  }

  if (normalizedLicenseNo.length < 5) {
    return res.status(400).json({ message: 'License No. is required and must be valid' });
  }

  const username = normalizedEmail;
  const passwordHash = await bcrypt.hash(normalizedPassword, 10);

  const { data: existingUser } = await supabase.from('users').select('id').eq('username', username).maybeSingle();
  if (existingUser) {
    return res.status(409).json({ message: 'Account already exists for this email' });
  }

  const { error } = await supabase.from('users').insert([{ 
    id: randomUUID(), 
    username, 
    passwordHash,
    name: normalizedName,
    licenseNo: normalizedLicenseNo
  }]);
  if (error) {
    return res.status(500).json({ message: 'Registration failed', error: error.message });
  }

  res.status(201).json({
    message: 'Account created successfully',
    user: { name: normalizedName, licenseNo: normalizedLicenseNo, email: username },
  });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const normalizedUsername = String(username || '').trim().toLowerCase();
  
  const { data, error } = await supabase.from('users').select('*').eq('username', normalizedUsername).single();
  if (error || !data) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }

  const validPassword = await bcrypt.compare(password, data.passwordHash);
  if (!validPassword) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }

  const token = jwt.sign({ username: data.username, id: data.id }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, username: data.username, name: data.name });
});

export default router;
