import { createContext, useContext, useState, useEffect } from 'react'
import api from '../utils/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = sessionStorage.getItem('sb_token')
    if (token) {
      api.get('/auth/me')
        .then(res => setUser(res.data.user))
        .catch(() => {
          sessionStorage.removeItem('sb_token')
          sessionStorage.removeItem('sb_user')
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    sessionStorage.setItem('sb_token', res.data.token)
    setUser(res.data.user)
    return res.data.user
  }

  const signup = async (data) => {
    const res = await api.post('/auth/signup', data)
    sessionStorage.setItem('sb_token', res.data.token)
    setUser(res.data.user)
    return res.data.user
  }

  const logout = () => {
    sessionStorage.removeItem('sb_token')
    sessionStorage.removeItem('sb_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
