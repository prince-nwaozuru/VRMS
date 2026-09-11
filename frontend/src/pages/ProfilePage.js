import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [dlFile, setDlFile] = useState(null);
  const [dlPreview, setDlPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [uploadError, setUploadError] = useState('');
  const fileRef = useRef();

  useEffect(() => {
    api.get('/auth/me').then(r => setProfile(r.data)).catch(() => {});
  }, []);

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

  const handleUpload = async () => {
    if (!dlFile) return;
    setUploading(true);
    setUploadError('');
    setUploadSuccess('');
    try {
      const fd = new FormData();
      fd.append('dl_image', dlFile);
      await api.post('/auth/upload-dl', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setUploadSuccess('Driving license updated successfully!');
      const updated = await api.get('/auth/me');
      setProfile(updated.data);
      setDlFile(null);
    } catch (err) {
      setUploadError(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const p = profile;
  const formatDate = d => d ? new Date(d).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

  return (
    <div style={styles.page} className="page-enter">
      <div style={styles.header}>
        <p style={styles.tag}>Account</p>
        <h1 style={styles.title}>My Profile</h1>
      </div>

      <div style={styles.grid}>
        {/* Profile info card */}
        <div className="card">
          <div style={styles.avatar}>
            <span style={styles.avatarInitials}>
              {(user?.firstName || user?.FIRST_NAME || '?')[0]}
              {(user?.lastName || user?.LAST_NAME || '?')[0]}
            </span>
          </div>
          <h2 style={styles.userName}>
            {p?.FIRST_NAME || user?.firstName} {p?.LAST_NAME || user?.lastName}
          </h2>
          <p style={styles.userEmail}>{p?.EMAIL || user?.email}</p>

          <div style={styles.divider} />

          <div style={styles.infoList}>
            {[
              ['📞', 'Phone', p?.PHONE],
              ['🎂', 'Date of Birth', formatDate(p?.DOB)],
              ['🪪', 'DL Number', p?.DL_NUMBER],
              ['📅', 'DL Expiry', formatDate(p?.DL_EXPIRY)],
            ].map(([icon, label, val]) => (
              <div key={label} style={styles.infoRow}>
                <span style={styles.infoIcon}>{icon}</span>
                <div>
                  <div style={styles.infoLabel}>{label}</div>
                  <div style={styles.infoVal}>{val || <span style={{ color: 'var(--text-muted)' }}>Not provided</span>}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* DL Upload card */}
        <div className="card">
          <h3 style={styles.sectionTitle}>Driving License</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 20 }}>
            Your driving license is required to rent vehicles. Keep it up-to-date.
          </p>

          {/* Current DL status */}
          <div style={styles.dlStatus}>
            {p?.DL_IMAGE_PATH ? (
              <div style={styles.dlUploaded}>
                <span style={{ fontSize: '1.5rem' }}>✅</span>
                <div>
                  <p style={{ fontWeight: 600, color: 'var(--success)' }}>License on file</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.DL_IMAGE_PATH}</p>
                </div>
              </div>
            ) : (
              <div style={styles.dlMissing}>
                <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                <div>
                  <p style={{ fontWeight: 600, color: 'var(--accent)' }}>No license uploaded</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Required to make reservations</p>
                </div>
              </div>
            )}
          </div>

          {uploadError && <div className="alert alert-error">{uploadError}</div>}
          {uploadSuccess && <div className="alert alert-success">{uploadSuccess}</div>}

          {/* Upload zone */}
          <div
            style={{ ...styles.uploadZone, borderColor: dlFile ? 'var(--accent)' : 'var(--border)' }}
            onClick={() => fileRef.current?.click()}
          >
            {dlPreview && dlPreview !== 'pdf' ? (
              <img src={dlPreview} alt="preview" style={styles.preview} />
            ) : dlPreview === 'pdf' ? (
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '2.5rem' }}>📄</span>
                <p style={{ color: 'var(--success)', fontWeight: 600, marginTop: 8 }}>{dlFile?.name}</p>
              </div>
            ) : (
              <div style={styles.uploadPrompt}>
                <span style={{ fontSize: '2.5rem' }}>🪪</span>
                <p style={{ fontWeight: 600 }}>Click to upload</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>JPG, PNG or PDF — max 5MB</p>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={handleFile}
              style={{ display: 'none' }}
            />
          </div>

          {dlFile && (
            <button
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 12 }}
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? <><div className="spinner" />Uploading...</> : '⬆️ Upload License'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    maxWidth: 900,
    margin: '0 auto',
    padding: '32px 24px',
    minHeight: 'calc(100vh - 64px)',
  },
  header: { marginBottom: 40 },
  tag: {
    fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent)',
    textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6,
  },
  title: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
    letterSpacing: '0.04em',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 24,
    alignItems: 'start',
  },
  avatar: {
    width: 80, height: 80,
    borderRadius: '50%',
    background: 'var(--accent-dim)',
    border: '2px solid var(--accent)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  avatarInitials: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: '1.8rem',
    color: 'var(--accent)',
    letterSpacing: '0.08em',
  },
  userName: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: '1.8rem',
    letterSpacing: '0.04em',
    marginBottom: 4,
  },
  userEmail: {
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
  },
  divider: {
    height: 1,
    background: 'var(--border)',
    margin: '20px 0',
  },
  infoList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  infoRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoIcon: { fontSize: '1.1rem', marginTop: 2 },
  infoLabel: {
    fontSize: '0.7rem', color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: 2,
  },
  infoVal: { fontSize: '0.9rem', color: 'var(--text-primary)' },
  sectionTitle: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: '1.5rem', letterSpacing: '0.04em', marginBottom: 8,
  },
  dlStatus: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: '14px 16px',
    marginBottom: 20,
  },
  dlUploaded: { display: 'flex', alignItems: 'center', gap: 12 },
  dlMissing: { display: 'flex', alignItems: 'center', gap: 12 },
  uploadZone: {
    border: '2px dashed',
    borderRadius: 'var(--radius)',
    padding: '32px 24px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'border-color 0.2s',
    minHeight: 140,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadPrompt: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 8, color: 'var(--text-secondary)',
  },
  preview: {
    maxHeight: 160, maxWidth: '100%',
    borderRadius: 8, objectFit: 'cover',
  },
};
