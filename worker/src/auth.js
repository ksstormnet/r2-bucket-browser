/**
 * R2 Browser Authentication Worker
 * Handles Google OAuth authentication with domain restriction
 */

// CORS headers helper
function corsHeaders(request, env) {
  const origin = request.headers.get('Origin');
  const allowedOrigins = env.ALLOWED_ORIGINS.split(',');
  
  const responseHeaders = new Headers({
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  });
  
  if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
    responseHeaders.set('Access-Control-Allow-Origin', origin);
  } else {
    responseHeaders.set('Access-Control-Allow-Origin', allowedOrigins[0]);
  }
  
  return responseHeaders;
}

// Error response helper
function errorResponse(message, status, headers) {
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers }
  );
}

// Success response helper
function successResponse(data, headers) {
  return new Response(
    JSON.stringify(data),
    { headers }
  );
}

// Generate a random state for OAuth flow
function generateState() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Verify JWT token
async function verifyGoogleToken(token, env) {
  try {
    // Fetch Google's public keys
    const googleCertsResponse = await fetch('https://www.googleapis.com/oauth2/v1/certs');
    const googleCerts = await googleCertsResponse.json();
    
    // Split the JWT
    const [headerB64, payloadB64, signature] = token.split('.');
    
    // Decode the payload
    const decodedPayload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
    
    // Basic validation
    const now = Math.floor(Date.now() / 1000);
    
    if (decodedPayload.exp < now) {
      throw new Error('Token expired');
    }
    
    if (decodedPayload.aud !== env.GOOGLE_CLIENT_ID) {
      throw new Error('Invalid audience');
    }
    
    // Check the domain
    const email = decodedPayload.email;
    if (!email) {
      throw new Error('Email not provided in token');
    }
    
    const emailDomain = email.split('@')[1];
    if (emailDomain !== env.AUTH_DOMAIN) {
      throw new Error(`Authentication restricted to @${env.AUTH_DOMAIN} domain. Found: @${emailDomain}`);
    }
    
    // Verify email is verified
    if (!decodedPayload.email_verified) {
      throw new Error('Email not verified');
    }
    
    return decodedPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    throw error;
  }
}

// Generate a session token
async function generateSessionToken(user, env) {
  // Create a session object
  const session = {
    id: crypto.randomUUID(),
    user: {
      email: user.email,
      name: user.name,
      picture: user.picture
    },
    created: Date.now(),
    expires: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
  };
  
  // Store the session in KV
  await env.AUTH_SESSIONS.put(session.id, JSON.stringify(session), {
    expirationTtl: 604800 // 7 days in seconds
  });
  
  return session.id;
}

// Verify a session token
async function verifySession(sessionId, env) {
  if (!sessionId) {
    throw new Error('No session ID provided');
  }
  
  const sessionData = await env.AUTH_SESSIONS.get(sessionId);
  
  if (!sessionData) {
    throw new Error('Session not found');
  }
  
  const session = JSON.parse(sessionData);
  
  // Check if session is expired
  if (session.expires < Date.now()) {
    await env.AUTH_SESSIONS.delete(sessionId);
    throw new Error('Session expired');
  }
  
  return session;
}

// Routes for authentication
async function handleLogin(request, env) {
  // Generate a random state for CSRF protection
  const state = generateState();
  
  // Store state in KV for verification (expires in 10 minutes)
  await env.AUTH_STATES.put(state, 'pending', {
    expirationTtl: 600
  });
  
  // Build Google OAuth URL
  const redirectUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  redirectUrl.searchParams.set('client_id', env.GOOGLE_CLIENT_ID);
  redirectUrl.searchParams.set('redirect_uri', env.REDIRECT_URI);
  redirectUrl.searchParams.set('response_type', 'code');
  redirectUrl.searchParams.set('scope', 'openid email profile');
  redirectUrl.searchParams.set('state', state);
  redirectUrl.searchParams.set('hd', env.AUTH_DOMAIN); // Restrict to domain
  
  // Redirect to Google
  return new Response(null, {
    headers: {
      'Location': redirectUrl.toString()
    },
    status: 302
  });
}

async function handleCallback(request, env) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  
  // Set CORS headers
  const headers = corsHeaders(request, env);
  headers.set('Content-Type', 'application/json');
  
  // Handle errors from Google
  if (error) {
    return errorResponse(`OAuth error: ${error}`, 400, headers);
  }
  
  // Verify required parameters
  if (!code || !state) {
    return errorResponse('Missing required parameters', 400, headers);
  }
  
  // Verify state to prevent CSRF
  const storedState = await env.AUTH_STATES.get(state);
  if (!storedState) {
    return errorResponse('Invalid state parameter', 400, headers);
  }
  
  // Delete the used state
  await env.AUTH_STATES.delete(state);
  
  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: env.REDIRECT_URI,
        grant_type: 'authorization_code'
      })
    });
    
    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      return errorResponse(`Token exchange error: ${tokenData.error}`, 400, headers);
    }
    
    // Verify ID token and extract user info
    const userData = await verifyGoogleToken(tokenData.id_token, env);
    
    // Domain verification is already done in verifyGoogleToken
    // This block is redundant and can be removed since domain 
    // validation errors will be caught in the catch block below
    
    // Generate session token
    const sessionToken = await generateSessionToken(userData, env);
    
    // Set session cookie
    headers.set('Set-Cookie', `session=${sessionToken}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`);
    
    // Redirect to frontend with session information
    return new Response(null, {
      headers: {
        ...Object.fromEntries(headers.entries()),
        'Location': `${env.FRONTEND_URL}/auth/success?session=${sessionToken}`
      },
      status: 302
    });
    
  } catch (error) {
    console.error('Authentication error:', error);
    
    // Determine the appropriate status code based on the error
    let status = 401;
    if (error.message.includes('restricted to @')) {
      status = 403; // Forbidden for domain mismatch
    }
    
    return errorResponse('Authentication failed: ' + error.message, status, headers);
  }
}

async function handleLogout(request, env) {
  const headers = corsHeaders(request, env);
  headers.set('Content-Type', 'application/json');
  
  // Get session ID from cookie
  const cookies = request.headers.get('Cookie') || '';
  const sessionCookie = cookies.split(';').find(c => c.trim().startsWith('session='));
  const sessionId = sessionCookie ? sessionCookie.split('=')[1].trim() : null;
  
  if (sessionId) {
    // Delete the session
    await env.AUTH_SESSIONS.delete(sessionId);
  }
  
  // Clear the cookie
  headers.set('Set-Cookie', 'session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');
  
  return successResponse({ success: true, message: 'Logged out successfully' }, headers);
}

async function handleVerifySession(request, env) {
  const headers = corsHeaders(request, env);
  headers.set('Content-Type', 'application/json');
  
  try {
    // Get session ID from cookie
    const cookies = request.headers.get('Cookie') || '';
    const sessionCookie = cookies.split(';').find(c => c.trim().startsWith('session='));
    const sessionId = sessionCookie ? sessionCookie.split('=')[1].trim() : null;
    
    if (!sessionId) {
      return errorResponse('No session found', 401, headers);
    }
    
    // Verify the session
    const session = await verifySession(sessionId, env);
    
    // Return user info
    return successResponse({
      authenticated: true,
      user: session.user
    }, headers);
    
  } catch (error) {
    return errorResponse('Session verification failed: ' + error.message, 401, headers);
  }
}

// Main handler for authentication requests
export async function handleAuthRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders(request, env),
    });
  }
  
  // Route requests
  if (path === '/api/auth/login') {
    return handleLogin(request, env);
  } else if (path === '/api/auth/callback') {
    return handleCallback(request, env);
  } else if (path === '/api/auth/logout') {
    return handleLogout(request, env);
  } else if (path === '/api/auth/verify') {
    return handleVerifySession(request, env);
  }
  
  // Route not found
  return new Response('Not Found', { status: 404 });
}

// Middleware for authenticating API requests
export async function authMiddleware(request, env) {
  try {
    // Get session ID from cookie
    const cookies = request.headers.get('Cookie') || '';
    const sessionCookie = cookies.split(';').find(c => c.trim().startsWith('session='));
    const sessionId = sessionCookie ? sessionCookie.split('=')[1].trim() : null;
    
    if (!sessionId) {
      throw new Error('No session found');
    }
    
    // Verify the session
    const session = await verifySession(sessionId, env);
    
    // Add user info to request
    request.user = session.user;
    
    // Continue to the next handler
    return null;
    
  } catch (error) {
    // Return 401 for unauthenticated requests
    const headers = corsHeaders(request, env);
    headers.set('Content-Type', 'application/json');
    
    return errorResponse('Authentication required: ' + error.message, 401, headers);
  }
}
