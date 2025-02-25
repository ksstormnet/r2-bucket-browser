/**
 * R2 Folder Management Worker
 * Handles creating, renaming, and deleting folders in R2
 */

// Get folder structure by listing objects with common prefixes
async function listFolders(env, prefix = '') {
  // Ensure prefix ends with a slash
  if (prefix && !prefix.endsWith('/')) {
    prefix += '/';
  }
  
  const options = {
    prefix: prefix,
    delimiter: '/',  // Use delimiter to get folders as common prefixes
  };
  
  const listed = await env.MY_BUCKET.list(options);
  
  // Process the common prefixes to get folders
  const folders = listed.delimitedPrefixes.map(folderPrefix => {
    // Remove the trailing slash and get the folder name
    const fullPath = folderPrefix;
    const name = folderPrefix.replace(prefix, '').replace('/', '');
    
    return {
      name,
      path: fullPath,
      isFolder: true
    };
  });
  
  // Process objects in the current folder
  const files = listed.objects
    .filter(obj => obj.key !== prefix) // Filter out the folder placeholder
    .map(obj => {
      const name = obj.key.replace(prefix, '');
      
      return {
        name,
        path: obj.key,
        size: obj.size,
        lastModified: obj.uploaded,
        isFolder: false,
        contentType: obj.httpMetadata?.contentType || 'application/octet-stream'
      };
    });
  
  return {
    prefix,
    folders,
    files,
    // Include navigation info
    parentFolder: getParentFolder(prefix)
  };
}

// Get parent folder path
function getParentFolder(path) {
  if (!path || path === '/') {
    return null;
  }
  
  // Remove trailing slash if exists
  const cleanPath = path.endsWith('/') ? path.slice(0, -1) : path;
  
  // Get the last index of slash
  const lastSlashIndex = cleanPath.lastIndexOf('/');
  
  // If no slash found, return empty (root)
  if (lastSlashIndex < 0) {
    return '';
  }
  
  // Return everything up to the last slash
  return cleanPath.substring(0, lastSlashIndex);
}

// Create a new folder
async function createFolder(env, folderPath) {
  // Ensure path ends with a slash
  if (!folderPath.endsWith('/')) {
    folderPath += '/';
  }
  
  // Create an empty object with the folder path to represent the folder
  await env.MY_BUCKET.put(folderPath, new Uint8Array(0), {
    customMetadata: {
      isFolder: 'true',
      createdAt: new Date().toISOString()
    }
  });
  
  return { path: folderPath };
}

// Rename a folder
async function renameFolder(env, oldPath, newPath) {
  // Ensure paths end with a slash
  if (!oldPath.endsWith('/')) oldPath += '/';
  if (!newPath.endsWith('/')) newPath += '/';
  
  // List all objects in the folder
  const options = {
    prefix: oldPath,
  };
  
  const listed = await env.MY_BUCKET.list(options);
  
  // Copy each object to the new path and delete the old one
  for (const obj of listed.objects) {
    const newKey = obj.key.replace(oldPath, newPath);
    
    // Copy the object with its metadata
    const oldObject = await env.MY_BUCKET.get(obj.key);
    
    if (oldObject) {
      await env.MY_BUCKET.put(newKey, oldObject.body, {
        httpMetadata: oldObject.httpMetadata,
        customMetadata: oldObject.customMetadata
      });
      
      // Delete the old object
      await env.MY_BUCKET.delete(obj.key);
    }
  }
  
  return { oldPath, newPath };
}

// Delete a folder and all its contents
async function deleteFolder(env, folderPath) {
  // Ensure path ends with a slash
  if (!folderPath.endsWith('/')) folderPath += '/';
  
  // List all objects in the folder
  const options = {
    prefix: folderPath,
  };
  
  const listed = await env.MY_BUCKET.list(options);
  
  // Delete each object
  for (const obj of listed.objects) {
    await env.MY_BUCKET.delete(obj.key);
  }
  
  return { deleted: true, path: folderPath };
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

// Handle folder requests
export async function handleFolderRequests(request, env, headers) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  try {
    // List folders and files
    if (path === '/api/folders' && request.method === 'GET') {
      const prefix = url.searchParams.get('prefix') || '';
      const result = await listFolders(env, prefix);
      return successResponse(result, headers);
    }
    
    // Create folder
    else if (path === '/api/folders' && request.method === 'POST') {
      const data = await request.json();
      
      if (!data.path) {
        return errorResponse('Path is required', 400, headers);
      }
      
      const result = await createFolder(env, data.path);
      return successResponse(result, headers);
    }
    
    // Rename folder
    else if (path === '/api/folders/rename' && request.method === 'POST') {
      const data = await request.json();
      
      if (!data.oldPath || !data.newPath) {
        return errorResponse('Both oldPath and newPath are required', 400, headers);
      }
      
      const result = await renameFolder(env, data.oldPath, data.newPath);
      return successResponse(result, headers);
    }
    
    // Delete folder
    else if (path.startsWith('/api/folders/') && request.method === 'DELETE') {
      const folderPath = decodeURIComponent(path.substring('/api/folders/'.length));
      
      if (!folderPath) {
        return errorResponse('Path is required', 400, headers);
      }
      
      const result = await deleteFolder(env, folderPath);
      return successResponse(result, headers);
    }
    
    // Route not found
    return errorResponse('Endpoint not found', 404, headers);
  } catch (error) {
    return errorResponse(`Error: ${error.message}`, 500, headers);
  }
}
