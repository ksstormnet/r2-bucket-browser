/**
 * R2 Image Processing Worker
 * 
 * This worker handles dynamic image transformations using Cloudflare's 
 * image processing capabilities
 */

// Helper to parse transformation parameters from URL path
function parseTransformations(path) {
  // Expected format: /image/width=300,height=200,fit=cover/image.jpg
  const parts = path.split('/');
  
  // Path should have at least 3 parts: "", "image", "transformations", "image-path"
  if (parts.length < 4 || parts[1] !== 'image') {
    return { valid: false };
  }
  
  // Parse transformation string (e.g., "width=300,height=200,fit=cover")
  const transformStr = parts[2];
  const transformPairs = transformStr.split(',');
  const transforms = {};
  
  transformPairs.forEach(pair => {
    const [key, value] = pair.split('=');
    if (key && value) {
      // Convert numeric values
      transforms[key] = /^\d+$/.test(value) ? parseInt(value, 10) : value;
    }
  });
  
  // Reconstruct the image path (everything after the transformations)
  const imagePath = parts.slice(3).join('/');
  
  return { 
    valid: true,
    transforms,
    imagePath
  };
}

// Error response helper
function errorResponse(message, status, headers) {
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers }
  );
}

// Handle image processing requests
export async function handleImageProcessingRequests(request, env, headers) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // Parse the path to extract transformation parameters
  const { valid, transforms, imagePath } = parseTransformations(path);
  
  if (!valid) {
    return errorResponse('Invalid image transformation request', 400, headers);
  }
  
  try {
    // Fetch the original image from R2
    const image = await env.MY_BUCKET.get(imagePath);
    
    if (image === null) {
      return errorResponse('Image not found', 404, headers);
    }
    
    // Extract transformation parameters
    const options = {
      width: transforms.width,
      height: transforms.height
    };
    
    // Handle fit parameter
    if (transforms.fit) {
      switch (transforms.fit) {
        case 'cover':
          options.fit = 'cover';
          break;
        case 'contain':
          options.fit = 'contain';
          break;
        case 'fill':
          options.fit = 'fill';
          break;
        default:
          options.fit = 'scale-down';
      }
    }
    
    // Set quality (optional, defaults to 85)
    if (transforms.quality && transforms.quality >= 1 && transforms.quality <= 100) {
      options.quality = transforms.quality;
    }
    
    // Apply format conversion if specified
    if (transforms.format && ['webp', 'jpeg', 'png', 'gif'].includes(transforms.format)) {
      options.format = transforms.format;
    } else {
      // Try to use WebP by default for browsers that support it
      options.format = 'auto';
    }
    
    // Process the image using Cloudflare's Image Resizing
    const response = await fetch(request.url, {
      cf: {
        image: options
      }
    });
    
    // Set cache headers
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('Cache-Control', 'public, max-age=31536000'); // Cache for a year
    
    // Return the transformed image
    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders
    });
    
  } catch (error) {
    return errorResponse(`Error processing image: ${error.message}`, 500, headers);
  }
}
