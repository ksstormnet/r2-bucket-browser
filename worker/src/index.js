/**
 * Main R2 Browser API Worker
 * Integrates with authentication
 */

// Import all worker modules
import { handleAuthRequest, authMiddleware } from './auth.js';
import { handleFolderRequests } from './folder-management.js';
import { handleMetadataRequests } from './metadata-management.js';
import { handleUploadRequests } from './upload.js';
import { handleImageProcessingRequests } from './image-processing.js';

// CORS headers helper
function corsHeaders(request, env) {
  const origin = request.headers.get('Origin');
  const allowedOrigins = env.ALLOWED_ORIGINS.split(',');
  
  const responseHeaders = new Headers({
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders(request, env),
      });
    }
    
    // Set up headers
    const headers = corsHeaders(request, env);
    headers.set('Content-Type', 'application/json');
    
    // Parse URL
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Special case: handle auth requests
    if (path.startsWith('/api/auth/')) {
      return handleAuthRequest(request, env);
    }
    
    // Public paths that don't require authentication
    const publicPaths = [
      '/api/public/health',    // Health check endpoint
    ];
    
    // Check if the path is public
    const isPublicPath = publicPaths.some(publicPath => path.startsWith(publicPath));
    
    if (!isPublicPath) {
      // Apply authentication middleware
      const authResponse = await authMiddleware(request, env);
      
      // If the middleware returned a response, return it
      if (authResponse) {
        return authResponse;
      }
      
      // If we get here, the user is authenticated
      // We can access user info via request.user
    }
    
    // Route requests based on path
    try {
      if (path.startsWith('/api/folders')) {
        return await handleFolderRequests(request, env, headers);
      }
      else if (path.startsWith('/api/metadata') || path === '/api/search') {
        return await handleMetadataRequests(request, env, headers);
      }
      else if (path === '/api/upload') {
        return await handleUploadRequests(request, env, headers);
      }
      else if (path.startsWith('/api/image')) {
        return await handleImageProcessingRequests(request, env, headers);
      }
      else if (path === '/api/public/health') {
        // Simple health check endpoint
        return new Response(JSON.stringify({ status: 'ok' }), { headers });
      }
      // User info endpoint
      else if (path === '/api/user') {
        return new Response(JSON.stringify({
          user: request.user
        }), { headers });
      }
      
      // Route not found
      return errorResponse('Endpoint not found', 404, headers);
    } catch (error) {
      console.error('Error handling request:', error);
      return errorResponse(`Error: ${error.message}`, 500, headers);
    }
  }
};
