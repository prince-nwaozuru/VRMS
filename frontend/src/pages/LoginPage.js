import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/fleet');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Left — hero panel */}
      <div style={styles.hero}>
        <div style={styles.heroContent}>
          <div style={styles.heroTag}>Vehicle Rental</div>
          <h1 style={styles.heroTitle}>Drive the<br />world your<br />way.</h1>
          <p style={styles.heroSub}>Premium vehicles. Seamless booking. Zero hassle.</p>
          <div style={styles.stats}>
            {[['500+', 'Vehicles'], ['3', 'Branches'], ['10k+', 'Happy Renters']].map(([num, label]) => (
              <div key={label} style={styles.stat}>
                <span style={styles.statNum}>{num}</span>
                <span style={styles.statLabel}>{label}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={styles.heroBg} />
      </div>

      {/* Right — form panel */}
      <div style={styles.formPanel}>
        <div style={styles.formCard} className="page-enter">
          <div style={styles.logoRow}>
            <span style={{ fontSize: '2rem' }}>🚗</span>
            <span style={styles.logoText}>DRIVE<span style={{ color: 'var(--accent)' }}>EASY</span></span>
          </div>

          <h2 style={styles.formTitle}>Welcome back</h2>
          <p style={styles.formSub}>Sign in to your account</p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Email Address</label>
              <input
                name="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
                autoFocus
              />
            </div>

            <div className="input-group">
              <label>Password</label>
              <input
                name="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 8, padding: '14px' }}
              disabled={loading}
            >
              {loading ? <><div className="spinner" />Signing in...</> : 'Sign In →'}
            </button>
          </form>

          <div style={styles.demoBox}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Demo credentials</p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>john.doe@email.com / <strong style={{ color: 'var(--accent)' }}>password</strong></p>
          </div>

          <p style={styles.switchLink}>
            New driver?{' '}
            <Link to="/register">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    display: 'flex',
    minHeight: '100vh',
  },
  hero: {
    flex: 1,
    position: 'relative',
    background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1220 50%, #0f1a2a 100%)',
    display: 'flex',
    alignItems: 'center',
    padding: '60px',
    overflow: 'hidden',
  },
  heroBg: {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(ellipse at 30% 60%, rgba(232,184,75,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(75,158,232,0.06) 0%, transparent 50%)',
    pointerEvents: 'none',
  },
  heroContent: {
    position: 'relative',
    zIndex: 1,
  },
  heroTag: {
    display: 'inline-block',
    padding: '4px 12px',
    background: 'var(--accent-dim)',
    border: '1px solid rgba(232,184,75,0.3)',
    borderRadius: 20,
    fontSize: '0.72rem',
    fontWeight: 600,
    color: 'var(--accent)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: 24,
  },
  heroTitle: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 'clamp(3.5rem, 6vw, 5rem)',
    lineHeight: 1.05,
    letterSpacing: '0.03em',
    color: '#f0f0f8',
    marginBottom: 20,
  },
  heroSub: {
    color: 'rgba(240,240,248,0.7)',
    fontSize: '1rem',
    maxWidth: 320,
    lineHeight: 1.7,
    marginBottom: 48,
  },
  stats: {
    display: 'flex',
    gap: 32,
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  statNum: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: '2rem',
    color: 'var(--accent)',
    letterSpacing: '0.04em',
  },
  statLabel: {
    fontSize: '0.75rem',
    color: 'rgba(240,240,248,0.5)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontWeight: 600,
  },
  formPanel: {
    width: 460,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 32px',
    background: 'var(--bg-card)',
    borderLeft: '1px solid var(--border)',
  },
  formCard: {
    width: '100%',
    maxWidth: 380,
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 40,
  },
  logoText: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: '1.6rem',
    letterSpacing: '0.08em',
    color: 'var(--text-primary)',
  },
  formTitle: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: '2.2rem',
    letterSpacing: '0.04em',
    marginBottom: 6,
  },
  formSub: {
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
    marginBottom: 28,
  },
  demoBox: {
    marginTop: 20,
    padding: '12px 16px',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 10,
  },
  switchLink: {
    textAlign: 'center',
    marginTop: 24,
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
  }
};
