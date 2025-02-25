# R2 Bucket Browser

A secure web application that provides a beautiful visual interface for browsing, managing, and using files stored in Cloudflare R2 buckets. Built specifically to integrate with Ghost blogs.

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
2. Follow the step-by-step guide in [DEPLOYMENT.md](docs/DEPLOYMENT.md)
3. Deploy the worker and frontend
4. Configure your authentication settings
5. Start managing your R2 bucket with a beautiful interface!

## 🔒 Security Features

- Domain-restricted Google authentication
- HTTP-only cookies for secure sessions
- CORS protection
- Rate limiting
- Content validation

## 🎛️ Configuration Options

| Setting | Description |
|---------|-------------|
| `ALLOWED_ORIGINS` | Domains allowed to access the API |
| `GOOGLE_CLIENT_ID` | Your Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Your Google OAuth client secret |
| `AUTH_DOMAIN` | Email domain to restrict access to (e.g., yourdomain.com) |
| `SESSION_DURATION` | How long sessions remain valid (default: 7 days) |

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed configuration instructions.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

If you encounter any problems or have questions, please open an issue on this repository.

---

Built with ❤️ using Cloudflare Workers and R2
