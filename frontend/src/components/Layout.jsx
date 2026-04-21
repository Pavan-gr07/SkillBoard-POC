import { useState } from 'react'
import { NavLink, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ROLE_LABELS = {
  student: 'Student',
  trainer: 'Trainer',
  institution: 'Institution',
  programme_manager: 'Programme Manager',
  monitoring_officer: 'Monitoring Officer',
}

const ROLE_COLORS = {
  student: '#34d399',
  trainer: '#6c63ff',
  institution: '#38bdf8',
  programme_manager: '#fbbf24',
  monitoring_officer: '#a78bfa',
}

// Map role to its profile path
const PROFILE_PATH = {
  student: '/student/profile',
  trainer: '/trainer/profile',
  institution: '/institution/profile',
  programme_manager: '/manager/profile',
  monitoring_officer: '/officer/profile',
}

export default function Layout({ children, navItems }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const color = ROLE_COLORS[user?.role] || '#6c63ff'
  const profilePath = PROFILE_PATH[user?.role] || '/'

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: 240,
        background: 'var(--bg2)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 100,
      }}>
        {/* Logo + User info */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{
            fontFamily: 'var(--font-head)',
            fontWeight: 800,
            fontSize: '1.25rem',
            color: 'var(--text)',
            letterSpacing: '-0.02em',
            marginBottom: '1rem',
          }}>
            Skill<span style={{ color }}>Bridge</span>
          </div>

          {/* Clickable user card → goes to profile */}
          <Link to={profilePath} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            padding: '0.625rem 0.75rem',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg3)',
            border: '1px solid var(--border)',
            textDecoration: 'none',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = color
            e.currentTarget.style.background = `${color}10`
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border)'
            e.currentTarget.style.background = 'var(--bg3)'
          }}>
            {/* Avatar */}
            <div style={{
              width: 32, height: 32,
              borderRadius: '50%',
              background: `${color}22`,
              border: `1.5px solid ${color}55`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.8125rem',
              fontWeight: 800,
              color,
              flexShrink: 0,
            }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: 'var(--text)',
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {user?.name}
              </div>
              <div style={{
                fontSize: '0.6875rem',
                color,
                fontWeight: 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}>
                {ROLE_LABELS[user?.role]}
              </div>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', overflowY: 'auto' }}>
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to.split('/').length === 2} // exact match for root paths like /student, /trainer etc
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                padding: '0.625rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: isActive ? color : 'var(--text2)',
                background: isActive ? `${color}14` : 'transparent',
                transition: 'all 0.15s',
                textDecoration: 'none',
              })}
            >
              <span style={{ fontSize: '1rem' }}>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: '1rem 0.75rem', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={handleLogout}
            className="btn btn-ghost"
            style={{ width: '100%', justifyContent: 'flex-start', gap: '0.625rem' }}
          >
            <span>↩</span> Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{
        marginLeft: 240,
        flex: 1,
        padding: '2rem',
        maxWidth: 'calc(100vw - 240px)',
        minHeight: '100vh',
      }}>
        {children}
      </main>
    </div>
  )
}
