import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import AddPatientModal from '../components/AddPatientModal';

export default function Dashboard() {
  const [patients, setPatients] = useState<any[]>([]);
  const [filterMode, setFilterMode] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const navigate = useNavigate();

  const fetchPatients = async () => {
    try {
      const res = await api.get('/patients');
      setPatients(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/login');
  };

  const filteredPatients = patients.filter(p => {
    if (filterMode === 'ALL') return true;
    if (filterMode === 'CRITICAL') return p.status === 'critical';
    return p.shift === filterMode;
  });

  return (
    <div className="screen active">
      <div className="topbar">
        <div>
          <div className="topbar-logo">Endorse<span>Me</span></div>
          <div className="topbar-subtitle">Ward Turnover System</div>
        </div>
        <div className="topbar-right">
          <span className="shift-badge">AM Shift</span>
          <button className="back-btn" onClick={handleLogout} title="Logout" style={{ marginLeft: '10px', fontSize: '0.9rem' }}>🚪</button>
        </div>
      </div>
      <div className="content">
        <div className="home-header">
          <div>
            <div className="home-title">My Patients</div>
            <div className="home-date">{new Date().toLocaleDateString('en-PH', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</div>
          </div>
          <button className="add-patient-btn" onClick={() => setShowAddModal(true)}>
            ＋ Add Patient
          </button>
        </div>

        <div className="shift-filter">
          <button className={`shift-btn ${filterMode === 'ALL' ? 'active' : ''}`} onClick={() => setFilterMode('ALL')}>All</button>
          <button className={`shift-btn ${filterMode === 'AM' ? 'active' : ''}`} onClick={() => setFilterMode('AM')}>AM Shift</button>
          <button className={`shift-btn ${filterMode === 'PM' ? 'active' : ''}`} onClick={() => setFilterMode('PM')}>PM Shift</button>
          <button className={`shift-btn ${filterMode === 'NIGHT' ? 'active' : ''}`} onClick={() => setFilterMode('NIGHT')}>Night Shift</button>
          <button className={`shift-btn ${filterMode === 'CRITICAL' ? 'active' : ''}`} onClick={() => setFilterMode('CRITICAL')}>🔴 Critical</button>
        </div>

        <div className="patient-grid">
          {filteredPatients.map(p => (
            <div key={p.id} className={`patient-card status-${p.status}`} onClick={() => navigate(`/patient/${p.id}`)} style={{ cursor: 'pointer' }}>
              <div className="patient-room">Rm {p.room} · {p.shift}</div>
              <div className="patient-name">{p.fname}<br/>{p.lname}</div>
              <div className="patient-diag">{p.diag}</div>
              <span className={`patient-status-badge ${p.status === 'stable' ? 'badge-stable' : p.status === 'critical' ? 'badge-critical' : 'badge-fair'}`}>
                {p.status}
              </span>
            </div>
          ))}
        </div>
        {filteredPatients.length === 0 && (
          <div className="no-results">
            No patients found. Add a patient to get started.
          </div>
        )}
      </div>
      {showAddModal && (
        <AddPatientModal 
          onClose={() => setShowAddModal(false)} 
          onSave={() => {
            setShowAddModal(false);
            fetchPatients();
          }} 
        />
      )}
    </div>
  );
}
