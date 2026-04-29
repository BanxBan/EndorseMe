import { useNavigate } from 'react-router-dom';

export default function AuthGateway() {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)', padding: '20px' }}>
      <div style={{ background: 'var(--surface)', padding: '36px', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: '440px', textAlign: 'center' }}>
        <h1 className="topbar-logo" style={{ color: 'var(--primary)', fontSize: '2rem', marginBottom: '10px' }}>
          Endorse<span style={{ color: 'var(--accent)' }}>Me</span>
        </h1>
        <p className="topbar-subtitle" style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
          Create Account / Log In
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button className="btn btn-primary btn-full" onClick={() => navigate('/register')}>
            Create Account
          </button>
          <button className="btn btn-ghost btn-full" onClick={() => navigate('/login')}>
            Log In as Nurse
          </button>
        </div>
      </div>
    </div>
  );
}
