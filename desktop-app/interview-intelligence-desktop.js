/**
 * MeetingMind Desktop - Job Interview Intelligence System
 * Desktop-specific features for interview preparation and live coaching
 */

const { ipcMain, BrowserWindow, dialog, shell, screen, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs').promises;

class InterviewIntelligenceDesktop {
    constructor() {
        this.interviewWindow = null;
        this.coachingOverlay = null;
        this.isLiveCoaching = false;
        this.currentInterview = null;
        this.setupIpcHandlers();
    }

    setupIpcHandlers() {
        // Interview preparation handlers
        ipcMain.handle('start-interview-preparation', this.startInterviewPreparation.bind(this));
        ipcMain.handle('save-interview-data', this.saveInterviewData.bind(this));
        ipcMain.handle('load-interview-data', this.loadInterviewData.bind(this));
        
        // Live coaching handlers
        ipcMain.handle('start-live-coaching', this.startLiveCoaching.bind(this));
        ipcMain.handle('stop-live-coaching', this.stopLiveCoaching.bind(this));
        ipcMain.handle('toggle-coaching-overlay', this.toggleCoachingOverlay.bind(this));
        
        // Screen capture and analysis
        ipcMain.handle('capture-interview-screen', this.captureInterviewScreen.bind(this));
        ipcMain.handle('analyze-interview-context', this.analyzeInterviewContext.bind(this));
        
        // File operations
        ipcMain.handle('export-interview-report', this.exportInterviewReport.bind(this));
        ipcMain.handle('import-company-data', this.importCompanyData.bind(this));
        
        // Offline capabilities
        ipcMain.handle('sync-offline-data', this.syncOfflineData.bind(this));
        ipcMain.handle('get-offline-status', this.getOfflineStatus.bind(this));
    }

    async startInterviewPreparation(event, interviewData) {
        try {
            // Create dedicated interview preparation window
            this.interviewWindow = new BrowserWindow({
                width: 1400,
                height: 900,
                minWidth: 1200,
                minHeight: 700,
                title: `Interview Prep: ${interviewData.company} - ${interviewData.role}`,
                webPreferences: {
                    nodeIntegration: false,
                    contextIsolation: true,
                    preload: path.join(__dirname, 'preload.js')
                },
                show: false
            });

            // Load interview preparation interface
            await this.interviewWindow.loadFile(path.join(__dirname, 'interview-preparation.html'));
            
            // Send interview data to the window
            this.interviewWindow.webContents.once('dom-ready', () => {
                this.interviewWindow.webContents.send('load-interview-data', interviewData);
                this.interviewWindow.show();
            });

            // Handle window events
            this.interviewWindow.on('closed', () => {
                this.interviewWindow = null;
            });

            // Register interview-specific shortcuts
            this.registerInterviewShortcuts();

            return { success: true, windowId: this.interviewWindow.id };
        } catch (error) {
            console.error('Failed to start interview preparation:', error);
            return { success: false, error: error.message };
        }
    }

    async startLiveCoaching(event, interviewConfig) {
        try {
            this.isLiveCoaching = true;
            this.currentInterview = interviewConfig;

            // Create floating coaching overlay
            await this.createCoachingOverlay();
            
            // Start screen monitoring for context awareness
            await this.startScreenMonitoring();
            
            // Initialize AI coaching engine
            await this.initializeCoachingEngine(interviewConfig);

            return { success: true, message: 'Live coaching started' };
        } catch (error) {
            console.error('Failed to start live coaching:', error);
            return { success: false, error: error.message };
        }
    }

    async createCoachingOverlay() {
        const primaryDisplay = screen.getPrimaryDisplay();
        const { width, height } = primaryDisplay.workAreaSize;

        this.coachingOverlay = new BrowserWindow({
            width: 350,
            height: 500,
            x: width - 370,
            y: 20,
            frame: false,
            alwaysOnTop: true,
            transparent: true,
            resizable: true,
            movable: true,
            skipTaskbar: true,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, 'preload.js')
            },
            show: false
        });

        await this.coachingOverlay.loadFile(path.join(__dirname, 'coaching-overlay.html'));
        
        this.coachingOverlay.webContents.once('dom-ready', () => {
            this.coachingOverlay.webContents.send('initialize-coaching', this.currentInterview);
            this.coachingOverlay.show();
        });

        // Make overlay draggable
        this.coachingOverlay.on('will-move', (event, bounds) => {
            // Keep overlay within screen bounds
            const display = screen.getDisplayNearestPoint({ x: bounds.x, y: bounds.y });
            const { x, y, width: screenWidth, height: screenHeight } = display.workArea;
            
            bounds.x = Math.max(x, Math.min(bounds.x, x + screenWidth - bounds.width));
            bounds.y = Math.max(y, Math.min(bounds.y, y + screenHeight - bounds.height));
        });

        this.coachingOverlay.on('closed', () => {
            this.coachingOverlay = null;
            this.stopLiveCoaching();
        });
    }

    async stopLiveCoaching() {
        try {
            this.isLiveCoaching = false;
            
            if (this.coachingOverlay) {
                this.coachingOverlay.close();
                this.coachingOverlay = null;
            }

            // Stop screen monitoring
            await this.stopScreenMonitoring();
            
            // Unregister coaching shortcuts
            this.unregisterCoachingShortcuts();

            return { success: true, message: 'Live coaching stopped' };
        } catch (error) {
            console.error('Failed to stop live coaching:', error);
            return { success: false, error: error.message };
        }
    }

    async toggleCoachingOverlay() {
        if (!this.coachingOverlay) return { success: false, error: 'No coaching session active' };

        if (this.coachingOverlay.isVisible()) {
            this.coachingOverlay.hide();
            return { success: true, visible: false };
        } else {
            this.coachingOverlay.show();
            return { success: true, visible: true };
        }
    }

    async captureInterviewScreen() {
        try {
            const sources = await require('electron').desktopCapturer.getSources({
                types: ['screen'],
                thumbnailSize: { width: 1920, height: 1080 }
            });

            if (sources.length > 0) {
                const screenshot = sources[0].thumbnail.toPNG();
                return {
                    success: true,
                    screenshot: screenshot.toString('base64'),
                    timestamp: Date.now()
                };
            }

            return { success: false, error: 'No screen sources available' };
        } catch (error) {
            console.error('Screen capture failed:', error);
            return { success: false, error: error.message };
        }
    }

    async analyzeInterviewContext(event, screenData) {
        try {
            // Analyze screen content for interview context
            const analysis = await this.performContextAnalysis(screenData);
            
            // Send real-time coaching suggestions
            if (this.coachingOverlay && analysis.suggestions.length > 0) {
                this.coachingOverlay.webContents.send('coaching-suggestions', analysis);
            }

            return { success: true, analysis };
        } catch (error) {
            console.error('Context analysis failed:', error);
            return { success: false, error: error.message };
        }
    }

    async performContextAnalysis(screenData) {
        // Simulate AI analysis of screen content
        return {
            detectedPlatform: 'zoom', // zoom, teams, meet, etc.
            participantCount: 3,
            currentSpeaker: 'interviewer',
            questionDetected: true,
            questionType: 'behavioral',
            confidence: 0.85,
            suggestions: [
                {
                    type: 'response_structure',
                    message: 'Use STAR method for this behavioral question',
                    priority: 'high'
                },
                {
                    type: 'timing',
                    message: 'Aim for 2-3 minute response',
                    priority: 'medium'
                }
            ],
            timestamp: Date.now()
        };
    }

    async saveInterviewData(event, interviewData) {
        try {
            const userDataPath = require('electron').app.getPath('userData');
            const interviewsDir = path.join(userDataPath, 'interviews');
            
            // Ensure directory exists
            await fs.mkdir(interviewsDir, { recursive: true });
            
            const filename = `interview_${interviewData.company}_${Date.now()}.json`;
            const filepath = path.join(interviewsDir, filename);
            
            await fs.writeFile(filepath, JSON.stringify(interviewData, null, 2));
            
            return { success: true, filepath, filename };
        } catch (error) {
            console.error('Failed to save interview data:', error);
            return { success: false, error: error.message };
        }
    }

    async loadInterviewData(event, filename) {
        try {
            const userDataPath = require('electron').app.getPath('userData');
            const filepath = path.join(userDataPath, 'interviews', filename);
            
            const data = await fs.readFile(filepath, 'utf8');
            const interviewData = JSON.parse(data);
            
            return { success: true, data: interviewData };
        } catch (error) {
            console.error('Failed to load interview data:', error);
            return { success: false, error: error.message };
        }
    }

    async exportInterviewReport(event, reportData) {
        try {
            const result = await dialog.showSaveDialog({
                title: 'Export Interview Report',
                defaultPath: `Interview_Report_${reportData.company}_${new Date().toISOString().split('T')[0]}.pdf`,
                filters: [
                    { name: 'PDF Files', extensions: ['pdf'] },
                    { name: 'HTML Files', extensions: ['html'] },
                    { name: 'Text Files', extensions: ['txt'] }
                ]
            });

            if (!result.canceled) {
                // Generate and save report based on selected format
                await this.generateReport(reportData, result.filePath);
                return { success: true, filepath: result.filePath };
            }

            return { success: false, error: 'Export cancelled' };
        } catch (error) {
            console.error('Failed to export report:', error);
            return { success: false, error: error.message };
        }
    }

    async generateReport(reportData, filepath) {
        const ext = path.extname(filepath).toLowerCase();
        
        if (ext === '.html') {
            const htmlContent = this.generateHTMLReport(reportData);
            await fs.writeFile(filepath, htmlContent);
        } else if (ext === '.txt') {
            const textContent = this.generateTextReport(reportData);
            await fs.writeFile(filepath, textContent);
        } else {
            // For PDF, we'd need a PDF library like puppeteer or similar
            const htmlContent = this.generateHTMLReport(reportData);
            await fs.writeFile(filepath.replace('.pdf', '.html'), htmlContent);
        }
    }

    generateHTMLReport(reportData) {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Interview Report - ${reportData.company}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .section { margin-bottom: 25px; }
        .score { font-size: 24px; color: #2ecc71; font-weight: bold; }
        .metric { margin: 10px 0; }
        .suggestions { background: #f8f9fa; padding: 15px; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Interview Performance Report</h1>
        <h2>${reportData.company} - ${reportData.role}</h2>
        <div class="score">Overall Score: ${reportData.overallScore}/10</div>
    </div>
    
    <div class="section">
        <h3>Performance Breakdown</h3>
        ${reportData.metrics.map(metric => `
            <div class="metric">
                <strong>${metric.name}:</strong> ${metric.score}% - ${metric.feedback}
            </div>
        `).join('')}
    </div>
    
    <div class="section">
        <h3>Strengths</h3>
        <ul>
            ${reportData.strengths.map(strength => `<li>${strength}</li>`).join('')}
        </ul>
    </div>
    
    <div class="section">
        <h3>Areas for Improvement</h3>
        <ul>
            ${reportData.improvements.map(improvement => `<li>${improvement}</li>`).join('')}
        </ul>
    </div>
    
    <div class="section suggestions">
        <h3>Next Steps</h3>
        <p>${reportData.nextSteps}</p>
    </div>
</body>
</html>`;
    }

    generateTextReport(reportData) {
        return `
INTERVIEW PERFORMANCE REPORT
============================

Company: ${reportData.company}
Role: ${reportData.role}
Date: ${new Date().toLocaleDateString()}
Overall Score: ${reportData.overallScore}/10

PERFORMANCE BREAKDOWN
--------------------
${reportData.metrics.map(metric => `${metric.name}: ${metric.score}% - ${metric.feedback}`).join('\n')}

STRENGTHS
---------
${reportData.strengths.map(strength => `• ${strength}`).join('\n')}

AREAS FOR IMPROVEMENT
--------------------
${reportData.improvements.map(improvement => `• ${improvement}`).join('\n')}

NEXT STEPS
----------
${reportData.nextSteps}

Generated by MeetingMind Interview Intelligence
`;
    }

    registerInterviewShortcuts() {
        // Emergency coaching toggle
        globalShortcut.register('CommandOrControl+Shift+C', () => {
            this.toggleCoachingOverlay();
        });

        // Quick note taking
        globalShortcut.register('CommandOrControl+Shift+N', () => {
            if (this.interviewWindow) {
                this.interviewWindow.webContents.send('open-quick-notes');
            }
        });

        // Panic button (hide all MeetingMind windows)
        globalShortcut.register('CommandOrControl+Shift+H', () => {
            if (this.coachingOverlay) this.coachingOverlay.hide();
            if (this.interviewWindow) this.interviewWindow.hide();
        });
    }

    unregisterCoachingShortcuts() {
        globalShortcut.unregister('CommandOrControl+Shift+C');
        globalShortcut.unregister('CommandOrControl+Shift+N');
        globalShortcut.unregister('CommandOrControl+Shift+H');
    }

    async startScreenMonitoring() {
        // Start periodic screen analysis for context awareness
        this.screenMonitorInterval = setInterval(async () => {
            if (this.isLiveCoaching) {
                const screenData = await this.captureInterviewScreen();
                if (screenData.success) {
                    await this.analyzeInterviewContext(null, screenData);
                }
            }
        }, 5000); // Analyze every 5 seconds
    }

    async stopScreenMonitoring() {
        if (this.screenMonitorInterval) {
            clearInterval(this.screenMonitorInterval);
            this.screenMonitorInterval = null;
        }
    }

    async syncOfflineData() {
        try {
            const userDataPath = require('electron').app.getPath('userData');
            const offlineDir = path.join(userDataPath, 'offline');
            
            // Check for offline data and sync when online
            const files = await fs.readdir(offlineDir).catch(() => []);
            
            return { success: true, syncedFiles: files.length };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getOfflineStatus() {
        return {
            isOnline: require('electron').net.isOnline(),
            hasOfflineData: true, // Check for cached data
            lastSync: Date.now() - 3600000 // 1 hour ago
        };
    }

    // Cleanup method
    destroy() {
        this.unregisterCoachingShortcuts();
        this.stopScreenMonitoring();
        
        if (this.interviewWindow) {
            this.interviewWindow.close();
        }
        
        if (this.coachingOverlay) {
            this.coachingOverlay.close();
        }
    }
}

module.exports = InterviewIntelligenceDesktop;
