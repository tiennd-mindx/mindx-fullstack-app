import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Login from './components/Auth/Login'
import Callback from './components/Auth/Callback'
import Dashboard from './components/Dashboard/Dashboard'
import ProtectedRoute from './components/Auth/ProtectedRoute'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    // Verify session with backend on app load
    const verifySession = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include' // Send cookies
        })
        
        if (response.ok) {
          const data = await response.json()
          console.log('✅ Session verified:', data)
          setIsAuthenticated(true)
        } else {
          console.log('❌ No valid session')
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error('Session verification error:', error)
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }
    
    verifySession()
  }, [])

  const handleLogin = () => {
    // No token to store - just mark as authenticated
    setIsAuthenticated(true)
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include' // Send cookies
      })
    } catch (error) {
      console.error('Logout error:', error)
    }
    setIsAuthenticated(false)
  }

  if (isLoading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={
            isAuthenticated ? 
              <Navigate to="/dashboard" /> : 
              <Login onLoginSuccess={handleLogin} />
          } 
        />
        <Route 
          path="/auth/callback" 
          element={<Callback onLogin={handleLogin} />} 
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Dashboard onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  )
}

export default App
