# MeetingMind Desktop

An AI-powered meeting assistant desktop application built with Electron that provides real-time insights, knowledge search, and automated follow-up generation during meetings and conversations.

## Features

### Core Functionality
- **Live Insights**: Real-time AI analysis of meeting conversations with contextual suggestions
- **Instant Answers**: Quick responses to questions with AI-powered intelligence
- **Knowledge Search**: Comprehensive search through knowledge bases and company information
- **People Intelligence**: Background information on meeting participants and conversation history
- **Follow-up Automation**: Automated email and note generation after meetings

### Desktop-Specific Features
- **Overlay Window**: Unobtrusive floating assistant that stays on top during meetings
- **Global Shortcuts**: Quick access to features without switching windows
- **System Integration**: Native notifications, power management, and system tray support
- **Screen Capture**: Context-aware assistance based on screen content
- **Local Data Storage**: Secure local storage of meeting data and settings
- **Cross-Platform**: Runs on Windows, macOS, and Linux

## Installation

### From Release (Recommended)
1. Download the latest release for your platform from the releases page
2. Install the application:
   - **Windows**: Run the `.exe` installer
   - **macOS**: Open the `.dmg` file and drag to Applications
   - **Linux**: Install the `.AppImage`, `.deb`, or `.rpm` package

### From Source
```bash
# Clone the repository
git clone https://github.com/meetingmind/desktop.git
cd meetingmind-desktop

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build
```

## Usage

### Getting Started
1. Launch MeetingMind from your applications folder or start menu
2. The main interface will open showing the AI assistant dashboard
3. Use the overlay window for unobtrusive meeting assistance
4. Configure settings through the preferences menu

### Global Shortcuts
- `Ctrl/Cmd + Shift + M`: Toggle main window visibility
- `Ctrl/Cmd + Shift + O`: Toggle overlay window
- `Ctrl/Cmd + N`: Start new meeting session

### Overlay Window
The overlay window provides real-time assistance during meetings:
- Displays live insights and suggestions
- Shows relevant knowledge search results
- Provides quick action buttons for common tasks
- Can be moved and resized as needed
- Stays on top of other applications

### Meeting Features
- **Start Listening**: Begin audio analysis for real-time insights
- **Get Insights**: Receive AI-powered suggestions based on conversation
- **Search Knowledge**: Find relevant information from your knowledge base
- **Generate Follow-up**: Create professional follow-up emails automatically

## Configuration

### Settings Location
- **Windows**: `%USERPROFILE%\.meetingmind\settings.json`
- **macOS**: `~/.meetingmind/settings.json`
- **Linux**: `~/.meetingmind/settings.json`

### Available Settings
```json
{
  "autoStart": false,
  "pauseOnLock": true,
  "notificationsEnabled": true,
  "overlayEnabled": true,
  "hotkeys": {
    "toggleOverlay": "CommandOrControl+Shift+O",
    "startListening": "CommandOrControl+Shift+L",
    "quickInsight": "CommandOrControl+Shift+I"
  },
  "aiSettings": {
    "confidenceThreshold": 0.7,
    "maxInsightsPerMinute": 3,
    "enableRealTimeAnalysis": true
  }
}
```

## Privacy & Security

### Data Handling
- All meeting data is stored locally on your device
- No audio or conversation data is transmitted to external servers
- Settings and preferences are stored in your user directory
- Meeting history can be exported or deleted at any time

### Permissions
The application requires the following permissions:
- **Microphone**: For audio analysis during meetings (optional)
- **Screen Recording**: For context-aware assistance (optional)
- **Notifications**: For system alerts and reminders
- **Accessibility**: For global shortcuts and overlay functionality

## Building from Source

### Prerequisites
- Node.js 16 or higher
- npm or yarn package manager
- Git

### Development Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for current platform
npm run build

# Build for specific platforms
npm run build-win    # Windows
npm run build-mac    # macOS
npm run build-linux  # Linux
```

### Build Outputs
- **Windows**: `.exe` installer and portable executable
- **macOS**: `.dmg` disk image and `.zip` archive
- **Linux**: `.AppImage`, `.deb`, and `.rpm` packages

## Troubleshooting

### Common Issues

**Application won't start**
- Ensure you have the latest version installed
- Check that your system meets the minimum requirements
- Try running as administrator (Windows) or with sudo (Linux)

**Overlay window not appearing**
- Check that overlay is enabled in settings
- Verify global shortcuts are not conflicting with other applications
- Restart the application and try again

**Audio features not working**
- Grant microphone permissions when prompted
- Check system audio settings and input devices
- Ensure no other applications are blocking microphone access

**Performance issues**
- Close unnecessary applications to free up system resources
- Adjust AI settings to reduce processing load
- Check for system updates and install if available

### Getting Help
- Check the FAQ section in the application
- Visit our support documentation
- Report issues on GitHub
- Contact support team

## Development

### Architecture
- **Main Process**: Electron main process handling system integration
- **Renderer Process**: React-based UI for the main application
- **Overlay Process**: Lightweight overlay window for meeting assistance
- **Desktop Features**: Native system integration and AI processing

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

### Code Style
- Use ESLint and Prettier for code formatting
- Follow React best practices for UI components
- Use TypeScript for type safety (where applicable)
- Write comprehensive tests for new features

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with Electron for cross-platform desktop support
- React for the user interface
- Various open-source libraries for AI and system integration

---

For more information, visit our website or check the documentation in the `/docs` folder.
