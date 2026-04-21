import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

// Pages
import Login from './pages/Login'
import Signup from './pages/Signup'
import JoinBatch from './pages/JoinBatch'

// Role Dashboards
import StudentDashboard from './pages/student/Dashboard'
import TrainerDashboard from './pages/trainer/Dashboard'
import InstitutionDashboard from './pages/institution/Dashboard'
import ManagerDashboard from './pages/manager/Dashboard'
import OfficerDashboard from './pages/officer/Dashboard'

const ROLE_ROUTES = {
  student: '/student',
  trainer: '/trainer',
  institution: '/institution',
  programme_manager: '/manager',
  monitoring_officer: '/officer',
}

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to={ROLE_ROUTES[user.role]} replace />
  return children
}

const RoleRouter = () => {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={ROLE_ROUTES[user.role]} replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RoleRouter />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/join/:token" element={<JoinBatch />} />

          <Route path="/student/*" element={
            <ProtectedRoute roles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          } />
          <Route path="/trainer/*" element={
            <ProtectedRoute roles={['trainer']}>
              <TrainerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/institution/*" element={
            <ProtectedRoute roles={['institution']}>
              <InstitutionDashboard />
            </ProtectedRoute>
          } />
          <Route path="/manager/*" element={
            <ProtectedRoute roles={['programme_manager']}>
              <ManagerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/officer/*" element={
            <ProtectedRoute roles={['monitoring_officer']}>
              <OfficerDashboard />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
