interface OpenIdConfig {
  authorization_endpoint: string
  token_endpoint: string
  userinfo_endpoint: string
  end_session_endpoint?: string
  issuer: string
}

let discoveryConfig: OpenIdConfig | null = null

export async function getOpenIdConfig() {
  if (discoveryConfig) {
    return discoveryConfig
  }

  try {
    const issuerUrl = process.env.OPENID_ISSUER || 'https://id-dev.mindx.edu.vn'
    const wellKnownUrl = `${issuerUrl}/.well-known/openid-configuration`
    
    console.log('🔍 Discovering OpenID configuration from:', wellKnownUrl)
    
    const response = await fetch(wellKnownUrl)
    if (!response.ok) {
      throw new Error(`Discovery failed: ${response.statusText}`)
    }
    
    discoveryConfig = await response.json() as OpenIdConfig
    
    console.log('✅ Discovered OpenID endpoints:')
    console.log('   Authorization:', discoveryConfig!.authorization_endpoint)
    console.log('   Token:', discoveryConfig!.token_endpoint)
    console.log('   UserInfo:', discoveryConfig!.userinfo_endpoint)

    return discoveryConfig!
  } catch (error) {
    console.error('❌ Failed to discover OpenID provider:', error)
    throw new Error('OpenID provider discovery failed')
  }
}

export function generateState(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export function getClientConfig() {
  return {
    client_id: process.env.OPENID_CLIENT_ID || '',
    client_secret: process.env.OPENID_CLIENT_SECRET || '',
    redirect_uri: process.env.OPENID_REDIRECT_URI || 'http://localhost:5173/auth/callback'
  }
}

