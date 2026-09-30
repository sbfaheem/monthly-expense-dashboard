import { Routes, Route, Navigate } from 'react-router-dom'
import ViewerDashboard from './pages/ViewerDashboard'
import AdminLogin from './pages/AdminLogin'
import AdminPanel from './pages/AdminPanel'
import ProtectedRoute from './components/ProtectedRoute'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/view" replace />} />
      <Route path="/view" element={<ViewerDashboard />} />
      <Route path="/index.html" element={<Navigate to="/view" replace />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/*" element={
        <ProtectedRoute>
          <AdminPanel />
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/view" replace />} />
    </Routes>
  )
}

export default App
