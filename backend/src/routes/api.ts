import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { readDb, writeDb } from '../db';

const router = Router();
router.use(authenticateToken); // Protect all routes below

router.get('/patients', (req, res) => {
  const db = readDb();
  res.json(db.patients);
});

router.post('/patients', (req, res) => {
  const db = readDb();
  const newPatient = { ...req.body, id: Date.now().toString() };
  db.patients.push(newPatient);
  writeDb(db);
  res.status(201).json(newPatient);
});

router.put('/patients/:id', (req, res) => {
  const db = readDb();
  const index = db.patients.findIndex((p: any) => p.id === req.params.id);
  if (index === -1) return res.status(404).send('Patient not found');
  db.patients[index] = { ...db.patients[index], ...req.body };
  writeDb(db);
  res.json(db.patients[index]);
});

router.get('/records/:key', (req, res) => {
  const db = readDb();
  const key = req.params.key;
  res.json(db.records[key] || []);
});

router.post('/records/:key', (req, res) => {
  const db = readDb();
  const key = req.params.key;
  if (!db.records[key]) db.records[key] = [];
  const newRecord = { ...req.body, id: Date.now().toString() };
  db.records[key].push(newRecord);
  writeDb(db);
  res.status(201).json(newRecord);
});

router.put('/records/:key/:id', (req, res) => {
  const db = readDb();
  const key = req.params.key;
  if (!db.records[key]) return res.status(404).send('Record type not found');
  
  const index = db.records[key].findIndex((r: any) => r.id === req.params.id);
  if (index === -1) return res.status(404).send('Record not found');
  
  db.records[key][index] = { ...db.records[key][index], ...req.body };
  writeDb(db);
  res.json(db.records[key][index]);
});

router.delete('/records/:key/:id', (req, res) => {
  const db = readDb();
  const key = req.params.key;
  if (db.records[key]) {
    db.records[key] = db.records[key].filter((r: any) => r.id !== req.params.id);
    writeDb(db);
  }
  res.sendStatus(204);
});

export default router;
