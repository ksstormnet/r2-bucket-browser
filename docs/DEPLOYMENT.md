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
git clone https://github.com/yourusername/r2-bucket-browser.git
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

1. **Create a Public Access Worker**
2. **Configure DNS**

## Step 7: Configure and Deploy the Frontend

1. **Configure Environment Variables**
2. **Install Dependencies**
3. **Build the Frontend**
4. **Deploy to Cloudflare Pages**

## Step 8: Test the Deployment

## Step 9: Add to Your Ghost Blog

## Troubleshooting & Maintenance

For detailed instructions on each step, see the full deployment guide in the repository.
