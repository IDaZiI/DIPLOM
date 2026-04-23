import { Navigate } from 'react-router-dom'
import { getUserRole, isAuthenticated } from '../utils/auth'

function ProtectedRoute({ children, allowedRoles = [] }) {
  if (!isAuthenticated()) {
    return <Navigate to="/auth" replace />
  }

  if (allowedRoles.length === 0) {
    return children
  }

  const role = getUserRole()

  if (!allowedRoles.includes(role)) {
    if (role === 'admin') {
      return <Navigate to="/admin/tables" replace />
    }

    if (role === 'waiter') {
      return <Navigate to="/availability" replace />
    }

    return <Navigate to="/booking" replace />
  }

  return children
}

export default ProtectedRoute