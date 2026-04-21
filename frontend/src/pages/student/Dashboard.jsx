import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../utils/api'
import { useAuth } from '../../context/AuthContext'
import Profile from '../Profile'

const NAV = [
  { to: '/student', label: 'My Sessions', icon: '📅' },
  { to: '/student/attendance', label: 'My Attendance', icon: '✅' },
  { to: '/student/batches', label: 'My Batches', icon: '👥' },
  { to: '/student/profile', label: 'Profile', icon: '👤' },
]

function Sessions() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [marked, setMarked] = useState({})
  const [msg, setMsg] = useState({})
  const [markingId, setMarkingId] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sessRes, attRes] = await Promise.all([
          api.get('/sessions'),
          api.get('/attendance/my'),
        ])
        setSessions(sessRes.data.sessions || [])
        const m = {}
        attRes.data.attendance?.forEach(a => {
          const sid = a.session_id?._id || a.session_id
          if (sid) m[sid] = a.status
        })
        setMarked(m)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const markAttendance = async (sessionId) => {
    setMarkingId(sessionId)
    setMsg(p => ({ ...p, [sessionId]: '' }))
    try {
      await api.post('/attendance/mark', { session_id: sessionId, status: 'present' })
      setMarked(p => ({ ...p, [sessionId]: 'present' }))
      setMsg(p => ({ ...p, [sessionId]: '✓ Marked present!' }))
    } catch (err) {
      setMsg(p => ({ ...p, [sessionId]: err.response?.data?.message || 'Failed' }))
    } finally {
      setMarkingId(null)
    }
  }

  // Get today's date in YYYY-MM-DD using local timezone (not UTC)
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  if (loading) return <div className="flex-center" style={{ padding: '3rem' }}><div className="spinner" /></div>

  const upcoming = sessions.filter(s => s.date >= today)
  const past = sessions.filter(s => s.date < today)

  return (
    <div>
      <div className="page-header">
        <h1>My Sessions</h1>
        <p>Mark attendance for today's sessions and view upcoming ones</p>
      </div>

      {sessions.length === 0 ? (
        <div className="empty-state card">
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📭</div>
          <p>No sessions yet. Join a batch using an invite link to get started.</p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <>
              <h3 style={{ marginBottom: '0.75rem', color: 'var(--text2)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Upcoming & Today
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {upcoming.map(s => {
                  const isToday = s.date === today
                  const alreadyMarked = !!marked[s._id]
                  const isMarking = markingId === s._id
                  return (
                    <div key={s._id} className="card" style={{
                      borderLeft: `3px solid ${isToday ? 'var(--accent)' : 'var(--border)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      flexWrap: 'wrap', gap: '1rem',
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 600, fontSize: '1rem' }}>{s.title}</span>
                          {isToday && <span className="badge badge-purple">Today</span>}
                        </div>
                        <div className="text-sm text-muted" style={{ marginTop: '0.2rem' }}>
                          {s.batch_id?.name} · {s.date} · {s.start_time}–{s.end_time}
                        </div>
                        {s.trainer_id && (
                          <div className="text-sm text-muted">Trainer: {s.trainer_id.name}</div>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {msg[s._id] && (
                          <span className={`text-sm ${msg[s._id].startsWith('✓') ? 'text-success' : 'text-danger'}`}>
                            {msg[s._id]}
                          </span>
                        )}
                        {alreadyMarked ? (
                          <span className="badge badge-green">✓ {marked[s._id]}</span>
                        ) : isToday ? (
                          <button className="btn btn-primary btn-sm" onClick={() => markAttendance(s._id)} disabled={isMarking}>
                            {isMarking ? '…' : 'Mark Present'}
                          </button>
                        ) : (
                          <span className="badge" style={{ background: 'var(--bg3)', color: 'var(--text3)' }}>Upcoming</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {past.length > 0 && (
            <>
              <h3 style={{ marginBottom: '0.75rem', color: 'var(--text2)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Past Sessions
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {past.map(s => {
                  const alreadyMarked = !!marked[s._id]
                  return (
                    <div key={s._id} className="card" style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      flexWrap: 'wrap', gap: '1rem', opacity: 0.75,
                    }}>
                      <div>
                        <div style={{ fontWeight: 500 }}>{s.title}</div>
                        <div className="text-sm text-muted">{s.batch_id?.name} · {s.date}</div>
                      </div>
                      {alreadyMarked ? (
                        <span className="badge badge-green">✓ {marked[s._id]}</span>
                      ) : (
                        <span className="badge badge-red">Absent</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

function Attendance() {
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/attendance/my').then(res => setAttendance(res.data.attendance || []))
      .finally(() => setLoading(false))
  }, [])

  const present = attendance.filter(a => a.status === 'present').length
  const late = attendance.filter(a => a.status === 'late').length
  const rate = attendance.length ? (((present + late) / attendance.length) * 100).toFixed(1) : 0

  if (loading) return <div className="flex-center" style={{ padding: '3rem' }}><div className="spinner" /></div>

  return (
    <div>
      <div className="page-header"><h1>My Attendance</h1><p>Your complete attendance history</p></div>

      <div className="grid-3 mb-2">
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--green)' }}>{present}</div>
          <div className="stat-label">Present</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--yellow)' }}>{late}</div>
          <div className="stat-label">Late</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--accent2)' }}>{rate}%</div>
          <div className="stat-label">Attendance Rate</div>
        </div>
      </div>

      <div className="card table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Session</th><th>Batch</th><th>Date</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {attendance.map(a => (
              <tr key={a._id}>
                <td>{a.session_id?.title || '—'}</td>
                <td>{a.session_id?.batch_id?.name || '—'}</td>
                <td>{a.session_id?.date || '—'}</td>
                <td>
                  <span className={`badge ${a.status === 'present' ? 'badge-green' : a.status === 'late' ? 'badge-yellow' : 'badge-red'}`}>
                    {a.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {attendance.length === 0 && <div className="empty-state"><p>No attendance records yet</p></div>}
      </div>
    </div>
  )
}

function Batches() {
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/batches').then(res => setBatches(res.data.batches || []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex-center" style={{ padding: '3rem' }}><div className="spinner" /></div>

  return (
    <div>
      <div className="page-header"><h1>My Batches</h1><p>Batches you are enrolled in</p></div>
      <div className="grid-2">
        {batches.map(b => (
          <div key={b._id} className="card">
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{b.name}</div>
            {b.institution_id && <div className="text-sm text-muted mt-1">{b.institution_id.name}</div>}
            <div className="text-sm text-muted mt-1">
              {b.trainers?.length} trainer{b.trainers?.length !== 1 ? 's' : ''}
            </div>
          </div>
        ))}
        {batches.length === 0 && <div className="empty-state card"><p>Not enrolled in any batches yet</p></div>}
      </div>
    </div>
  )
}

export default function StudentDashboard() {
  return (
    <Layout navItems={NAV}>
      <Routes>
        <Route index element={<Sessions />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="batches" element={<Batches />} />
        <Route path="profile" element={<Profile />} />
      </Routes>
    </Layout>
  )
}
