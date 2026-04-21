import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../utils/api'
import { useAuth } from '../../context/AuthContext'
import Profile from '../Profile'

const NAV = [
  { to: '/trainer', label: 'Dashboard', icon: '🏠' },
  { to: '/trainer/sessions', label: 'Sessions', icon: '📅' },
  { to: '/trainer/batches', label: 'Batches', icon: '👥' },
  { to: '/trainer/profile', label: 'Profile', icon: '👤' },
]

function Home() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState([])
  const [batches, setBatches] = useState([])

  useEffect(() => {
    api.get('/sessions').then(r => setSessions(r.data.sessions || []))
    api.get('/batches').then(r => setBatches(r.data.batches || []))
  }, [])

  return (
    <div>
      <div className="page-header">
        <h1>Welcome, {user?.name} 👋</h1>
        <p>Manage your sessions and batches</p>
      </div>
      <div className="grid-3 mb-2">
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--accent2)' }}>{sessions.length}</div>
          <div className="stat-label">Total Sessions</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--green)' }}>{batches.length}</div>
          <div className="stat-label">Batches</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--yellow)' }}>
            {batches.reduce((sum, b) => sum + (b.students?.length || 0), 0)}
          </div>
          <div className="stat-label">Students</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>Recent Sessions</h3>
        {sessions.slice(0, 5).map(s => (
          <div key={s._id} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '0.75rem 0', borderBottom: '1px solid var(--border)',
          }}>
            <div>
              <div style={{ fontWeight: 500 }}>{s.title}</div>
              <div className="text-sm text-muted">{s.batch_id?.name} · {s.date}</div>
            </div>
            <span className="badge badge-purple">{s.start_time}–{s.end_time}</span>
          </div>
        ))}
        {sessions.length === 0 && <p className="text-muted text-sm">No sessions yet</p>}
      </div>
    </div>
  )
}

function Sessions() {
  const [sessions, setSessions] = useState([])
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ batch_id: '', title: '', date: '', start_time: '', end_time: '' })
  const [error, setError] = useState('')
  const [attendanceData, setAttendanceData] = useState(null)
  const [viewingSession, setViewingSession] = useState(null)

  useEffect(() => {
    Promise.all([
      api.get('/sessions'),
      api.get('/batches'),
    ]).then(([sr, br]) => {
      setSessions(sr.data.sessions || [])
      setBatches(br.data.batches || [])
    }).finally(() => setLoading(false))
  }, [])

  const createSession = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const res = await api.post('/sessions', form)
      setSessions(p => [res.data.session, ...p])
      setShowModal(false)
      setForm({ batch_id: '', title: '', date: '', start_time: '', end_time: '' })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create session')
    }
  }

  const viewAttendance = async (session) => {
    setViewingSession(session)
    const res = await api.get(`/sessions/${session._id}/attendance`)
    setAttendanceData(res.data)
  }

  if (loading) return <div className="flex-center" style={{ padding: '3rem' }}><div className="spinner" /></div>

  if (viewingSession) return (
    <div>
      <button className="btn btn-ghost btn-sm mb-2" onClick={() => { setViewingSession(null); setAttendanceData(null) }}>
        ← Back to Sessions
      </button>
      <div className="page-header">
        <h1>{viewingSession.title}</h1>
        <p>{viewingSession.date} · {viewingSession.start_time}–{viewingSession.end_time}</p>
      </div>
      {attendanceData ? (
        <div className="card table-wrapper">
          <table>
            <thead><tr><th>Student</th><th>Email</th><th>Status</th><th>Marked At</th></tr></thead>
            <tbody>
              {attendanceData.attendance?.map(a => (
                <tr key={a.student_id}>
                  <td>{a.name}</td>
                  <td>{a.email}</td>
                  <td>
                    <span className={`badge ${a.status === 'present' ? 'badge-green' : a.status === 'late' ? 'badge-yellow' : 'badge-red'}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="text-sm">{a.marked_at ? new Date(a.marked_at).toLocaleTimeString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <div className="flex-center"><div className="spinner" /></div>}
    </div>
  )

  return (
    <div>
      <div className="flex-between mb-2">
        <div className="page-header" style={{ margin: 0 }}>
          <h1>Sessions</h1>
          <p>Create and manage your training sessions</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Session</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {sessions.map(s => (
          <div key={s._id} className="card flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontWeight: 600 }}>{s.title}</div>
              <div className="text-sm text-muted">{s.batch_id?.name} · {s.date} · {s.start_time}–{s.end_time}</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => viewAttendance(s)}>
              View Attendance
            </button>
          </div>
        ))}
        {sessions.length === 0 && <div className="empty-state card"><p>No sessions yet. Create one to get started.</p></div>}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Create New Session</div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={createSession}>
              <div className="form-group">
                <label className="label">Batch</label>
                <select className="select" value={form.batch_id}
                  onChange={e => setForm(p => ({ ...p, batch_id: e.target.value }))} required>
                  <option value="">Select batch…</option>
                  {batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Session Title</label>
                <input className="input" placeholder="e.g. Introduction to Python"
                  value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="label">Date</label>
                <input className="input" type="date" value={form.date}
                  onChange={e => setForm(p => ({ ...p, date: e.target.value }))} required />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="label">Start Time</label>
                  <input className="input" type="time" value={form.start_time}
                    onChange={e => setForm(p => ({ ...p, start_time: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="label">End Time</label>
                  <input className="input" type="time" value={form.end_time}
                    onChange={e => setForm(p => ({ ...p, end_time: e.target.value }))} required />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Session</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function Batches() {
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [inviteLinks, setInviteLinks] = useState({})
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', institution_id: '' })
  const [error, setError] = useState('')
  const { user } = useAuth()

  useEffect(() => {
    api.get('/batches').then(r => setBatches(r.data.batches || []))
      .finally(() => setLoading(false))
  }, [])

  const generateInvite = async (batchId) => {
    const res = await api.post(`/batches/${batchId}/invite`)
    setInviteLinks(p => ({ ...p, [batchId]: res.data.invite_link }))
  }

  const createBatch = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const payload = { name: form.name }
      if (user.institution_id) payload.institution_id = user.institution_id
      else if (form.institution_id) payload.institution_id = form.institution_id
      const res = await api.post('/batches', payload)
      setBatches(p => [res.data.batch, ...p])
      setShowCreate(false)
      setForm({ name: '', institution_id: '' })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create batch')
    }
  }

  if (loading) return <div className="flex-center" style={{ padding: '3rem' }}><div className="spinner" /></div>

  return (
    <div>
      <div className="flex-between mb-2">
        <div className="page-header" style={{ margin: 0 }}>
          <h1>Batches</h1>
          <p>Manage your student batches and invite links</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Batch</button>
      </div>

      <div className="grid-2">
        {batches.map(b => (
          <div key={b._id} className="card">
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{b.name}</div>
            {b.institution_id && <div className="text-sm text-muted mt-1">{typeof b.institution_id === 'object' ? b.institution_id.name : ''}</div>}
            <div className="text-sm text-muted mt-1">{b.students?.length || 0} students enrolled</div>

            {inviteLinks[b._id] ? (
              <div style={{
                marginTop: '0.75rem',
                background: 'var(--bg3)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.5rem 0.75rem',
                fontSize: '0.75rem',
                color: 'var(--accent2)',
                wordBreak: 'break-all',
              }}>
                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Invite Link:</div>
                {inviteLinks[b._id]}
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ marginTop: '0.5rem', width: '100%' }}
                  onClick={() => navigator.clipboard?.writeText(inviteLinks[b._id])}
                >
                  Copy Link
                </button>
              </div>
            ) : (
              <button className="btn btn-ghost btn-sm mt-1" onClick={() => generateInvite(b._id)}>
                🔗 Generate Invite Link
              </button>
            )}
          </div>
        ))}
        {batches.length === 0 && <div className="empty-state card"><p>No batches yet</p></div>}
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Create New Batch</div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={createBatch}>
              <div className="form-group">
                <label className="label">Batch Name</label>
                <input className="input" placeholder="e.g. Batch A - Web Dev 2025"
                  value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
              </div>
              {!user.institution_id && (
                <div className="form-group">
                  <label className="label">Institution ID</label>
                  <input className="input" placeholder="Institution ID"
                    value={form.institution_id} onChange={e => setForm(p => ({ ...p, institution_id: e.target.value }))} required />
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Batch</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default function TrainerDashboard() {
  return (
    <Layout navItems={NAV}>
      <Routes>
        <Route index element={<Home />} />
        <Route path="sessions" element={<Sessions />} />
        <Route path="batches" element={<Batches />} />
        <Route path="profile" element={<Profile />} />
      </Routes>
    </Layout>
  )
}
