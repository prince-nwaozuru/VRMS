import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/fleet', label: 'Fleet' },
    { to: '/reservations', label: 'My Rentals' },
    { to: '/profile', label: 'Profile' },
  ];

  return (
    <nav style={styles.nav}>
      <div style={styles.inner}>
        {/* Logo */}
        <Link to="/fleet" style={styles.logo}>
          <span style={styles.logoIcon}>🚗</span>
          <span style={styles.logoText}>DRIVE<span style={{ color: 'var(--accent)' }}>EASY</span></span>
        </Link>

        {/* Desktop links */}
        <div style={styles.links}>
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              style={{
                ...styles.link,
                ...(location.pathname === link.to ? styles.linkActive : {})
              }}
            >
              {link.label}
              {location.pathname === link.to && <span style={styles.linkDot} />}
            </Link>
          ))}
        </div>

        {/* User section */}
        <div style={styles.userSection}>
          <span style={styles.userName}>
            Hi, {user?.firstName || user?.FIRST_NAME}
          </span>
          <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '8px 18px', fontSize: '0.82rem' }}>
            Sign Out
          </button>
        </div>

        {/* Mobile hamburger */}
        <button style={styles.hamburger} onClick={() => setMenuOpen(o => !o)}>
          <span /><span /><span />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={styles.mobileMenu}>
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              style={styles.mobileLink}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <button onClick={handleLogout} style={styles.mobileLogout}>Sign Out</button>
        </div>
      )}
    </nav>
  );
}

const styles = {
  nav: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    background: 'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(16px)',
    borderBottom: '1px solid var(--border)',
  },
  inner: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 24px',
    height: 64,
    display: 'flex',
    alignItems: 'center',
    gap: 32,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    textDecoration: 'none',
    flexShrink: 0,
  },
  logoIcon: { fontSize: '1.4rem' },
  logoText: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: '1.5rem',
    letterSpacing: '0.08em',
    color: 'var(--text-primary)',
  },
  links: {
    display: 'flex',
    gap: 4,
    flex: 1,
  },
  link: {
    position: 'relative',
    padding: '6px 14px',
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    fontSize: '0.875rem',
    fontWeight: 500,
    borderRadius: 8,
    transition: 'color 0.2s',
  },
  linkActive: {
    color: 'var(--accent)',
    background: 'var(--accent-dim)',
  },
  linkDot: {
    position: 'absolute',
    bottom: -2,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 4,
    height: 4,
    borderRadius: '50%',
    background: 'var(--accent)',
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginLeft: 'auto',
  },
  userName: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
  hamburger: {
    display: 'none',
    flexDirection: 'column',
    gap: 5,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 4,
  },
  mobileMenu: {
    background: 'var(--bg-card)',
    borderTop: '1px solid var(--border)',
    padding: '16px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  mobileLink: {
    padding: '10px 0',
    color: 'var(--text-primary)',
    textDecoration: 'none',
    fontSize: '0.95rem',
    borderBottom: '1px solid var(--border)',
  },
  mobileLogout: {
    marginTop: 8,
    background: 'none',
    border: '1px solid var(--border)',
    color: 'var(--danger)',
    padding: '10px',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: '0.875rem',
  }
};
