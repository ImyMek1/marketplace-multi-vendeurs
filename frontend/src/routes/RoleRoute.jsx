import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

function RoleRoute({ allowedRoles }) {
  const { user } = useAuth()

  const role = user?.role?.name

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

export default RoleRoute