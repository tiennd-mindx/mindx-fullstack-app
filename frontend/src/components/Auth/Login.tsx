import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import './Auth.css'

interface LoginProps {
  onLoginSuccess?: () => void
}

function Login({ onLoginSuccess }: LoginProps) {
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const popupRef = useRef<Window | null>(null)
  const checkClosedIntervalRef = useRef<number | null>(null)

  useEffect(() => {
    // Check for error from callback
    const errorParam = searchParams.get('error')
    if (errorParam) {
      setError('Authentication failed. Please try again.')
    }
  }, [searchParams])

  useEffect(() => {
    // Listen for messages from popup window
    const handleMessage = async (event: MessageEvent) => {
      // Security: verify origin
      if (event.origin !== window.location.origin) {
        console.warn('Ignoring message from unknown origin:', event.origin)
        return
      }

      if (event.data.type === 'LOGIN_SUCCESS') {
        console.log('✅ Login successful from popup')
        
        // Clear the popup close monitor
        if (checkClosedIntervalRef.current) {
          clearInterval(checkClosedIntervalRef.current)
          checkClosedIntervalRef.current = null
        }
        
        // Update authentication state first
        if (onLoginSuccess) {
          onLoginSuccess()
        }
        
        setIsLoading(false)
        
        // Use setTimeout to ensure state update completes before navigation
        setTimeout(() => {
          console.log('✅ Navigating to dashboard')
          navigate('/dashboard')
        }, 100)
      } else if (event.data.type === 'LOGIN_ERROR') {
        console.error('❌ Login failed:', event.data.error)
        setError(event.data.error || 'Authentication failed')
        setIsLoading(false)
        
        // Clear the popup close monitor
        if (checkClosedIntervalRef.current) {
          clearInterval(checkClosedIntervalRef.current)
          checkClosedIntervalRef.current = null
        }
      }
    }

    window.addEventListener('message', handleMessage)

    // Cleanup
    return () => {
      window.removeEventListener('message', handleMessage)
      if (checkClosedIntervalRef.current) {
        clearInterval(checkClosedIntervalRef.current)
      }
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close()
      }
    }
  }, [navigate, onLoginSuccess])

  const handleOpenIDLogin = async () => {
    setError('')
    setIsLoading(true)

    try {
      // Get the OpenID authorization URL from backend
      const response = await fetch('/api/auth/login')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to initiate login')
      }

      // Calculate centered popup position
      const width = 500
      const height = 600
      const left = window.screen.width / 2 - width / 2
      const top = window.screen.height / 2 - height / 2

      // Open OAuth flow in popup window
      const popup = window.open(
        data.redirectUrl,
        'MindX Login',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes`
      )

      if (!popup) {
        throw new Error('Popup was blocked. Please allow popups for this site.')
      }

      popupRef.current = popup

      // Monitor popup - if user closes it manually, reset state
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed)
          checkClosedIntervalRef.current = null
          console.log('🚪 Popup was closed manually')
          setError('Login was cancelled')
          setIsLoading(false)
        }
      }, 500)
      
      checkClosedIntervalRef.current = checkClosed

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Login to MindX</h1>
        <p className="auth-description">
          Sign in with your MindX account
        </p>
        
        {error && <div className="error-message">{error}</div>}
        
        <button 
          onClick={handleOpenIDLogin} 
          disabled={isLoading}
          className="btn btn-primary openid-button"
        >
          {isLoading ? 'Waiting for login...' : '🔐 Sign in with MindX'}
        </button>

        <p className="auth-footer">
          A popup window will open for authentication at id-dev.mindx.edu.vn
        </p>
      </div>
    </div>
  )
}

export default Login
