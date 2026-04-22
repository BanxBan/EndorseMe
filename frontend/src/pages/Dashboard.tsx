import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiWithCache, clearCache } from '../api';
import AddPatientModal from '../components/AddPatientModal';

export default function Dashboard() {
  const [patients, setPatients] = useState<any[]>([]);
  const [filterMode, setFilterMode] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await apiWithCache.get('/patients');
      setPatients(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  // Preload data when component mounts
  useEffect(() => {
    // Warm up the cache
    apiWithCache.get('/patients').catch(() => {});
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ fontSize: '1.8rem', backgroundColor: 'rgba(23, 107, 135, 0.1)', color: '#176B87', width: '48px', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👥</div>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#666', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Patients</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#04364A' }}>{patients.length}</div>
            </div>
          </div>
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ fontSize: '1.8rem', backgroundColor: 'rgba(211, 47, 47, 0.1)', color: '#d32f2f', width: '48px', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⚠️</div>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#666', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Critical Cases</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#d32f2f' }}>{patients.filter(p => p.status === 'critical').length}</div>
            </div>
          </div>
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ fontSize: '1.8rem', backgroundColor: 'rgba(237, 108, 2, 0.1)', color: '#ed6c02', width: '48px', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🔶</div>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#666', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fair Cases</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#ed6c02' }}>{patients.filter(p => p.status === 'fair').length}</div>
            </div>
          </div>
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ fontSize: '1.8rem', backgroundColor: 'rgba(46, 125, 50, 0.1)', color: '#2e7d32', width: '48px', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✅</div>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#666', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Stable Cases</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#2e7d32' }}>{patients.filter(p => p.status === 'stable').length}</div>
            </div>
          </div>
        </div>

        <div className="shift-filter">
          <button className={`shift-btn ${filterMode === 'ALL' ? 'active' : ''}`} onClick={() => setFilterMode('ALL')}>All</button>
          <button className={`shift-btn ${filterMode === 'AM' ? 'active' : ''}`} onClick={() => setFilterMode('AM')}>AM Shift</button>
          <button className={`shift-btn ${filterMode === 'PM' ? 'active' : ''}`} onClick={() => setFilterMode('PM')}>PM Shift</button>
          <button className={`shift-btn ${filterMode === 'NIGHT' ? 'active' : ''}`} onClick={() => setFilterMode('NIGHT')}>Night Shift</button>
          <button className={`shift-btn ${filterMode === 'CRITICAL' ? 'active' : ''}`} onClick={() => setFilterMode('CRITICAL')}>🔴 Critical</button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>Loading...</div>
              <div style={{ color: '#666' }}>Fetching patient data</div>
            </div>
          </div>
        ) : (
          <div className="patient-grid">
            {filteredPatients.map(p => (
            <div key={p.id} className={`patient-card status-${p.status}`} onClick={() => navigate(`/patient/${p.id}`)} style={{ cursor: 'pointer' }}>
              <div className="patient-room">{p.ward_name ? `${p.ward_name} – Bed ${p.bed_number}` : `Rm ${p.room}`} · {p.shift}</div>
              <div className="patient-name">{p.fname}<br/>{p.lname}</div>
              <div className="patient-diag">{p.diag}</div>
              <span className={`patient-status-badge ${p.status === 'stable' ? 'badge-stable' : p.status === 'critical' ? 'badge-critical' : 'badge-fair'}`}>
                {p.status}
              </span>
            </div>
          ))}
          </div>
        )}
        {!loading && filteredPatients.length === 0 && (
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
            clearCache('/patients');
            fetchPatients();
          }} 
        />
      )}
    </div>
  );
}
