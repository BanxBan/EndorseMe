import { useState, useEffect } from 'react';
import api from '../api';

const STANDARD_ROOMS = [
  'RM 201', 'RM 202', 'RM 203', 'RM 204', 'RM 205',
  'RM 206', 'RM 207', 'RM 208', 'RM 209', 'RM 210',
  'RM 211', 'RM 212', 'RM 213', 'RM 214', 'RM 215'
];

const WARDS = [
  { name: 'Ward #1', type: 'High Risk', label: 'OB-Gyne Ward – High Risk' },
  { name: 'Ward #2', type: 'Moderate Risk', label: 'OB-Gyne Ward – Moderate Risk' },
  { name: 'Ward #3', type: 'Extension', label: 'OB-Ward Extension' },
];

const BEDS = ['1', '2', '3', '4', '5', '6'];

export default function AddPatientModal({ patient, onClose, onSave }: { patient?: any, onClose: () => void, onSave: () => void }) {
  const isEditing = !!patient;

  // Determine initial room type based on existing patient data
  const getInitialRoomType = () => {
    if (patient?.ward_name) return 'ob-gyne';
    if (patient?.room) return 'standard';
    return '';
  };

  const [roomType, setRoomType] = useState(getInitialRoomType());
  const [occupiedRooms, setOccupiedRooms] = useState<string[]>([]);
  const [occupiedBeds, setOccupiedBeds] = useState<{ ward: string; bed: string }[]>([]);

  const [formData, setFormData] = useState({
    room: patient?.room || '',
    ward_name: patient?.ward_name || '',
    ward_type: patient?.ward_type || '',
    bed_number: patient?.bed_number || '',
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

  // Fetch existing patients to determine occupied rooms/beds
  useEffect(() => {
    const fetchOccupied = async () => {
      try {
        const res = await api.get('/patients');
        const patients = res.data;
        // Filter out the current patient if editing
        const others = isEditing ? patients.filter((p: any) => p.id !== patient.id) : patients;
        
        setOccupiedRooms(others.filter((p: any) => p.room).map((p: any) => p.room));
        setOccupiedBeds(others.filter((p: any) => p.ward_name && p.bed_number).map((p: any) => ({ ward: p.ward_name, bed: p.bed_number })));
      } catch (err) {
        console.error('Failed to fetch patients for occupancy:', err);
      }
    };
    fetchOccupied();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoomTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRoomType(e.target.value);
    // Reset room/ward fields when switching type
    setFormData({
      ...formData,
      room: '',
      ward_name: '',
      ward_type: '',
      bed_number: '',
    });
  };

  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedWard = WARDS.find(w => w.name === e.target.value);
    setFormData({
      ...formData,
      ward_name: selectedWard?.name || '',
      ward_type: selectedWard?.type || '',
      bed_number: '', // Reset bed when ward changes
    });
  };

  const isBedOccupied = (ward: string, bed: string) => {
    return occupiedBeds.some(ob => ob.ward === ward && ob.bed === bed);
  };

  const handleSave = async () => {
    if (roomType === 'standard' && !formData.room) {
      alert('Please select a Room');
      return;
    }
    if (roomType === 'ob-gyne' && (!formData.ward_name || !formData.bed_number)) {
      alert('Please select a Ward and Bed Number');
      return;
    }
    if (!roomType) {
      alert('Please select a Room Type');
      return;
    }
    if (!formData.fname || !formData.lname) {
      alert('Please fill in First Name and Last Name');
      return;
    }

    try {
      // Clear irrelevant fields based on room type
      const payload = { ...formData };
      if (roomType === 'standard') {
        payload.ward_name = '';
        payload.ward_type = '';
        payload.bed_number = '';
      } else {
        payload.room = '';
      }

      if (isEditing) {
        await api.put(`/patients/${patient.id}`, payload);
      } else {
        await api.post('/patients', payload);
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
        <div className="modal-title">{isEditing ? 'Edit Patient' : 'Add Patient'}</div>
        <div className="modal-sub">Fill in the patient's information</div>
        
        {/* Room Type Selector */}
        <div className="form-group">
          <label>Room Type</label>
          <select value={roomType} onChange={handleRoomTypeChange}>
            <option value="">Select Room Type</option>
            <option value="standard">Standard Room (RM 201–215)</option>
            <option value="ob-gyne">OB-Gyne Ward (Ward #1–3)</option>
          </select>
        </div>

        {/* Standard Room Selector */}
        {roomType === 'standard' && (
          <div className="form-group">
            <label>Room Number</label>
            <select name="room" value={formData.room} onChange={handleChange}>
              <option value="">Select Room</option>
              {STANDARD_ROOMS.map(r => {
                const occupied = occupiedRooms.includes(r);
                return (
                  <option key={r} value={r} disabled={occupied}>
                    {r}{occupied ? ' — Occupied' : ''}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {/* OB-Gyne Ward Selectors */}
        {roomType === 'ob-gyne' && (
          <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="form-group">
              <label>Ward / Room</label>
              <select name="ward_name" value={formData.ward_name} onChange={handleWardChange}>
                <option value="">Select Ward</option>
                {WARDS.map(w => <option key={w.name} value={w.name}>{w.name} ({w.type})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Bed Number</label>
              <select name="bed_number" value={formData.bed_number} onChange={handleChange} disabled={!formData.ward_name}>
                <option value="">Select Bed</option>
                {formData.ward_name && BEDS.map(b => {
                  const occupied = isBedOccupied(formData.ward_name, b);
                  return (
                    <option key={b} value={b} disabled={occupied}>
                      Bed {b}{occupied ? ' — Occupied' : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        )}

        {/* Assignment Preview */}
        {((roomType === 'standard' && formData.room) || (roomType === 'ob-gyne' && formData.ward_name && formData.bed_number)) && (
          <div style={{ 
            backgroundColor: 'rgba(23, 107, 135, 0.08)', 
            border: '1px solid rgba(23, 107, 135, 0.2)',
            borderRadius: '8px', 
            padding: '8px 12px', 
            marginBottom: '12px',
            fontSize: '0.85rem',
            color: '#176B87',
            fontWeight: 600
          }}>
            📍 {roomType === 'standard' 
              ? formData.room 
              : `${formData.ward_name} – Bed ${formData.bed_number} (${formData.ward_type})`}
          </div>
        )}

        <div className="form-row">
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
