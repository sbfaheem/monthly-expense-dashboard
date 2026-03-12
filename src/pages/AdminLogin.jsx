import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff } from 'lucide-react'
import './AdminLogin.css'

const ADMIN_PASSWORD = 'admin123' // Simple demo password

export default function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLogin = (e) => {
    e.preventDefault()
    if (username === 'admin' && password === ADMIN_PASSWORD) {
      sessionStorage.setItem('admin_auth', 'true')
      navigate('/admin')
    } else {
      setError('Invalid credentials. Try admin / admin123')
      setTimeout(() => setError(''), 3000)
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
              placeholder="admin"
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
          <button type="submit" className="btn-login">Login to Admin Panel</button>
        </form>

        <div className="login-hint">
          <strong>Demo credentials:</strong> admin / admin123
        </div>
        <a href="/view" className="back-to-viewer">← Back to Viewer Dashboard</a>
      </div>
    </div>
  )
}
