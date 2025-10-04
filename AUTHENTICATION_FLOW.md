# 🔐 OpenID Authentication Flow Documentation

## Overview

This document explains the complete authentication flow implemented in the MindX Full-Stack Application using OpenID Connect (OIDC) with the MindX identity provider (`https://id-dev.mindx.edu.vn`).

---

## Authentication Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          OPENID AUTHENTICATION FLOW                             │
└─────────────────────────────────────────────────────────────────────────────────┘

   User                Frontend              Backend               MindX IdP
    │                    │                      │                       │
    │  1. Click Login    │                      │                       │
    │───────────────────→│                      │                       │
    │                    │                      │                       │
    │                    │  2. GET /api/auth/login                      │
    │                    │─────────────────────→│                       │
    │                    │                      │                       │
    │                    │                  [Generate state]            │
    │                    │                  [Store state]               │
    │                    │                      │                       │
    │                    │  3. Authorization URL                        │
    │                    │←─────────────────────│                       │
    │                    │                      │                       │
    │  4. Popup opens    │                      │                       │
    │←──────────────────────────────────────────────────────────────→│
    │                         (Redirect to MindX login page)            │
    │                                                                    │
    │  5. Enter credentials                                             │
    │───────────────────────────────────────────────────────────────→│
    │                                                                    │
    │                                             [Validate user]        │
    │                                             [Generate code]        │
    │                                                                    │
    │  6. Redirect with code & state                                    │
    │←──────────────────────────────────────────────────────────────────│
    │                    │                      │                       │
    │  7. Callback page  │                      │                       │
    │   (code + state)   │                      │                       │
    │───────────────────→│                      │                       │
    │                    │                      │                       │
    │                    │  8. POST /api/auth/callback                  │
    │                    │     { code, state }  │                       │
    │                    │─────────────────────→│                       │
    │                    │                      │                       │
    │                    │                  [Validate state]            │
    │                    │                      │                       │
    │                    │                      │  9. Exchange code     │
    │                    │                      │     for tokens        │
    │                    │                      │──────────────────────→│
    │                    │                      │                       │
    │                    │                      │  10. Tokens           │
    │                    │                      │  (access + id token)  │
    │                    │                      │←──────────────────────│
    │                    │                      │                       │
    │                    │                  [Store tokens server-side]  │
    │                    │                  [Create session JWT]        │
    │                    │                  [Set HTTP-only cookie]      │
    │                    │                      │                       │
    │                    │  11. User info       │                       │
    │                    │    + session cookie  │                       │
    │                    │←─────────────────────│                       │
    │                    │                      │                       │
    │  12. Close popup   │                      │                       │
    │  Show dashboard    │                      │                       │
    │←───────────────────│                      │                       │
    │                    │                      │                       │
    │  ═══════════════════════════════════════════════════════════════ │
    │             AUTHENTICATED - SESSION ACTIVE                        │
    │  ═══════════════════════════════════════════════════════════════ │
    │                    │                      │                       │
    │  13. Access protected route                                       │
    │───────────────────→│                      │                       │
    │                    │                      │                       │
    │                    │  14. GET /api/auth/me                        │
    │                    │   (cookie auto-sent) │                       │
    │                    │─────────────────────→│                       │
    │                    │                      │                       │
    │                    │                  [Verify cookie JWT]         │
    │                    │                  [Retrieve session]          │
    │                    │                      │                       │
    │                    │  15. User data       │                       │
    │                    │←─────────────────────│                       │
    │                    │                      │                       │
    │  16. Display data  │                      │                       │
    │←───────────────────│                      │                       │
    │                    │                      │                       │

┌─────────────────────────────────────────────────────────────────────────────────┐
│                           KEY SECURITY FEATURES                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│  🔒 Authorization Code Flow    - Most secure OAuth 2.0 flow                     │
│  🍪 HTTP-only Cookies          - Tokens never exposed to JavaScript            │
│  💾 Backend Token Storage      - Access/ID tokens stored server-side only      │
│  🎫 Session-based Auth         - Frontend only receives session cookie         │
│  🛡️  State Parameter           - CSRF protection during OAuth flow             │
│  🔐 Client Secret              - Never exposed to frontend                      │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Simplified Flow (3 Main Steps)

```
┌───────────────────────────────────────────────────────────────────────────┐
│                                                                           │
│  STEP 1: LOGIN INITIATION                                                │
│  ┌──────────┐              ┌──────────┐                                  │
│  │ Frontend │─────────────→│ Backend  │                                  │
│  └──────────┘   Get auth   └──────────┘                                  │
│       ↓          URL            ↓                                         │
│       └─────────────────────────┘                                         │
│                   ↓                                                       │
│           Opens MindX Login                                               │
│                                                                           │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  STEP 2: USER AUTHENTICATION                                             │
│  ┌──────────┐              ┌──────────────┐                              │
│  │   User   │─────────────→│  MindX IdP   │                              │
│  └──────────┘  Credentials  └──────────────┘                              │
│       ↑                            ↓                                      │
│       └─────── Code + State ───────┘                                      │
│                                                                           │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  STEP 3: TOKEN EXCHANGE                                                  │
│  ┌──────────┐    Code      ┌──────────┐   Code+Secret  ┌──────────────┐ │
│  │ Frontend │─────────────→│ Backend  │───────────────→│  MindX IdP   │ │
│  └──────────┘              └──────────┘                └──────────────┘ │
│       ↑                         ↓                             ↓         │
│       │                     [Store tokens]             [Return tokens]   │
│       │                     [Create session]                  ↓         │
│       │                         ↓                             ↓         │
│       └─── User info ───────────┘←────────────────────────────┘         │
│           + Cookie                                                        │
│                                                                           │
│  ✅ AUTHENTICATED - Dashboard loads with user profile                    │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## Architecture

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Frontend   │         │   Backend    │         │  MindX IdP   │
│  (React SPA) │         │  (Node.js)   │         │  (OpenID)    │
└──────────────┘         └──────────────┘         └──────────────┘
```

**Key Security Features:**
- ✅ **Authorization Code Flow** - Most secure OAuth 2.0 flow
- ✅ **HTTP-only Cookies** - Tokens never exposed to JavaScript
- ✅ **Backend Token Storage** - Access/ID tokens stored server-side only
- ✅ **Session-based Authentication** - Frontend only receives session cookie
- ✅ **State Parameter** - CSRF protection during OAuth flow

---

## Complete Authentication Flow

### 1️⃣ Login Initiation

**User Action:** User clicks "Login" button on frontend

**Frontend (`Login.tsx`):**
```typescript
// 1. Call backend to get authorization URL
const response = await fetch('/api/auth/login', {
  credentials: 'include'  // Include cookies
})
const { redirectUrl } = await response.json()

// 2. Open MindX login page in popup
window.open(redirectUrl, 'login-popup', 'width=500,height=600')
```

**Backend (`auth.ts` - `/api/auth/login`):**
```typescript
// 1. Generate random state for CSRF protection
const state = generateState()  // crypto.randomBytes(32).toString('hex')

// 2. Store state temporarily
sessionStore.set(state, { createdAt: Date.now() })

// 3. Build authorization URL
const authUrl = new URL(config.authorization_endpoint)
authUrl.searchParams.set('client_id', clientConfig.client_id)
authUrl.searchParams.set('response_type', 'code')
authUrl.searchParams.set('scope', 'openid profile email')
authUrl.searchParams.set('state', state)
authUrl.searchParams.set('redirect_uri', clientConfig.redirect_uri)

// 4. Return URL to frontend
res.json({ redirectUrl: authUrl.href })
```

**Result:** Popup window opens with MindX login page

**Example Authorization URL:**
```
https://id-dev.mindx.edu.vn/oauth/authorize?
  client_id=YOUR_CLIENT_ID&
  response_type=code&
  scope=openid+profile+email&
  state=abc123random&
  redirect_uri=https://tiennd.mindx.edu.vn/auth/callback
```

---

### 2️⃣ User Authentication at MindX IdP

**User Action:** User enters credentials on MindX login page

**What Happens:**
1. User enters username/password
2. MindX validates credentials
3. MindX asks for user consent (optional, first time only)
4. MindX generates authorization code
5. MindX redirects back to your application

**Redirect URL (sent to frontend):**
```
http://localhost:5173/auth/callback?
  code=AUTH_CODE_HERE&
  state=abc123random
```

---

### 3️⃣ Authorization Code Exchange

**Frontend (`Callback.tsx`):**
```typescript
// 1. Extract code and state from URL
const code = searchParams.get('code')
const state = searchParams.get('state')

// 2. Send to backend for token exchange
const response = await fetch('/api/auth/callback', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',  // CRITICAL: Allow cookies
  body: JSON.stringify({ code, state })
})

// 3. Backend sets HTTP-only cookie
// Session is now active!
```

**Backend (`auth.ts` - `/api/auth/callback`):**
```typescript
// 1. Validate state parameter (CSRF protection)
if (!state || !sessionStore.has(state)) {
  throw new Error('Invalid state parameter')
}

// 2. Exchange authorization code for tokens
const tokenParams = new URLSearchParams({
  grant_type: 'authorization_code',
  code: code,
  redirect_uri: clientConfig.redirect_uri,
  client_id: clientConfig.client_id,
  client_secret: clientConfig.client_secret  // Backend only!
})

const tokenResponse = await fetch(config.token_endpoint, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: tokenParams.toString()
})

const tokenSet = await tokenResponse.json()
// tokenSet = {
//   access_token: "...",
//   id_token: "...",
//   token_type: "Bearer",
//   expires_in: 3600
// }

// 3. Decode ID token to extract user info
const idTokenPayload = tokenSet.id_token.split('.')[1]
const decodedPayload = JSON.parse(Buffer.from(idTokenPayload, 'base64').toString())

const userinfo = {
  sub: decodedPayload.sub,        // User ID
  email: decodedPayload.email,    // Email
  name: decodedPayload.name       // Display name
}

// 4. Store tokens in backend session store (NOT in frontend!)
const sessionId = generateState()
sessionStore.set(sessionId, {
  access_token: tokenSet.access_token,  // For API calls to MindX
  id_token: tokenSet.id_token,          // User identity proof
  user: userinfo,
  createdAt: Date.now()
})

// 5. Create session JWT (NO tokens inside, just reference)
const sessionToken = jwt.sign(
  {
    sessionId: sessionId,  // Reference to backend session
    sub: userinfo.sub,
    email: userinfo.email,
    name: userinfo.name
  },
  process.env.SESSION_SECRET,
  { expiresIn: '7d' }
)

// 6. Set HTTP-only secure cookie
res.cookie('session', sessionToken, {
  httpOnly: true,   // JavaScript CANNOT access this
  secure: true,     // HTTPS only (production)
  sameSite: 'lax',  // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
})

// 7. Return ONLY user info (NO TOKENS!)
res.json({ 
  user: {
    sub: userinfo.sub,
    email: userinfo.email,
    name: userinfo.name
  },
  message: 'Login successful'
})
```

**Result:** User is authenticated, session cookie is set

---

### 4️⃣ Accessing Protected Resources

**Frontend (Any protected page):**
```typescript
// Fetch user data
const response = await fetch('/api/auth/me', {
  credentials: 'include'  // ALWAYS include credentials
})

if (!response.ok) {
  // User not authenticated, redirect to login
  navigate('/login')
}

const { user } = await response.json()
// user = { sub, email, name }
```

**Backend (`auth.ts` - `/api/auth/me`):**
```typescript
// Middleware extracts session from HTTP-only cookie
const sessionCookie = req.cookies.session

if (!sessionCookie) {
  return res.status(401).json({ message: 'Not authenticated' })
}

// Verify session JWT
const decoded = jwt.verify(sessionCookie, process.env.SESSION_SECRET)

// Retrieve session from store
const session = sessionStore.get(decoded.sessionId)

if (!session) {
  return res.status(401).json({ message: 'Session expired' })
}

// Return user info (NO TOKENS!)
res.json({ 
  user: session.user,
  authenticated: true 
})
```

**Result:** Protected data returned to authenticated user

---

### 5️⃣ Making Authenticated API Calls

**Frontend (Example):**
```typescript
// Any API call to protected endpoint
const response = await fetch('/api/protected/data', {
  method: 'GET',
  credentials: 'include',  // Session cookie sent automatically
  headers: {
    'Content-Type': 'application/json'
  }
})

if (response.status === 401) {
  // Session expired, redirect to login
  navigate('/login')
}

const data = await response.json()
```

**Backend (Protected route):**
```typescript
// Use authentication middleware
router.get('/protected/data', authenticateToken, async (req, res) => {
  // req.user is populated by middleware
  const userId = req.user.sub
  
  // Access user's data
  const data = await getUserData(userId)
  
  res.json({ data })
})
```

**Middleware (`middleware/auth.ts`):**
```typescript
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const sessionCookie = req.cookies.session

  if (!sessionCookie) {
    return res.status(401).json({ message: 'Authentication required' })
  }

  try {
    // Verify session JWT
    const decoded = jwt.verify(sessionCookie, process.env.SESSION_SECRET)
    
    // Attach user to request
    req.user = {
      sessionId: decoded.sessionId,
      sub: decoded.sub,
      email: decoded.email,
      name: decoded.name
    }
    
    next()
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired session' })
  }
}
```

---

### 6️⃣ Logout

**Frontend:**
```typescript
// Call logout endpoint
await fetch('/api/auth/logout', {
  method: 'POST',
  credentials: 'include'
})

// Redirect to login
navigate('/login')
```

**Backend (`auth.ts` - `/api/auth/logout`):**
```typescript
// 1. Get session cookie
const sessionCookie = req.cookies.session

if (sessionCookie) {
  // 2. Decode to get session ID
  const decoded = jwt.verify(sessionCookie, process.env.SESSION_SECRET)
  
  // 3. Delete session from store
  sessionStore.delete(decoded.sessionId)
}

// 4. Clear cookie
res.clearCookie('session', {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax'
})

// 5. Confirm logout
res.json({ message: 'Logged out successfully' })
```

**Result:** Session destroyed, cookie cleared, user logged out

---

## Security Model

### What Frontend Has Access To
```json
{
  "user": {
    "sub": "user-id-123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```
✅ **Only user profile information**

### What Frontend DOES NOT Have Access To
- ❌ Access Token
- ❌ ID Token
- ❌ Client Secret
- ❌ Session Store

All sensitive tokens stored **backend-only**!

---

## Token Storage Comparison

### ❌ Insecure (localStorage/sessionStorage)
```typescript
// BAD: Tokens exposed to JavaScript
localStorage.setItem('access_token', token)
// Vulnerable to XSS attacks!
```

### ✅ Secure (HTTP-only Cookies + Backend Session)
```typescript
// GOOD: Tokens never exposed to JavaScript

// Backend:
res.cookie('session', sessionToken, {
  httpOnly: true,  // JavaScript CANNOT access
  secure: true,    // HTTPS only
  sameSite: 'lax'  // CSRF protection
})

// Frontend:
fetch('/api/data', {
  credentials: 'include'  // Cookie sent automatically
})
```

---

## Session Flow Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW                         │
└────────────────────────────────────────────────────────────────┘

1. LOGIN INITIATION
   Frontend                 Backend              MindX IdP
      │                        │                      │
      │──── GET /api/auth/login ───→│                │
      │                        │                      │
      │                    [Generate state]          │
      │                    [Store state]             │
      │                        │                      │
      │←── authorizationUrl ───│                      │
      │                        │                      │
      │──────────────────────────────────────────────→│
      │              (User redirected to MindX)       │
      │                                                │

2. USER AUTHENTICATION
      │                        │                      │
      │                        │      [User enters    │
      │                        │       credentials]   │
      │                        │                      │
      │←──────────────────────────────────────────────│
      │     Redirect with code & state                │
      │                        │                      │

3. TOKEN EXCHANGE
      │                        │                      │
      │─ POST /api/auth/callback ──→│                │
      │  { code, state }       │                      │
      │                        │                      │
      │                    [Validate state]           │
      │                        │                      │
      │                        │─── POST /token ─────→│
      │                        │  { code, client_id,  │
      │                        │    client_secret }   │
      │                        │                      │
      │                        │←─── tokens ──────────│
      │                        │  { access_token,     │
      │                        │    id_token }        │
      │                        │                      │
      │                    [Store tokens in           │
      │                     backend session]          │
      │                        │                      │
      │                    [Create session JWT]       │
      │                        │                      │
      │                    [Set HTTP-only cookie]     │
      │                        │                      │
      │←── { user } + cookie ──│                      │
      │                        │                      │

4. AUTHENTICATED REQUESTS
      │                        │                      │
      │─── GET /api/auth/me ──→│                      │
      │  (cookie auto-sent)    │                      │
      │                        │                      │
      │                    [Verify cookie JWT]        │
      │                    [Retrieve session]         │
      │                        │                      │
      │←──── { user } ─────────│                      │
      │                        │                      │

5. LOGOUT
      │                        │                      │
      │─ POST /api/auth/logout ─→│                    │
      │  (cookie auto-sent)    │                      │
      │                        │                      │
      │                    [Delete session]           │
      │                    [Clear cookie]             │
      │                        │                      │
      │←── success ────────────│                      │
      │                        │                      │
```

---

## Data Flow

### 1. Tokens Never Leave Backend
```
MindX IdP ──→ Backend ──→ Session Store
              (tokens)     (encrypted storage)
                 ↓
            HTTP-only Cookie
                 ↓
              Frontend
           (session reference only)
```

### 2. Frontend Authentication State
```typescript
// Frontend stores minimal user info
const [user, setUser] = useState<User | null>(null)

// User object contains NO sensitive tokens
interface User {
  sub: string      // User ID
  email: string    // Email
  name: string     // Display name
}
```

### 3. Backend Session Management
```typescript
// Backend session store (in-memory or Redis)
sessionStore = {
  "session-abc123": {
    access_token: "eyJhbGc...",  // For MindX API calls
    id_token: "eyJhbGc...",      // User identity proof
    user: { sub, email, name },  // User profile
    createdAt: 1234567890
  }
}
```

---

## API Endpoints Reference

### Public Endpoints (No Authentication)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/hello` | Hello world |
| `GET` | `/api/auth/login` | Get authorization URL |
| `POST` | `/api/auth/callback` | Exchange code for session |

### Protected Endpoints (Requires Session Cookie)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/auth/me` | Get current user |
| `POST` | `/api/auth/logout` | Logout and clear session |

---

## Configuration

### Backend Environment Variables

```env
# OpenID Provider
OPENID_ISSUER_URL=https://id-dev.mindx.edu.vn

# OpenID Client (from MindX DevOps)
OPENID_CLIENT_ID=your-client-id
OPENID_CLIENT_SECRET=your-client-secret

# Redirect URI (must match whitelisted URIs)
OPENID_REDIRECT_URI=http://localhost:5173/auth/callback

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Session Secret (generate random string)
SESSION_SECRET=random-32-char-string

# Environment
NODE_ENV=development
```

### Frontend Configuration

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
```

---

## Common Scenarios

### Scenario 1: First-Time Login
1. User clicks "Login" → Popup opens
2. User enters credentials at MindX
3. MindX redirects with authorization code
4. Backend exchanges code for tokens
5. Backend sets session cookie
6. Popup closes, dashboard loads
7. User is authenticated ✅

### Scenario 2: Already Logged In
1. User refreshes page
2. Frontend checks session: `GET /api/auth/me`
3. Backend validates session cookie
4. User info returned
5. User stays authenticated ✅

### Scenario 3: Session Expired
1. Frontend makes API call
2. Backend returns `401 Unauthorized`
3. Frontend redirects to login
4. User logs in again
5. New session created ✅

### Scenario 4: Logout
1. User clicks "Logout"
2. Frontend calls `POST /api/auth/logout`
3. Backend deletes session and clears cookie
4. Frontend redirects to login
5. User logged out ✅

---

## Troubleshooting

### Issue: "Invalid redirect URI"
**Cause:** Redirect URI not whitelisted at MindX IdP

**Solution:**
```bash
# Ask MindX DevOps to whitelist:
# - http://localhost:5173/auth/callback (local)
# - https://yourdomain.com/auth/callback (production)

# Check your .env matches:
OPENID_REDIRECT_URI=http://localhost:5173/auth/callback
```

### Issue: "State parameter mismatch"
**Cause:** State parameter validation failed (possible CSRF attack or expired state)

**Solution:**
- State expires after 5 minutes (normal behavior)
- User took too long to login → start login flow again
- Check that state is properly stored in backend session

### Issue: "Session cookie not sent"
**Cause:** Missing `credentials: 'include'` in fetch calls

**Solution:**
```typescript
// ALWAYS include credentials
fetch('/api/auth/me', {
  credentials: 'include'  // ← REQUIRED!
})
```

### Issue: "CORS error"
**Cause:** Backend not configured for frontend origin

**Solution:**
```typescript
// backend/src/server.ts
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true  // Allow cookies
}))
```

### Issue: "Token expired"
**Cause:** Access token lifetime exceeded (typically 1 hour)

**Future Enhancement:** Implement token refresh flow
```typescript
// TODO: Implement refresh token flow
// When access_token expires, use refresh_token to get new tokens
```

---

## Production Considerations

### 1. Session Store
```typescript
// Development: In-memory (loses sessions on restart)
const sessionStore = new Map<string, any>()

// Production: Redis (persistent, scalable)
import Redis from 'ioredis'
const redis = new Redis(process.env.REDIS_URL)
```

### 2. HTTPS Enforcement
```typescript
// Production: HTTPS only
res.cookie('session', token, {
  secure: true,  // HTTPS only
  httpOnly: true,
  sameSite: 'strict'  // Stricter CSRF protection
})
```

### 3. Token Refresh (Future Enhancement)
```typescript
// Implement refresh token flow
// Exchange refresh_token for new access_token
// Before access_token expires (proactive refresh)
```

### 4. Rate Limiting
```typescript
// Prevent brute force attacks
import rateLimit from 'express-rate-limit'

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5  // 5 attempts
})

app.get('/api/auth/login', loginLimiter, loginHandler)
```

---

## Related Documentation

- **Security Guidelines:** `SECURITY.md`
- **Quick Start:** `OPENID_QUICKSTART.md`
- **Deployment Guide:** `README.md`
- **API Documentation:** `PROJECT_SUMMARY.md`

---

## Summary

**Key Principles:**
1. ✅ **Authorization Code Flow** - Most secure OAuth flow
2. ✅ **Backend Token Storage** - Tokens never exposed to frontend
3. ✅ **HTTP-only Cookies** - Session reference only, not tokens
4. ✅ **State Parameter** - CSRF protection
5. ✅ **Credentials Include** - Send cookies with every request

**Security Checklist:**
- [ ] Tokens stored backend-only (in-memory or Redis)
- [ ] HTTP-only cookies for session management
- [ ] State parameter validated for CSRF protection
- [ ] `credentials: 'include'` on all API calls
- [ ] HTTPS enforced in production
- [ ] Client secret never exposed to frontend
- [ ] Proper CORS configuration with credentials

---

**Last Updated:** October 4, 2025  
**Version:** 1.0.0

