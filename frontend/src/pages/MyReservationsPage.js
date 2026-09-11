import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const STATUS_CONFIG = {
  CONFIRMED: { label: 'Confirmed', cls: 'badge-success' },
  PENDING: { label: 'Pending', cls: 'badge-warning' },
  COMPLETED: { label: 'Completed', cls: 'badge-info' },
  CANCELLED: { label: 'Cancelled', cls: 'badge-danger' },
};

export default function MyReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/reservations/my')
      .then(r => setReservations(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatDate = d => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <div className="spinner" style={{ width: 40, height: 40 }} />
    </div>
  );

  return (
    <div style={styles.page} className="page-enter">
      <div style={styles.header}>
        <p style={styles.tag}>Your Rentals</p>
        <h1 style={styles.title}>My Reservations</h1>
        <p style={styles.sub}>{reservations.length} reservation{reservations.length !== 1 ? 's' : ''} total</p>
      </div>

      {reservations.length === 0 ? (
        <div style={styles.empty}>
          <span style={{ fontSize: '4rem' }}>🚗</span>
          <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: '2rem', letterSpacing: '0.04em' }}>No reservations yet</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Browse our fleet and book your first vehicle!</p>
          <button className="btn btn-primary" onClick={() => navigate('/fleet')}>Browse Fleet →</button>
        </div>
      ) : (
        <div style={styles.list}>
          {reservations.map((r, i) => {
            const status = STATUS_CONFIG[r.STATUS] || { label: r.STATUS, cls: 'badge-warning' };
            return (
              <div key={r.RESERVATION_ID} style={{ ...styles.card, animationDelay: `${i * 60}ms` }} className="page-enter">
                {/* Left: car icon */}
                <div style={styles.cardLeft}>
                  <span style={styles.carIcon}>
                    {r.CATEGORY_NAME === 'Economy' ? '🚙' :
                     r.CATEGORY_NAME === 'SUV' ? '🚐' :
                     r.CATEGORY_NAME === 'Luxury' ? '🏎️' :
                     r.CATEGORY_NAME === 'Pickup Truck' ? '🛻' : '🚗'}
                  </span>
                </div>

                {/* Middle: details */}
                <div style={styles.cardMid}>
                  <div style={styles.cardTopRow}>
                    <div>
                      <div style={styles.makeLabel}>{r.MAKE}</div>
                      <h3 style={styles.modelName}>{r.MODEL} {r.YEAR_MADE}</h3>
                    </div>
                    <span className={`badge ${status.cls}`}>{status.label}</span>
                  </div>

                  <div style={styles.dateRow}>
                    <div style={styles.dateBox}>
                      <span style={styles.dateLabel}>Pickup</span>
                      <span style={styles.dateVal}>{formatDate(r.PICKUP_DATE)}</span>
                    </div>
                    <div style={styles.dateSep}>→</div>
                    <div style={styles.dateBox}>
                      <span style={styles.dateLabel}>Return</span>
                      <span style={styles.dateVal}>{formatDate(r.RETURN_DATE)}</span>
                    </div>
                    <div style={styles.dateBox}>
                      <span style={styles.dateLabel}>Duration</span>
                      <span style={styles.dateVal}>{r.TOTAL_DAYS} day{r.TOTAL_DAYS !== 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  <div style={styles.metaRow}>
                    <span style={styles.metaItem}>📍 {r.BRANCH_NAME}</span>
                    <span style={styles.metaItem}>🪪 {r.LICENCE_PLATE}</span>
                    <span style={styles.metaItem}>🎨 {r.COLOR}</span>
                  </div>
                </div>

                {/* Right: price */}
                <div style={styles.cardRight}>
                  <div style={styles.resId}>#{r.RESERVATION_ID}</div>
                  <div style={styles.priceBox}>
                    <span style={styles.priceLabel}>Total</span>
                    <span style={styles.price}>${parseFloat(r.SUBTOTAL).toFixed(2)}</span>
                    <span style={styles.priceRate}>${r.BASE_DAILY_RATE}/day</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    maxWidth: 1000,
    margin: '0 auto',
    padding: '32px 24px',
    minHeight: 'calc(100vh - 64px)',
  },
  header: {
    marginBottom: 40,
  },
  tag: {
    fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent)',
    textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6,
  },
  title: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
    letterSpacing: '0.04em', marginBottom: 6,
  },
  sub: { color: 'var(--text-secondary)', fontSize: '0.9rem' },
  list: { display: 'flex', flexDirection: 'column', gap: 16 },
  empty: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 12, paddingTop: 80, textAlign: 'center',
  },
  card: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    display: 'flex',
    gap: 0,
    overflow: 'hidden',
    transition: 'border-color 0.2s',
  },
  cardLeft: {
    width: 120,
    flexShrink: 0,
    background: 'var(--bg-elevated)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRight: '1px solid var(--border)',
  },
  carIcon: { fontSize: '3.5rem' },
  cardMid: { flex: 1, padding: '20px 24px' },
  cardTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  makeLabel: {
    fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2,
  },
  modelName: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: '1.6rem', letterSpacing: '0.04em',
  },
  dateRow: {
    display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12,
  },
  dateBox: { display: 'flex', flexDirection: 'column', gap: 2 },
  dateLabel: {
    fontSize: '0.68rem', color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600,
  },
  dateVal: { fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' },
  dateSep: { color: 'var(--text-muted)', fontSize: '1.2rem' },
  metaRow: { display: 'flex', gap: 16, flexWrap: 'wrap' },
  metaItem: { fontSize: '0.78rem', color: 'var(--text-secondary)' },
  cardRight: {
    width: 140,
    flexShrink: 0,
    borderLeft: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    gap: 12,
    background: 'var(--bg-elevated)',
  },
  resId: {
    fontSize: '0.72rem', color: 'var(--text-muted)',
    fontWeight: 700, letterSpacing: '0.08em',
  },
  priceBox: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 2,
  },
  priceLabel: {
    fontSize: '0.68rem', color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.08em',
  },
  price: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: '1.8rem', color: 'var(--accent)', letterSpacing: '0.04em',
  },
  priceRate: { fontSize: '0.72rem', color: 'var(--text-muted)' },
};
