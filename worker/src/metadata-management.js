/**
 * R2 Metadata Management Worker
 * Handles retrieving, updating, and searching object metadata
 */

// Get object metadata
async function getObjectMetadata(env, key) {
  // Get the object and its metadata
  const object = await env.MY_BUCKET.head(key);
  
  if (!object) {
    throw new Error('Object not found');
  }
  
  // Extract and return metadata
  return {
    key,
    size: object.size,
    uploaded: object.uploaded,
    httpMetadata: object.httpMetadata || {},
    customMetadata: object.customMetadata || {}
  };
}

// Update object metadata
async function updateObjectMetadata(env, key, newMetadata) {
  // Get the current object
  const object = await env.MY_BUCKET.get(key);
  
  if (!object) {
    throw new Error('Object not found');
  }
  
  // Prepare the metadata
  const httpMetadata = {
    ...object.httpMetadata,
    ...newMetadata.httpMetadata
  };
  
  const customMetadata = {
    ...object.customMetadata,
    ...newMetadata.customMetadata
  };
  
  // Update the object with the same content but new metadata
  await env.MY_BUCKET.put(key, object.body, {
    httpMetadata,
    customMetadata
  });
  
  // Return the updated metadata
  return {
    key,
    httpMetadata,
    customMetadata
  };
}

// Search objects by metadata
async function searchObjectsByMetadata(env, searchParams) {
  const { tags, description, type, dateFrom, dateTo, prefix } = searchParams;
  
  // List objects, potentially with a prefix
  const options = {};
  if (prefix) {
    options.prefix = prefix;
  }
  
  const listed = await env.MY_BUCKET.list(options);
  
  // Filter objects based on search criteria
  const matchingObjects = [];
  
  for (const obj of listed.objects) {
    // Skip folder placeholders (empty objects with trailing slash)
    if (obj.key.endsWith('/') && obj.size === 0) {
      continue;
    }
    
    // Get object metadata
    const object = await env.MY_BUCKET.head(obj.key);
    const metadata = object.customMetadata || {};
    
    // Check if object matches search criteria
    let matches = true;
    
    // Filter by tags
    if (tags && tags.length > 0) {
      const objectTags = metadata.tags ? metadata.tags.split(',').map(t => t.trim().toLowerCase()) : [];
      const searchTags = tags.split(',').map(t => t.trim().toLowerCase());
      
      // Check if any of the search tags are present in the object tags
      if (!searchTags.some(tag => objectTags.includes(tag))) {
        matches = false;
      }
    }
    
    // Filter by description
    if (description && matches) {
      const objectDesc = (metadata.description || '').toLowerCase();
      if (!objectDesc.includes(description.toLowerCase())) {
        matches = false;
      }
    }
    
    // Filter by content type
    if (type && matches) {
      const contentType = (object.httpMetadata?.contentType || '').toLowerCase();
      if (!contentType.includes(type.toLowerCase())) {
        matches = false;
      }
    }
    
    // Filter by date range
    if ((dateFrom || dateTo) && matches) {
      const uploadDate = new Date(object.uploaded).getTime();
      
      if (dateFrom) {
        const fromDate = new Date(dateFrom).getTime();
        if (uploadDate < fromDate) {
          matches = false;
        }
      }
      
      if (dateTo && matches) {
        const toDate = new Date(dateTo).getTime();
        if (uploadDate > toDate) {
          matches = false;
        }
      }
    }
    
    // Add matching object to results
    if (matches) {
      matchingObjects.push({
        key: obj.key,
        size: obj.size,
        uploaded: object.uploaded,
        contentType: object.httpMetadata?.contentType,
        metadata
      });
    }
  }
  
  return matchingObjects;
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

// Handle metadata requests
export async function handleMetadataRequests(request, env, headers) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  try {
    // Get object metadata
    if (path.startsWith('/api/metadata/') && request.method === 'GET') {
      const objectKey = decodeURIComponent(path.substring('/api/metadata/'.length));
      
      if (!objectKey) {
        return errorResponse('Object key is required', 400, headers);
      }
      
      const metadata = await getObjectMetadata(env, objectKey);
      return successResponse(metadata, headers);
    }
    
    // Update object metadata
    else if (path.startsWith('/api/metadata/') && request.method === 'PUT') {
      const objectKey = decodeURIComponent(path.substring('/api/metadata/'.length));
      
      if (!objectKey) {
        return errorResponse('Object key is required', 400, headers);
      }
      
      const data = await request.json();
      
      if (!data || (!data.httpMetadata && !data.customMetadata)) {
        return errorResponse('Metadata is required', 400, headers);
      }
      
      const updatedMetadata = await updateObjectMetadata(env, objectKey, data);
      return successResponse(updatedMetadata, headers);
    }
    
    // Search objects by metadata
    else if (path === '/api/search' && request.method === 'GET') {
      const searchParams = {
        tags: url.searchParams.get('tags'),
        description: url.searchParams.get('description'),
        type: url.searchParams.get('type'),
        dateFrom: url.searchParams.get('dateFrom'),
        dateTo: url.searchParams.get('dateTo'),
        prefix: url.searchParams.get('prefix')
      };
      
      const searchResults = await searchObjectsByMetadata(env, searchParams);
      return successResponse({
        count: searchResults.length,
        results: searchResults
      }, headers);
    }
    
    // Route not found
    return errorResponse('Endpoint not found', 404, headers);
  } catch (error) {
    return errorResponse(`Error: ${error.message}`, 500, headers);
  }
}
