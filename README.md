# R2 Bucket Browser

A secure web application that provides a beautiful visual interface for browsing, managing, and using files stored in Cloudflare R2 buckets. Built specifically to integrate with Ghost blogs.

## 📝 Changelog

Stay up to date with the latest improvements and updates! We maintain a detailed changelog that documents all notable changes, including new features, improvements, and bug fixes.

Check out our [CHANGELOG.md](CHANGELOG.md) file for the full history of changes.

## 🌟 Features

- **Google Authentication**: Secure access restricted to users with your domain email accounts
- **Visual File Browser**: Browse files and folders with a responsive, user-friendly interface
- **Image Processing**: Resize, crop, and optimize images on-the-fly
- **Metadata Management**: Add, edit, and search file metadata including tags and descriptions
- **Folder Management**: Create, rename, and organize folders
- **File Upload**: Drag-and-drop file uploads with progress indication
- **Direct Ghost Blog Integration**: Easily copy image URLs for use in your Ghost blog

## 🔧 Technologies

- **Backend**: Cloudflare Workers with R2 storage
- **Frontend**: React with Tailwind CSS
- **Authentication**: Google OAuth 2.0 with domain restriction
- **Storage**: Cloudflare R2 and KV for sessions

## 📁 Repository Structure

```
r2-bucket-browser/
├── worker/                  # Cloudflare Worker backend
│   ├── src/                 # Worker source code
│   │   ├── index.js         # Main entry point
│   │   ├── auth.js          # Authentication
│   │   └── ...              # Feature implementations
│   └── wrangler.toml        # Worker configuration
├── frontend/                # React frontend
│   ├── src/                 # Frontend source code
│   │   ├── components/      # React components
│   │   ├── utils/           # Utility functions
│   │   └── ...              # Application files
│   └── public/              # Static assets
└── docs/                    # Documentation
    ├── DEPLOYMENT.md        # Deployment instructions
    └── images/              # Documentation images
```

## ✅ Prerequisites

- Cloudflare account with Workers and R2 enabled
- Google Workspace account with admin access (for OAuth setup)
- Node.js and npm installed
- A Ghost blog (for integration)

## 🚀 Quick Start

1. Clone this repository
2. Follow the step-by-step guide in [Deployment Guide](docs/DEPLOYMENT.md) for detailed setup instructions, including authentication domain configuration
3. Deploy the worker and frontend
4. Set up your authentication domain in both worker and frontend environments
5. Configure your other authentication settings
6. Set up public access to your R2 bucket:
   - Create and deploy a public access worker
   - Configure DNS for your public access URL
   - Set up CORS settings for public bucket access
7. Start managing your R2 bucket with the browser interface:
   - Upload, organize, and manage files and folders
   - Use the image processing features for resizing and optimization
   - Access public links to your assets
8. Integrate with your Ghost blog:
   - Add image upload integration to your Ghost site
   - Configure Ghost to use your R2 bucket for media storage
   - Add the R2 Browser to your Ghost navigation

## 🔒 Security Features

- Domain-restricted Google authentication (limit access to specific email domains like @yourdomain.com)
- HTTP-only cookies for secure sessions
- CORS protection
- Rate limiting
- Content validation

## 🎛️ Configuration Options

### Worker Environment Variables

| Setting | Required | Description |
|---------|----------|-------------|
| `AUTH_DOMAIN` | Yes | Email domain to restrict access to (e.g., yourdomain.com). Only users with email addresses from this domain will be allowed to authenticate |
| `GOOGLE_CLIENT_ID` | Yes | Your Google OAuth client ID for authentication |
| `GOOGLE_CLIENT_SECRET` | Yes | Your Google OAuth client secret for authentication |
| `REDIRECT_URI` | Yes | OAuth callback URL (e.g., https://api.yourdomain.com/oauth/callback) |
| `ALLOWED_ORIGINS` | Yes | Comma-separated list of domains allowed to access the API (CORS) |
| `FRONTEND_URL` | Yes | URL of your frontend application for redirects |
| `SESSION_DURATION` | No | How long sessions remain valid (default: 7 days) |

### Frontend Environment Variables

| Setting | Required | Description |
|---------|----------|-------------|
| `REACT_APP_API_URL` | Yes | URL of the Worker API (e.g., https://api.yourdomain.com) |
| `REACT_APP_PUBLIC_URL` | Yes | Public URL where the frontend is hosted |
| `REACT_APP_AUTH_DOMAIN` | Yes | Must match the Worker's AUTH_DOMAIN setting |

### Environment Files

- Worker:
  - `.env` - Production environment
  - `.env.sample` - Template with example values
- Frontend:
  - `.env.development` - Development environment
  - `.env.production` - Production environment
  - `.env.development.sample` - Development template
  - `.env.production.sample` - Production template

See the [Complete Deployment and Configuration Guide](docs/DEPLOYMENT.md) for detailed setup instructions.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

If you encounter any problems or have questions, please open an issue on this repository.

---

Built with ❤️ using Cloudflare Workers and R2
