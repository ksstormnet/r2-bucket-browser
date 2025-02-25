import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import R2BucketBrowser from './components/R2BucketBrowser';
import Login from './components/Login';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);
  
  // Function to check if user is authenticated
  const checkAuth = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/verify`, {
        method: 'GET',
        credentials: 'include' // Important for sending cookies
      });
      
      const data = await response.json();
      
      if (response.ok && data.authenticated) {
        setIsAuthenticated(true);
        setUser(data.user);
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle successful login
  const handleLoginSuccess = () => {
    checkAuth();
  };
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await fetch(`${process.env.REACT_APP_API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
  
  // Show loading spinner while checking auth status
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Auth callback route */}
          <Route 
            path="/auth/success" 
            element={
              isAuthenticated ? 
                <Navigate to="/" /> : 
                <Login onLoginSuccess={handleLoginSuccess} />
            } 
          />
          
          {/* Main application route */}
          <Route 
            path="/" 
            element={
              isAuthenticated ? (
                <div className="flex flex-col min-h-screen">
                  {user && (
                    <div className="bg-gray-800 text-white py-2 px-4 text-sm flex justify-between items-center">
                      <div className="flex items-center">
                        {user.picture && (
                          <img 
                            src={user.picture} 
                            alt={user.name} 
                            className="h-6 w-6 rounded-full mr-2"
                          />
                        )}
                        <span>{user.name} ({user.email})</span>
                      </div>
                      <button 
                        onClick={handleLogout}
                        className="text-gray-300 hover:text-white"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                  <R2BucketBrowser user={user} />
                </div>
              ) : (
                <Login onLoginSuccess={handleLoginSuccess} />
              )
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
