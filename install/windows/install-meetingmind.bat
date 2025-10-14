@echo off
REM MeetingMind Installation Script for Windows
REM Version: 1.0.0
REM Platform: Windows 10/11

echo.
echo ========================================
echo    MeetingMind Installation for Windows
echo    AI-Powered Meeting Assistant
echo ========================================
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [INFO] Running with administrator privileges
) else (
    echo [ERROR] This script requires administrator privileges
    echo Please right-click and select "Run as administrator"
    pause
    exit /b 1
)

REM Set installation directory
set INSTALL_DIR=%ProgramFiles%\MeetingMind
set DATA_DIR=%APPDATA%\MeetingMind
set TEMP_DIR=%TEMP%\meetingmind-install

echo [INFO] Installation directory: %INSTALL_DIR%
echo [INFO] Data directory: %DATA_DIR%
echo.

REM Create directories
echo [INFO] Creating installation directories...
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
if not exist "%DATA_DIR%" mkdir "%DATA_DIR%"
if not exist "%TEMP_DIR%" mkdir "%TEMP_DIR%"

REM Check for Node.js
echo [INFO] Checking for Node.js...
node --version >nul 2>&1
if %errorLevel% neq 0 (
    echo [INFO] Node.js not found. Installing Node.js...
    
    REM Download Node.js installer
    echo [INFO] Downloading Node.js installer...
    powershell -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.10.0/node-v20.10.0-x64.msi' -OutFile '%TEMP_DIR%\nodejs-installer.msi'"
    
    REM Install Node.js silently
    echo [INFO] Installing Node.js...
    msiexec /i "%TEMP_DIR%\nodejs-installer.msi" /quiet /norestart
    
    REM Add Node.js to PATH
    setx PATH "%PATH%;%ProgramFiles%\nodejs" /M
    
    echo [INFO] Node.js installation completed
) else (
    echo [INFO] Node.js is already installed
    node --version
)

REM Check for Git
echo [INFO] Checking for Git...
git --version >nul 2>&1
if %errorLevel% neq 0 (
    echo [INFO] Git not found. Installing Git...
    
    REM Download Git installer
    echo [INFO] Downloading Git installer...
    powershell -Command "Invoke-WebRequest -Uri 'https://github.com/git-for-windows/git/releases/download/v2.42.0.windows.2/Git-2.42.0.2-64-bit.exe' -OutFile '%TEMP_DIR%\git-installer.exe'"
    
    REM Install Git silently
    echo [INFO] Installing Git...
    "%TEMP_DIR%\git-installer.exe" /VERYSILENT /NORESTART
    
    echo [INFO] Git installation completed
) else (
    echo [INFO] Git is already installed
    git --version
)

REM Clone MeetingMind repository
echo [INFO] Downloading MeetingMind application...
cd /d "%INSTALL_DIR%"
git clone https://github.com/kimhons/meetingmind-platform.git . 2>nul
if %errorLevel% neq 0 (
    echo [ERROR] Failed to download MeetingMind. Please check your internet connection.
    pause
    exit /b 1
)

REM Install dependencies
echo [INFO] Installing application dependencies...
call npm install --production
if %errorLevel% neq 0 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

REM Create configuration file
echo [INFO] Creating configuration file...
(
echo # MeetingMind Configuration
echo # Generated on %date% %time%
echo.
echo # AIMLAPI Configuration
echo AIMLAPI_API_KEY=your_aimlapi_key_here
echo AIMLAPI_BASE_URL=https://api.aimlapi.com/v1
echo.
echo # Cost Management
echo AI_MONTHLY_BUDGET=5000
echo COST_ALERT_THRESHOLD=0.8
echo.
echo # Server Configuration
echo PORT=3000
echo NODE_ENV=production
echo.
echo # Security
echo SESSION_SECRET=your_session_secret_here
echo JWT_SECRET=your_jwt_secret_here
echo.
echo # Database Configuration
echo SUPABASE_URL=your_supabase_url_here
echo SUPABASE_ANON_KEY=your_supabase_anon_key_here
echo.
echo # Meeting Platform Integration
echo ZOOM_CLIENT_ID=your_zoom_client_id_here
echo ZOOM_CLIENT_SECRET=your_zoom_client_secret_here
echo TEAMS_CLIENT_ID=your_teams_client_id_here
echo TEAMS_CLIENT_SECRET=your_teams_client_secret_here
) > "%DATA_DIR%\.env"

REM Create Windows service script
echo [INFO] Creating Windows service...
(
echo @echo off
echo cd /d "%INSTALL_DIR%"
echo set NODE_ENV=production
echo node server.js
) > "%INSTALL_DIR%\start-meetingmind.bat"

REM Create desktop shortcut
echo [INFO] Creating desktop shortcut...
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%USERPROFILE%\Desktop\MeetingMind.lnk'); $Shortcut.TargetPath = '%INSTALL_DIR%\start-meetingmind.bat'; $Shortcut.WorkingDirectory = '%INSTALL_DIR%'; $Shortcut.IconLocation = '%INSTALL_DIR%\assets\icon.ico'; $Shortcut.Description = 'MeetingMind AI-Powered Meeting Assistant'; $Shortcut.Save()"

REM Create start menu entry
echo [INFO] Creating start menu entry...
if not exist "%ProgramData%\Microsoft\Windows\Start Menu\Programs\MeetingMind" mkdir "%ProgramData%\Microsoft\Windows\Start Menu\Programs\MeetingMind"
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%ProgramData%\Microsoft\Windows\Start Menu\Programs\MeetingMind\MeetingMind.lnk'); $Shortcut.TargetPath = '%INSTALL_DIR%\start-meetingmind.bat'; $Shortcut.WorkingDirectory = '%INSTALL_DIR%'; $Shortcut.IconLocation = '%INSTALL_DIR%\assets\icon.ico'; $Shortcut.Description = 'MeetingMind AI-Powered Meeting Assistant'; $Shortcut.Save()"

REM Create uninstaller
echo [INFO] Creating uninstaller...
(
echo @echo off
echo echo Uninstalling MeetingMind...
echo taskkill /f /im node.exe 2^>nul
echo rd /s /q "%INSTALL_DIR%" 2^>nul
echo rd /s /q "%DATA_DIR%" 2^>nul
echo del "%USERPROFILE%\Desktop\MeetingMind.lnk" 2^>nul
echo rd /s /q "%ProgramData%\Microsoft\Windows\Start Menu\Programs\MeetingMind" 2^>nul
echo echo MeetingMind has been uninstalled successfully.
echo pause
) > "%INSTALL_DIR%\uninstall.bat"

REM Add to Windows Registry for Add/Remove Programs
echo [INFO] Registering with Windows...
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\MeetingMind" /v "DisplayName" /t REG_SZ /d "MeetingMind AI Meeting Assistant" /f >nul
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\MeetingMind" /v "DisplayVersion" /t REG_SZ /d "1.0.0" /f >nul
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\MeetingMind" /v "Publisher" /t REG_SZ /d "MeetingMind Inc." /f >nul
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\MeetingMind" /v "UninstallString" /t REG_SZ /d "%INSTALL_DIR%\uninstall.bat" /f >nul
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\MeetingMind" /v "InstallLocation" /t REG_SZ /d "%INSTALL_DIR%" /f >nul

REM Configure Windows Firewall
echo [INFO] Configuring Windows Firewall...
netsh advfirewall firewall add rule name="MeetingMind" dir=in action=allow protocol=TCP localport=3000 >nul

REM Cleanup temporary files
echo [INFO] Cleaning up temporary files...
rd /s /q "%TEMP_DIR%" 2>nul

echo.
echo ========================================
echo    MeetingMind Installation Complete!
echo ========================================
echo.
echo Installation Directory: %INSTALL_DIR%
echo Configuration File: %DATA_DIR%\.env
echo.
echo IMPORTANT: Please configure your API keys in:
echo %DATA_DIR%\.env
echo.
echo To start MeetingMind:
echo 1. Double-click the desktop shortcut, or
echo 2. Use Start Menu ^> MeetingMind ^> MeetingMind, or
echo 3. Run: %INSTALL_DIR%\start-meetingmind.bat
echo.
echo Access the web interface at: http://localhost:3000
echo.
echo For support, visit: https://github.com/kimhons/meetingmind-platform
echo.
pause
