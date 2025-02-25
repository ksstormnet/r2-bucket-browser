/**
 * R2 Upload API Worker
 * Handles file uploads to R2 bucket with authentication and validation
 */

// Helper to validate file types
function isAllowedFileType(contentType) {
  const allowedTypes = [
    // Images
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp',
    // Documents
    'application/pdf', 'text/plain', 'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    // Archives
    'application/zip', 'application/x-rar-compressed',
    // Other media
    'video/mp4', 'audio/mpeg'
  ];
  
  return allowedTypes.includes(contentType);
}

// Helper to sanitize file names
function sanitizeFileName(filename) {
  // Replace spaces with underscores
  let sanitized = filename.replace(/\s+/g, '_');
  
  // Remove special characters except for alphanumeric, underscore, hyphen, and period
  sanitized = sanitized.replace(/[^\w\-\.]/g, '');
  
  // Ensure filename doesn't start with a period (hidden file)
  if (sanitized.startsWith('.')) {
    sanitized = 'file_' + sanitized;
  }
  
  return sanitized;
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

// Handle upload requests
export async function handleUploadRequests(request, env, headers) {
  // Verify it's a POST request
  if (request.method !== 'POST') {
    return errorResponse('Method not allowed', 405, headers);
  }
  
  try {
    // Check if the request includes multipart form data
    const contentType = request.headers.get('Content-Type') || '';
    
    if (!contentType.includes('multipart/form-data')) {
      return errorResponse('Content-Type must be multipart/form-data', 400, headers);
    }
    
    // Get the form data
    const formData = await request.formData();
    
    // Get the file from the form data
    const file = formData.get('file');
    
    if (!file || !(file instanceof File)) {
      return errorResponse('No file provided', 400, headers);
    }
    
    // Validate file size (limit to 10MB)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      return errorResponse('File size exceeds the limit of 10MB', 400, headers);
    }
    
    // Validate file type
    if (!isAllowedFileType(file.type)) {
      return errorResponse('File type not allowed', 400, headers);
    }
    
    // Get the destination path
    let destPath = formData.get('path') || '';
    if (destPath && !destPath.endsWith('/')) {
      destPath += '/';
    }
    
    // Sanitize filename
    const sanitizedFilename = sanitizeFileName(file.name);
    const fullPath = destPath + sanitizedFilename;
    
    // Handle file with custom metadata
    const customMetadata = {};
    
    // Add original filename as metadata
    customMetadata.originalFilename = file.name;
    
    // Add upload timestamp
    customMetadata.uploadedAt = new Date().toISOString();
    
    // Add user info if available
    if (request.user) {
      customMetadata.uploadedBy = request.user.email;
    }
    
    // Add any custom metadata from the form
    if (formData.has('description')) {
      customMetadata.description = formData.get('description');
    }
    
    if (formData.has('tags')) {
      customMetadata.tags = formData.get('tags');
    }
    
    // Upload the file to R2
    await env.MY_BUCKET.put(fullPath, file, {
      httpMetadata: {
        contentType: file.type,
      },
      customMetadata
    });
    
    // Calculate the public URL
    const publicUrl = `https://${env.PUBLIC_BUCKET_DOMAIN}/${fullPath}`;
    
    // Return success response
    return successResponse({
      success: true,
      path: fullPath,
      size: file.size,
      type: file.type,
      url: publicUrl
    }, headers);
    
  } catch (error) {
    // Handle errors
    return errorResponse(`Upload failed: ${error.message}`, 500, headers);
  }
}
