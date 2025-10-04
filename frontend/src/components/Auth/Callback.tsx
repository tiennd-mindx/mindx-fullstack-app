import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import './Auth.css'

interface CallbackProps {
  onLogin: (token: string) => void
}

function Callback({ onLogin }: CallbackProps) {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [status, setStatus] = useState('Processing...')

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code')
      const state = searchParams.get('state')
      const errorParam = searchParams.get('error')

      // Check if we're in a popup window
      const isPopup = window.opener && window.opener !== window

      if (errorParam) {
        setError('Authentication failed')
        
        if (isPopup) {
          // Send error to parent window and close
          window.opener.postMessage(
            { type: 'LOGIN_ERROR', error: 'Authentication failed' },
            window.location.origin
          )
          setTimeout(() => window.close(), 1000)
        } else {
          setTimeout(() => navigate('/login?error=authentication_failed'), 2000)
        }
        return
      }

      if (!code || !state) {
        setError('Missing authorization code or state')
        
        if (isPopup) {
          window.opener.postMessage(
            { type: 'LOGIN_ERROR', error: 'Missing parameters' },
            window.location.origin
          )
          setTimeout(() => window.close(), 1000)
        } else {
          setTimeout(() => navigate('/login?error=missing_params'), 2000)
        }
        return
      }

      try {
        setStatus('Exchanging authorization code...')
        
        // Call backend to exchange code for token
        const response = await fetch('/api/auth/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include', // Allow cookies
          body: JSON.stringify({ code, state })
        })

        if (!response.ok) {
          throw new Error('Failed to exchange authorization code')
        }

        await response.json() // Session is stored in HTTP-only cookie
        
        console.log('✅ Session cookie set successfully')
        setStatus('Login successful! Closing popup...')
        
        if (isPopup) {
          // Give browser time to set the cookie before notifying parent
          setTimeout(() => {
            console.log('📤 Sending LOGIN_SUCCESS to parent window')
            window.opener.postMessage(
              { type: 'LOGIN_SUCCESS' },
              window.location.origin
            )
            
            // Close popup after sending message
            setTimeout(() => {
              console.log('🚪 Closing popup window')
              window.close()
            }, 300)
          }, 200)
        } else {
          // Regular flow: redirect to dashboard
          onLogin('authenticated')
          setTimeout(() => navigate('/dashboard'), 500)
        }
        
      } catch (err) {
        console.error('Callback error:', err)
        setError('Authentication failed. Please try again.')
        
        if (isPopup) {
          window.opener.postMessage(
            { type: 'LOGIN_ERROR', error: 'Authentication failed' },
            window.location.origin
          )
          setTimeout(() => window.close(), 1000)
        } else {
          setTimeout(() => navigate('/login?error=callback_failed'), 2000)
        }
      }
    }

    handleCallback()
  }, [searchParams, onLogin, navigate])

  if (error) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1>Authentication Failed</h1>
          <p className="error-message">{error}</p>
          <p>Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Processing Authentication</h1>
        <p>{status}</p>
        <div className="loading-spinner"></div>
      </div>
    </div>
  )
}

export default Callback

