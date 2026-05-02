import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

type TokenPayload = {
  id?: string;
  username?: string;
  exp?: number;
};

function parseToken(token: string | null): TokenPayload | null {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    const parsed = JSON.parse(atob(payload));
    return parsed;
  } catch {
    return null;
  }
}

export default function NurseProfile() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const storedUsername = localStorage.getItem('username') || '';

  const profile = useMemo(() => {
    const parsed = parseToken(token);
    const n = localStorage.getItem('nurseName');
    return {
      name: (n && !n.includes('@')) ? n : 'Nurse',
      email: storedUsername || parsed?.username || 'Not available',
      licenseNo: localStorage.getItem('licenseNo') || 'Not available',
      role: 'Nurse',
    };
  }, [storedUsername, token]);

  return (
    <div className="screen active">
      <div className="topbar">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>←</button>
        <div>
          <div className="topbar-logo">Nurse Profile</div>
          <div className="topbar-subtitle">Account details</div>
        </div>
      </div>
      <div className="content">
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', padding: '20px', boxShadow: 'var(--shadow)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '10px', textAlign: 'center' }}>👩‍⚕️</div>
          <div className="info-row">
            <span className="info-key">Name</span>
            <span className="info-val">{profile.name}</span>
          </div>
          <div className="info-row">
            <span className="info-key">Role</span>
            <span className="info-val">{profile.role}</span>
          </div>
          <div className="info-row">
            <span className="info-key">Email</span>
            <span className="info-val">{profile.email}</span>
          </div>
          <div className="info-row">
            <span className="info-key">License Number</span>
            <span className="info-val">{profile.licenseNo}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
