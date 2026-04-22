import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiWithCache, clearCache } from '../api';
import api from '../api';
import AddPatientModal from '../components/AddPatientModal';
import { showToast } from '../utils/toast';

export default function PatientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to remove ${patient?.fname} ${patient?.lname}? This will also delete all their records.`)) {
      return;
    }
    try {
      await api.delete(`/patients/${id}`);
      clearCache();
      showToast('Patient removed successfully');
      navigate('/');
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
          <button className="back-btn" onClick={() => navigate('/')}>←</button>
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
          <button className="back-btn" onClick={() => navigate('/')}>←</button>
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
            <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={() => navigate('/')}>Back to Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen active">
      <div className="topbar">
        <button className="back-btn" onClick={() => navigate('/')}>←</button>
        <div>
          <div className="topbar-logo" style={{fontSize: '1.2rem'}}>{patient.fname} {patient.lname}</div>
          <div className="topbar-subtitle">{patient.ward_name ? `${patient.ward_name} – Bed ${patient.bed_number}` : `Room ${patient.room}`}</div>
        </div>
        <div className="topbar-right" style={{ display: 'flex', gap: '6px' }}>
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
            <span className="hero-tag accent">{patient.status.toUpperCase()}</span>
            <span className="hero-tag">{patient.doctor}</span>
            <span className="hero-tag">Allergy: {patient.allergy || 'NKDA'}</span>
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
            <div className="icon-tile-label">Vital Signs</div>
          </div>
          <div className="icon-tile" onClick={() => navigate(`/patient/${id}/meds`)}>
            <span className="icon-tile-emoji">💊</span>
            <div className="icon-tile-label">Medications</div>
          </div>
          <div className="icon-tile" onClick={() => navigate(`/patient/${id}/status`)}>
            <span className="icon-tile-emoji">📝</span>
            <div className="icon-tile-label">Status</div>
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
