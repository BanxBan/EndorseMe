import { Router } from 'express';
import { supabase } from '../db';

const router = Router();

// Authentication removed for patient operations

router.get('/patients', async (req, res) => {
  const { data, error } = await supabase.from('patients').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data.map(d => ({ ...d.data, id: d.id })));
});

router.post('/patients', async (req, res) => {
  const newId = Date.now().toString();
  const { data, error } = await supabase.from('patients').insert([{ id: newId, data: req.body }]).select();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ ...data[0].data, id: data[0].id });
});

router.put('/patients/:id', async (req, res) => {
  const { data, error } = await supabase.from('patients').update({ data: req.body }).eq('id', req.params.id).select();
  if (error) return res.status(500).json({ error: error.message });
  if (!data || data.length === 0) return res.status(404).json({ message: 'Patient not found' });
  res.json({ ...data[0].data, id: data[0].id });
});

router.delete('/patients/:id', async (req, res) => {
  // Also delete related records for this patient
  await supabase.from('records').delete().like('key', `%${req.params.id}%`);
  const { error } = await supabase.from('patients').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.sendStatus(204);
});

router.get('/records/:key', async (req, res) => {
  const { data, error } = await supabase.from('records').select('*').eq('key', req.params.key);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data.map(d => ({ ...d.data, id: d.id })));
});

router.post('/records/:key', async (req, res) => {
  const newId = Date.now().toString();
  const { data, error } = await supabase.from('records').insert([{ id: newId, key: req.params.key, data: req.body }]).select();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ ...data[0].data, id: data[0].id });
});

router.put('/records/:key/:id', async (req, res) => {
  const { data, error } = await supabase.from('records').update({ data: req.body }).eq('id', req.params.id).eq('key', req.params.key).select();
  if (error) return res.status(500).json({ error: error.message });
  if (!data || data.length === 0) return res.status(404).json({ message: 'Record not found for update' });
  res.json({ ...data[0].data, id: data[0].id });
});

router.delete('/records/:key/:id', async (req, res) => {
  const { error } = await supabase.from('records').delete().eq('id', req.params.id).eq('key', req.params.key);
  if (error) return res.status(500).json({ error: error.message });
  res.sendStatus(204);
});

export default router;
