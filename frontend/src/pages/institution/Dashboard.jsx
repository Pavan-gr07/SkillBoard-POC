import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../utils/api'
import { useAuth } from '../../context/AuthContext'
import Profile from '../Profile'

const NAV = [
  { to: '/institution', label: 'Overview', icon: '🏛️' },
  { to: '/institution/batches', label: 'Batches', icon: '👥' },
  { to: '/institution/trainers', label: 'Trainers', icon: '🧑‍🏫' },
  { to: '/institution/profile', label: 'Profile', icon: '👤' },
]

function Overview() {
  const { user } = useAuth()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.institution_id) {
      const id = typeof user.institution_id === 'object' ? user.institution_id._id : user.institution_id
      api.get(`/institutions/${id}/summary`).then(r => setSummary(r.data))
        .finally(() => setLoading(false))
    } else setLoading(false)
  }, [user])

  if (loading) return <div className="flex-center" style={{ padding: '3rem' }}><div className="spinner" /></div>
  if (!summary) return <div className="alert alert-info">No institution data found. Make sure your account is linked to an institution.</div>

  return (
    <div>
      <div className="page-header">
        <h1>{summary.institution}</h1>
        <p>Institution overview and attendance summary</p>
      </div>

      <div className="grid-3 mb-2">
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--accent3)' }}>{summary.total_batches}</div>
          <div className="stat-label">Batches</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--accent2)' }}>{summary.total_trainers}</div>
          <div className="stat-label">Trainers</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--green)' }}>
            {summary.batches?.reduce((s, b) => s + b.total_students, 0) || 0}
          </div>
          <div className="stat-label">Students</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>Batch Attendance Summary</h3>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>Batch</th><th>Students</th><th>Sessions</th><th>Attendance Rate</th></tr>
            </thead>
            <tbody>
              {summary.batches?.map(b => (
                <tr key={b.batch_id}>
                  <td style={{ fontWeight: 500 }}>{b.batch_name}</td>
                  <td>{b.total_students}</td>
                  <td>{b.total_sessions}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{
                        width: 80, height: 6, background: 'var(--bg3)',
                        borderRadius: 3, overflow: 'hidden',
                      }}>
                        <div style={{
                          width: `${b.overall_attendance_rate}%`, height: '100%',
                          background: b.overall_attendance_rate >= 75 ? 'var(--green)' : b.overall_attendance_rate >= 50 ? 'var(--yellow)' : 'var(--red)',
                          borderRadius: 3,
                        }} />
                      </div>
                      <span className="text-sm fw-600">{b.overall_attendance_rate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function Batches() {
  const { user } = useAuth()
  const [batches, setBatches] = useState([])
  const [allTrainers, setAllTrainers] = useState([])
  const [selected, setSelected] = useState(null)
  const [batchSummary, setBatchSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newBatchName, setNewBatchName] = useState('')
  const [trainerEmail, setTrainerEmail] = useState('')
  const [trainerMsg, setTrainerMsg] = useState('')
  const [trainerErr, setTrainerErr] = useState('')
  const [assigningBatch, setAssigningBatch] = useState(false)

  const instId = user?.institution_id
    ? (typeof user.institution_id === 'object' ? user.institution_id._id : user.institution_id)
    : null

  useEffect(() => {
    const load = async () => {
      const [bRes] = await Promise.all([api.get('/batches')])
      setBatches(bRes.data.batches || [])
      setLoading(false)
    }
    load()
  }, [instId])

  const viewBatch = async (batch) => {
    setSelected(batch)
    setBatchSummary(null)
    setAssigningBatch(false)
    setTrainerMsg('')
    setTrainerErr('')
    const res = await api.get(`/batches/${batch._id}/summary`)
    setBatchSummary(res.data.summary)
  }

  const createBatch = async (e) => {
    e.preventDefault()
    const res = await api.post('/batches', { name: newBatchName, institution_id: instId })
    setBatches(p => [res.data.batch, ...p])
    setShowCreate(false)
    setNewBatchName('')
  }

  const assignTrainer = async (e) => {
    e.preventDefault()
    setTrainerMsg(''); setTrainerErr('')
    try {
      await api.post(`/batches/${selected._id}/trainers`, { trainer_email: trainerEmail })
      setTrainerMsg('Trainer assigned successfully!')
      setTrainerEmail('')
      // Refresh batches and selected
      const res = await api.get('/batches')
      setBatches(res.data.batches || [])
      const updated = res.data.batches.find(b => b._id === selected._id)
      if (updated) setSelected(updated)
      setTimeout(() => setTrainerMsg(''), 3000)
    } catch (err) {
      setTrainerErr(err.response?.data?.message || 'Failed to assign trainer')
    }
  }

  const removeTrainer = async (trainerId) => {
    try {
      await api.delete(`/batches/${selected._id}/trainers/${trainerId}`)
      const res = await api.get('/batches')
      setBatches(res.data.batches || [])
      const updated = res.data.batches.find(b => b._id === selected._id)
      if (updated) setSelected(updated)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed')
    }
  }

  if (loading) return <div className="flex-center" style={{ padding: '3rem' }}><div className="spinner" /></div>

  if (selected) return (
    <div>
      <button className="btn btn-ghost btn-sm mb-2" onClick={() => { setSelected(null); setBatchSummary(null) }}>
        ← Back to Batches
      </button>
      <div className="page-header">
        <h1>{selected.name}</h1>
        <p>Trainer assignment and student attendance</p>
      </div>

      {/* Trainer Management Card */}
      <div className="card mb-2">
        <div className="flex-between mb-2">
          <h3>Assigned Trainers ({selected.trainers?.length || 0})</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => setAssigningBatch(a => !a)}>
            {assigningBatch ? 'Cancel' : '+ Assign Trainer'}
          </button>
        </div>

        {assigningBatch && (
          <form onSubmit={assignTrainer} style={{ marginBottom: '1rem' }}>
            {trainerMsg && <div className="alert alert-success">{trainerMsg}</div>}
            {trainerErr && <div className="alert alert-error">{trainerErr}</div>}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <input className="input" type="email" placeholder="Trainer's registered email address"
                value={trainerEmail} onChange={e => setTrainerEmail(e.target.value)} required />
              <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>Assign</button>
            </div>
            <p className="text-sm text-muted mt-1">
              Trainer must already have a SkillBridge account with the Trainer role.
            </p>
          </form>
        )}

        {selected.trainers?.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {selected.trainers.map(t => (
              <div key={t._id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.625rem 0.875rem',
                background: 'var(--bg3)', borderRadius: 'var(--radius-sm)',
              }}>
                <div>
                  <span style={{ fontWeight: 600 }}>{t.name}</span>
                  <span className="text-sm text-muted" style={{ marginLeft: '0.5rem' }}>{t.email}</span>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => removeTrainer(t._id)}>Remove</button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">No trainers assigned to this batch yet. Use "Assign Trainer" above.</p>
        )}
      </div>

      {/* Attendance Summary */}
      <div className="card mb-2">
        <h3 style={{ marginBottom: '0.25rem' }}>Batch Info</h3>
        <p className="text-sm text-muted">
          {selected.students?.length || 0} students enrolled
        </p>
      </div>

      {batchSummary ? (
        <>
          <div className="grid-2 mb-2">
            <div className="stat-card">
              <div className="stat-value">{batchSummary.total_students}</div>
              <div className="stat-label">Students</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{batchSummary.total_sessions}</div>
              <div className="stat-label">Sessions Conducted</div>
            </div>
          </div>
          <div className="card table-wrapper">
            <h3 style={{ marginBottom: '1rem' }}>Student Attendance</h3>
            <table>
              <thead><tr><th>Student</th><th>Present</th><th>Late</th><th>Absent</th><th>Attendance Rate</th></tr></thead>
              <tbody>
                {batchSummary.students?.map(s => (
                  <tr key={s.student_id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{s.name}</div>
                      <div className="text-sm text-muted">{s.email}</div>
                    </td>
                    <td><span className="badge badge-green">{s.present}</span></td>
                    <td><span className="badge badge-yellow">{s.late}</span></td>
                    <td><span className="badge badge-red">{s.absent}</span></td>
                    <td>
                      <span style={{ fontWeight: 600, color: s.attendance_rate >= 75 ? 'var(--green)' : s.attendance_rate >= 50 ? 'var(--yellow)' : 'var(--red)' }}>
                        {s.attendance_rate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {batchSummary.students?.length === 0 && (
              <div className="empty-state"><p>No students enrolled in this batch yet</p></div>
            )}
          </div>
        </>
      ) : <div className="flex-center" style={{ padding: '2rem' }}><div className="spinner" /></div>}
    </div>
  )

  return (
    <div>
      <div className="flex-between mb-2">
        <div className="page-header" style={{ margin: 0 }}>
          <h1>Batches</h1>
          <p>Manage batches, assign trainers, view attendance</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Batch</button>
      </div>

      <div className="grid-2">
        {batches.map(b => (
          <div key={b._id} className="card" style={{ cursor: 'pointer' }} onClick={() => viewBatch(b)}>
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{b.name}</div>
            <div className="text-sm text-muted mt-1">
              {b.students?.length || 0} students ·{' '}
              {b.trainers?.length || 0} trainer{b.trainers?.length !== 1 ? 's' : ''}
            </div>
            {b.trainers?.length > 0 && (
              <div className="text-sm mt-1" style={{ color: 'var(--text3)' }}>
                {b.trainers.map(t => t.name).join(', ')}
              </div>
            )}
            {b.trainers?.length === 0 && (
              <div className="text-sm mt-1" style={{ color: 'var(--yellow)' }}>⚠ No trainers assigned</div>
            )}
            <div className="text-sm mt-1" style={{ color: 'var(--accent2)' }}>Manage →</div>
          </div>
        ))}
        {batches.length === 0 && <div className="empty-state card"><p>No batches yet</p></div>}
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Create New Batch</div>
            <form onSubmit={createBatch}>
              <div className="form-group">
                <label className="label">Batch Name</label>
                <input className="input" placeholder="e.g. Batch B - Data Science"
                  value={newBatchName} onChange={e => setNewBatchName(e.target.value)} required />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function Trainers() {
  const { user } = useAuth()
  const [trainers, setTrainers] = useState([])
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    // Get trainers via institution summary
    const id = typeof user.institution_id === 'object' ? user.institution_id._id : user.institution_id
    if (id) {
      api.get(`/institutions/${id}/summary`).then(r => setTrainers(r.data.trainers || []))
    }
  }, [user])

  const assignTrainer = async (e) => {
    e.preventDefault()
    setMsg(''); setError('')
    const id = typeof user.institution_id === 'object' ? user.institution_id._id : user.institution_id
    try {
      await api.post(`/institutions/${id}/trainers`, { trainer_email: email })
      setMsg(`Trainer assigned successfully`)
      setEmail('')
      const r = await api.get(`/institutions/${id}/summary`)
      setTrainers(r.data.trainers || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed')
    }
  }

  return (
    <div>
      <div className="page-header"><h1>Trainers</h1><p>Trainers under your institution</p></div>

      <div className="card mb-2">
        <h3 style={{ marginBottom: '1rem' }}>Assign a Trainer</h3>
        {msg && <div className="alert alert-success">{msg}</div>}
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={assignTrainer} style={{ display: 'flex', gap: '0.75rem' }}>
          <input className="input" type="email" placeholder="Trainer's email address"
            value={email} onChange={e => setEmail(e.target.value)} required />
          <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>Assign</button>
        </form>
      </div>

      <div className="card table-wrapper">
        <table>
          <thead><tr><th>Name</th><th>Email</th></tr></thead>
          <tbody>
            {trainers.map(t => (
              <tr key={t._id}>
                <td style={{ fontWeight: 500 }}>{t.name}</td>
                <td className="text-muted">{t.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {trainers.length === 0 && <div className="empty-state"><p>No trainers assigned yet</p></div>}
      </div>
    </div>
  )
}

export default function InstitutionDashboard() {
  return (
    <Layout navItems={NAV}>
      <Routes>
        <Route index element={<Overview />} />
        <Route path="batches" element={<Batches />} />
        <Route path="trainers" element={<Trainers />} />
        <Route path="profile" element={<Profile />} />
      </Routes>
    </Layout>
  )
}
