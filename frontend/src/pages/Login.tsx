import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await authApi.post('/login', { username: username.trim().toLowerCase(), password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('username', res.data.username);
      localStorage.setItem('nurseName', res.data.name || res.data.username);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ background: 'var(--surface)', padding: '40px', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 className="topbar-logo" style={{ color: 'var(--primary)', fontSize: '2rem' }}>Endorse<span style={{ color: 'var(--accent)' }}>Me</span></h1>
          <p className="topbar-subtitle" style={{ color: 'var(--text-muted)' }}>Log In as Nurse</p>
        </div>
        
        {error && <div style={{ color: 'var(--danger)', marginBottom: '15px', textAlign: 'center', fontSize: '0.88rem' }}>{error}</div>}
        
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={username} onChange={e => setUsername(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: '20px' }}>Log In</button>
        </form>
        <button className="btn btn-ghost btn-full" style={{ marginTop: '10px' }} onClick={() => navigate('/register')}>
          Create new nurse account
        </button>
      </div>
    </div>
  );
}
