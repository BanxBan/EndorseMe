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
    navigate('/auth');
  };

  const normalizeStatus = (status: string) => {
    const normalized = String(status || '').toLowerCase().trim();
    if (normalized === 'stable') return 'admitted';
    if (normalized === 'fair') return 'for billing';
    if (normalized === 'critical') return 'for discharge';
    return normalized || 'admitted';
  };

  const getPriority = (status: string) => {
    const s = normalizeStatus(status);
    if (s === 'for discharge') return { label: 'High', color: '#d32f2f', icon: '🔴' };
    if (s === 'for billing') return { label: 'Medium', color: '#ed6c02', icon: '🟠' };
    return { label: 'Low', color: '#2e7d32', icon: '🟢' };
  };

  const getStatusBadgeClass = (status: string) => {
    const s = normalizeStatus(status);
    if (s === 'for discharge') return 'badge-critical';
    if (s === 'for billing') return 'badge-fair';
    return 'badge-stable';
  };

  const getPatientType = (patient: any) => {
    const type = String(patient.patientType || '').trim();
    if (type === 'Post CS' || type === 'NSVD' || type === 'Gyne') return type;
    return String(patient.ward_type || '').toLowerCase().includes('ob') ? 'NSVD' : 'Gyne';
  };

  const getPatientTypeBadgeClass = (type: string) => {
    if (type === 'Post CS') return 'patient-type-post-cs';
    if (type === 'NSVD') return 'patient-type-nsvd';
    return 'patient-type-gyne';
  };

  const filteredPatients = patients.filter(p => {
    if (filterMode === 'ALL') return true;
    const normalizedStatus = normalizeStatus(p.status);
    if (filterMode === 'ADMITTED') return normalizedStatus === 'admitted';
    if (filterMode === 'FOR_BILLING') return normalizedStatus === 'for billing';
    if (filterMode === 'FOR_DISCHARGE') return normalizedStatus === 'for discharge';
    if (filterMode === 'POST_CS') return getPatientType(p) === 'Post CS';
    if (filterMode === 'NSVD') return getPatientType(p) === 'NSVD';
    if (filterMode === 'GYNE') return getPatientType(p) === 'Gyne';
    return true;
  });

  const nurseName = localStorage.getItem('username') || 'Nurse';
  const postCsCount = patients.filter(p => getPatientType(p) === 'Post CS').length;
  const nsvdCount = patients.filter(p => getPatientType(p) === 'NSVD').length;
  const gyneCount = patients.filter(p => getPatientType(p) === 'Gyne').length;
  const pendingMeds = patients.filter(p => normalizeStatus(p.status) !== 'admitted').length;
  const pendingLabsOrProcedures = patients.filter(p => normalizeStatus(p.status) === 'for billing').length;
  const urgentAlerts = patients.filter(p => normalizeStatus(p.status) === 'for discharge').length;

  const handleEndorsePatient = () => {
    if (filteredPatients.length === 0) {
      alert('No patient available to endorse yet.');
      return;
    }
    navigate(`/patient/${filteredPatients[0].id}/sbar`);
  };

  const scrollToPatientList = () => {
    const el = document.getElementById('patient-list');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="screen active">
      <div className="topbar">
        <div>
          <div className="topbar-logo">Endorse<span>Me</span></div>
          <div className="topbar-subtitle">Ward Turnover System</div>
        </div>
        <div className="topbar-right">
          <span className="shift-badge">AM Shift</span>
          <button className="back-btn" onClick={() => navigate('/profile')} title="Profile" style={{ marginLeft: '10px', fontSize: '0.9rem' }}>👤</button>
          <button className="back-btn" onClick={handleLogout} title="Logout" style={{ marginLeft: '10px', fontSize: '0.9rem' }}>🚪</button>
        </div>
      </div>
      <div className="content dashboard-content">
        <div className="dashboard-left" style={{ display: 'grid', gap: '15px', marginBottom: '20px' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div className="home-title">Nurse Info</div>
            <div className="info-row"><span className="info-key">Name</span><span className="info-val">{nurseName}</span></div>
            <div className="info-row"><span className="info-key">Shift</span><span className="info-val">AM Shift</span></div>
            <div className="info-row"><span className="info-key">Assigned Unit</span><span className="info-val">OB-Gyne</span></div>
          </div>

          <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div className="home-title" style={{ marginBottom: '10px' }}>Patient Overview</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '1.4rem', backgroundColor: 'rgba(23, 107, 135, 0.1)', color: '#176B87', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👥</div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#666', fontWeight: 600, textTransform: 'uppercase' }}>Total</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#04364A' }}>{patients.length}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '1.4rem', backgroundColor: 'rgba(106, 27, 154, 0.1)', color: '#6A1B9A', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🤰</div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#666', fontWeight: 600, textTransform: 'uppercase' }}>OB</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#04364A' }}>{postCsCount + nsvdCount}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '1.4rem', backgroundColor: 'rgba(27, 94, 32, 0.1)', color: '#1B5E20', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🩺</div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#666', fontWeight: 600, textTransform: 'uppercase' }}>Gyne</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#04364A' }}>{gyneCount}</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div className="home-title" style={{ marginBottom: '10px' }}>Notifications</div>
            <div className="info-row"><span className="info-key">New endorsements</span><span className="info-val">{patients.length > 0 ? patients.length : 0}</span></div>
            <div className="info-row"><span className="info-key">Pending acknowledgments</span><span className="info-val">{pendingLabsOrProcedures}</span></div>
            <div className="info-row"><span className="info-key">Urgent alerts</span><span className="info-val">{urgentAlerts}</span></div>
          </div>

        </div>

        <div className="dashboard-main">
        <div id="patient-list">
          <div className="home-title">My Patients</div>
          <div className="home-date">{new Date().toLocaleDateString('en-PH', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</div>
        </div>

        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div className="home-title" style={{ marginBottom: '10px' }}>Quick Actions</div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>Add Patient</button>
            <button className="btn btn-accent" onClick={handleEndorsePatient}>Endorse Patient</button>
            <button className="btn btn-ghost" onClick={scrollToPatientList}>View Patient List</button>
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div className="home-title" style={{ marginBottom: '10px' }}>Task Summary</div>
          <div className="info-row"><span className="info-key">Due medications</span><span className="info-val">{pendingMeds}</span></div>
          <div className="info-row"><span className="info-key">Pending labs/procedures</span><span className="info-val">{pendingLabsOrProcedures}</span></div>
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
            <div style={{ fontSize: '1.8rem', backgroundColor: 'rgba(237, 108, 2, 0.1)', color: '#ed6c02', width: '48px', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🔶</div>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#666', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>For Billing</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#ed6c02' }}>{patients.filter(p => normalizeStatus(p.status) === 'for billing').length}</div>
            </div>
          </div>
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ fontSize: '1.8rem', backgroundColor: 'rgba(46, 125, 50, 0.1)', color: '#2e7d32', width: '48px', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✅</div>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#666', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Admitted</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#2e7d32' }}>{patients.filter(p => normalizeStatus(p.status) === 'admitted').length}</div>
            </div>
          </div>
        </div>

        <div className="shift-filter">
          <button className={`shift-btn ${filterMode === 'ALL' ? 'active' : ''}`} onClick={() => setFilterMode('ALL')}>All</button>
          <button className={`shift-btn ${filterMode === 'ADMITTED' ? 'active' : ''}`} onClick={() => setFilterMode('ADMITTED')}>Admitted</button>
          <button className={`shift-btn ${filterMode === 'FOR_BILLING' ? 'active' : ''}`} onClick={() => setFilterMode('FOR_BILLING')}>For Billing</button>
          <button className={`shift-btn ${filterMode === 'FOR_DISCHARGE' ? 'active' : ''}`} onClick={() => setFilterMode('FOR_DISCHARGE')}>For Discharge</button>
          <button className={`shift-btn ${filterMode === 'POST_CS' ? 'active' : ''}`} onClick={() => setFilterMode('POST_CS')}>Post CS</button>
          <button className={`shift-btn ${filterMode === 'NSVD' ? 'active' : ''}`} onClick={() => setFilterMode('NSVD')}>NSVD</button>
          <button className={`shift-btn ${filterMode === 'GYNE' ? 'active' : ''}`} onClick={() => setFilterMode('GYNE')}>Gyne</button>
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
            <div key={p.id} className={`patient-card status-${normalizeStatus(p.status).replace(/\s+/g, '-')}`} onClick={() => navigate(`/patient/${p.id}`)} style={{ cursor: 'pointer' }}>
              <div className="patient-room">{p.ward_name ? `${p.ward_name} – Bed ${p.bed_number}` : `Rm ${p.room}`} · {String(p.ward_type || '').toLowerCase().includes('ob') ? 'OB' : 'Gyne'}</div>
              <div className="patient-name">{p.fname} {p.lname}, {p.age} y/o</div>
              <div className="patient-diag">{p.diag}</div>
              <span className={`patient-type-badge ${getPatientTypeBadgeClass(getPatientType(p))}`}>{getPatientType(p)}</span>
              <span className={`patient-status-badge ${getStatusBadgeClass(p.status)}`}>
                {normalizeStatus(p.status)}
              </span>
              <div style={{ marginTop: '6px', fontSize: '0.7rem', fontWeight: 700, color: getPriority(p.status).color }}>
                {getPriority(p.status).icon} Priority: {getPriority(p.status).label}
              </div>
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
