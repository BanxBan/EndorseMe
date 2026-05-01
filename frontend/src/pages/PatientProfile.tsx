import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiWithCache, clearCache } from '../api';
import api from '../api';
import AddPatientModal from '../components/AddPatientModal';
import { showToast } from '../utils/toast';

export default function PatientProfile() {
  const normalizeStatus = (status: string) => {
    const normalized = String(status || '').toLowerCase().trim();
    if (normalized === 'stable') return 'admitted';
    if (normalized === 'fair') return 'for billing';
    if (normalized === 'critical') return 'for discharge';
    return normalized || 'admitted';
  };

  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const patientCategory = String(patient?.ward_type || '').toLowerCase().includes('ob') ? 'OB' : 'Gyne';
  const patientType = (() => {
    const type = String(patient?.patientType || '').trim();
    if (type === 'Post CS' || type === 'NSVD' || type === 'OB') return 'OB';
    if (type === 'Gyne') return 'Gyne';
    return patientCategory === 'OB' ? 'OB' : 'Gyne';
  })();
  const patientTypeBadgeClass = patientType === 'OB' ? 'patient-type-ob' : 'patient-type-gyne';
  const vitalsSchedule = patient?.vitalsSchedule || 'Q4';
  const ioSchedule = patient?.ioSchedule || 'QShift';
  const hasAllergy = patient?.allergy && String(patient.allergy).trim().toUpperCase() !== 'NKDA';

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to remove ${patient?.fname} ${patient?.lname}? This will also delete all their records.`)) {
      return;
    }
    try {
      await api.delete(`/patients/${id}`);
      clearCache();
      showToast('Patient removed successfully');
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      alert('Failed to delete patient');
    }
  };

  const fetchPatient = async () => {
    try {
      setLoading(true);
      const res = await apiWithCache.get('/patients');
      const p = res.data.find((p: any) => p.id === id);
      setPatient(p);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatient();
  }, [id]);

  if (loading) {
    return (
      <div className="screen active">
        <div className="topbar">
          <button className="back-btn" onClick={() => navigate('/dashboard')}>←</button>
          <div>
            <div className="topbar-logo">Loading...</div>
            <div className="topbar-subtitle">Fetching patient data</div>
          </div>
        </div>
        <div className="content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>⏳</div>
            <div style={{ fontSize: '1.2rem', color: '#666', marginBottom: '10px' }}>Loading Patient Profile</div>
            <div style={{ color: '#999', fontSize: '0.9rem' }}>Please wait a moment...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="screen active">
        <div className="topbar">
          <button className="back-btn" onClick={() => navigate('/dashboard')}>←</button>
          <div>
            <div className="topbar-logo">Patient Not Found</div>
            <div className="topbar-subtitle">Please check the patient ID</div>
          </div>
        </div>
        <div className="content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🔍</div>
            <div style={{ fontSize: '1.2rem', color: '#666', marginBottom: '10px' }}>Patient Not Found</div>
            <div style={{ color: '#999', fontSize: '0.9rem' }}>The patient you're looking for doesn't exist</div>
            <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen active">
      <div className="topbar">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>←</button>
        <div>
          <div className="topbar-logo" style={{fontSize: '1.2rem'}}>{patient.fname} {patient.lname}</div>
          <div className="topbar-subtitle">{patient.ward_name ? `${patient.ward_name} – Bed ${patient.bed_number}` : `Room ${patient.room}`}</div>
        </div>
        <div className="topbar-right" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 600, marginRight: '4px', opacity: 0.9 }}>{localStorage.getItem('nurseName') || localStorage.getItem('username') || 'Nurse'}</span>
          <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '20px' }} onClick={() => setShowEditModal(true)}>✏️ Edit</button>
          <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '20px', color: '#d32f2f' }} onClick={handleDelete}>🗑️ Remove</button>
        </div>
      </div>
      <div className="content">
        <div className="patient-hero">
          <div className="patient-hero-room">{patient.ward_name ? `${patient.ward_name} – Bed ${patient.bed_number} (${patient.ward_type})` : `Room ${patient.room}`} · {patient.shift} Shift · {patient.sex}, {patient.age}y/o</div>
          <div className="patient-hero-name">{patient.fname} {patient.lname}</div>
          <div className="patient-hero-info">
            {patient.diag} · Admitted {new Date(patient.admit).toLocaleDateString('en-PH', { month:'short', day:'numeric', year:'numeric' })}
          </div>
          <div className="patient-hero-tags">
            <span className="hero-tag accent">{normalizeStatus(patient.status).toUpperCase()}</span>
            <span className={`patient-type-badge ${patientTypeBadgeClass}`}>{patientType}</span>
            <span className="hero-tag">{patient.doctor}</span>
            <span className="hero-tag" style={hasAllergy ? { background: '#FDDDE0', color: '#B71C1C', fontWeight: 700 } : undefined}>
              Allergy: {patient.allergy || 'NKDA'} {hasAllergy ? '⚠️' : ''}
            </span>
          </div>
        </div>

        <div className="profile-layout">
        <div className="panel-card">
          <div className="home-title" style={{ marginBottom: '10px' }}>Quick Summary</div>
          <div className="info-row" style={{ backgroundColor: 'rgba(23, 107, 135, 0.05)', borderRadius: '8px', padding: '8px 10px', marginBottom: '12px' }}>
            <span className="info-key">👤 Active Nurse</span>
            <span className="info-val" style={{ fontWeight: 700, color: '#176B87' }}>{localStorage.getItem('nurseName') || localStorage.getItem('username') || 'Nurse'}</span>
          </div>
          <div className="info-row"><span className="info-key">Room Number</span><span className="info-val">{patient.ward_name ? `${patient.ward_name} – Bed ${patient.bed_number}` : patient.room}</span></div>
          <div className="info-row"><span className="info-key">Patient Category</span><span className="info-val">{patientCategory}</span></div>
          <div className="info-row"><span className="info-key">Patient Type</span><span className="info-val"><span className={`patient-type-badge ${patientTypeBadgeClass}`}>{patientType}</span></span></div>
          <div className="info-row"><span className="info-key">Patient Status</span><span className="info-val">{normalizeStatus(patient.status)}</span></div>
          <div className="info-row"><span className="info-key">Vital Signs Schedule</span><span className="info-val"><span className="schedule-badge">VS {vitalsSchedule}</span></span></div>
          <div className="info-row"><span className="info-key">I&O Schedule</span><span className="info-val"><span className="schedule-badge">I&O {ioSchedule}</span></span></div>
          <div className="info-row"><span className="info-key">Age & Sex</span><span className="info-val">{patient.age} / {patient.sex}</span></div>
          <div className="info-row"><span className="info-key">Attending Physician</span><span className="info-val">{patient.doctor}</span></div>
          <div className="info-row"><span className="info-key">Diagnosis</span><span className="info-val">{patient.diag}</span></div>
          <div className="info-row"><span className="info-key">Admission Date</span><span className="info-val">{new Date(patient.admit).toLocaleDateString('en-PH', { month:'short', day:'numeric', year:'numeric' })}</span></div>
          <div className="info-row" style={hasAllergy ? { background: '#FFF1F2', borderRadius: '8px', padding: '8px 10px', marginTop: '8px' } : undefined}>
            <span className="info-key">Allergies ⚠️</span>
            <span className="info-val" style={hasAllergy ? { color: '#B71C1C', fontWeight: 700 } : undefined}>{patient.allergy || 'NKDA'}</span>
          </div>
        </div>

        <div className="icon-grid">
          <div className="icon-tile" onClick={() => navigate(`/patient/${id}/diet`)}>
            <span className="icon-tile-emoji">🍎</span>
            <div className="icon-tile-label">Diet</div>
          </div>
          <div className="icon-tile" onClick={() => navigate(`/patient/${id}/labs`)}>
            <span className="icon-tile-emoji">🔬</span>
            <div className="icon-tile-label">Labs</div>
          </div>
          <div className="icon-tile" onClick={() => navigate(`/patient/${id}/ivfluids`)}>
            <span className="icon-tile-emoji">💧</span>
            <div className="icon-tile-label">IV Fluids</div>
          </div>
          <div className="icon-tile" onClick={() => navigate(`/patient/${id}/vitals`)}>
            <span className="icon-tile-emoji">❤️</span>
            <div className="icon-tile-label">VS</div>
            <div className="icon-tile-current"><span className="schedule-badge">Due {vitalsSchedule}</span></div>
          </div>
          <div className="icon-tile" onClick={() => navigate(`/patient/${id}/io`)}>
            <span className="icon-tile-emoji">⚖️</span>
            <div className="icon-tile-label">I & O</div>
            <div className="icon-tile-current"><span className="schedule-badge">Due {ioSchedule}</span></div>
          </div>
          <div className="icon-tile" onClick={() => navigate(`/patient/${id}/meds`)}>
            <span className="icon-tile-emoji">💊</span>
            <div className="icon-tile-label">Medications</div>
          </div>
          <div className="icon-tile" onClick={() => navigate(`/patient/${id}/so`)}>
            <span className="icon-tile-emoji">📝</span>
            <div className="icon-tile-label">SO</div>
          </div>
          <div className="icon-tile" onClick={() => navigate(`/patient/${id}/attachments`)}>
            <span className="icon-tile-emoji">📂</span>
            <div className="icon-tile-label">Attachments</div>
          </div>
          <div className="icon-tile" onClick={() => navigate(`/patient/${id}/alerts`)}>
            <span className="icon-tile-emoji">!</span>
            <div className="icon-tile-label">Alerts</div>
          </div>
          <div className="icon-tile" onClick={() => navigate(`/patient/${id}/orders`)}>
            <span className="icon-tile-emoji">ORD</span>
            <div className="icon-tile-label">Important Orders</div>
          </div>
        </div>

        <div className="endorse-btn-block" onClick={() => navigate(`/patient/${id}/sbar`)}>
          <div className="endorse-icon">📋</div>
          <div>
            <div className="endorse-label">SBAR Endorsement</div>
            <div className="endorse-sub">Situation · Background · Assessment · Recommendation</div>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: '1.2rem' }}>→</div>
        </div>
        </div>
      </div>

      {showEditModal && (
        <AddPatientModal 
          patient={patient}
          onClose={() => setShowEditModal(false)} 
          onSave={() => {
            setShowEditModal(false);
            fetchPatient();
          }} 
        />
      )}
    </div>
  );
}
