import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ROLE_OPTIONS = [
  { value: 'student', label: 'Student', desc: 'Mark attendance for your sessions' },
  { value: 'trainer', label: 'Trainer', desc: 'Create sessions and manage batches' },
  { value: 'institution', label: 'Institution', desc: 'Oversee trainers and view reports' },
  { value: 'programme_manager', label: 'Programme Manager', desc: 'Regional oversight of all institutions' },
  { value: 'monitoring_officer', label: 'Monitoring Officer', desc: 'Read-only access to programme data' },
]

const ROLE_ROUTES = {
  student: '/student',
  trainer: '/trainer',
  institution: '/institution',
  programme_manager: '/manager',
  monitoring_officer: '/officer',
}

export default function Signup() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const redirectTo = params.get('redirect')
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: '', institution_name: '', institution_id: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.role) { setError('Please select a role'); return }
    setLoading(true)
    try {
      const payload = { name: form.name, email: form.email, password: form.password, role: form.role }
      if (form.role === 'institution') payload.institution_name = form.institution_name
      if (form.institution_id && (form.role === 'trainer' || form.role === 'student'))
        payload.institution_id = form.institution_id
      const user = await signup(payload)
      navigate(redirectTo || ROLE_ROUTES[user.role])
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: 'var(--bg)',
    }}>
      <div style={{ width: '100%', maxWidth: 520 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            fontFamily: 'var(--font-head)',
            fontSize: '2rem',
            fontWeight: 800,
            letterSpacing: '-0.02em',
          }}>
            Skill<span style={{ color: 'var(--accent2)' }}>Bridge</span>
          </div>
          <h2 style={{ marginTop: '0.5rem', fontSize: '1.25rem', fontWeight: 600 }}>Create your account</h2>
          <p style={{ color: 'var(--text2)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Join the SkillBridge platform
          </p>
        </div>

        <div className="card">
          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">Full Name</label>
              <input className="input" placeholder="Your full name" value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="you@example.com" value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="label">Password</label>
              <input className="input" type="password" placeholder="Min. 6 characters" value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required minLength={6} />
            </div>

            <div className="form-group">
              <label className="label">Select your role</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {ROLE_OPTIONS.map(opt => (
                  <label key={opt.value} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${form.role === opt.value ? 'var(--accent)' : 'var(--border)'}`,
                    background: form.role === opt.value ? 'rgba(108,99,255,0.08)' : 'var(--bg3)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}>
                    <input type="radio" name="role" value={opt.value}
                      checked={form.role === opt.value}
                      onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                      style={{ accentColor: 'var(--accent)' }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{opt.label}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text2)' }}>{opt.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {form.role === 'institution' && (
              <div className="form-group">
                <label className="label">Institution Name</label>
                <input className="input" placeholder="e.g. NSDC Training Centre" value={form.institution_name}
                  onChange={e => setForm(p => ({ ...p, institution_name: e.target.value }))} required />
              </div>
            )}

            {(form.role === 'trainer' || form.role === 'student') && (
              <div className="form-group">
                <label className="label">Institution ID <span style={{ color: 'var(--text3)' }}>(optional — can be set later)</span></label>
                <input className="input" placeholder="Paste institution ID if you have it" value={form.institution_id}
                  onChange={e => setForm(p => ({ ...p, institution_id: e.target.value }))} />
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', fontSize: '0.9375rem' }}
              disabled={loading}
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: 'var(--text2)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent2)', fontWeight: 500 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
