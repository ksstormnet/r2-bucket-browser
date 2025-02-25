import React, { useEffect, useState } from 'react';

const AUTH_DOMAIN = process.env.REACT_APP_AUTH_DOMAIN;

const Login = ({ onLoginSuccess }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Check if user is already logged in
  useEffect(() => {
    checkSession();
  }, []);
  
  // Handle URL parameters on auth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const session = urlParams.get('session');
    
    if (session) {
      // Clear URL parameters without refreshing page
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Notify parent component about successful login
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    }
  }, [onLoginSuccess]);
  
  // Check if session exists and is valid
  const checkSession = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/verify`, {
        method: 'GET',
        credentials: 'include' // Important for sending cookies
      });
      
      const data = await response.json();
      
      if (response.ok && data.authenticated) {
        // User is already logged in
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      }
    } catch (err) {
      console.error('Error checking session:', err);
      setError('Failed to verify authentication status');
    } finally {
      setLoading(false);
    }
  };
  
  // Start Google Auth flow
  const handleGoogleLogin = () => {
    window.location.href = `${process.env.REACT_APP_API_URL}/api/auth/login`;
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            R2 Bucket Browser
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please sign in with your Google account
          </p>
        </div>
        
        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {error && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
                <p>{error}</p>
              </div>
            )}
            
            <button
              onClick={handleGoogleLogin}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <svg className="h-5 w-5 text-blue-500 group-hover:text-blue-400" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
                </svg>
              </span>
              Sign in with Google
            </button>
            
            <div className="text-center mt-4">
              <p className="text-sm text-gray-600">
                Only <span className="font-medium">@{AUTH_DOMAIN}</span> accounts are allowed to sign in
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
