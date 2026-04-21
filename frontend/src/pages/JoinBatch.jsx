import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'

export default function JoinBatch() {
  const { token } = useParams()
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [batch, setBatch] = useState(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    // Wait for auth to resolve before deciding what to do
    if (authLoading) return

    if (!user) {
      // Not logged in — show a preview of the batch info if possible, prompt to login
      // We can't fetch (route is protected), so just show a login prompt with the token stored
      setLoading(false)
      return
    }

    if (user.role !== 'student') {
      setError('Only students can join batches via invite links.')
      setLoading(false)
      return
    }

    api.get(`/batches/join/${token}`)
      .then(res => setBatch(res.data.batch))
      .catch(() => setError('Invalid or expired invite link.'))
      .finally(() => setLoading(false))
  }, [token, user, authLoading])

  const handleJoin = async () => {
    setJoining(true)
    setError('')
    try {
      await api.post(`/batches/${batch._id}/join`, { invite_token: token })
      setSuccess(true)
      setTimeout(() => navigate('/student'), 2000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join batch')
    } finally {
      setJoining(false)
    }
  }

  if (authLoading || loading) return <div className="loading-screen"><div className="spinner" /></div>

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem', background: 'var(--bg)',
    }}>
      <div className="card" style={{ maxWidth: 440, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎓</div>
        <h2 style={{ fontFamily: 'var(--font-head)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
          Batch Invite
        </h2>

        {/* Not logged in at all */}
        {!user && (
          <>
            <p style={{ color: 'var(--text2)', marginBottom: '1.5rem' }}>
              You need to be logged in as a student to join this batch.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Link
                to={`/login?redirect=/join/${token}`}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.75rem' }}
              >
                Log In to Join
              </Link>
              <Link
                to={`/signup?redirect=/join/${token}`}
                className="btn btn-ghost"
                style={{ width: '100%', padding: '0.75rem' }}
              >
                Sign Up as Student
              </Link>
            </div>
          </>
        )}

        {error && <div className="alert alert-error">{error}</div>}

        {success && (
          <div className="alert alert-success">
            ✓ Joined successfully! Redirecting to your dashboard…
          </div>
        )}

        {user && batch && !success && (
          <>
            <p style={{ color: 'var(--text2)', marginBottom: '1.5rem' }}>
              You've been invited to join:
            </p>
            <div style={{
              background: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', padding: '1rem', marginBottom: '1.5rem',
            }}>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.25rem', fontWeight: 700 }}>
                {batch.name}
              </div>
              {batch.institution_id && (
                <div style={{ color: 'var(--text2)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  {batch.institution_id.name}
                </div>
              )}
              {batch.trainers?.length > 0 && (
                <div style={{ color: 'var(--text2)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                  Trainer: {batch.trainers.map(t => t.name).join(', ')}
                </div>
              )}
            </div>
            <button className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }}
              onClick={handleJoin} disabled={joining}>
              {joining ? 'Joining…' : 'Join Batch'}
            </button>
          </>
        )}

        {user && !batch && !error && !success && (
          <div className="flex-center" style={{ padding: '1rem' }}><div className="spinner" /></div>
        )}
      </div>
    </div>
  )
}
