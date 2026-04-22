import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client once for reuse
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_dev';

const app = express();

// Middleware - optimize for performance
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Cache for frequently accessed data
const cache = new Map();
const CACHE_TTL = 30 * 1000; // 30 seconds

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Routes
app.post('/auth/login', async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Patient routes (protected)
app.get('/api/patients', authenticateToken, async (req, res) => {
  try {
    const cacheKey = 'patients';
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.json(cached.data);
    }
    
    const { data, error } = await supabase.from('patients').select('*');
    if (error) return res.status(500).json({ error: error.message });
    
    const result = data.map(d => ({ ...d.data, id: d.id }));
    cache.set(cacheKey, { data: result, timestamp: Date.now() });
    
    res.json(result);
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/patients', authenticateToken, async (req, res) => {
  try {
    const newId = Date.now().toString();
    const { data, error } = await supabase.from('patients').insert([{ id: newId, data: req.body }]).select();
    if (error) return res.status(500).json({ error: error.message });
    
    // Invalidate cache
    cache.delete('patients');
    
    res.status(201).json({ ...data[0].data, id: data[0].id });
  } catch (error) {
    console.error('Add patient error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.put('/api/patients/:id', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase.from('patients').update({ data: req.body }).eq('id', req.params.id).select();
    if (error) return res.status(500).json({ error: error.message });
    
    // Invalidate cache
    cache.delete('patients');
    
    res.json({ ...data[0].data, id: data[0].id });
  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.delete('/api/patients/:id', authenticateToken, async (req, res) => {
  try {
    await supabase.from('records').delete().like('key', `%${req.params.id}%`);
    const { error } = await supabase.from('patients').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });

    // Invalidate cache
    cache.delete('patients');

    res.sendStatus(204);
  } catch (error) {
    console.error('Delete patient error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Records routes (protected)
app.get('/api/records/:key', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase.from('records').select('*').eq('key', req.params.key);
    if (error) return res.status(500).json({ error: error.message });
    res.json(data.map(d => ({ ...d.data, id: d.id })));
  } catch (error) {
    console.error('Get records error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/records/:key', authenticateToken, async (req, res) => {
  try {
    const newId = Date.now().toString();
    const { data, error } = await supabase.from('records').insert([{ id: newId, key: req.params.key, data: req.body }]).select();
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json({ ...data[0].data, id: data[0].id });
  } catch (error) {
    console.error('Add record error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.put('/api/records/:key/:id', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase.from('records').update({ data: req.body }).eq('id', req.params.id).eq('key', req.params.key).select();
    if (error) return res.status(500).json({ error: error.message });
    res.json({ ...data[0].data, id: data[0].id });
  } catch (error) {
    console.error('Update record error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.delete('/api/records/:key/:id', authenticateToken, async (req, res) => {
  try {
    const { error } = await supabase.from('records').delete().eq('id', req.params.id).eq('key', req.params.key);
    if (error) return res.status(500).json({ error: error.message });
    res.sendStatus(204);
  } catch (error) {
    console.error('Delete record error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

export default app;
