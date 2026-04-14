import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function ProtectedRoute({ children }) {
  const { profile, loading } = useAuth()

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div style={{ fontSize: 48 }}>⭐</div>
    </div>
  )

  if (!profile) return <Navigate to="/" replace />

  if (!profile.family_id) return <Navigate to="/app/setup-family" replace />

  return children
}
