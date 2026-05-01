import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiWithCache, clearCache } from '../api';
import AddPatientModal from '../components/AddPatientModal';

const getCurrentShift = () => {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 14) return 'AM';
  if (hour >= 14 && hour < 22) return 'PM';
  return 'NOC';
};

export default function Dashboard() {
  const [patients, setPatients] = useState<any[]>([]);
  const [allRecords, setAllRecords] = useState<any[]>([]);
  const [filterMode, setFilterMode] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUrgentPanel, setShowUrgentPanel] = useState(false);
  const [urgentPanelFilter, setUrgentPanelFilter] = useState<'all' | 'labs' | 'meds' | 'new' | 'critical'>('all');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const patientsRes = await apiWithCache.get('/patients');
      setPatients(patientsRes.data);
      
      // Attempt to get records for med tracking, but don't fail if it's missing
      try {
        const recordsRes = await apiWithCache.get('/all-records');
        setAllRecords(recordsRes.data);
      } catch (recErr) {
        console.warn('Medication tracking data unavailable yet:', recErr);
        setAllRecords([]);
      }
    } catch (err) {
      console.error('Failed to fetch patients:', err);
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
    apiWithCache.get('/patients').catch(() => { });
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
    if (normalized === 'discharged') return 'discharged';
    return normalized || 'admitted';
  };

  const getStatusBadgeClass = (status: string) => {
    const s = normalizeStatus(status);
    if (s === 'for discharge') return 'badge-critical';
    if (s === 'for billing') return 'badge-fair';
    return 'badge-stable';
  };

  const getPatientType = (patient: any) => {
    const type = String(patient.patientType || '').trim();
    if (type === 'CS' || type === 'Post CS' || type === 'NSVD' || type === 'OB') return 'OB';
    if (type === 'Gyne') return 'Gyne';
    return String(patient.ward_type || '').toLowerCase().includes('ob') ? 'OB' : 'Gyne';
  };

  const getPatientTypeBadgeClass = (type: string) => {
    if (type === 'OB') return 'patient-type-ob';
    return 'patient-type-gyne';
  };

  const filteredPatients = patients.filter(p => {
    if (filterMode === 'ALL') return true;
    const normalizedStatus = normalizeStatus(p.status);
    if (filterMode === 'ADMITTED') return normalizedStatus === 'admitted';
    if (filterMode === 'FOR_BILLING') return normalizedStatus === 'for billing';
    if (filterMode === 'FOR_DISCHARGE') return normalizedStatus === 'for discharge';
    if (filterMode === 'OB') return getPatientType(p) === 'OB';
    if (filterMode === 'GYNE') return getPatientType(p) === 'Gyne';
    if (filterMode === 'PENDING_MEDS') return normalizeStatus(p.status) !== 'admitted';
    return true;
  });

  const storedName = localStorage.getItem('nurseName');
  const nurseName = (storedName && !storedName.includes('@')) ? storedName : 'Nurse';
  const obCount = patients.filter(p => getPatientType(p) === 'OB').length;
  const gyneCount = patients.filter(p => getPatientType(p) === 'Gyne').length;
  const pendingLabsOrProcedures = patients.filter(p => normalizeStatus(p.status) === 'for billing').length;

  const getShiftPendingMeds = (patientId: string) => {
    const shift = getCurrentShift();
    const meds = allRecords.filter(r => r.patientId === patientId && r.type === 'med' && r.medStatus === 'Active' && r.freq !== 'PRN');
    if (shift === 'AM') {
      return meds.filter(m => ['OD', 'BID', 'TID', 'QID'].includes(m.freq));
    }
    if (shift === 'PM') {
      return meds.filter(m => ['BID', 'TID', 'QID'].includes(m.freq));
    }
    return meds; // NOC
  };

  const patientsWithPendingMeds = patients.filter(p => getShiftPendingMeds(p.id).length > 0);
  const pendingMeds = patientsWithPendingMeds.length;
  const urgentNotifications = patients.flatMap(p => {
    const notifications = [];
    const status = normalizeStatus(p.status);
    if (status === 'discharged') return []; // No notifications for discharged patients
    
    if (status === 'for discharge') {
      notifications.push({ id: `${p.id}-critical`, patient: p, type: 'critical', msg: p.diag || 'Critical Status', icon: '🔴', target: `/patient/${p.id}` });
    }
    if (status === 'for billing') {
      const pendingLab = (p.importantOrders || []).find((o: any) => o.orderStatus !== 'Completed')?.description;
      notifications.push({ id: `${p.id}-labs`, patient: p, type: 'labs', msg: pendingLab ? `Pending: ${pendingLab}` : 'Pending labs/procedures', icon: '🧪', target: `/patient/${p.id}/labs` });
    }
    const shiftMeds = getShiftPendingMeds(p.id);
    if (shiftMeds.length > 0) {
      notifications.push({ id: `${p.id}-meds`, patient: p, type: 'meds', msg: `Due: ${shiftMeds.map(m => m.name).join(', ')}`, icon: '💊', target: `/patient/${p.id}/meds` });
    }
    // If patient was added in the last 12 hours
    const patientTs = Number(p.id);
    if (!isNaN(patientTs) && (Date.now() - patientTs < 12 * 60 * 60 * 1000)) {
      notifications.push({ id: `${p.id}-new`, patient: p, type: 'new', msg: 'New Endorsement - Review profile', icon: '🆕', target: `/patient/${p.id}` });
    }
    return notifications;
  });
  const criticalAlertsCount = urgentNotifications.filter(n => n.type === 'critical').length;
  const newEndorsementsCount = urgentNotifications.filter(n => n.type === 'new').length;

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
          <span style={{ fontSize: '0.75rem', fontWeight: 600, marginRight: '8px', opacity: 0.9 }}>{nurseName}</span>
          <span className="shift-badge">{getCurrentShift()} Shift</span>
          <button className="back-btn" onClick={() => navigate('/profile')} title="Profile" style={{ marginLeft: '10px', fontSize: '0.9rem' }}>👤</button>
          <button className="back-btn" onClick={handleLogout} title="Logout" style={{ marginLeft: '10px', fontSize: '0.9rem' }}>🚪</button>
        </div>
      </div>
      <div className="content dashboard-content">
        <div className="dashboard-left" style={{ display: 'grid', gap: '15px', marginBottom: '20px' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div className="home-title">Nurse Info</div>
            <div className="info-row"><span className="info-key">Name</span><span className="info-val">{nurseName}</span></div>
            <div className="info-row"><span className="info-key">Shift</span><span className="info-val">{getCurrentShift()} Shift</span></div>
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
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#04364A' }}>{obCount}</div>
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
            <div className="home-title" style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => { setUrgentPanelFilter('all'); setShowUrgentPanel(true); }}>
              <span>Notifications</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>View All →</span>
            </div>
            <div className="info-row" onClick={() => { setUrgentPanelFilter('new'); setShowUrgentPanel(true); }} style={{ cursor: 'pointer' }}>
              <span className="info-key">New endorsements</span>
              <span className="info-val">{newEndorsementsCount}</span>
            </div>
            <div className="info-row" onClick={() => { setUrgentPanelFilter('labs'); setShowUrgentPanel(true); }} style={{ cursor: 'pointer' }}>
              <span className="info-key">Pending acknowledgments</span>
              <span className="info-val">{pendingLabsOrProcedures}</span>
            </div>
            <div className="info-row" onClick={() => { setUrgentPanelFilter('critical'); setShowUrgentPanel(true); }} style={{ cursor: 'pointer', border: criticalAlertsCount > 0 ? '1px solid var(--danger)' : 'none', borderRadius: '8px', padding: '4px 8px' }}>
              <span className="info-key">Urgent alerts</span>
              <span className={`info-val ${criticalAlertsCount > 0 ? 'pulse-danger' : ''}`} style={criticalAlertsCount > 0 ? { color: 'var(--danger)', fontWeight: 800 } : {}}>
                {criticalAlertsCount}
              </span>
            </div>
          </div>

        </div>

        <div className="dashboard-main">
          {showUrgentPanel && (
            <div className="modal-overlay open" onClick={(e) => { if (e.target === e.currentTarget) setShowUrgentPanel(false) }}>
              <div className="modal" style={{ transform: 'translateY(0)', maxWidth: '500px' }}>
                <div className="modal-handle"></div>
                <div className="modal-title" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="pulse-icon">🔔</span> {urgentPanelFilter === 'all' ? 'Urgent Tasks & Notifications' : 
                                                          urgentPanelFilter === 'labs' ? 'Pending Labs/Procedures' :
                                                          urgentPanelFilter === 'meds' ? 'Pending Medications' :
                                                          urgentPanelFilter === 'new' ? 'New Endorsements' : 'Urgent Alerts'}
                </div>
                
                <div style={{ marginTop: '20px', display: 'grid', gap: '12px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '5px' }}>
                  {urgentNotifications.filter(n => urgentPanelFilter === 'all' || n.type === urgentPanelFilter).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
                      <div style={{ fontSize: '3rem', marginBottom: '10px' }}>✅</div>
                      <div>All caught up! No {urgentPanelFilter === 'all' ? 'urgent' : urgentPanelFilter} tasks.</div>
                    </div>
                  ) : urgentNotifications.filter(n => urgentPanelFilter === 'all' || n.type === urgentPanelFilter).map(n => (
                    <div key={n.id} className="notification-item" onClick={() => { navigate(n.target); setShowUrgentPanel(false); }} style={{ cursor: 'pointer', border: '1px solid #eee' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: 700, color: '#333' }}>{n.patient.fname} {n.patient.lname}</div>
                        <span style={{ fontSize: '1.2rem' }}>{n.icon}</span>
                      </div>
                      {n.msg && <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>{n.msg}</div>}
                    </div>
                  ))}
                </div>
                
                <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-ghost" onClick={() => setShowUrgentPanel(false)}>Close</button>
                </div>
              </div>
            </div>
          )}
          <div id="patient-list">
            <div className="home-title">My Patients</div>
            <div className="home-date">{new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
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
            <div className="info-row" onClick={() => { setUrgentPanelFilter('labs'); setShowUrgentPanel(true); }} style={{ cursor: 'pointer' }}>
              <span className="info-key">Pending labs/procedures</span>
              <span className="info-val">{pendingLabsOrProcedures}</span>
            </div>
            <div className="info-row" onClick={() => { setUrgentPanelFilter('meds'); setShowUrgentPanel(true); }} style={{ cursor: 'pointer' }}>
              <span className="info-key">Pending meds</span>
              <span className="info-val">{pendingMeds}</span>
            </div>
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
            <button className={`shift-btn ${filterMode === 'OB' ? 'active' : ''}`} onClick={() => setFilterMode('OB')}>OB</button>
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
