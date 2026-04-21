import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ROLE_ROUTES = {
  student: '/student',
  trainer: '/trainer',
  institution: '/institution',
  programme_manager: '/manager',
  monitoring_officer: '/officer',
}

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Grab ?redirect= param so invite links work after login
  const params = new URLSearchParams(location.search)
  const redirectTo = params.get('redirect')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      // After login, go to redirect URL if present, else role dashboard
      navigate(redirectTo || ROLE_ROUTES[user.role])
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'var(--bg)',
    }}>
      {/* Left decorative panel */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(135deg, #0d0d18 0%, #1a1030 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          width: 400, height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(108,99,255,0.2) 0%, transparent 70%)',
          top: '20%', left: '10%',
        }} />
        <div style={{
          position: 'absolute',
          width: 300, height: 300,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56,189,248,0.1) 0%, transparent 70%)',
          bottom: '20%', right: '10%',
        }} />
        <div style={{ position: 'relative', textAlign: 'center' }}>
          <div style={{
            fontFamily: 'var(--font-head)',
            fontSize: '3rem',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            marginBottom: '1rem',
          }}>
            Skill<span style={{ color: 'var(--accent2)' }}>Bridge</span>
          </div>
          <p style={{ color: 'var(--text2)', maxWidth: 320, lineHeight: 1.7 }}>
            The attendance management platform for SkillBridge state-level skilling programmes.
          </p>
          <div style={{
            marginTop: '2.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            maxWidth: 280,
          }}>
            {['Students', 'Trainers', 'Institutions', 'Programme Managers', 'Monitoring Officers'].map(role => (
              <div key={role} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.625rem 1rem',
                fontSize: '0.875rem',
                color: 'var(--text2)',
              }}>
                <span style={{ color: 'var(--accent2)' }}>✓</span> {role}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div style={{
        width: 480,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem',
        borderLeft: '1px solid var(--border)',
      }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: '1.75rem', marginBottom: '0.5rem' }}>
            Welcome back
          </h1>
          <p style={{ color: 'var(--text2)', marginBottom: '2rem', fontSize: '0.9rem' }}>
            Sign in to your account to continue
          </p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">Email address</label>
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="label">Password</label>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', fontSize: '0.9375rem' }}
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text2)' }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: 'var(--accent2)', fontWeight: 500 }}>
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
