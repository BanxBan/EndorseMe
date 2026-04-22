import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiWithCache } from '../api';
import api from '../api';
import AddDetailModal from '../components/AddDetailModal';
import { showToast } from '../utils/toast';

const detailMeta: any = {
  diet: { title: 'Diet Orders 🍎', key: 'diet' },
  labs: { title: 'Laboratory 🔬', key: 'labs' },
  ivfluids: { title: 'IV Fluids 💧', key: 'iv' },
  vitals: { title: 'Vital Signs ❤️', key: 'vitals' },
  meds: { title: 'Medications 💊', key: 'meds' },
  status: { title: 'Current Status 📝', key: 'status' },
  sbar: { title: 'SBAR Endorsement 📋', key: 'sbar' },
};

export default function DetailScreen() {
  const { id, type } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const pRes = await apiWithCache.get('/patients');
      const foundPatient = pRes.data.find((p: any) => p.id === id);
      setPatient(foundPatient);
      
      if (foundPatient && type) {
        const meta = detailMeta[type as string];
        const res = await apiWithCache.get(`/records/${meta.key}_${id}`);
        setRecords(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [id, type]);

  const handleDelete = async (recordId: string) => {
    const meta = detailMeta[type as string];
    await api.delete(`/records/${meta.key}_${id}/${recordId}`);
    showToast('Record removed successfully');
    fetchRecords();
  };

  if (loading) {
    const meta = detailMeta[type as string];
    return (
      <div className="screen active">
        <div className="topbar">
          <button className="back-btn" onClick={() => navigate(`/patient/${id}`)}>←</button>
          <div>
            <div className="topbar-logo">{meta?.title || 'Loading...'}</div>
            <div className="topbar-subtitle">Fetching data...</div>
          </div>
        </div>
        <div className="content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>⏳</div>
            <div style={{ fontSize: '1.2rem', color: '#666', marginBottom: '10px' }}>Loading {meta?.title?.split(' ')[0] || 'Data'}</div>
            <div style={{ color: '#999', fontSize: '0.9rem' }}>Please wait a moment...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!patient || !type) {
    return (
      <div className="screen active">
        <div className="topbar">
          <button className="back-btn" onClick={() => navigate('/')}>←</button>
          <div>
            <div className="topbar-logo">Page Not Found</div>
            <div className="topbar-subtitle">Invalid patient or module</div>
          </div>
        </div>
        <div className="content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🔍</div>
            <div style={{ fontSize: '1.2rem', color: '#666', marginBottom: '10px' }}>Page Not Found</div>
            <div style={{ color: '#999', fontSize: '0.9rem' }}>The patient or module you're looking for doesn't exist</div>
            <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={() => navigate('/')}>Back to Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  const meta = detailMeta[type];

  return (
    <div className="screen active">
      <div className="topbar">
        <button className="back-btn" onClick={() => navigate(`/patient/${id}`)}>←</button>
        <div>
          <div className="topbar-logo">{meta.title}</div>
          <div className="topbar-subtitle">{patient.fname} {patient.lname} · Rm {patient.room}</div>
        </div>
      </div>
      <div className="content">
        {records.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📂</div>
            <div className="empty-text">No records found.</div>
          </div>
        ) : (
          <div className="history-list">
            {records.map(r => (
              <div key={r.id} className="history-item">
                <div className="history-value">{r.value || r.name || r.fluid || `BP: ${r.bp}` || r.situation}</div>
                <div className="history-time">{new Date(r.ts).toLocaleString()} · {r.by}</div>
                <button className="edit-btn" onClick={() => {
                  setEditingRecord(r);
                  setShowModal(true);
                }}>✏️</button>
                <button className="delete-btn" onClick={() => handleDelete(r.id)}>🗑</button>
              </div>
            ))}
          </div>
        )}
      </div>
      <button className="fab" onClick={() => {
        setEditingRecord(null);
        setShowModal(true);
      }}>＋</button>

      {showModal && (
        <AddDetailModal 
          type={meta.key} 
          patientId={id as string} 
          record={editingRecord}
          onClose={() => setShowModal(false)} 
          onSave={() => {
            setShowModal(false);
            fetchRecords();
          }} 
        />
      )}
    </div>
  );
}
