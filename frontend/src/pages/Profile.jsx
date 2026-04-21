import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'

const ROLE_LABELS = {
  student: 'Student',
  trainer: 'Trainer',
  institution: 'Institution Admin',
  programme_manager: 'Programme Manager',
  monitoring_officer: 'Monitoring Officer',
}

const ROLE_COLORS = {
  student: 'var(--green)',
  trainer: 'var(--accent)',
  institution: 'var(--accent3)',
  programme_manager: 'var(--yellow)',
  monitoring_officer: 'var(--accent2)',
}

export default function Profile() {
  const { user, logout } = useAuth()
  const [tab, setTab] = useState('info') // 'info' | 'password'

  const [nameForm, setNameForm] = useState({ name: user?.name || '' })
  const [nameMsg, setNameMsg] = useState('')
  const [nameErr, setNameErr] = useState('')
  const [savingName, setSavingName] = useState(false)

  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' })
  const [pwMsg, setPwMsg] = useState('')
  const [pwErr, setPwErr] = useState('')
  const [savingPw, setSavingPw] = useState(false)

  const updateName = async (e) => {
    e.preventDefault()
    setNameMsg(''); setNameErr('')
    setSavingName(true)
    try {
      await api.patch('/auth/profile', { name: nameForm.name })
      setNameMsg('Name updated successfully!')
      // Update local user display
      setTimeout(() => setNameMsg(''), 3000)
    } catch (err) {
      setNameErr(err.response?.data?.message || 'Failed to update name')
    } finally {
      setSavingName(false)
    }
  }

  const changePassword = async (e) => {
    e.preventDefault()
    setPwMsg(''); setPwErr('')
    if (pwForm.newPw !== pwForm.confirm) {
      setPwErr('New passwords do not match'); return
    }
    if (pwForm.newPw.length < 6) {
      setPwErr('Password must be at least 6 characters'); return
    }
    setSavingPw(true)
    try {
      await api.patch('/auth/password', {
        current_password: pwForm.current,
        new_password: pwForm.newPw,
      })
      setPwMsg('Password changed successfully!')
      setPwForm({ current: '', newPw: '', confirm: '' })
      setTimeout(() => setPwMsg(''), 4000)
    } catch (err) {
      setPwErr(err.response?.data?.message || 'Failed to change password')
    } finally {
      setSavingPw(false)
    }
  }

  const color = ROLE_COLORS[user?.role] || 'var(--accent)'

  return (
    <div style={{ maxWidth: 560 }}>
      <div className="page-header">
        <h1>My Profile</h1>
        <p>Manage your account information and security</p>
      </div>

      {/* Profile Card */}
      <div className="card mb-2" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <div style={{
          width: 64, height: 64,
          borderRadius: '50%',
          background: `${color}18`,
          border: `2px solid ${color}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-head)',
          fontWeight: 800,
          fontSize: '1.5rem',
          color,
          flexShrink: 0,
        }}>
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '1.25rem' }}>
            {user?.name}
          </div>
          <div style={{ color: 'var(--text2)', fontSize: '0.875rem' }}>{user?.email}</div>
          <div style={{ marginTop: '0.35rem' }}>
            <span className="badge" style={{
              background: `${color}18`,
              color,
              border: `1px solid ${color}30`,
            }}>
              {ROLE_LABELS[user?.role]}
            </span>
            {user?.institution_id && (
              <span className="badge badge-blue" style={{ marginLeft: '0.5rem' }}>
                {typeof user.institution_id === 'object' ? user.institution_id.name : 'Institution linked'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Account details */}
      <div className="card mb-2">
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {['info', 'password'].map(t => (
            <button key={t} onClick={() => setTab(t)} className="btn btn-sm"
              style={{
                background: tab === t ? 'var(--accent)' : 'var(--bg3)',
                color: tab === t ? '#fff' : 'var(--text2)',
                border: `1px solid ${tab === t ? 'var(--accent)' : 'var(--border)'}`,
              }}>
              {t === 'info' ? '👤 Account Info' : '🔒 Change Password'}
            </button>
          ))}
        </div>

        {tab === 'info' && (
          <form onSubmit={updateName}>
            <div className="form-group">
              <label className="label">Full Name</label>
              <input className="input" value={nameForm.name}
                onChange={e => setNameForm({ name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="label">Email Address</label>
              <input className="input" value={user?.email} disabled
                style={{ opacity: 0.5, cursor: 'not-allowed' }} />
              <p className="text-sm text-muted mt-1">Email cannot be changed.</p>
            </div>
            <div className="form-group">
              <label className="label">Role</label>
              <input className="input" value={ROLE_LABELS[user?.role]} disabled
                style={{ opacity: 0.5, cursor: 'not-allowed' }} />
              <p className="text-sm text-muted mt-1">Role is fixed at registration.</p>
            </div>
            {nameMsg && <div className="alert alert-success">{nameMsg}</div>}
            {nameErr && <div className="alert alert-error">{nameErr}</div>}
            <button type="submit" className="btn btn-primary" disabled={savingName}>
              {savingName ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        )}

        {tab === 'password' && (
          <form onSubmit={changePassword}>
            <div className="form-group">
              <label className="label">Current Password</label>
              <input className="input" type="password" placeholder="Your current password"
                value={pwForm.current} onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="label">New Password</label>
              <input className="input" type="password" placeholder="At least 6 characters"
                value={pwForm.newPw} onChange={e => setPwForm(p => ({ ...p, newPw: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="label">Confirm New Password</label>
              <input className="input" type="password" placeholder="Repeat new password"
                value={pwForm.confirm} onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))} required />
            </div>
            {pwMsg && <div className="alert alert-success">{pwMsg}</div>}
            {pwErr && <div className="alert alert-error">{pwErr}</div>}
            <button type="submit" className="btn btn-primary" disabled={savingPw}>
              {savingPw ? 'Changing…' : 'Change Password'}
            </button>
          </form>
        )}
      </div>

      {/* Account ID info */}
      <div className="card" style={{ fontSize: '0.8125rem' }}>
        <div style={{ color: 'var(--text3)', marginBottom: '0.5rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Account Details
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text3)' }}>User ID</span>
            <span style={{ color: 'var(--text2)', fontFamily: 'monospace', fontSize: '0.75rem' }}>{user?._id}</span>
          </div>
          {user?.institution_id && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text3)' }}>Institution ID</span>
              <span style={{ color: 'var(--text2)', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                {typeof user.institution_id === 'object' ? user.institution_id._id : user.institution_id}
              </span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text3)' }}>Member since</span>
            <span style={{ color: 'var(--text2)' }}>
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
