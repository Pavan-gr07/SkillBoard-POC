import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../utils/api'
import Profile from '../Profile'

const NAV = [
  { to: '/officer', label: 'Programme Overview', icon: '🔍' },
  { to: '/officer/sessions', label: 'All Sessions', icon: '📅' },
  { to: '/officer/profile', label: 'Profile', icon: '👤' },
]

function Overview() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/programme/summary').then(r => setData(r.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex-center" style={{ padding: '3rem' }}><div className="spinner" /></div>
  if (!data) return <div className="alert alert-error">Failed to load data</div>

  return (
    <div>
      <div className="page-header">
        <h1>Programme Overview</h1>
        <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="badge badge-purple">Read-Only</span>
          Monitoring view — no modifications allowed
        </p>
      </div>

      <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
        You have read-only access. All data is live from the programme.
      </div>

      <div className="grid-4 mb-2">
        {[
          { label: 'Institutions', value: data.total_institutions, color: 'var(--accent2)' },
          { label: 'Total Batches', value: data.total_batches, color: 'var(--accent3)' },
          { label: 'Total Students', value: data.total_students, color: 'var(--green)' },
          { label: 'Overall Attendance', value: `${data.overall_attendance_rate}%`, color: 'var(--yellow)' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2 mb-2">
        <div className="stat-card">
          <div className="stat-value">{data.total_sessions}</div>
          <div className="stat-label">Total Sessions</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{data.total_trainers}</div>
          <div className="stat-label">Total Trainers</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>Institution Attendance Rates</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {data.institutions?.map(inst => (
            <div key={inst.institution_id}>
              <div className="flex-between mb-1">
                <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{inst.institution_name}</span>
                <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text2)' }}>
                  {inst.attendance_rate}%
                </span>
              </div>
              <div style={{ height: 8, background: 'var(--bg3)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  width: `${inst.attendance_rate}%`,
                  height: '100%',
                  background: inst.attendance_rate >= 75
                    ? 'linear-gradient(90deg, var(--green), #86efac)'
                    : inst.attendance_rate >= 50
                    ? 'linear-gradient(90deg, var(--yellow), #fde68a)'
                    : 'linear-gradient(90deg, var(--red), #fca5a5)',
                  borderRadius: 4,
                  transition: 'width 0.6s ease',
                }} />
              </div>
              <div className="text-sm text-muted" style={{ marginTop: '0.2rem' }}>
                {inst.total_batches} batch{inst.total_batches !== 1 ? 'es' : ''} · {inst.total_sessions} sessions
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AllSessions() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/sessions').then(r => setSessions(r.data.sessions || []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex-center" style={{ padding: '3rem' }}><div className="spinner" /></div>

  return (
    <div>
      <div className="page-header">
        <h1>All Sessions</h1>
        <p>Read-only view of all programme sessions</p>
      </div>
      <div className="card table-wrapper">
        <table>
          <thead>
            <tr><th>Title</th><th>Batch</th><th>Trainer</th><th>Date</th><th>Time</th></tr>
          </thead>
          <tbody>
            {sessions.map(s => (
              <tr key={s._id}>
                <td style={{ fontWeight: 500 }}>{s.title}</td>
                <td>{s.batch_id?.name || '—'}</td>
                <td>{s.trainer_id?.name || '—'}</td>
                <td>{s.date}</td>
                <td className="text-sm">{s.start_time}–{s.end_time}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {sessions.length === 0 && <div className="empty-state"><p>No sessions in the programme yet</p></div>}
      </div>
    </div>
  )
}

export default function OfficerDashboard() {
  return (
    <Layout navItems={NAV}>
      <Routes>
        <Route index element={<Overview />} />
        <Route path="sessions" element={<AllSessions />} />
        <Route path="profile" element={<Profile />} />
      </Routes>
    </Layout>
  )
}
