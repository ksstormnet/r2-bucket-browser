# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2025-02-25

### Changed
- Improved .gitignore file
  - Consolidated and removed redundant patterns
  - Enhanced environment file exclusions while preserving sample files
  - Better organized structure with clear categorization
  - Added comprehensive coverage for build artifacts and dependencies

## [1.1.0] - 2024-01-09

### Added
- Configurable authentication domain restrictions via environment variables
  - Worker: `AUTH_DOMAIN` variable for specifying allowed email domains
  - Frontend: `REACT_APP_AUTH_DOMAIN` variable for displaying allowed domain
- Environment configuration templates
  - Added `worker/.env.sample`
  - Added `frontend/.env.development.sample`
  - Added `frontend/.env.production.sample`
- Enhanced security through strict domain validation in authentication flow

### Changed
- Updated frontend Login component to display the allowed authentication domain
- Improved authentication error handling with domain-specific messages
- Environment variable configuration
  - Separated development and production configurations
  - Moved sensitive values to environment variables
  - Added validation for required environment variables

### Documentation
- Added comprehensive deployment guide for authentication setup
- Enhanced README.md with:
  - Authentication domain configuration instructions
  - Updated security features section
  - Expanded configuration options documentation
  - Clear links to deployment documentation
- Added environment variable documentation for both worker and frontend
- Improved quick start guide with authentication setup steps

[1.1.0]: https://github.com/ksstormnet/r2-bucket-browser/releases/tag/v1.1.0
[1.2.0]: https://github.com/ksstormnet/r2-bucket-browser/releases/tag/v1.2.0


