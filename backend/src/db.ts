import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(__dirname, '..', 'db.json');

// Initialize with some seed data if empty
const defaultData = {
  users: [
    // password is "password" hashed with bcryptjs
    { id: '1', username: 'admin', passwordHash: '$2b$10$9Yb.f8c9OZ2rSFNcyDgutOBWvyHycKwTQvUw0hz2qLgiiFiqQunKi' }
  ],
  patients: [
    { id: 'p1', room: '301-A', fname: 'Maria', lname: 'Santos', age: 68, sex: 'Female', doctor: 'Dr. Reyes', diag: 'Community-acquired pneumonia', admit: '2026-04-14', status: 'fair', allergy: 'Penicillin', shift: 'AM' },
    { id: 'p2', room: '302-B', fname: 'Jose', lname: 'Garcia', age: 54, sex: 'Male', doctor: 'Dr. Cruz', diag: 'Hypertensive urgency', admit: '2026-04-16', status: 'stable', allergy: 'NKDA', shift: 'AM' },
    { id: 'p3', room: '303-C', fname: 'Lucia', lname: 'Reyes', age: 79, sex: 'Female', doctor: 'Dr. Tan', diag: 'Acute MI — post-cath care', admit: '2026-04-15', status: 'critical', allergy: 'ASA', shift: 'PM' }
  ],
  records: {} // { "type_patientId": [ ... ] }
};

export function readDb() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
}

export function writeDb(data: any) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Ensure it's created on startup
readDb();
