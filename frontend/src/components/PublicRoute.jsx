import { Navigate } from 'react-router-dom'
import { getUserRole, isAuthenticated } from '../utils/auth'

function PublicRoute({ children }) {
  if (!isAuthenticated()) {
    return children
  }

  const role = getUserRole()

  if (role === 'admin') {
    return <Navigate to="/admin/tables" replace />
  }

  if (role === 'waiter') {
    return <Navigate to="/availability" replace />
  }

  return <Navigate to="/booking" replace />
}

export default PublicRoute