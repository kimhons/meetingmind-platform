#!/bin/bash

# MeetingMind Installation Script for Unix/Linux
# Version: 1.0.0
# Platform: Ubuntu 18.04+, CentOS 7+, Debian 9+, Fedora 30+

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Installation directories
INSTALL_DIR="/opt/meetingmind"
DATA_DIR="/var/lib/meetingmind"
CONFIG_DIR="/etc/meetingmind"
LOG_DIR="/var/log/meetingmind"
SERVICE_DIR="/etc/systemd/system"
TEMP_DIR="/tmp/meetingmind-install"

# User and group
MEETINGMIND_USER="meetingmind"
MEETINGMIND_GROUP="meetingmind"

echo ""
echo "========================================"
echo "   MeetingMind Installation for Linux"
echo "   AI-Powered Meeting Assistant"
echo "========================================"
echo ""

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
    print_error "This script must be run as root"
    print_info "Please run with sudo: sudo $0"
    exit 1
fi

# Detect Linux distribution
print_info "Detecting Linux distribution..."
if [[ -f /etc/os-release ]]; then
    . /etc/os-release
    DISTRO=$ID
    VERSION=$VERSION_ID
    print_success "Detected: $PRETTY_NAME"
else
    print_error "Cannot detect Linux distribution"
    exit 1
fi

# Function to install packages based on distribution
install_package() {
    case $DISTRO in
        ubuntu|debian)
            apt-get update -qq
            apt-get install -y "$@"
            ;;
        centos|rhel|fedora)
            if command -v dnf &> /dev/null; then
                dnf install -y "$@"
            else
                yum install -y "$@"
            fi
            ;;
        arch)
            pacman -Sy --noconfirm "$@"
            ;;
        *)
            print_error "Unsupported distribution: $DISTRO"
            exit 1
            ;;
    esac
}

# Install system dependencies
print_info "Installing system dependencies..."
case $DISTRO in
    ubuntu|debian)
        install_package curl wget git build-essential
        ;;
    centos|rhel|fedora)
        install_package curl wget git gcc gcc-c++ make
        ;;
    arch)
        install_package curl wget git base-devel
        ;;
esac

# Create system user and group
print_info "Creating system user and group..."
if ! getent group $MEETINGMIND_GROUP > /dev/null 2>&1; then
    groupadd --system $MEETINGMIND_GROUP
    print_success "Created group: $MEETINGMIND_GROUP"
fi

if ! getent passwd $MEETINGMIND_USER > /dev/null 2>&1; then
    useradd --system --gid $MEETINGMIND_GROUP --home-dir $DATA_DIR --shell /bin/false $MEETINGMIND_USER
    print_success "Created user: $MEETINGMIND_USER"
fi

# Create directories
print_info "Creating installation directories..."
mkdir -p "$INSTALL_DIR"
mkdir -p "$DATA_DIR"
mkdir -p "$CONFIG_DIR"
mkdir -p "$LOG_DIR"
mkdir -p "$TEMP_DIR"

# Set directory ownership
chown -R $MEETINGMIND_USER:$MEETINGMIND_GROUP "$DATA_DIR"
chown -R $MEETINGMIND_USER:$MEETINGMIND_GROUP "$LOG_DIR"

# Install Node.js
print_info "Installing Node.js..."
if ! command -v node &> /dev/null; then
    # Install Node.js via NodeSource repository
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    case $DISTRO in
        ubuntu|debian)
            install_package nodejs
            ;;
        centos|rhel|fedora)
            curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
            install_package nodejs
            ;;
        arch)
            install_package nodejs npm
            ;;
    esac
    print_success "Node.js installation completed"
else
    print_success "Node.js is already installed"
    node --version
    npm --version
fi

# Install Git if not present
print_info "Checking for Git..."
if ! command -v git &> /dev/null; then
    print_info "Installing Git..."
    install_package git
    print_success "Git installation completed"
else
    print_success "Git is already installed"
    git --version
fi

# Clone MeetingMind repository
print_info "Downloading MeetingMind application..."
cd "$INSTALL_DIR"
if [[ -d ".git" ]]; then
    print_info "Updating existing installation..."
    sudo -u $MEETINGMIND_USER git pull origin main
else
    print_info "Cloning fresh installation..."
    git clone https://github.com/kimhons/meetingmind-platform.git .
    chown -R $MEETINGMIND_USER:$MEETINGMIND_GROUP "$INSTALL_DIR"
fi

if [[ $? -ne 0 ]]; then
    print_error "Failed to download MeetingMind. Please check your internet connection."
    exit 1
fi

print_success "MeetingMind downloaded successfully"

# Install dependencies
print_info "Installing application dependencies..."
cd "$INSTALL_DIR"
sudo -u $MEETINGMIND_USER npm install --production

if [[ $? -ne 0 ]]; then
    print_error "Failed to install dependencies"
    exit 1
fi

print_success "Dependencies installed successfully"

# Create configuration file
print_info "Creating configuration file..."
cat > "$CONFIG_DIR/meetingmind.env" << EOF
# MeetingMind Configuration
# Generated on $(date)

# AIMLAPI Configuration
AIMLAPI_API_KEY=your_aimlapi_key_here
AIMLAPI_BASE_URL=https://api.aimlapi.com/v1

# Cost Management
AI_MONTHLY_BUDGET=5000
COST_ALERT_THRESHOLD=0.8

# Server Configuration
PORT=3000
NODE_ENV=production
HOST=0.0.0.0

# Security
SESSION_SECRET=your_session_secret_here
JWT_SECRET=your_jwt_secret_here

# Database Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Meeting Platform Integration
ZOOM_CLIENT_ID=your_zoom_client_id_here
ZOOM_CLIENT_SECRET=your_zoom_client_secret_here
TEAMS_CLIENT_ID=your_teams_client_id_here
TEAMS_CLIENT_SECRET=your_teams_client_secret_here

# Linux Specific
LOG_FILE=$LOG_DIR/meetingmind.log
PID_FILE=$DATA_DIR/meetingmind.pid
DATA_DIR=$DATA_DIR
EOF

# Set configuration file permissions
chmod 640 "$CONFIG_DIR/meetingmind.env"
chown root:$MEETINGMIND_GROUP "$CONFIG_DIR/meetingmind.env"

print_success "Configuration file created"

# Create systemd service file
print_info "Creating systemd service..."
cat > "$SERVICE_DIR/meetingmind.service" << EOF
[Unit]
Description=MeetingMind AI-Powered Meeting Assistant
Documentation=https://github.com/kimhons/meetingmind-platform
After=network.target

[Service]
Type=simple
User=$MEETINGMIND_USER
Group=$MEETINGMIND_GROUP
WorkingDirectory=$INSTALL_DIR
ExecStart=/usr/bin/node server.js
ExecReload=/bin/kill -HUP \$MAINPID
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=meetingmind
EnvironmentFile=$CONFIG_DIR/meetingmind.env

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$DATA_DIR $LOG_DIR
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectControlGroups=true

# Resource limits
LimitNOFILE=65536
LimitNPROC=4096

[Install]
WantedBy=multi-user.target
EOF

print_success "Systemd service created"

# Create startup script
print_info "Creating startup script..."
cat > "$INSTALL_DIR/start-meetingmind.sh" << EOF
#!/bin/bash

# MeetingMind Startup Script for Linux
echo "Starting MeetingMind service..."
systemctl start meetingmind
systemctl status meetingmind --no-pager
echo ""
echo "MeetingMind is starting..."
echo "Access the web interface at: http://localhost:3000"
echo ""
echo "To check logs: journalctl -u meetingmind -f"
echo "To stop: systemctl stop meetingmind"
EOF

chmod +x "$INSTALL_DIR/start-meetingmind.sh"

# Create stop script
print_info "Creating stop script..."
cat > "$INSTALL_DIR/stop-meetingmind.sh" << EOF
#!/bin/bash

# MeetingMind Stop Script for Linux
echo "Stopping MeetingMind service..."
systemctl stop meetingmind
systemctl status meetingmind --no-pager
echo "MeetingMind stopped successfully"
EOF

chmod +x "$INSTALL_DIR/stop-meetingmind.sh"

# Create log rotation configuration
print_info "Creating log rotation configuration..."
cat > "/etc/logrotate.d/meetingmind" << EOF
$LOG_DIR/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $MEETINGMIND_USER $MEETINGMIND_GROUP
    postrotate
        systemctl reload meetingmind > /dev/null 2>&1 || true
    endscript
}
EOF

# Configure firewall (if ufw is available)
if command -v ufw &> /dev/null; then
    print_info "Configuring UFW firewall..."
    ufw allow 3000/tcp comment "MeetingMind"
    print_success "Firewall configured"
fi

# Configure firewalld (if available)
if command -v firewall-cmd &> /dev/null; then
    print_info "Configuring firewalld..."
    firewall-cmd --permanent --add-port=3000/tcp
    firewall-cmd --reload
    print_success "Firewall configured"
fi

# Create uninstaller
print_info "Creating uninstaller..."
cat > "$INSTALL_DIR/uninstall.sh" << EOF
#!/bin/bash

if [[ \$EUID -ne 0 ]]; then
    echo "This script must be run as root"
    echo "Please run with sudo: sudo \$0"
    exit 1
fi

echo "Uninstalling MeetingMind..."

# Stop and disable service
systemctl stop meetingmind 2>/dev/null || true
systemctl disable meetingmind 2>/dev/null || true

# Remove service file
rm -f "$SERVICE_DIR/meetingmind.service"

# Remove firewall rules
if command -v ufw &> /dev/null; then
    ufw delete allow 3000/tcp 2>/dev/null || true
fi

if command -v firewall-cmd &> /dev/null; then
    firewall-cmd --permanent --remove-port=3000/tcp 2>/dev/null || true
    firewall-cmd --reload 2>/dev/null || true
fi

# Remove log rotation
rm -f "/etc/logrotate.d/meetingmind"

# Remove installation directory
rm -rf "$INSTALL_DIR"

# Remove configuration
rm -rf "$CONFIG_DIR"

# Ask user if they want to remove data and logs
read -p "Do you want to remove user data and logs? (y/N): " -n 1 -r
echo
if [[ \$REPLY =~ ^[Yy]\$ ]]; then
    rm -rf "$DATA_DIR"
    rm -rf "$LOG_DIR"
    echo "User data and logs removed"
fi

# Ask user if they want to remove system user
read -p "Do you want to remove system user '$MEETINGMIND_USER'? (y/N): " -n 1 -r
echo
if [[ \$REPLY =~ ^[Yy]\$ ]]; then
    userdel $MEETINGMIND_USER 2>/dev/null || true
    groupdel $MEETINGMIND_GROUP 2>/dev/null || true
    echo "System user removed"
fi

systemctl daemon-reload

echo "MeetingMind has been uninstalled successfully"
EOF

chmod +x "$INSTALL_DIR/uninstall.sh"

# Reload systemd and enable service
print_info "Configuring systemd service..."
systemctl daemon-reload
systemctl enable meetingmind

# Cleanup temporary files
print_info "Cleaning up temporary files..."
rm -rf "$TEMP_DIR"

# Set final permissions
print_info "Setting final permissions..."
chown -R $MEETINGMIND_USER:$MEETINGMIND_GROUP "$INSTALL_DIR"
chmod -R 755 "$INSTALL_DIR"
chmod 750 "$CONFIG_DIR"

echo ""
echo "========================================"
echo "   MeetingMind Installation Complete!"
echo "========================================"
echo ""
echo "Installation Directory: $INSTALL_DIR"
echo "Configuration File: $CONFIG_DIR/meetingmind.env"
echo "Data Directory: $DATA_DIR"
echo "Log Directory: $LOG_DIR"
echo ""
echo "IMPORTANT: Please configure your API keys in:"
echo "$CONFIG_DIR/meetingmind.env"
echo ""
echo "To start MeetingMind:"
echo "sudo systemctl start meetingmind"
echo ""
echo "To enable auto-start at boot:"
echo "sudo systemctl enable meetingmind"
echo ""
echo "To check status:"
echo "sudo systemctl status meetingmind"
echo ""
echo "To view logs:"
echo "sudo journalctl -u meetingmind -f"
echo ""
echo "To stop MeetingMind:"
echo "sudo systemctl stop meetingmind"
echo ""
echo "Access the web interface at: http://localhost:3000"
echo "Or from other machines: http://$(hostname -I | awk '{print $1}'):3000"
echo ""
echo "For support, visit: https://github.com/kimhons/meetingmind-platform"
echo ""

print_success "Installation completed successfully!"
print_info "You can now start MeetingMind with: sudo systemctl start meetingmind"
