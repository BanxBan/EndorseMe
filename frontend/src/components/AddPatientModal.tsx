import { useState } from 'react';
import api from '../api';

export default function AddPatientModal({ patient, onClose, onSave }: { patient?: any, onClose: () => void, onSave: () => void }) {
  const [formData, setFormData] = useState({
    room: patient?.room || '',
    shift: patient?.shift || 'AM',
    fname: patient?.fname || '',
    lname: patient?.lname || '',
    age: patient?.age || '',
    sex: patient?.sex || 'Male',
    doctor: patient?.doctor || '',
    diag: patient?.diag || '',
    admit: patient?.admit || '',
    status: patient?.status || 'stable',
    allergy: patient?.allergy || ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!formData.room || !formData.fname || !formData.lname) {
      alert('Please fill in at least Room, First and Last Name');
      return;
    }
    try {
      if (patient) {
        await api.put(`/patients/${patient.id}`, formData);
      } else {
        await api.post('/patients', formData);
      }
      onSave();
    } catch (err) {
      console.error(err);
      alert('Failed to save patient');
    }
  };

  return (
    <div className="modal-overlay open" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal" style={{ transform: 'translateY(0)' }}>
        <div className="modal-handle"></div>
        <div className="modal-title">{patient ? 'Edit Patient' : 'Add Patient'}</div>
        <div className="modal-sub">Fill in the patient's information</div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Room / Bed</label>
            <input type="text" name="room" value={formData.room} onChange={handleChange} placeholder="e.g. 301-A" />
          </div>
          <div className="form-group">
            <label>Shift</label>
            <select name="shift" value={formData.shift} onChange={handleChange}>
              <option value="AM">AM Shift</option>
              <option value="PM">PM Shift</option>
              <option value="NIGHT">Night Shift</option>
            </select>
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>First Name</label>
            <input type="text" name="fname" value={formData.fname} onChange={handleChange} placeholder="Juan" />
          </div>
          <div className="form-group">
            <label>Last Name</label>
            <input type="text" name="lname" value={formData.lname} onChange={handleChange} placeholder="Dela Cruz" />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Age</label>
            <input type="number" name="age" value={formData.age} onChange={handleChange} placeholder="45" />
          </div>
          <div className="form-group">
            <label>Sex</label>
            <select name="sex" value={formData.sex} onChange={handleChange}>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
        </div>
        
        <div className="form-group">
          <label>Attending Physician</label>
          <input type="text" name="doctor" value={formData.doctor} onChange={handleChange} placeholder="Dr. Santos" />
        </div>
        <div className="form-group">
          <label>Diagnosis / Chief Complaint</label>
          <input type="text" name="diag" value={formData.diag} onChange={handleChange} placeholder="e.g. Community-acquired pneumonia" />
        </div>
        <div className="form-group">
          <label>Admission Date</label>
          <input type="date" name="admit" value={formData.admit} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Patient Status</label>
          <select name="status" value={formData.status} onChange={handleChange}>
            <option value="stable">Stable</option>
            <option value="fair">Fair</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <div className="form-group">
          <label>Allergies (if any)</label>
          <input type="text" name="allergy" value={formData.allergy} onChange={handleChange} placeholder="NKDA / Penicillin..." />
        </div>
        
        <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSave}>💾 Save Patient</button>
        </div>
      </div>
    </div>
  );
}
