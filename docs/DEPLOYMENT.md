# Deployment Guide

This guide provides step-by-step instructions for deploying the R2 Bucket Browser application.

## Prerequisites

Before you begin, ensure you have:

- A Cloudflare account with Workers and R2 enabled
- A Google Workspace account with admin access
- Node.js (v16 or newer) and npm installed
- Wrangler CLI installed (`npm install -g wrangler`)
- A domain name managed by Cloudflare (for custom domains)
- Git installed

## Step 1: Clone the Repository

```bash
git clone https://github.com/ksstormnet/r2-bucket-browser.git
cd r2-bucket-browser
```

## Step 2: Set Up Cloudflare R2 Bucket

1. **Create an R2 Bucket**:
   - Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Navigate to R2
   - Click "Create bucket"
   - Name your bucket (e.g., "ghost-blog-assets")
   - Click "Create bucket"

2. **Create R2 API Tokens**:
   - In the R2 section, click "Manage R2 API Tokens"
   - Click "Create API token"
   - Select "Admin Read & Write" permissions
   - Note down your Access Key ID and Secret Access Key

## Step 3: Set Up KV Namespaces

1. **Create KV Namespaces**:
   - In the Cloudflare Dashboard, go to "Workers & Pages"
   - Select "KV" from the sidebar
   - Create two namespaces:
     - `AUTH_SESSIONS` (for storing user sessions)
     - `AUTH_STATES` (for OAuth state parameters)
   - Note down both namespace IDs

## Step 4: Configure Google OAuth

1. **Create a Google Cloud Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Click "Select a project" > "New Project"
   - Name your project (e.g., "R2 Browser Auth")
   - Click "Create"

2. **Configure OAuth Consent Screen**:
   - Go to "APIs & Services" > "OAuth consent screen"
   - Select "Internal" as User Type
   - Fill in required information:
     - App name: "R2 Bucket Browser"
     - User support email: Your email
     - Developer contact information: Your email
   - Add scopes: `openid`, `email`, `profile`
   - Click "Save and Continue" and complete the setup

3. **Create OAuth Credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Application type: "Web application"
   - Name: "R2 Bucket Browser Web Client"
   - Add Authorized JavaScript origins:
     - Your frontend URL (e.g., `https://r2-browser.yourdomain.com`)
     - `http://localhost:3000` (for development)
   - Add Authorized redirect URIs:
     - `https://r2-browser-api.yourdomain.workers.dev/api/auth/callback`
     - `http://localhost:8787/api/auth/callback` (for development)
   - Click "Create"
   - Note down the Client ID and Client Secret

4. **Configure Authorization Domain**:
   - The application restricts access to users from specific email domains
   - Set up the authorization domain in both worker and frontend environments:

   a) **Worker Environment**:
      ```bash
      # In worker/.env
      AUTH_DOMAIN=yourdomain.com
      ```
      For development:
      ```bash
      # In worker/.env.development
      AUTH_DOMAIN=yourdomain.com
      ```

   b) **Frontend Environment**:
      ```bash
      # In frontend/.env.production
      REACT_APP_AUTH_DOMAIN=yourdomain.com
      ```
      For development:
      ```bash
      # In frontend/.env.development
      REACT_APP_AUTH_DOMAIN=yourdomain.com
      ```

   Important notes:
   - The AUTH_DOMAIN value in the worker and REACT_APP_AUTH_DOMAIN in the frontend must match exactly
   - This domain should be the email domain of your organization (e.g., if users log in with @company.com emails, use "company.com")
   - For development, you might use a different domain than production, but ensure it matches between worker and frontend
   - Example:
     * Development: "dev-company.com" (for testing with @dev-company.com emails)
     * Production: "company.com" (for actual users with @company.com emails)

5. **Enable Google People API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google People API"
   - Select it and click "Enable"

## Step 5: Configure and Deploy the Worker

1. **Configure the Worker**:
   - Navigate to the worker directory
   - Update `wrangler.toml` with your information:
     - Account ID
     - R2 bucket name
     - KV namespace IDs
     - Environment variables

2. **Add Secret Environment Variables**:
   ```bash
   wrangler secret put GOOGLE_CLIENT_SECRET
   # When prompted, paste your Google Client Secret
   ```

3. **Install Dependencies**:
   ```bash
   npm install
   ```

4. **Deploy the Worker**:
   ```bash
   wrangler deploy
   ```

5. **Note Your Worker URL**

## Step 6: Set Up Public Access to Your R2 Bucket

1. **Create a Public Access Worker**:
   - In the Cloudflare Dashboard, go to "Workers & Pages"
   - Click "Create application" > "Create Worker"
   - Name your worker (e.g., "r2-public-access")
   - In the worker code editor, paste the following code:
     ```js
     export default {
       async fetch(request, env) {
         const url = new URL(request.url);
         const path = url.pathname.slice(1);
         
         if (!path) {
           return new Response("Not Found", { status: 404 });
         }
         
         // Get object from R2
         const object = await env.BUCKET.get(path);
         
         if (!object) {
           return new Response("Not Found", { status: 404 });
         }
         
         // Set appropriate content-type header based on file extension
         const contentType = object.httpMetadata?.contentType || 
           getContentTypeFromPath(path) || 
           "application/octet-stream";
         
         const headers = new Headers();
         headers.set("content-type", contentType);
         headers.set("cache-control", "public, max-age=86400");
         headers.set("access-control-allow-origin", "*");
         
         return new Response(object.body, {
           headers
         });
       }
     };
     
     function getContentTypeFromPath(path) {
       const extension = path.split('.').pop().toLowerCase();
       const contentTypes = {
         'jpg': 'image/jpeg',
         'jpeg': 'image/jpeg',
         'png': 'image/png',
         'gif': 'image/gif',
         'svg': 'image/svg+xml',
         'webp': 'image/webp',
         'pdf': 'application/pdf',
         'mp4': 'video/mp4',
         'webm': 'video/webm',
         'mp3': 'audio/mpeg',
         'txt': 'text/plain',
         'html': 'text/html',
         'css': 'text/css',
         'js': 'application/javascript',
         'json': 'application/json',
         'xml': 'application/xml',
         'zip': 'application/zip'
       };
       
       return contentTypes[extension];
     }
     ```
   - Click "Save and Deploy"
   - Go to "Settings" > "Variables" > "R2 Bucket Bindings"
   - Add a binding with Name: `BUCKET` and select your R2 bucket
   - Click "Save and deploy"

2. **Configure DNS**:
   - In the Cloudflare Dashboard, go to DNS settings for your domain
   - Add a new DNS record:
     - Type: CNAME
     - Name: assets (or your preferred subdomain)
     - Target: your-worker-name.your-account.workers.dev
     - Proxy status: Proxied
   - Click "Save"
   - Your public R2 access URL will be: `https://assets.yourdomain.com`
   - Note this URL for the next steps

## Step 7: Configure and Deploy the Frontend

1. **Configure Environment Variables**:
   - Navigate to the frontend directory
   - Create or edit `.env.production`:
     ```bash
     # In frontend/.env.production
     REACT_APP_API_URL=https://your-worker-url.workers.dev
     REACT_APP_AUTH_DOMAIN=yourdomain.com
     REACT_APP_PUBLIC_URL=https://assets.yourdomain.com
     REACT_APP_APP_URL=https://r2-browser.yourdomain.com
     ```
   - Replace placeholders with your actual values:
     - `your-worker-url.workers.dev`: The worker URL from Step 5
     - `yourdomain.com`: Your organization's email domain
     - `assets.yourdomain.com`: The public R2 access URL from Step 6
     - `r2-browser.yourdomain.com`: The URL where your frontend will be hosted

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Build the Frontend**:
   ```bash
   npm run build
   ```
   This will create a production build in the `build` directory.

4. **Deploy to Cloudflare Pages**:
   - In the Cloudflare Dashboard, go to "Workers & Pages"
   - Click "Create application" > "Pages" > "Connect to Git"
   - Connect to your GitHub repository
   - Configure your build settings:
     - Build command: `npm run build`
     - Build output directory: `build`
     - Root directory: `/frontend` (if your frontend is in a subdirectory)
   - Add environment variables:
     - `REACT_APP_API_URL`: Your worker URL
     - `REACT_APP_AUTH_DOMAIN`: Your organization's email domain
     - `REACT_APP_PUBLIC_URL`: Your public R2 access URL
     - `REACT_APP_APP_URL`: Your frontend URL
   - Click "Save and Deploy"
   - Once deployed, note the Pages URL, or set up a custom domain:
     - Go to "Custom domains"
     - Click "Set up a custom domain"
     - Enter your domain (e.g., r2-browser.yourdomain.com)
     - Follow the prompts to verify and configure the domain

## Step 8: Test the Deployment

1. **Test Authentication**:
   - Navigate to your frontend URL (e.g., `https://r2-browser.yourdomain.com`)
   - Click the "Login" button
   - You should be redirected to the Google OAuth consent screen
   - Log in with an email that matches your authorized domain
   - You should be redirected back to the application

2. **Test File Operations**:
   - Upload a file by dragging and dropping or using the upload button
   - Create a new folder
   - Navigate through folder structure
   - Download a file
   - Delete a file (if permission is granted)
   - View file details and copy public URL

3. **Test Public Access**:
   - Copy a public URL for an uploaded file
   - Open the URL in a new browser window or tab
   - The file should be accessible without authentication

## Step 9: Add to Your Ghost Blog

1. **Configure Ghost Blog to Use R2 for Media Storage**:
   - Log in to your Ghost admin panel
   - Go to "Settings" > "Code injection"
   - In the "Site Header" section, add the following code:
     ```html
     <script>
     (function() {
       // Listen for file uploads in the Ghost editor
       document.addEventListener('upload-start', function(event) {
         const fileUploadUrl = 'https://your-worker-url.workers.dev/api/upload';
         
         // Override the default upload URL
         event.detail.uploader.options.url = fileUploadUrl;
         
         // Add custom headers or params if needed
         event.detail.uploader.options.headers = {
           'Authorization': 'Bearer your-api-token' // If you implemented token auth
         };
       });
       
       // Update image URLs if needed
       document.addEventListener('upload-success', function(event) {
         const response = event.detail.response;
         if (response && response.url) {
           // If your API returns a different URL format, transform it here
           event.detail.response.url = response.url.replace(
             'https://your-worker-url.workers.dev',
             'https://assets.yourdomain.com'
           );
         }
       });
     })();
     </script>
     ```
   - Replace placeholders with your actual URLs
   - Click "Save"

2. **Use the R2 Browser for Media Management**:
   - Add a link to your Ghost blog's navigation menu:
     - Go to "Settings" > "Navigation"
     - Add a new item:
       - Label: "Media Manager"
       - URL: `https://r2-browser.yourdomain.com`
     - Click "Save"
   - When you need to manage media files, click the link to open the R2 Bucket Browser

## Troubleshooting & Maintenance

### Authentication Issues

1. **OAuth Redirect Errors**:
   - Verify that your redirect URIs in Google Cloud Console match exactly with your worker's callback URL
   - Check for any typos or missing parts in URLs
   - Ensure your worker's domain is included in the authorized JavaScript origins

2. **Domain Restrictions Not Working**:
   - Verify that `AUTH_DOMAIN` in worker and `REACT_APP_AUTH_DOMAIN` in frontend match
   - Check if the user's email domain exactly matches the configured domain
   - Review logs for any authentication errors

### File Access Issues

1. **Cannot Access Files**:
   - Check R2 bucket permissions
   - Verify that your R2 API tokens have the correct permissions
   - Check if the public access worker is properly configured

2. **Slow File Access**:
   - Consider adding caching headers to your public access worker
   - Check if your site is being proxied through Cloudflare
   - Consider using Cloudflare Cache Rules to optimize delivery

### Deployment Issues

1. **Worker Deployment Fails**:
   - Run `wrangler dev` locally to debug issues before deployment
   - Check for any syntax errors in your worker code
   - Verify that KV namespaces are correctly bound

2. **Frontend Build Errors**:
   - Check your Node.js version (v16+ recommended)
   - Verify that all dependencies are installed
   - Check for any environment variables that might be missing

### Maintenance Tasks

1. **Regular Backups**:
   - Set up regular backups of your R2 bucket
   - Consider using Cloudflare R2 versioning (if available)
   - Use Cloudflare Worker Cron triggers for automated maintenance tasks

2. **Security Updates**:
   - Regularly update dependencies with `npm update`
   - Rotate R2 API tokens periodically
   - Review logs for any suspicious activity

3. **Monitoring**:
   - Set up monitoring with Cloudflare Analytics
   - Create custom dashboards for worker performance
   - Set up alerts for unusual patterns or errors

For additional support or questions, refer to the project repository or open an issue on GitHub.
