import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    dob: '', dl_number: '', dl_expiry: '', password: '', confirm_password: ''
  });
  const [dlFile, setDlFile] = useState(null);
  const [dlPreview, setDlPreview] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1=personal, 2=license, 3=account
  const fileRef = useRef();
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleFile = e => {
    const file = e.target.files[0];
    if (!file) return;
    setDlFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = ev => setDlPreview(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setDlPreview('pdf');
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match');
      return;
    }
    if (!dlFile) {
      setError('Please upload your driving license');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k !== 'confirm_password' && v) formData.append(k, v);
      });
      formData.append('dl_image', dlFile);
      await register(formData);
      navigate('/fleet');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const steps = ['Personal Info', 'Driving License', 'Account Setup'];

  return (
    <div style={styles.page}>
      <div style={styles.container} className="page-enter">
        {/* Header */}
        <div style={styles.header}>
          <Link to="/login" style={{ textDecoration: 'none' }}>
            <span style={styles.logoText}>🚗 DRIVE<span style={{ color: 'var(--accent)' }}>EASY</span></span>
          </Link>
          <h2 style={styles.title}>Create Your Account</h2>
          <p style={styles.sub}>Join thousands of happy renters</p>
        </div>

        {/* Steps indicator */}
        <div style={styles.steps}>
          {steps.map((label, i) => (
            <div key={i} style={styles.stepItem}>
              <div style={{
                ...styles.stepNum,
                background: step > i + 1 ? 'var(--success)' : step === i + 1 ? 'var(--accent)' : 'var(--bg-elevated)',
                color: step >= i + 1 ? '#000' : 'var(--text-muted)',
                borderColor: step >= i + 1 ? 'transparent' : 'var(--border)',
              }}>
                {step > i + 1 ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: '0.75rem', color: step === i + 1 ? 'var(--accent)' : 'var(--text-muted)', fontWeight: step === i + 1 ? 600 : 400 }}>
                {label}
              </span>
              {i < steps.length - 1 && <div style={styles.stepLine} />}
            </div>
          ))}
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Step 1: Personal Info */}
          {step === 1 && (
            <div className="page-enter">
              <div style={styles.row}>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>First Name *</label>
                  <input name="first_name" placeholder="John" value={form.first_name} onChange={handleChange} required />
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Last Name *</label>
                  <input name="last_name" placeholder="Doe" value={form.last_name} onChange={handleChange} required />
                </div>
              </div>
              <div className="input-group">
                <label>Phone</label>
                <input name="phone" type="tel" placeholder="416-555-0000" value={form.phone} onChange={handleChange} />
              </div>
              <div className="input-group">
                <label>Date of Birth</label>
                <input name="dob" type="date" value={form.dob} onChange={handleChange} />
              </div>
              <button type="button" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}
                onClick={() => {
                  if (!form.first_name || !form.last_name) { setError('Please fill required fields'); return; }
                  setError(''); setStep(2);
                }}>
                Continue →
              </button>
            </div>
          )}

          {/* Step 2: Driving License */}
          {step === 2 && (
            <div className="page-enter">
              <div style={styles.row}>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>DL Number</label>
                  <input name="dl_number" placeholder="DL-ON-123456" value={form.dl_number} onChange={handleChange} />
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>DL Expiry Date</label>
                  <input name="dl_expiry" type="date" value={form.dl_expiry} onChange={handleChange} />
                </div>
              </div>

              {/* Upload area */}
              <div style={styles.uploadArea} onClick={() => fileRef.current?.click()}>
                {dlPreview ? (
                  dlPreview === 'pdf' ? (
                    <div style={styles.pdfIcon}>
                      <span style={{ fontSize: '2.5rem' }}>📄</span>
                      <p style={{ color: 'var(--success)', fontWeight: 600 }}>{dlFile.name}</p>
                    </div>
                  ) : (
                    <img src={dlPreview} alt="DL preview" style={styles.dlPreview} />
                  )
                ) : (
                  <div style={styles.uploadPrompt}>
                    <span style={{ fontSize: '2.5rem' }}>🪪</span>
                    <p style={{ fontWeight: 600, marginBottom: 4 }}>Upload Driving License *</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>JPG, PNG or PDF — max 5MB</p>
                  </div>
                )}
                <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFile} style={{ display: 'none' }} />
              </div>
              {dlFile && (
                <p style={{ fontSize: '0.8rem', color: 'var(--success)', marginBottom: 8 }}>
                  ✓ {dlFile.name} uploaded
                </p>
              )}

              <div style={styles.row}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setStep(1)}>← Back</button>
                <button type="button" className="btn btn-primary" style={{ flex: 2 }}
                  onClick={() => {
                    if (!dlFile) { setError('Please upload your driving license'); return; }
                    setError(''); setStep(3);
                  }}>
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Account Setup */}
          {step === 3 && (
            <div className="page-enter">
              <div className="input-group">
                <label>Email Address *</label>
                <input name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
              </div>
              <div className="input-group">
                <label>Password *</label>
                <input name="password" type="password" placeholder="••••••••" value={form.password} onChange={handleChange} required minLength={6} />
              </div>
              <div className="input-group">
                <label>Confirm Password *</label>
                <input name="confirm_password" type="password" placeholder="••••••••" value={form.confirm_password} onChange={handleChange} required />
              </div>

              <div style={styles.row}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setStep(2)}>← Back</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={loading}>
                  {loading ? <><div className="spinner" />Creating account...</> : 'Create Account 🚗'}
                </button>
              </div>
            </div>
          )}
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '40px 20px',
    background: 'radial-gradient(ellipse at 50% 0%, rgba(232,184,75,0.05) 0%, transparent 60%)',
  },
  container: {
    width: '100%',
    maxWidth: 520,
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '40px 36px',
  },
  header: {
    marginBottom: 32,
  },
  logoText: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: '1.4rem',
    letterSpacing: '0.08em',
    color: 'var(--text-primary)',
    textDecoration: 'none',
  },
  title: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: '2rem',
    letterSpacing: '0.04em',
    marginTop: 20,
    marginBottom: 4,
  },
  sub: {
    color: 'var(--text-secondary)',
    fontSize: '0.875rem',
  },
  steps: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 32,
    gap: 0,
  },
  stepItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  stepNum: {
    width: 28, height: 28,
    borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.75rem', fontWeight: 700,
    border: '1.5px solid',
    flexShrink: 0,
    transition: 'all 0.3s',
  },
  stepLine: {
    flex: 1,
    height: 1,
    background: 'var(--border)',
    marginLeft: 8,
  },
  row: {
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
  },
  uploadArea: {
    border: '2px dashed var(--border)',
    borderRadius: 'var(--radius)',
    padding: '32px 24px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'border-color 0.2s',
    marginBottom: 12,
    '&:hover': { borderColor: 'var(--accent)' },
  },
  uploadPrompt: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    color: 'var(--text-secondary)',
  },
  dlPreview: {
    maxHeight: 160,
    maxWidth: '100%',
    borderRadius: 8,
    objectFit: 'cover',
  },
  pdfIcon: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
};
