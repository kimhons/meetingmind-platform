# MeetingMind Installation Packages Summary

## Overview

MeetingMind provides comprehensive installation packages for all major operating systems, ensuring seamless deployment across Windows, macOS, and Unix/Linux environments. Each package includes automated dependency management, configuration setup, and system integration.

## Available Installation Methods

### 1. Platform-Specific Native Installers

#### Windows Installation Package
- **File**: `install/windows/install-meetingmind.bat`
- **Requirements**: Windows 10/11, Administrator privileges
- **Features**:
  - Automated Node.js and Git installation
  - Windows Service integration
  - Registry entries for Add/Remove Programs
  - Desktop and Start Menu shortcuts
  - Windows Firewall configuration
  - Automatic uninstaller creation

**Installation Command**:
```cmd
curl -O https://raw.githubusercontent.com/kimhons/meetingmind-platform/main/install/windows/install-meetingmind.bat
# Right-click and "Run as administrator"
```

#### macOS Installation Package
- **File**: `install/macos/install-meetingmind.sh`
- **Requirements**: macOS 10.15+, Homebrew (auto-installed)
- **Features**:
  - Homebrew integration for dependency management
  - macOS Application Bundle (.app) creation
  - LaunchAgent for auto-start capability
  - Proper macOS permissions and security
  - Native uninstaller

**Installation Command**:
```bash
curl -fsSL https://raw.githubusercontent.com/kimhons/meetingmind-platform/main/install/macos/install-meetingmind.sh | bash
```

#### Unix/Linux Installation Package
- **File**: `install/unix/install-meetingmind.sh`
- **Requirements**: Ubuntu 18.04+, CentOS 7+, Debian 9+, Fedora 30+
- **Features**:
  - Multi-distribution support (apt, yum, dnf, pacman)
  - systemd service integration
  - System user and group creation
  - Log rotation configuration
  - Firewall configuration (ufw/firewalld)
  - Security hardening

**Installation Command**:
```bash
curl -fsSL https://raw.githubusercontent.com/kimhons/meetingmind-platform/main/install/unix/install-meetingmind.sh | sudo bash
```

### 2. Container-Based Deployment

#### Docker Installation
- **File**: `Dockerfile` (multi-stage optimized build)
- **Features**:
  - Alpine Linux base for minimal footprint
  - Multi-stage build for optimization
  - Non-root user for security
  - Health checks included
  - Production-ready configuration

**Docker Commands**:
```bash
# Build and run
docker build -t meetingmind:latest .
docker run -p 3000:3000 --env-file .env meetingmind:latest

# Or use npm scripts
npm run docker:build
npm run docker:run
```

#### Docker Compose Deployment
- **File**: `docker-compose.yml`
- **Features**:
  - Multi-service orchestration
  - Redis integration for caching
  - Nginx reverse proxy
  - Volume management for persistence
  - Network isolation
  - Health monitoring

**Docker Compose Commands**:
```bash
# Start all services
docker-compose up -d

# Or use npm scripts
npm run docker:compose
npm run docker:stop
```

### 3. Cloud Platform Deployment

#### Railway Deployment
- **Configuration**: `railway.json`, `nixpacks.toml`
- **Features**:
  - One-click deployment
  - Automatic scaling
  - Environment variable management
  - Built-in monitoring

**Railway Command**:
```bash
npm run deploy:railway
```

#### Vercel Deployment
- **Configuration**: `vercel.json`
- **Features**:
  - Serverless deployment
  - Global CDN
  - Automatic HTTPS
  - Preview deployments

**Vercel Command**:
```bash
npm run deploy:vercel
```

## Installation Directory Structure

### Windows
```
%ProgramFiles%\MeetingMind\          # Application files
%APPDATA%\MeetingMind\               # User configuration
%APPDATA%\MeetingMind\.env           # Environment configuration
```

### macOS
```
/Applications/MeetingMind/           # Application files
~/Library/Application Support/MeetingMind/  # User data
~/Library/Logs/MeetingMind/          # Log files
/Applications/MeetingMind.app/       # macOS app bundle
```

### Linux/Unix
```
/opt/meetingmind/                    # Application files
/etc/meetingmind/                    # System configuration
/var/lib/meetingmind/                # Application data
/var/log/meetingmind/                # Log files
/etc/systemd/system/meetingmind.service  # Service definition
```

## Package Features Comparison

| Feature | Windows | macOS | Linux | Docker |
|---------|---------|-------|-------|--------|
| **Automated Installation** | ✅ | ✅ | ✅ | ✅ |
| **Dependency Management** | ✅ | ✅ | ✅ | ✅ |
| **Service Integration** | ✅ | ✅ | ✅ | ✅ |
| **Auto-start Capability** | ✅ | ✅ | ✅ | ✅ |
| **Security Hardening** | ✅ | ✅ | ✅ | ✅ |
| **Firewall Configuration** | ✅ | ❌ | ✅ | ❌ |
| **GUI Integration** | ✅ | ✅ | ❌ | ❌ |
| **Uninstaller** | ✅ | ✅ | ✅ | ✅ |
| **Log Rotation** | ❌ | ❌ | ✅ | ✅ |
| **Container Isolation** | ❌ | ❌ | ❌ | ✅ |

## Configuration Management

### Environment Variables
All packages create appropriate configuration files:

```env
# Core Configuration
AIMLAPI_API_KEY=your_aimlapi_key_here
AI_MONTHLY_BUDGET=5000
PORT=3000
NODE_ENV=production

# Security
SESSION_SECRET=your_session_secret_here
JWT_SECRET=your_jwt_secret_here

# Database
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Meeting Platforms
ZOOM_CLIENT_ID=your_zoom_client_id_here
TEAMS_CLIENT_ID=your_teams_client_id_here
```

### Platform-Specific Settings
Each installer configures platform-appropriate settings:
- **Windows**: Registry entries, Windows Services
- **macOS**: LaunchAgents, Application Bundles
- **Linux**: systemd services, user/group management
- **Docker**: Container environment, health checks

## Service Management

### Starting MeetingMind

#### Windows
```cmd
# Desktop shortcut or Start Menu
# Or command line:
"%ProgramFiles%\MeetingMind\start-meetingmind.bat"
```

#### macOS
```bash
# Applications folder or:
/Applications/MeetingMind/start-meetingmind.sh

# Auto-start:
launchctl load ~/Library/LaunchAgents/com.meetingmind.app.plist
```

#### Linux
```bash
# systemd service:
sudo systemctl start meetingmind
sudo systemctl enable meetingmind  # Auto-start

# Direct:
/opt/meetingmind/start-meetingmind.sh
```

#### Docker
```bash
# Docker Compose:
docker-compose up -d

# Direct Docker:
docker run -d -p 3000:3000 --env-file .env meetingmind:latest
```

## Monitoring and Logs

### Log Locations

| Platform | Log Location |
|----------|--------------|
| **Windows** | `%APPDATA%\MeetingMind\logs\` |
| **macOS** | `~/Library/Logs/MeetingMind/` |
| **Linux** | `/var/log/meetingmind/` or `journalctl -u meetingmind` |
| **Docker** | `docker logs meetingmind-app` |

### Health Monitoring
All packages include health check endpoints:
- **Health Check**: `http://localhost:3000/health`
- **AI Status**: `http://localhost:3000/api/ai/status`
- **System Test**: `http://localhost:3000/api/test/all`

## Security Considerations

### Network Security
- **Firewall Rules**: Automatically configured where supported
- **Port Management**: Only necessary ports exposed (3000)
- **HTTPS Support**: Available with SSL certificate configuration

### Application Security
- **Non-root Execution**: All packages run with limited privileges
- **Input Sanitization**: Built-in security measures
- **API Key Protection**: Secure configuration file permissions

### System Integration
- **Service Isolation**: Proper user/group separation
- **Resource Limits**: Configured where supported
- **Auto-restart**: Service recovery on failure

## Troubleshooting

### Common Installation Issues

#### Permission Errors
```bash
# Windows: Run as Administrator
# macOS/Linux: Check file permissions
chmod +x install-meetingmind.sh
```

#### Port Conflicts
```env
# Change port in configuration
PORT=3001
```

#### Dependency Issues
```bash
# Manual dependency installation
# Windows: Install Node.js manually
# macOS: brew install node
# Linux: Package manager install
```

### Verification Commands

#### Test Installation
```bash
# All platforms
curl http://localhost:3000/health

# Or use npm script
npm run health
```

#### Test AI Integration
```bash
# Test AIMLAPI connectivity
npm run test:aimlapi

# Comprehensive testing
npm run test:all
```

## Update Management

### Automatic Updates
All packages support in-place updates:

```bash
# Pull latest changes
git pull origin main
npm install --production

# Restart service (platform-specific)
```

### Manual Updates
Re-run the installer to update existing installations.

## Uninstallation

### Complete Removal

#### Windows
```cmd
# Control Panel or:
"%ProgramFiles%\MeetingMind\uninstall.bat"
```

#### macOS
```bash
/Applications/MeetingMind/uninstall.sh
```

#### Linux
```bash
sudo /opt/meetingmind/uninstall.sh
```

#### Docker
```bash
docker-compose down -v  # Remove volumes too
docker rmi meetingmind:latest
```

## Support and Documentation

### Installation Support
- **GitHub Issues**: Report installation problems
- **Documentation**: Complete guides in `docs/` directory
- **Community**: GitHub Discussions for help

### Enterprise Deployment
For enterprise deployments requiring:
- Custom installation paths
- Advanced security configurations
- Load balancing setup
- High availability configurations

Contact the MeetingMind team through the GitHub repository.

## Summary

MeetingMind provides comprehensive installation packages that ensure:

✅ **Universal Compatibility**: Windows, macOS, Linux, Docker  
✅ **Automated Setup**: One-command installation  
✅ **Production Ready**: Service integration and security  
✅ **Easy Management**: Start, stop, update, uninstall  
✅ **Monitoring**: Health checks and logging  
✅ **Security**: Proper permissions and isolation  

**Choose your preferred installation method and get MeetingMind running in minutes!**
