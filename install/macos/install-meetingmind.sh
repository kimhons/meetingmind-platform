#!/bin/bash

# MeetingMind Installation Script for macOS
# Version: 1.0.0
# Platform: macOS 10.15+ (Catalina and later)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Installation directories
INSTALL_DIR="/Applications/MeetingMind"
DATA_DIR="$HOME/Library/Application Support/MeetingMind"
LOG_DIR="$HOME/Library/Logs/MeetingMind"
TEMP_DIR="/tmp/meetingmind-install"

echo ""
echo "========================================"
echo "   MeetingMind Installation for macOS"
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
if [[ $EUID -eq 0 ]]; then
    print_error "This script should not be run as root"
    print_info "Please run without sudo for user installation"
    exit 1
fi

# Check macOS version
print_info "Checking macOS version..."
MACOS_VERSION=$(sw_vers -productVersion)
MACOS_MAJOR=$(echo $MACOS_VERSION | cut -d. -f1)
MACOS_MINOR=$(echo $MACOS_VERSION | cut -d. -f2)

if [[ $MACOS_MAJOR -lt 10 ]] || [[ $MACOS_MAJOR -eq 10 && $MACOS_MINOR -lt 15 ]]; then
    print_error "macOS 10.15 (Catalina) or later is required"
    print_error "Current version: $MACOS_VERSION"
    exit 1
fi

print_success "macOS version: $MACOS_VERSION (supported)"

# Create directories
print_info "Creating installation directories..."
mkdir -p "$INSTALL_DIR"
mkdir -p "$DATA_DIR"
mkdir -p "$LOG_DIR"
mkdir -p "$TEMP_DIR"

# Check for Homebrew
print_info "Checking for Homebrew..."
if ! command -v brew &> /dev/null; then
    print_info "Homebrew not found. Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Add Homebrew to PATH
    if [[ -f "/opt/homebrew/bin/brew" ]]; then
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/opt/homebrew/bin/brew shellenv)"
    else
        echo 'eval "$(/usr/local/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/usr/local/bin/brew shellenv)"
    fi
    
    print_success "Homebrew installation completed"
else
    print_success "Homebrew is already installed"
    brew --version
fi

# Check for Node.js
print_info "Checking for Node.js..."
if ! command -v node &> /dev/null; then
    print_info "Node.js not found. Installing Node.js via Homebrew..."
    brew install node
    print_success "Node.js installation completed"
else
    print_success "Node.js is already installed"
    node --version
    npm --version
fi

# Check for Git
print_info "Checking for Git..."
if ! command -v git &> /dev/null; then
    print_info "Git not found. Installing Git via Homebrew..."
    brew install git
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
    git pull origin main
else
    print_info "Cloning fresh installation..."
    git clone https://github.com/kimhons/meetingmind-platform.git .
fi

if [[ $? -ne 0 ]]; then
    print_error "Failed to download MeetingMind. Please check your internet connection."
    exit 1
fi

print_success "MeetingMind downloaded successfully"

# Install dependencies
print_info "Installing application dependencies..."
npm install --production

if [[ $? -ne 0 ]]; then
    print_error "Failed to install dependencies"
    exit 1
fi

print_success "Dependencies installed successfully"

# Create configuration file
print_info "Creating configuration file..."
cat > "$DATA_DIR/.env" << EOF
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

# macOS Specific
LOG_FILE=$LOG_DIR/meetingmind.log
PID_FILE=$DATA_DIR/meetingmind.pid
EOF

print_success "Configuration file created"

# Create launch script
print_info "Creating launch script..."
cat > "$INSTALL_DIR/start-meetingmind.sh" << EOF
#!/bin/bash

# MeetingMind Startup Script for macOS
cd "$INSTALL_DIR"

# Load environment variables
if [[ -f "$DATA_DIR/.env" ]]; then
    export \$(cat "$DATA_DIR/.env" | grep -v '^#' | xargs)
fi

# Set default values
export NODE_ENV=\${NODE_ENV:-production}
export PORT=\${PORT:-3000}
export LOG_FILE=\${LOG_FILE:-$LOG_DIR/meetingmind.log}
export PID_FILE=\${PID_FILE:-$DATA_DIR/meetingmind.pid}

# Create log directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Start MeetingMind
echo "Starting MeetingMind..."
echo "Log file: \$LOG_FILE"
echo "PID file: \$PID_FILE"
echo "Web interface: http://localhost:\$PORT"

# Start the application
node server.js > "\$LOG_FILE" 2>&1 &
echo \$! > "\$PID_FILE"

echo "MeetingMind started successfully!"
echo "Access the web interface at: http://localhost:\$PORT"
EOF

chmod +x "$INSTALL_DIR/start-meetingmind.sh"

# Create stop script
print_info "Creating stop script..."
cat > "$INSTALL_DIR/stop-meetingmind.sh" << EOF
#!/bin/bash

# MeetingMind Stop Script for macOS
PID_FILE="$DATA_DIR/meetingmind.pid"

if [[ -f "\$PID_FILE" ]]; then
    PID=\$(cat "\$PID_FILE")
    if ps -p \$PID > /dev/null 2>&1; then
        echo "Stopping MeetingMind (PID: \$PID)..."
        kill \$PID
        rm -f "\$PID_FILE"
        echo "MeetingMind stopped successfully"
    else
        echo "MeetingMind is not running"
        rm -f "\$PID_FILE"
    fi
else
    echo "MeetingMind PID file not found"
    # Try to kill any running node processes with MeetingMind
    pkill -f "node.*server.js" || true
fi
EOF

chmod +x "$INSTALL_DIR/stop-meetingmind.sh"

# Create macOS app bundle
print_info "Creating macOS application bundle..."
APP_BUNDLE="/Applications/MeetingMind.app"
mkdir -p "$APP_BUNDLE/Contents/MacOS"
mkdir -p "$APP_BUNDLE/Contents/Resources"

# Create Info.plist
cat > "$APP_BUNDLE/Contents/Info.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>MeetingMind</string>
    <key>CFBundleIdentifier</key>
    <string>com.meetingmind.app</string>
    <key>CFBundleName</key>
    <string>MeetingMind</string>
    <key>CFBundleVersion</key>
    <string>1.0.0</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleSignature</key>
    <string>MMND</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.15</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>LSUIElement</key>
    <false/>
</dict>
</plist>
EOF

# Create app launcher
cat > "$APP_BUNDLE/Contents/MacOS/MeetingMind" << EOF
#!/bin/bash
cd "$INSTALL_DIR"
exec ./start-meetingmind.sh
EOF

chmod +x "$APP_BUNDLE/Contents/MacOS/MeetingMind"

# Create LaunchAgent for auto-start (optional)
print_info "Creating LaunchAgent for auto-start..."
LAUNCH_AGENT_DIR="$HOME/Library/LaunchAgents"
mkdir -p "$LAUNCH_AGENT_DIR"

cat > "$LAUNCH_AGENT_DIR/com.meetingmind.app.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.meetingmind.app</string>
    <key>ProgramArguments</key>
    <array>
        <string>$INSTALL_DIR/start-meetingmind.sh</string>
    </array>
    <key>RunAtLoad</key>
    <false/>
    <key>KeepAlive</key>
    <false/>
    <key>WorkingDirectory</key>
    <string>$INSTALL_DIR</string>
    <key>StandardOutPath</key>
    <string>$LOG_DIR/meetingmind.log</string>
    <key>StandardErrorPath</key>
    <string>$LOG_DIR/meetingmind-error.log</string>
</dict>
</plist>
EOF

# Create uninstaller
print_info "Creating uninstaller..."
cat > "$INSTALL_DIR/uninstall.sh" << EOF
#!/bin/bash

echo "Uninstalling MeetingMind..."

# Stop the application
"$INSTALL_DIR/stop-meetingmind.sh"

# Remove LaunchAgent
launchctl unload "$LAUNCH_AGENT_DIR/com.meetingmind.app.plist" 2>/dev/null || true
rm -f "$LAUNCH_AGENT_DIR/com.meetingmind.app.plist"

# Remove application bundle
rm -rf "/Applications/MeetingMind.app"

# Remove installation directory
rm -rf "$INSTALL_DIR"

# Ask user if they want to remove data
read -p "Do you want to remove user data and logs? (y/N): " -n 1 -r
echo
if [[ \$REPLY =~ ^[Yy]\$ ]]; then
    rm -rf "$DATA_DIR"
    rm -rf "$LOG_DIR"
    echo "User data and logs removed"
fi

echo "MeetingMind has been uninstalled successfully"
EOF

chmod +x "$INSTALL_DIR/uninstall.sh"

# Cleanup temporary files
print_info "Cleaning up temporary files..."
rm -rf "$TEMP_DIR"

# Set proper permissions
print_info "Setting permissions..."
chmod -R 755 "$INSTALL_DIR"
chmod 600 "$DATA_DIR/.env"

echo ""
echo "========================================"
echo "   MeetingMind Installation Complete!"
echo "========================================"
echo ""
echo "Installation Directory: $INSTALL_DIR"
echo "Configuration File: $DATA_DIR/.env"
echo "Log Directory: $LOG_DIR"
echo ""
echo "IMPORTANT: Please configure your API keys in:"
echo "$DATA_DIR/.env"
echo ""
echo "To start MeetingMind:"
echo "1. Double-click MeetingMind.app in Applications, or"
echo "2. Run: $INSTALL_DIR/start-meetingmind.sh"
echo ""
echo "To stop MeetingMind:"
echo "Run: $INSTALL_DIR/stop-meetingmind.sh"
echo ""
echo "To enable auto-start at login:"
echo "launchctl load $LAUNCH_AGENT_DIR/com.meetingmind.app.plist"
echo ""
echo "Access the web interface at: http://localhost:3000"
echo ""
echo "For support, visit: https://github.com/kimhons/meetingmind-platform"
echo ""

print_success "Installation completed successfully!"
