import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import AddPatientModal from '../components/AddPatientModal';

export default function PatientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const fetchPatient = async () => {
    try {
      const res = await api.get('/patients');
      const p = res.data.find((p: any) => p.id === id);
      setPatient(p);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPatient();
  }, [id]);

  if (!patient) return <div>Loading...</div>;

  return (
    <div className="screen active">
      <div className="topbar">
        <button className="back-btn" onClick={() => navigate('/')}>←</button>
        <div>
          <div className="topbar-logo" style={{fontSize: '1.2rem'}}>{patient.fname} {patient.lname}</div>
          <div className="topbar-subtitle">Room {patient.room}</div>
        </div>
        <div className="topbar-right">
          <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '20px' }} onClick={() => setShowEditModal(true)}>✏️ Edit</button>
        </div>
      </div>
      <div className="content">
        <div className="patient-hero">
          <div className="patient-hero-room">Room {patient.room} · {patient.shift} Shift · {patient.sex}, {patient.age}y/o</div>
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
