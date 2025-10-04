import { Router, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { getOpenIdConfig, getClientConfig, generateState } from '../config/openid'
// import { authenticateToken } from '../middleware/auth' // Not used currently

const router = Router()

interface TokenSet {
  access_token: string
  id_token?: string
  refresh_token?: string
  token_type: string
  expires_in?: number
}

interface UserInfo {
  sub: string
  email?: string
  name?: string
}

// Store state and session data temporarily (use Redis in production)
const sessionStore = new Map<string, any>()

// Initiate OpenID login
router.get('/login', async (_req: Request, res: Response): Promise<void> => {
  try {
    const config = await getOpenIdConfig()
    const clientConfig = getClientConfig()
    const state = generateState()
    
    // Store state for validation
    sessionStore.set(state, { createdAt: Date.now() })
    
    // Build authorization URL manually
    const authUrl = new URL(config.authorization_endpoint)
    authUrl.searchParams.set('client_id', clientConfig.client_id)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', 'openid profile email')
    authUrl.searchParams.set('state', state)
    authUrl.searchParams.set('redirect_uri', clientConfig.redirect_uri)
    // Don't set prompt parameter - let MindX handle consent naturally
    
    console.log('🔐 Authorization URL:', authUrl.href)
    console.log('📍 Redirect URI:', clientConfig.redirect_uri)
    
    res.json({ 
      redirectUrl: authUrl.href,
      message: 'Redirect to this URL to login'
    })
  } catch (error) {
    console.error('❌ Login error:', error)
    res.status(500).json({
      message: 'Error initiating login',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// OpenID callback endpoint - called by frontend with authorization code
router.post('/callback', async (req: Request, res: Response): Promise<void> => {
  try {
    const config = await getOpenIdConfig()
    const clientConfig = getClientConfig()
    
    // Get authorization code and state from request body
    const { code, state } = req.body
    
    console.log('📥 Callback received from frontend:', { code: code ? '✓' : '✗', state: state ? '✓' : '✗' })
    
    if (!code) {
      res.status(400).json({ message: 'Authorization code missing' })
      return
    }
    
    // Verify state
    if (!state || !sessionStore.has(state)) {
      res.status(400).json({ message: 'Invalid state parameter' })
      return
    }
    
    console.log('✓ State validated')
    
    // Exchange authorization code for tokens
    console.log('🔄 Exchanging code for tokens at:', config.token_endpoint)
    
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: clientConfig.redirect_uri,
      client_id: clientConfig.client_id,
      client_secret: clientConfig.client_secret
    })
    
    const tokenResponse = await fetch(config.token_endpoint, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: tokenParams.toString()
    })
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('❌ Token exchange failed:', errorText)
      throw new Error(`Token request failed: ${tokenResponse.status} ${tokenResponse.statusText}`)
    }
    
    const tokenSet = await tokenResponse.json() as TokenSet
    console.log('✅ Received tokens:', tokenSet)
    console.log('📦 Full token response:', JSON.stringify(tokenSet, null, 2))
    
    // Decode ID token to get user info (ID token already contains user claims)
    console.log('👤 Decoding ID token for user info')
    
    if (!tokenSet.id_token) {
      throw new Error('ID token missing from token response')
    }
    
    // Decode JWT (without verification - just extract payload)
    // ID token format: header.payload.signature
    const idTokenPayload = tokenSet.id_token.split('.')[1]
    const decodedPayload = JSON.parse(Buffer.from(idTokenPayload, 'base64').toString())
    
    const userinfo: UserInfo = {
      sub: decodedPayload.sub || decodedPayload.user_id,
      email: decodedPayload.email,
      name: decodedPayload.name || decodedPayload.email
    }
    
    console.log('✅ User info decoded from ID token:', { 
      sub: userinfo.sub,
      email: userinfo.email,
      name: userinfo.name
    })
    
    // Store tokens securely in session (in production, use Redis)
    const sessionId = generateState()
    sessionStore.set(sessionId, {
      access_token: tokenSet.access_token,
      id_token: tokenSet.id_token,
      user: userinfo,
      createdAt: Date.now()
    })
    
    // Create session JWT (NO tokens inside, just session reference)
    const sessionToken = jwt.sign(
      {
        sessionId: sessionId,
        sub: userinfo.sub,
        email: userinfo.email,
        name: userinfo.name
      },
      process.env.SESSION_SECRET || 'default-secret',
      { expiresIn: '7d' }
    )
    
    // Clean up state
    sessionStore.delete(state)
    
    // Set HTTP-only secure cookie (tokens never exposed to frontend)
    res.cookie('session', sessionToken, {
      httpOnly: true,  // NOT accessible via JavaScript
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'lax', // CSRF protection
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })
    
    // Return ONLY user info (no tokens!)
    console.log('✅ Session created, returning user info')
    res.json({ 
      user: {
        sub: userinfo.sub,
        email: userinfo.email,
        name: userinfo.name
      }
    })
    
  } catch (error) {
    console.error('❌ Callback error:', error)
    res.status(500).json({
      message: 'Authentication failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Logout endpoint
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  // Get session from cookie
  const sessionToken = req.cookies?.session
  // let idToken: string | null = null // Not used currently
  
  if (sessionToken) {
    try {
      const decoded = jwt.verify(sessionToken, process.env.SESSION_SECRET || 'default-secret') as any
      
      // Clear server-side session
      sessionStore.delete(decoded.sessionId)
    } catch (error) {
      console.error('Error clearing session:', error)
    }
  }
  
  // Clear session cookie
  res.clearCookie('session')
  
  // Note: Not calling MindX end_session to avoid:
  // 1. Consent revocation (causes consent screen on re-login)
  // 2. post_logout_redirect_uri whitelist requirement
  // 3. Extra confirmation UI from MindX
  // Result: MindX session stays active = instant re-login
  
  res.json({
    message: 'Logged out successfully'
  })
})

// Get current user (protected route)
router.get('/me', async (req: Request, res: Response): Promise<void> => {
  try {
    const sessionCookie = req.cookies.session
    
    if (!sessionCookie) {
      res.status(401).json({ message: 'Not authenticated' })
      return
    }
    
    // Verify session JWT
    const decoded = jwt.verify(sessionCookie, process.env.SESSION_SECRET || 'default-secret') as any
    
    // Retrieve session from store
    const session = sessionStore.get(decoded.sessionId)
    
    if (!session) {
      res.status(401).json({ message: 'Session expired' })
      return
    }
    
    res.json({
      user: {
        sub: decoded.sub,
        email: decoded.email,
        name: decoded.name
      },
      authenticated: true
    })
  } catch (error) {
    console.error('Session verification error:', error)
    res.status(401).json({ message: 'Invalid session' })
  }
})

export default router
