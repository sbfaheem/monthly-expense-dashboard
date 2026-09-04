import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff } from 'lucide-react'
import { getAdminPassword } from '../utils/storage'
import './AdminLogin.css'

export default function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [adminPassword, setAdminPassword] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    getAdminPassword().then(setAdminPassword).catch(() => setAdminPassword('admin123'))
  }, [])

  const handleLogin = (e) => {
    e.preventDefault()
    if (adminPassword === null) {
      setError('System is loading, please try again.')
      return
    }
    if (username === 'admin' && password === adminPassword) {
      sessionStorage.setItem('admin_auth', 'true')
      navigate('/admin')
    } else {
      setError('Invalid username or password. Please try again.')
      setTimeout(() => setError(''), 4000)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <Lock size={28} />
        </div>
        <h1 className="login-title">Admin Panel</h1>
        <p className="login-subtitle">Monthly Expense Dashboard</p>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter username"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <div className="password-wrapper">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <button type="button" className="toggle-pass" onClick={() => setShowPass(s => !s)}>
                {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
          </div>
          <button type="submit" className="btn-login" disabled={adminPassword === null}>
            {adminPassword === null ? 'Loading...' : 'Login to Admin Panel'}
          </button>
        </form>

        <a href="/view" className="back-to-viewer">← Back to Viewer Dashboard</a>
      </div>
    </div>
  )
}
