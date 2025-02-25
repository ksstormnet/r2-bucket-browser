/**
 * API utility functions for making authenticated requests
 */

// Helper for authenticated API calls
export const callApi = async (endpoint, method = 'GET', body = null) => {
  try {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    const options = {
      method,
      headers,
      credentials: 'include' // Important for sending cookies
    };
    
    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${process.env.REACT_APP_API_URL}${endpoint}`, options);
    
    if (!response.ok) {
      // Handle authentication errors
      if (response.status === 401) {
        // Redirect to login page
        window.location.href = '/';
        throw new Error('Authentication required');
      }
      
      const errorData = await response.json();
      throw new Error(errorData.error || 'Request failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
};

// Upload file with progress tracking
export const uploadFile = async (file, path, onProgress) => {
  try {
    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    
    // Add the path if available
    if (path) {
      formData.append('path', path);
    }
    
    // Upload the file - include credentials for authentication
    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Upload failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};
