import { Navigate } from 'react-router-dom'

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = sessionStorage.getItem('admin_auth') === 'true'
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />
  }
  return children
}

export default ProtectedRoute
