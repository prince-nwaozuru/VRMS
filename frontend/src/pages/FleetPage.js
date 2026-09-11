import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const CAR_ICONS = {
  'Economy': '🚙', 'SUV': '🚐', 'Luxury': '🏎️', 'Pickup Truck': '🛻', 'Van': '🚌'
};

const CATEGORY_COLORS = {
  'Economy': '#4be8a0', 'SUV': '#4b9ee8', 'Luxury': '#e8b84b',
  'Pickup Truck': '#e85454', 'Van': '#b84be8'
};

export default function FleetPage() {
  const [vehicles, setVehicles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/vehicles/categories').then(r => setCategories(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = selectedCategory ? `?category_id=${selectedCategory}` : '';
    api.get(`/vehicles${params}`)
      .then(r => setVehicles(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedCategory]);

  const filtered = vehicles.filter(v => {
    const term = searchTerm.toLowerCase();
    return !term ||
      v.MAKE?.toLowerCase().includes(term) ||
      v.MODEL?.toLowerCase().includes(term) ||
      v.CATEGORY_NAME?.toLowerCase().includes(term);
  });

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <p style={styles.headerTag}>Available Now</p>
          <h1 style={styles.pageTitle}>Our Fleet</h1>
          <p style={styles.headerSub}>
            {vehicles.length} vehicles across {categories.length} categories
          </p>
        </div>

        <div style={styles.searchRow}>
          <div style={styles.searchBox}>
            <span style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>🔍</span>
            <input
              style={styles.searchInput}
              placeholder="Search make, model, or type..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} style={styles.clearBtn}>✕</button>
            )}
          </div>
        </div>

        <div style={styles.filters}>
          <button
            className={`btn ${selectedCategory === '' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '8px 18px', fontSize: '0.82rem' }}
            onClick={() => setSelectedCategory('')}
          >
            All ({vehicles.length})
          </button>
          {categories.map(cat => {
            const count = vehicles.filter(v => String(v.CATEGORY_ID) === String(cat.CATEGORY_ID)).length;
            return (
              <button
                key={cat.CATEGORY_ID}
                className={`btn ${selectedCategory === String(cat.CATEGORY_ID) ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '8px 18px', fontSize: '0.82rem' }}
                onClick={() => setSelectedCategory(String(cat.CATEGORY_ID))}
              >
                {CAR_ICONS[cat.CATEGORY_NAME] || '🚗'} {cat.CATEGORY_NAME}
                {count > 0 && <span style={styles.countBadge}>{count}</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div style={styles.content}>
        {loading ? (
          <div style={styles.loadingState}>
            <div className="spinner" style={{ width: 40, height: 40 }} />
            <p style={{ color: 'var(--text-muted)' }}>Loading fleet...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={{ fontSize: '3rem' }}>🚗</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>No vehicles found</p>
            <button className="btn btn-ghost" onClick={() => { setSelectedCategory(''); setSearchTerm(''); }}>
              Clear filters
            </button>
          </div>
        ) : (
          <div style={styles.grid}>
            {filtered.map((v, i) => (
              <VehicleCard
                key={v.VEHICLE_ID}
                vehicle={v}
                index={i}
                onClick={() => navigate(`/vehicle/${v.VEHICLE_ID}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function VehicleCard({ vehicle: v, index, onClick }) {
  const [imgError, setImgError] = useState(false);
  const catColor = CATEGORY_COLORS[v.CATEGORY_NAME] || 'var(--accent)';
  const icon = CAR_ICONS[v.CATEGORY_NAME] || '🚗';

  return (
    <div
      style={{ ...styles.card, animationDelay: `${index * 50}ms` }}
      className="page-enter"
      onClick={onClick}
    >
      {/* Image area */}
      <div style={styles.cardHero}>
        {v.IMAGE_URL && !imgError ? (
          <>
            <img
              src={v.IMAGE_URL}
              alt={`${v.MAKE} ${v.MODEL}`}
              style={styles.carImage}
              onError={() => setImgError(true)}
            />
            <div style={styles.imageOverlay} />
          </>
        ) : (
          <div style={{ ...styles.fallbackHero, background: `linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 70%)` }}>
            <span style={styles.fallbackIcon}>{icon}</span>
          </div>
        )}

        {/* Overlaid badges */}
        <div style={styles.heroBadges}>
          <span
            className="badge"
            style={{
              background: `rgba(${catColor === 'var(--accent)' ? '232,184,75' : catColor.replace('#','').match(/.{2}/g).map(h=>parseInt(h,16)).join(',')}, 0.2)`,
              color: catColor,
              border: `1px solid ${catColor}44`,
            }}
          >
            {v.CATEGORY_NAME}
          </span>
          <span className="badge badge-success">{v.STATUS}</span>
        </div>

        {/* Price overlay bottom right */}
        <div style={styles.priceOverlay}>
          <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)' }}>from</span>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.5rem', color: '#fff', lineHeight: 1 }}>
            ${v.BASE_DAILY_RATE}
          </span>
          <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)' }}>/day</span>
        </div>
      </div>

      {/* Info */}
      <div style={styles.cardBody}>
        <div style={styles.makeRow}>
          <span style={styles.makeName}>{v.MAKE}</span>
          <span style={styles.yearTag}>{v.YEAR_MADE}</span>
        </div>
        <h3 style={styles.modelName}>{v.MODEL}</h3>

        <div style={styles.specRow}>
          <div style={styles.spec}>
            <span style={styles.specIcon}>🎨</span>
            <span style={styles.specVal}>{v.COLOR}</span>
          </div>
          <div style={styles.spec}>
            <span style={styles.specIcon}>💺</span>
            <span style={styles.specVal}>{v.SEATS} seats</span>
          </div>
          <div style={styles.spec}>
            <span style={styles.specIcon}>📍</span>
            <span style={styles.specVal}>{v.BRANCH_NAME?.replace(' Branch', '')}</span>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div style={styles.cardFooter}>
        <div style={styles.depositInfo}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            Deposit: ${v.DEPOSIT_AMOUNT}
          </span>
        </div>
        <button className="btn btn-primary" style={{ padding: '9px 20px', fontSize: '0.82rem' }}>
          Rent Now →
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    maxWidth: 1280,
    margin: '0 auto',
    padding: '32px 24px',
    minHeight: 'calc(100vh - 64px)',
  },
  header: { marginBottom: 40 },
  headerContent: { marginBottom: 24 },
  headerTag: {
    fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent)',
    textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8,
  },
  pageTitle: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
    letterSpacing: '0.04em', marginBottom: 8,
  },
  headerSub: { color: 'var(--text-secondary)', fontSize: '0.95rem' },
  searchRow: { marginBottom: 16 },
  searchBox: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', padding: '10px 16px', maxWidth: 440,
  },
  searchInput: {
    background: 'transparent', border: 'none', outline: 'none',
    color: 'var(--text-primary)', fontSize: '0.9rem',
    fontFamily: "'DM Sans', sans-serif", flex: 1,
  },
  clearBtn: {
    background: 'none', border: 'none', color: 'var(--text-muted)',
    cursor: 'pointer', fontSize: '0.8rem', padding: '0 4px',
  },
  filters: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  countBadge: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    marginLeft: 6, background: 'rgba(255,255,255,0.1)',
    borderRadius: 10, fontSize: '0.65rem', padding: '1px 6px', fontWeight: 700,
  },
  content: { minHeight: 400 },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
    gap: 20,
  },
  loadingState: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 16, paddingTop: 80,
  },
  emptyState: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 12, paddingTop: 80,
  },
  card: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden', cursor: 'pointer',
    transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s',
    display: 'flex', flexDirection: 'column',
    ':hover': { transform: 'translateY(-4px)', borderColor: 'var(--accent)' },
  },
  cardHero: {
    height: 190,
    position: 'relative',
    background: 'var(--bg-elevated)',
    overflow: 'hidden',
  },
  carImage: {
    width: '100%', height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.4s ease',
  },
  imageOverlay: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(to bottom, transparent 40%, rgba(10,10,15,0.7) 100%)',
  },
  fallbackHero: {
    width: '100%', height: '100%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  fallbackIcon: {
    fontSize: '5rem',
    filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))',
  },
  heroBadges: {
    position: 'absolute', top: 12, left: 12, right: 12,
    display: 'flex', justifyContent: 'space-between',
  },
  priceOverlay: {
    position: 'absolute', bottom: 12, right: 14,
    display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
    gap: 0,
  },
  cardBody: { padding: '16px 18px', flex: 1 },
  makeRow: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 2,
  },
  makeName: {
    fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.1em',
  },
  yearTag: {
    fontSize: '0.7rem', color: 'var(--text-muted)',
    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
    padding: '2px 8px', borderRadius: 20,
  },
  modelName: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: '1.4rem', letterSpacing: '0.04em', marginBottom: 10,
  },
  specRow: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  spec: { display: 'flex', alignItems: 'center', gap: 4 },
  specIcon: { fontSize: '0.75rem' },
  specVal: { fontSize: '0.75rem', color: 'var(--text-secondary)' },
  cardFooter: {
    padding: '12px 18px',
    borderTop: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: 'var(--bg-elevated)',
  },
  depositInfo: {},
};
