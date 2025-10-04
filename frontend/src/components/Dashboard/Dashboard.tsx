import { useState, useEffect } from 'react'
import './Dashboard.css'

interface DashboardProps {
  onLogout: () => void
}

function Dashboard({ onLogout }: DashboardProps) {
  const [apiHealth, setApiHealth] = useState<string>('checking...')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check API health
        const healthResponse = await fetch('/api/health')
        if (healthResponse.ok) {
          setApiHealth('healthy')
        } else {
          setApiHealth('unhealthy')
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        setApiHealth('error')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      onLogout() // This now handles the logout API call
    }
  }

  if (isLoading) {
    return <div className="loading">Loading dashboard...</div>
  }

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <div className="nav-content">
          <h1>MindX Dashboard</h1>
          <button onClick={handleLogout} className="btn btn-logout">
            Logout
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        {/* User Profile Card */}
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar">
              👤
            </div>
            <div className="profile-info">
              <h2>Authenticated User</h2>
              <p className="profile-email">Logged in via MindX OpenID</p>
            </div>
          </div>
          
          <div className="profile-details">
            <h3>OpenID Connect Information</h3>
            <div className="detail-row">
              <span className="detail-label">Provider:</span>
              <span className="detail-value">MindX OpenID (id-dev.mindx.edu.vn)</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Authentication:</span>
              <span className="detail-value status-badge status-healthy">✓ Active</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Session:</span>
              <span className="detail-value">Cookie-based (HTTP-only)</span>
            </div>
          </div>

          <div className="profile-actions">
            <button onClick={handleLogout} className="btn btn-logout-large">
              🚪 Logout
            </button>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <div className="card-icon">🚀</div>
            <h3>API Status</h3>
            <p className={`status-badge status-${apiHealth}`}>
              {apiHealth}
            </p>
            <p className="card-description">
              Backend API connection status
            </p>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">🔐</div>
            <h3>Authentication</h3>
            <p className="status-badge status-healthy">OpenID Connect</p>
            <p className="card-description">
              Authenticated via MindX OpenID
            </p>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">☁️</div>
            <h3>Deployment</h3>
            <p className="status-badge status-healthy">Production</p>
            <p className="card-description">
              https://tiennd.mindx.edu.vn
            </p>
          </div>
        </div>

        <div className="info-section">
          <h3>🚀 Production Stack</h3>
          <div className="tech-stack">
            <div className="tech-item">✅ React + TypeScript Frontend</div>
            <div className="tech-item">✅ Node.js + Express Backend</div>
            <div className="tech-item">✅ OpenID Connect Authentication</div>
            <div className="tech-item">✅ Azure Kubernetes Service (AKS)</div>
            <div className="tech-item">✅ Azure Container Registry (ACR)</div>
            <div className="tech-item">✅ HTTPS with Let's Encrypt SSL</div>
            <div className="tech-item">✅ NGINX Ingress Controller</div>
            <div className="tech-item">✅ Cookie-based Session Management</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
