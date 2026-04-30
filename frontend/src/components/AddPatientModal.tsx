import { useState, useEffect } from 'react';
import api from '../api';
import { showToast } from '../utils/toast';

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
const OB_PATIENT_TYPES = ['Post CS', 'NSVD'];
const VITALS_SCHEDULES = ['Q4', 'Q6', 'Q8', 'QShift'];
const IO_SCHEDULES = ['QShift', 'Q8', 'Q12', 'Q24'];

export default function AddPatientModal({ patient, onClose, onSave }: { patient?: any, onClose: () => void, onSave: () => void }) {
  const isEditing = !!patient;
  const today = new Date().toISOString().split('T')[0];

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
    fname: patient?.fname || '',
    lname: patient?.lname || '',
    age: patient?.age || '',
    sex: patient?.sex || 'Male',
    patientCategory: patient?.patientType === 'Gyne' ? 'Gyne' : 'OB',
    patientType: patient?.patientType || 'Gyne',
    vitalsSchedule: patient?.vitalsSchedule || 'Q4',
    ioSchedule: patient?.ioSchedule || 'QShift',
    importantOrders: patient?.importantOrders || [],
    doctor: patient?.doctor || '',
    diag: patient?.diag || '',
    admit: patient?.admit || today,
    status: patient?.status || 'admitted',
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
    if (!formData.fname.trim() || !formData.lname.trim()) {
      alert('Please fill in First Name and Last Name');
      return;
    }
    if (!String(formData.age).trim()) {
      alert('Please fill in Age');
      return;
    }
    if (Number(formData.age) <= 0) {
      alert('Age must be greater than 0');
      return;
    }
    if (!formData.doctor.trim()) {
      alert('Please fill in Attending Physician');
      return;
    }
    if (!formData.diag.trim()) {
      alert('Please fill in Diagnosis / Chief Complaint');
      return;
    }
    if (!formData.admit) {
      alert('Please select an Admission Date');
      return;
    }
    if (formData.admit > today) {
      alert('Admission Date cannot be above today');
      return;
    }
    if (!formData.allergy.trim()) {
      alert('Please fill in Allergies (use NKDA if none)');
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
        showToast('Patient updated successfully');
      } else {
        await api.post('/patients', payload);
        showToast('Patient added successfully');
      }
      onSave();
    } catch (err) {
      console.error(err);
      alert('Failed to save patient');
    }
  };

  return (
    <div className="modal-overlay open" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal" style={{ 
        transform: 'translateY(0)',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <div className="modal-handle"></div>
        <div className="modal-title" style={{ fontSize: '1.8rem', fontWeight: 800 }}>{isEditing ? '✏️ Edit Patient' : '➕ Add Patient'}</div>
        <div className="modal-sub" style={{ fontSize: '1rem', color: '#666' }}>Fill in the patient's information below</div>
        
        {/* Room Assignment Section */}
        <div style={{ 
          background: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '24px',
          border: '2px solid #2196F3',
          boxShadow: '0 4px 12px rgba(33, 150, 243, 0.15)'
        }}>
          <div style={{ 
            fontSize: '1.2rem', 
            fontWeight: 800, 
            color: '#1565C0', 
            marginBottom: '16px', 
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{ fontSize: '1.5rem' }}>🏥</span>
            Room Assignment
          </div>
          <div className="form-group">
            <label style={{ fontSize: '1rem', fontWeight: 600, color: '#1565C0' }}>📍 Room Type</label>
            <select value={roomType} onChange={handleRoomTypeChange} style={{ 
              fontSize: '1rem',
              padding: '12px',
              borderRadius: '8px',
              border: '2px solid #90CAF9'
            }}>
              <option value="">Select Room Type</option>
              <option value="standard">Standard Room (RM 201–215)</option>
              <option value="ob-gyne">OB-Gyne Ward (Ward #1–3)</option>
            </select>
          </div>

          {/* Standard Room Selector */}
          {roomType === 'standard' && (
            <div className="form-group">
              <label style={{ fontSize: '1rem', fontWeight: 600, color: '#1565C0' }}>🚪 Room Number</label>
              <select name="room" value={formData.room} onChange={handleChange} style={{ 
                fontSize: '1rem',
                padding: '12px',
                borderRadius: '8px',
                border: '2px solid #90CAF9'
              }}>
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
            <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label style={{ fontSize: '1rem', fontWeight: 600, color: '#1565C0' }}>🏥 Ward / Room</label>
                <select name="ward_name" value={formData.ward_name} onChange={handleWardChange} style={{ 
                  fontSize: '1rem',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '2px solid #90CAF9'
                }}>
                  <option value="">Select Ward</option>
                  {WARDS.map(w => <option key={w.name} value={w.name}>{w.name} ({w.type})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label style={{ fontSize: '1rem', fontWeight: 600, color: '#1565C0' }}>🛏️ Bed Number</label>
                <select name="bed_number" value={formData.bed_number} onChange={handleChange} disabled={!formData.ward_name} style={{ 
                  fontSize: '1rem',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '2px solid #90CAF9'
                }}>
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
              backgroundColor: '#1976D2',
              color: 'white',
              borderRadius: '12px', 
              padding: '14px 16px', 
              marginTop: '16px',
              fontSize: '1.1rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 4px 8px rgba(25, 118, 210, 0.3)'
            }}>
              <span style={{ fontSize: '1.6rem' }}>✅</span>
              {roomType === 'standard' 
                ? `Assigned to: ${formData.room}` 
                : `Assigned to: ${formData.ward_name} – Bed ${formData.bed_number} (${formData.ward_type})`}
            </div>
          )}
        </div>

        {/* Patient Information Section */}
        <div style={{ 
          background: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '24px',
          border: '2px solid #4CAF50',
          boxShadow: '0 4px 12px rgba(76, 175, 80, 0.15)'
        }}>
          <div style={{ 
            fontSize: '1.2rem', 
            fontWeight: 800, 
            color: '#2E7D32', 
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{ fontSize: '1.5rem' }}>👤</span>
            Patient Information
          </div>
          <div className="form-row" style={{ gap: '12px' }}>
            <div className="form-group">
              <label style={{ fontSize: '1rem', fontWeight: 600, color: '#2E7D32' }}>👤 First Name</label>
              <input type="text" name="fname" value={formData.fname} onChange={handleChange} placeholder="Juan" style={{ 
                fontSize: '1rem',
                padding: '12px',
                borderRadius: '8px',
                border: '2px solid #A5D6A7'
              }} />
            </div>
            <div className="form-group">
              <label style={{ fontSize: '1rem', fontWeight: 600, color: '#2E7D32' }}>👤 Last Name</label>
              <input type="text" name="lname" value={formData.lname} onChange={handleChange} placeholder="Dela Cruz" style={{ 
                fontSize: '1rem',
                padding: '12px',
                borderRadius: '8px',
                border: '2px solid #A5D6A7'
              }} />
            </div>
          </div>
          
          <div className="form-row" style={{ gap: '12px' }}>
            <div className="form-group">
              <label style={{ fontSize: '1rem', fontWeight: 600, color: '#2E7D32' }}>🎂 Age</label>
              <input type="number" name="age" value={formData.age} onChange={handleChange} placeholder="45" style={{ 
                fontSize: '1rem',
                padding: '12px',
                borderRadius: '8px',
                border: '2px solid #A5D6A7'
              }} />
            </div>
            <div className="form-group">
              <label style={{ fontSize: '1rem', fontWeight: 600, color: '#2E7D32' }}>⚧ Sex</label>
              <select name="sex" value={formData.sex} onChange={handleChange} style={{ 
                fontSize: '1rem',
                padding: '12px',
                borderRadius: '8px',
                border: '2px solid #A5D6A7'
              }}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label style={{ fontSize: '1rem', fontWeight: 600, color: '#2E7D32' }}>🏷️ Patient Category</label>
            <select name="patientCategory" value={formData.patientCategory} onChange={(e) => {
              handleChange(e);
              // Reset patientType when category changes
              setFormData({
                ...formData,
                patientCategory: e.target.value,
                patientType: e.target.value === 'OB' ? 'NSVD' : 'Gyne'
              });
            }} style={{ 
              fontSize: '1rem',
              padding: '12px',
              borderRadius: '8px',
              border: '2px solid #A5D6A7'
            }}>
              <option value="OB">OB</option>
              <option value="Gyne">Gyne</option>
            </select>
          </div>
          {formData.patientCategory === 'OB' && (
            <div className="form-group">
              <label style={{ fontSize: '1rem', fontWeight: 600, color: '#2E7D32' }}>🏷️ Patient Type</label>
              <select name="patientType" value={formData.patientType} onChange={handleChange} style={{ 
                fontSize: '1rem',
                padding: '12px',
                borderRadius: '8px',
                border: '2px solid #A5D6A7'
              }}>
                {OB_PATIENT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Medical Details Section */}
        <div style={{ 
          background: 'linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '24px',
          border: '2px solid #FF9800',
          boxShadow: '0 4px 12px rgba(255, 152, 0, 0.15)'
        }}>
          <div style={{ 
            fontSize: '1.2rem', 
            fontWeight: 800, 
            color: '#E65100', 
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{ fontSize: '1.5rem' }}>🩺</span>
            Medical Details
          </div>
          <div className="form-group">
            <label style={{ fontSize: '1rem', fontWeight: 600, color: '#E65100' }}>👨‍⚕️ Attending Physician</label>
            <input type="text" name="doctor" value={formData.doctor} onChange={handleChange} placeholder="Dr. Santos" style={{ 
              fontSize: '1rem',
              padding: '12px',
              borderRadius: '8px',
              border: '2px solid #FFCC80'
            }} />
          </div>
          <div className="form-group">
            <label style={{ fontSize: '1rem', fontWeight: 600, color: '#E65100' }}>📋 Diagnosis / Chief Complaint</label>
            <input type="text" name="diag" value={formData.diag} onChange={handleChange} placeholder="e.g. Community-acquired pneumonia" style={{ 
              fontSize: '1rem',
              padding: '12px',
              borderRadius: '8px',
              border: '2px solid #FFCC80'
            }} />
          </div>
          <div className="form-group">
            <label style={{ fontSize: '1rem', fontWeight: 600, color: '#E65100' }}>⚠️ Allergies (if any)</label>
            <input type="text" name="allergy" value={formData.allergy} onChange={handleChange} placeholder="NKDA / Penicillin..." style={{ 
              fontSize: '1rem',
              padding: '12px',
              borderRadius: '8px',
              border: '2px solid #FFCC80'
            }} />
          </div>
        </div>

        {/* Schedules & Status Section */}
        <div style={{ 
          background: 'linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 100%)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '24px',
          border: '2px solid #9C27B0',
          boxShadow: '0 4px 12px rgba(156, 39, 176, 0.15)'
        }}>
          <div style={{ 
            fontSize: '1.2rem', 
            fontWeight: 800, 
            color: '#6A1B9A', 
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{ fontSize: '1.5rem' }}>⏰</span>
            Schedules & Status
          </div>
          <div className="form-row" style={{ gap: '12px' }}>
            <div className="form-group">
              <label style={{ fontSize: '1rem', fontWeight: 600, color: '#6A1B9A' }}>❤️ Vital Signs Schedule</label>
              <select name="vitalsSchedule" value={formData.vitalsSchedule} onChange={handleChange} style={{ 
                fontSize: '1rem',
                padding: '12px',
                borderRadius: '8px',
                border: '2px solid #CE93D8'
              }}>
                {VITALS_SCHEDULES.map(schedule => <option key={schedule} value={schedule}>{schedule}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label style={{ fontSize: '1rem', fontWeight: 600, color: '#6A1B9A' }}>⚖️ I&O Schedule</label>
              <select name="ioSchedule" value={formData.ioSchedule} onChange={handleChange} style={{ 
                fontSize: '1rem',
                padding: '12px',
                borderRadius: '8px',
                border: '2px solid #CE93D8'
              }}>
                {IO_SCHEDULES.map(schedule => <option key={schedule} value={schedule}>{schedule}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row" style={{ gap: '12px' }}>
            <div className="form-group">
              <label style={{ fontSize: '1rem', fontWeight: 600, color: '#6A1B9A' }}>📅 Admission Date</label>
              <input type="date" name="admit" value={formData.admit} onChange={handleChange} max={today} style={{ 
                fontSize: '1rem',
                padding: '12px',
                borderRadius: '8px',
                border: '2px solid #CE93D8'
              }} />
            </div>
            <div className="form-group">
              <label style={{ fontSize: '1rem', fontWeight: 600, color: '#6A1B9A' }}>📊 Patient Status</label>
              <select name="status" value={formData.status} onChange={handleChange} style={{ 
                fontSize: '1rem',
                padding: '12px',
                borderRadius: '8px',
                border: '2px solid #CE93D8'
              }}>
                <option value="admitted">Admitted</option>
                <option value="for billing">For Billing</option>
                <option value="for discharge">For Discharge</option>
              </select>
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <button className="btn btn-ghost" style={{ 
            flex: 1, 
            fontSize: '1.1rem',
            padding: '14px',
            borderRadius: '12px',
            fontWeight: 600
          }} onClick={onClose}>❌ Cancel</button>
          <button className="btn btn-primary" style={{ 
            flex: 2, 
            fontSize: '1.1rem',
            padding: '14px',
            borderRadius: '12px',
            fontWeight: 700,
            boxShadow: '0 4px 12px rgba(23, 107, 135, 0.3)'
          }} onClick={handleSave}>💾 Save Patient</button>
        </div>
      </div>
    </div>
  );
}
