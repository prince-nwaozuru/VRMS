import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function VehicleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [insurancePlans, setInsurancePlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState({
    pickup_date: '', return_date: '', pickup_branch_id: '', insurance_plan_id: ''
  });
  const [summary, setSummary] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/vehicles/${id}`),
      api.get('/reservations/insurance-plans/list')
    ]).then(([vRes, iRes]) => {
      setVehicle(vRes.data);
      setInsurancePlans(iRes.data);
    }).catch(() => navigate('/fleet'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const calcSummary = (pd, rd, insId) => {
    if (!pd || !rd || !vehicle) return;
    const days = Math.max(1, Math.ceil((new Date(rd) - new Date(pd)) / 86400000));
    const vehicleTotal = days * parseFloat(vehicle.BASE_DAILY_RATE);
    const ins = insurancePlans.find(p => String(p.PLAN_ID) === String(insId));
    const insTotal = ins ? days * parseFloat(ins.DAILY_RATE) : 0;
    setSummary({
      days,
      vehicleTotal,
      insTotal,
      insName: ins?.PLAN_NAME,
      total: vehicleTotal + insTotal + parseFloat(vehicle.DEPOSIT_AMOUNT)
    });
  };

  const handleChange = e => {
    const next = { ...booking, [e.target.name]: e.target.value };
    setBooking(next);
    calcSummary(next.pickup_date, next.return_date, next.insurance_plan_id);
  };

  const handleBook = async e => {
    e.preventDefault();
    if (!booking.pickup_date || !booking.return_date) {
      setError('Please select pickup and return dates');
      return;
    }
    setError(''); setSubmitting(true);
    try {
      const res = await api.post('/reservations', {
        vehicle_id: id,
        pickup_branch_id: booking.pickup_branch_id || vehicle.BRANCH_ID,
        pickup_date: booking.pickup_date,
        return_date: booking.return_date,
        insurance_plan_id: booking.insurance_plan_id || undefined
      });
      setSuccess(`🎉 Reservation #${res.data.reservationId} confirmed! Check My Rentals for details.`);
      setTimeout(() => navigate('/reservations'), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <div className="spinner" style={{ width: 40, height: 40 }} />
    </div>
  );

  if (!vehicle) return null;

  return (
    <div style={styles.page}>
      <button onClick={() => navigate('/fleet')} className="btn btn-ghost" style={{ marginBottom: 24 }}>
        ← Back to Fleet
      </button>

      <div style={styles.layout}>
        {/* Left: Vehicle info */}
        <div style={styles.info}>
          {/* Hero */}
          <div style={styles.hero}>
            {vehicle.IMAGE_URL && !imgError ? (
              <>
                <img
                  src={vehicle.IMAGE_URL}
                  alt={`${vehicle.MAKE} ${vehicle.MODEL}`}
                  style={styles.heroImg}
                  onError={() => setImgError(true)}
                />
                <div style={styles.heroImgOverlay} />
              </>
            ) : (
              <>
                <span style={styles.heroIcon}>
                  {vehicle.CATEGORY_NAME === 'Economy' ? '🚙' :
                   vehicle.CATEGORY_NAME === 'SUV' ? '🚐' :
                   vehicle.CATEGORY_NAME === 'Luxury' ? '🏎️' :
                   vehicle.CATEGORY_NAME === 'Pickup Truck' ? '🛻' : '🚗'}
                </span>
                <div style={styles.heroBg} />
              </>
            )}
          </div>

          <div className="card" style={{ borderRadius: '0 0 20px 20px', borderTop: 'none', marginBottom: 20 }}>
            <div style={styles.makeLabel}>{vehicle.MAKE} · {vehicle.CATEGORY_NAME}</div>
            <h1 style={styles.modelTitle}>{vehicle.MODEL}</h1>
            <div style={styles.metaGrid}>
              {[
                ['📅', 'Year', vehicle.YEAR_MADE],
                ['🎨', 'Color', vehicle.COLOR],
                ['💺', 'Seats', vehicle.SEATS],
                ['🪪', 'Plate', vehicle.LICENCE_PLATE],
              ].map(([icon, label, val]) => (
                <div key={label} style={styles.metaBox}>
                  <span style={styles.metaIcon}>{icon}</span>
                  <span style={styles.metaLabel}>{label}</span>
                  <span style={styles.metaVal}>{val}</span>
                </div>
              ))}
            </div>

            {vehicle.AVG_RATING && (
              <div style={styles.ratingRow}>
                <span style={{ color: 'var(--accent)', fontSize: '1.2rem' }}>★</span>
                <strong style={{ color: 'var(--accent)' }}>{vehicle.AVG_RATING}</strong>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>({vehicle.REVIEW_COUNT} reviews)</span>
              </div>
            )}
          </div>

          {/* Branch info */}
          <div className="card">
            <h3 style={{ fontFamily: "'Bebas Neue'", fontSize: '1.3rem', letterSpacing: '0.04em', marginBottom: 12 }}>Pickup Location</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>📍 {vehicle.BRANCH_NAME}</p>
            {vehicle.BRANCH_PHONE && <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>📞 {vehicle.BRANCH_PHONE}</p>}
            <div style={styles.priceLine}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Daily rate</span>
              <span style={styles.bigRate}>${vehicle.BASE_DAILY_RATE}<span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/day</span></span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Security deposit</span>
              <span style={{ color: 'var(--text-secondary)' }}>${vehicle.DEPOSIT_AMOUNT}</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 10 }}>
              Min. age {vehicle.MINIMUM_AGE_REQUIREMENT}+ · Deposit returned after return
            </p>
          </div>
        </div>

        {/* Right: Booking form */}
        <div style={styles.bookingPanel}>
          <div className="card">
            <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: '1.8rem', letterSpacing: '0.04em', marginBottom: 6 }}>
              Book This Vehicle
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 24 }}>
              Confirm your dates to reserve
            </p>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {!success && (
              <form onSubmit={handleBook}>
                <div className="input-group">
                  <label>Pickup Date</label>
                  <input type="date" name="pickup_date" min={today} value={booking.pickup_date} onChange={handleChange} required />
                </div>
                <div className="input-group">
                  <label>Return Date</label>
                  <input type="date" name="return_date"
                    min={booking.pickup_date || today}
                    value={booking.return_date} onChange={handleChange} required />
                </div>

                {/* Insurance */}
                <div className="input-group">
                  <label>Insurance Plan (optional)</label>
                  <select name="insurance_plan_id" value={booking.insurance_plan_id} onChange={handleChange}>
                    <option value="">No insurance</option>
                    {insurancePlans.map(p => (
                      <option key={p.PLAN_ID} value={p.PLAN_ID}>
                        {p.PLAN_NAME} — ${p.DAILY_RATE}/day
                      </option>
                    ))}
                  </select>
                </div>

                {/* Insurance description */}
                {booking.insurance_plan_id && (() => {
                  const plan = insurancePlans.find(p => String(p.PLAN_ID) === String(booking.insurance_plan_id));
                  return plan ? (
                    <div style={styles.insDesc}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--info)' }}>ℹ️ {plan.DESCRIPTION}</span>
                    </div>
                  ) : null;
                })()}

                {/* Cost summary */}
                {summary && (
                  <div style={styles.summaryBox}>
                    <h4 style={{ fontFamily: "'Bebas Neue'", fontSize: '1.1rem', letterSpacing: '0.04em', marginBottom: 12 }}>
                      Cost Summary
                    </h4>
                    <div style={styles.summaryRow}>
                      <span>Vehicle ({summary.days} days × ${vehicle.BASE_DAILY_RATE})</span>
                      <span>${summary.vehicleTotal.toFixed(2)}</span>
                    </div>
                    {summary.insTotal > 0 && (
                      <div style={styles.summaryRow}>
                        <span>{summary.insName}</span>
                        <span>${summary.insTotal.toFixed(2)}</span>
                      </div>
                    )}
                    <div style={styles.summaryRow}>
                      <span style={{ color: 'var(--text-muted)' }}>Security Deposit</span>
                      <span style={{ color: 'var(--text-muted)' }}>${vehicle.DEPOSIT_AMOUNT}</span>
                    </div>
                    <div style={styles.summaryTotal}>
                      <span>Total Due</span>
                      <span style={{ color: 'var(--accent)' }}>${summary.total.toFixed(2)}</span>
                    </div>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 6 }}>
                      * Deposit of ${vehicle.DEPOSIT_AMOUNT} will be refunded upon return
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: 16, padding: '14px' }}
                  disabled={submitting}
                >
                  {submitting ? <><div className="spinner" />Processing...</> : '🚗 Confirm Reservation'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '32px 24px',
    minHeight: 'calc(100vh - 64px)',
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: '1fr 380px',
    gap: 24,
    alignItems: 'start',
  },
  info: {},
  hero: {
    height: 280,
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderBottom: 'none',
    borderRadius: '20px 20px 0 0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  heroImg: {
    width: '100%', height: '100%',
    objectFit: 'cover',
    objectPosition: 'center',
  },
  heroImgOverlay: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(to bottom, transparent 30%, rgba(10,10,15,0.75) 100%)',
  },
  heroIcon: {
    fontSize: '8rem',
    filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.5))',
    position: 'relative',
    zIndex: 1,
  },
  heroBg: {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(ellipse at center, rgba(232,184,75,0.05) 0%, transparent 70%)',
  },
  makeLabel: {
    fontSize: '0.72rem',
    fontWeight: 700,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: 4,
  },
  modelTitle: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: '2.5rem',
    letterSpacing: '0.04em',
    marginBottom: 20,
  },
  metaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 12,
    marginBottom: 16,
  },
  metaBox: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: '10px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    alignItems: 'center',
    textAlign: 'center',
  },
  metaIcon: { fontSize: '1.2rem' },
  metaLabel: { fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 },
  metaVal: { fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' },
  ratingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  priceLine: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  bigRate: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: '2rem',
    color: 'var(--accent)',
    letterSpacing: '0.04em',
  },
  bookingPanel: {},
  insDesc: {
    background: 'rgba(75,158,232,0.08)',
    border: '1px solid rgba(75,158,232,0.2)',
    borderRadius: 8,
    padding: '8px 12px',
    marginBottom: 12,
  },
  summaryBox: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '16px',
    marginTop: 8,
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    marginBottom: 8,
  },
  summaryTotal: {
    display: 'flex',
    justifyContent: 'space-between',
    fontWeight: 700,
    fontSize: '1rem',
    paddingTop: 10,
    borderTop: '1px solid var(--border)',
    marginTop: 4,
  },
};
