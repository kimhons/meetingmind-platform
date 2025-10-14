# MeetingMind Installation Guide

## Overview

MeetingMind is an AI-powered meeting assistant that provides seamless integration with popular meeting platforms, advanced AI analysis, and comprehensive meeting intelligence. This guide provides installation instructions for Windows, macOS, and Unix/Linux systems.

## System Requirements

### Minimum Requirements
- **RAM**: 4GB (8GB recommended)
- **Storage**: 2GB free space
- **Network**: Internet connection required
- **Node.js**: 18.0+ (automatically installed)

### Platform-Specific Requirements

#### Windows
- **OS**: Windows 10 (version 1903+) or Windows 11
- **Architecture**: x64
- **PowerShell**: 5.1+ (pre-installed)
- **Administrator privileges**: Required for installation

#### macOS
- **OS**: macOS 10.15 (Catalina) or later
- **Architecture**: Intel x64 or Apple Silicon (M1/M2)
- **Xcode Command Line Tools**: Automatically installed
- **Homebrew**: Automatically installed if not present

#### Linux/Unix
- **OS**: Ubuntu 18.04+, CentOS 7+, Debian 9+, Fedora 30+, or compatible
- **Architecture**: x64
- **systemd**: Required for service management
- **Root privileges**: Required for installation

## Installation Methods

### Quick Installation (Recommended)

#### Windows
1. **Download the installer**:
   ```cmd
   curl -O https://raw.githubusercontent.com/kimhons/meetingmind-platform/main/install/windows/install-meetingmind.bat
   ```

2. **Run as Administrator**:
   - Right-click on `install-meetingmind.bat`
   - Select "Run as administrator"
   - Follow the installation prompts

#### macOS
1. **Download and run the installer**:
   ```bash
   curl -fsSL https://raw.githubusercontent.com/kimhons/meetingmind-platform/main/install/macos/install-meetingmind.sh | bash
   ```

#### Linux/Unix
1. **Download and run the installer**:
   ```bash
   curl -fsSL https://raw.githubusercontent.com/kimhons/meetingmind-platform/main/install/unix/install-meetingmind.sh | sudo bash
   ```

### Manual Installation

If you prefer to install manually or need more control over the installation process:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/kimhons/meetingmind-platform.git
   cd meetingmind-platform
   ```

2. **Install dependencies**:
   ```bash
   npm install --production
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the application**:
   ```bash
   npm start
   ```

## Post-Installation Configuration

### 1. API Key Configuration

After installation, you must configure your API keys in the environment file:

#### Windows
Edit: `%APPDATA%\MeetingMind\.env`

#### macOS
Edit: `~/Library/Application Support/MeetingMind/.env`

#### Linux
Edit: `/etc/meetingmind/meetingmind.env`

### Required API Keys

```env
# AIMLAPI Configuration (Required)
AIMLAPI_API_KEY=your_aimlapi_key_here

# Supabase Configuration (Required)
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Meeting Platform Integration (Optional)
ZOOM_CLIENT_ID=your_zoom_client_id_here
ZOOM_CLIENT_SECRET=your_zoom_client_secret_here
TEAMS_CLIENT_ID=your_teams_client_id_here
TEAMS_CLIENT_SECRET=your_teams_client_secret_here
```

### 2. Security Configuration

Generate secure secrets for production use:

```env
# Generate random secrets
SESSION_SECRET=your_secure_session_secret_here
JWT_SECRET=your_secure_jwt_secret_here
```

### 3. Cost Management

Configure your AI usage budget:

```env
# Set monthly budget in USD
AI_MONTHLY_BUDGET=5000
COST_ALERT_THRESHOLD=0.8
```

## Starting MeetingMind

### Windows
- **Desktop Shortcut**: Double-click the MeetingMind shortcut
- **Start Menu**: Start Menu → MeetingMind → MeetingMind
- **Command Line**: Run `%ProgramFiles%\MeetingMind\start-meetingmind.bat`

### macOS
- **Applications**: Double-click MeetingMind.app in Applications folder
- **Terminal**: Run `/Applications/MeetingMind/start-meetingmind.sh`
- **Auto-start**: Enable with `launchctl load ~/Library/LaunchAgents/com.meetingmind.app.plist`

### Linux
- **Systemd Service**: `sudo systemctl start meetingmind`
- **Auto-start**: `sudo systemctl enable meetingmind`
- **Direct**: Run `/opt/meetingmind/start-meetingmind.sh`

## Accessing MeetingMind

Once started, access MeetingMind through your web browser:

- **Local Access**: http://localhost:3000
- **Network Access**: http://[your-ip-address]:3000

## Verification

### Health Check
Visit http://localhost:3000/health to verify the installation:

```json
{
  "status": "healthy",
  "timestamp": "2025-10-14T18:00:00.000Z",
  "version": "1.0.0",
  "aimlapi": {
    "status": "operational",
    "apiKey": "configured"
  }
}
```

### Test AI Integration
Visit http://localhost:3000/api/test/aimlapi to test AIMLAPI integration:

```json
{
  "status": "passed",
  "message": "AIMLAPI integration working correctly",
  "details": {
    "apiKeyValid": true,
    "modelsAccessible": true,
    "costTracking": true
  }
}
```

## Troubleshooting

### Common Issues

#### 1. Port Already in Use
If port 3000 is already in use, change the port in your environment file:
```env
PORT=3001
```

#### 2. API Key Issues
- Verify your AIMLAPI key is valid
- Check that all required environment variables are set
- Ensure no extra spaces or quotes in the .env file

#### 3. Permission Issues (Linux/macOS)
```bash
# Fix ownership issues
sudo chown -R meetingmind:meetingmind /opt/meetingmind
sudo chmod -R 755 /opt/meetingmind
```

#### 4. Service Won't Start (Linux)
```bash
# Check service status
sudo systemctl status meetingmind

# View logs
sudo journalctl -u meetingmind -f

# Restart service
sudo systemctl restart meetingmind
```

### Log Locations

#### Windows
- Application Logs: `%APPDATA%\MeetingMind\logs\`
- System Events: Windows Event Viewer

#### macOS
- Application Logs: `~/Library/Logs/MeetingMind/`
- System Logs: Console.app or `log show --predicate 'subsystem contains "meetingmind"'`

#### Linux
- System Logs: `sudo journalctl -u meetingmind`
- Application Logs: `/var/log/meetingmind/`

## Updating MeetingMind

### Automatic Updates
MeetingMind will check for updates automatically and notify you when new versions are available.

### Manual Updates

#### Windows
Run the installer again - it will update the existing installation.

#### macOS
```bash
cd /Applications/MeetingMind
git pull origin main
npm install --production
```

#### Linux
```bash
cd /opt/meetingmind
sudo -u meetingmind git pull origin main
sudo -u meetingmind npm install --production
sudo systemctl restart meetingmind
```

## Uninstallation

### Windows
- **Control Panel**: Programs and Features → MeetingMind → Uninstall
- **Command Line**: Run `%ProgramFiles%\MeetingMind\uninstall.bat`

### macOS
```bash
/Applications/MeetingMind/uninstall.sh
```

### Linux
```bash
sudo /opt/meetingmind/uninstall.sh
```

## Advanced Configuration

### Custom Installation Paths

You can customize installation paths by modifying the installer scripts before running them.

### Reverse Proxy Setup

For production deployments, consider using a reverse proxy like Nginx:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### SSL/TLS Configuration

For secure deployments, configure SSL/TLS certificates:

```env
# Enable HTTPS
HTTPS_ENABLED=true
SSL_CERT_PATH=/path/to/certificate.crt
SSL_KEY_PATH=/path/to/private.key
```

## Performance Optimization

### System Tuning

#### Linux
```bash
# Increase file descriptor limits
echo "meetingmind soft nofile 65536" >> /etc/security/limits.conf
echo "meetingmind hard nofile 65536" >> /etc/security/limits.conf

# Optimize network settings
echo "net.core.somaxconn = 65535" >> /etc/sysctl.conf
sysctl -p
```

### Resource Monitoring

Monitor MeetingMind performance:

```bash
# CPU and Memory usage
htop

# Network connections
netstat -tulpn | grep :3000

# Application logs
tail -f /var/log/meetingmind/meetingmind.log
```

## Security Considerations

### Firewall Configuration
Ensure only necessary ports are open:
- Port 3000: MeetingMind web interface
- Port 443: HTTPS (if using SSL)

### Regular Updates
Keep MeetingMind and system dependencies updated:
```bash
# Update MeetingMind
git pull origin main
npm update

# Update system packages (Ubuntu/Debian)
sudo apt update && sudo apt upgrade

# Update system packages (CentOS/RHEL)
sudo yum update
```

## Support

### Documentation
- **GitHub Repository**: https://github.com/kimhons/meetingmind-platform
- **API Documentation**: http://localhost:3000/docs (when running)
- **Configuration Guide**: See `docs/` directory in the repository

### Community Support
- **Issues**: Report bugs and feature requests on GitHub Issues
- **Discussions**: Join community discussions on GitHub Discussions

### Enterprise Support
For enterprise deployments and commercial support, contact the MeetingMind team through the GitHub repository.

## License

MeetingMind is released under the MIT License. See the LICENSE file in the repository for full details.

---

**Installation completed successfully!** 🚀

Access your MeetingMind installation at http://localhost:3000 and start experiencing the future of AI-powered meeting assistance.
