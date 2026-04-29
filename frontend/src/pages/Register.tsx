import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api';

export default function Register() {
  const [name, setName] = useState('');
  const [licenseNo, setLicenseNo] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cleanedName = name.trim();
    const cleanedLicenseNo = licenseNo.trim();
    const cleanedEmail = email.trim().toLowerCase();

    if (!cleanedLicenseNo || cleanedLicenseNo.length < 5) {
      setError('License No. is required and must be valid');
      return;
    }

    setSaving(true);

    try {
      await authApi.post('/register', { name: cleanedName, licenseNo: cleanedLicenseNo, email: cleanedEmail, password });
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)', padding: '20px' }}>
      <div style={{ background: 'var(--surface)', padding: '32px', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: '460px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 className="topbar-logo" style={{ color: 'var(--primary)', fontSize: '1.9rem' }}>Create Nurse Account</h1>
          <p className="topbar-subtitle" style={{ color: 'var(--text-muted)' }}>Nurse Registration</p>
        </div>

        {error && <div style={{ color: 'var(--danger)', marginBottom: '15px', textAlign: 'center', fontSize: '0.88rem' }}>{error}</div>}

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label>Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>License No.</label>
            <input type="text" value={licenseNo} onChange={e => setLicenseNo(e.target.value)} minLength={5} required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: '12px' }} disabled={saving}>
            {saving ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <button className="btn btn-ghost btn-full" style={{ marginTop: '10px' }} onClick={() => navigate('/login')}>
          Already have an account? Log In
        </button>
      </div>
    </div>
  );
}
