import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../utils/api'
import Profile from '../Profile'

const NAV = [
  { to: '/manager', label: 'Programme Summary', icon: '📊' },
  { to: '/manager/institutions', label: 'Institutions', icon: '🏛️' },
  { to: '/manager/profile', label: 'Profile', icon: '👤' },
]

function Summary() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/programme/summary').then(r => setData(r.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex-center" style={{ padding: '3rem' }}><div className="spinner" /></div>
  if (!data) return <div className="alert alert-error">Failed to load summary</div>

  return (
    <div>
      <div className="page-header">
        <h1>Programme Summary</h1>
        <p>Programme-wide attendance overview across all institutions</p>
      </div>

      <div className="grid-4 mb-2">
        {[
          { label: 'Institutions', value: data.total_institutions, color: 'var(--accent2)' },
          { label: 'Batches', value: data.total_batches, color: 'var(--accent3)' },
          { label: 'Students', value: data.total_students, color: 'var(--green)' },
          { label: 'Attendance Rate', value: `${data.overall_attendance_rate}%`, color: 'var(--yellow)' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>Institution Breakdown</h3>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>Institution</th><th>Batches</th><th>Sessions</th><th>Attendance Rate</th></tr>
            </thead>
            <tbody>
              {data.institutions?.map(inst => (
                <tr key={inst.institution_id}>
                  <td style={{ fontWeight: 500 }}>{inst.institution_name}</td>
                  <td>{inst.total_batches}</td>
                  <td>{inst.total_sessions}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: 80, height: 6, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{
                          width: `${inst.attendance_rate}%`, height: '100%',
                          background: inst.attendance_rate >= 75 ? 'var(--green)' : inst.attendance_rate >= 50 ? 'var(--yellow)' : 'var(--red)',
                          borderRadius: 3,
                        }} />
                      </div>
                      <span className="fw-600">{inst.attendance_rate}%</span>
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

function Institutions() {
  const [institutions, setInstitutions] = useState([])
  const [selected, setSelected] = useState(null)
  const [instSummary, setInstSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/institutions').then(r => setInstitutions(r.data.institutions || []))
      .finally(() => setLoading(false))
  }, [])

  const viewInstitution = async (inst) => {
    setSelected(inst)
    const res = await api.get(`/institutions/${inst._id}/summary`)
    setInstSummary(res.data)
  }

  if (loading) return <div className="flex-center" style={{ padding: '3rem' }}><div className="spinner" /></div>

  if (selected) return (
    <div>
      <button className="btn btn-ghost btn-sm mb-2" onClick={() => { setSelected(null); setInstSummary(null) }}>
        ← Back to Institutions
      </button>
      <div className="page-header">
        <h1>{selected.name}</h1>
      </div>
      {instSummary ? (
        <>
          <div className="grid-3 mb-2">
            <div className="stat-card"><div className="stat-value">{instSummary.total_batches}</div><div className="stat-label">Batches</div></div>
            <div className="stat-card"><div className="stat-value">{instSummary.total_trainers}</div><div className="stat-label">Trainers</div></div>
          </div>
          <div className="card table-wrapper">
            <h3 style={{ marginBottom: '1rem' }}>Batch Summaries</h3>
            <table>
              <thead><tr><th>Batch</th><th>Students</th><th>Sessions</th><th>Attendance Rate</th></tr></thead>
              <tbody>
                {instSummary.batches?.map(b => (
                  <tr key={b.batch_id}>
                    <td style={{ fontWeight: 500 }}>{b.batch_name}</td>
                    <td>{b.total_students}</td>
                    <td>{b.total_sessions}</td>
                    <td style={{ fontWeight: 600 }}>{b.overall_attendance_rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : <div className="flex-center"><div className="spinner" /></div>}
    </div>
  )

  return (
    <div>
      <div className="page-header"><h1>Institutions</h1><p>All institutions in the programme</p></div>
      <div className="grid-2">
        {institutions.map(inst => (
          <div key={inst._id} className="card" style={{ cursor: 'pointer' }} onClick={() => viewInstitution(inst)}>
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{inst.name}</div>
            {inst.admin_id && <div className="text-sm text-muted mt-1">Admin: {inst.admin_id.name}</div>}
            <div className="text-sm mt-1" style={{ color: 'var(--accent2)' }}>View breakdown →</div>
          </div>
        ))}
        {institutions.length === 0 && <div className="empty-state card"><p>No institutions found</p></div>}
      </div>
    </div>
  )
}

export default function ManagerDashboard() {
  return (
    <Layout navItems={NAV}>
      <Routes>
        <Route index element={<Summary />} />
        <Route path="institutions" element={<Institutions />} />
        <Route path="profile" element={<Profile />} />
      </Routes>
    </Layout>
  )
}
