/**
 * System Integration Orchestrator
 * 
 * Master orchestrator that coordinates all MeetingMind system components,
 * manages system lifecycle, handles graceful startup/shutdown, and ensures
 * optimal performance across all integrated services.
 */

const EventEmitter = require('events');

// Import all system components
const { ContextualAnalysisService } = require('../backend/services/contextual-analysis');
const { TripleAIClient } = require('../backend/ai/triple-ai-client');
const { SuggestionEngine } = require('../features/contextual-intelligence/suggestion-engine');
const { IntelligenceOrchestrator } = require('../backend/services/intelligence-orchestrator');
const { MeetingMemoryService } = require('../backend/services/meeting-memory-service');
const { CrossMeetingIntelligence } = require('../backend/services/cross-meeting-intelligence');
const { OpportunityDetectionEngine } = require('../backend/services/opportunity-detection-engine');
const { PostMeetingAnalysis } = require('../backend/services/post-meeting-analysis');
const { AICoachingEngine } = require('../backend/services/ai-coaching-engine');
const { KnowledgeBaseService } = require('../backend/services/knowledge-base-service');
const { UnifiedIntelligenceHub } = require('../backend/services/unified-intelligence-hub');
const { IntelligenceSynthesizer } = require('../backend/ai/intelligence-synthesizer');
const { EnterpriseSecurityFramework } = require('../backend/security/enterprise-security-framework');
const { MultiTenantArchitecture } = require('../backend/enterprise/multi-tenant-architecture');
const { PerformanceOptimizationEngine } = require('../backend/performance/performance-optimization-engine');
const { RealTimeMonitoringDashboard } = require('../backend/monitoring/real-time-monitoring-dashboard');
const { IntegrationTestingFramework } = require('../testing/integration-testing-framework');

class SystemIntegrationOrchestrator extends EventEmitter {
  constructor() {
    super();
    
    // System components registry
    this.components = new Map();
    this.componentStatus = new Map();
    this.componentDependencies = new Map();
    this.componentMetrics = new Map();
    
    // System state management
    this.systemState = 'stopped';
    this.startupSequence = [];
    this.shutdownSequence = [];
    this.healthCheckInterval = null;
    this.metricsCollectionInterval = null;
    
    // System configuration
    this.systemConfig = {
      startupTimeout: 300000, // 5 minutes
      shutdownTimeout: 60000, // 1 minute
      healthCheckInterval: 30000, // 30 seconds
      metricsInterval: 10000, // 10 seconds
      maxRetries: 3,
      gracefulShutdownDelay: 5000 // 5 seconds
    };

    // System metrics
    this.systemMetrics = {
      startTime: null,
      uptime: 0,
      totalRequests: 0,
      totalErrors: 0,
      averageResponseTime: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      activeConnections: 0,
      systemHealth: 100
    };

    // Initialize orchestrator
    this.initializeOrchestrator();
  }

  /**
   * Initialize system orchestrator
   */
  initializeOrchestrator() {
    console.log('Initializing System Integration Orchestrator...');
    
    // Register all system components
    this.registerSystemComponents();
    
    // Define component dependencies
    this.defineComponentDependencies();
    
    // Create startup and shutdown sequences
    this.createStartupSequence();
    this.createShutdownSequence();
    
    // Set up event handlers
    this.setupEventHandlers();
    
    console.log('System Integration Orchestrator initialized');
  }

  /**
   * Register all system components
   */
  registerSystemComponents() {
    console.log('Registering system components...');

    // Core AI Components
    this.registerComponent('triple-ai-client', TripleAIClient, {
      category: 'ai',
      priority: 1,
      critical: true,
      dependencies: []
    });

    this.registerComponent('contextual-analysis', ContextualAnalysisService, {
      category: 'ai',
      priority: 2,
      critical: true,
      dependencies: ['triple-ai-client']
    });

    this.registerComponent('suggestion-engine', SuggestionEngine, {
      category: 'intelligence',
      priority: 3,
      critical: true,
      dependencies: ['contextual-analysis']
    });

    this.registerComponent('intelligence-orchestrator', IntelligenceOrchestrator, {
      category: 'intelligence',
      priority: 4,
      critical: true,
      dependencies: ['suggestion-engine']
    });

    // Memory and Analytics Components
    this.registerComponent('meeting-memory-service', MeetingMemoryService, {
      category: 'memory',
      priority: 5,
      critical: true,
      dependencies: ['intelligence-orchestrator']
    });

    this.registerComponent('cross-meeting-intelligence', CrossMeetingIntelligence, {
      category: 'intelligence',
      priority: 6,
      critical: true,
      dependencies: ['meeting-memory-service']
    });

    this.registerComponent('opportunity-detection-engine', OpportunityDetectionEngine, {
      category: 'analytics',
      priority: 7,
      critical: true,
      dependencies: ['cross-meeting-intelligence']
    });

    this.registerComponent('post-meeting-analysis', PostMeetingAnalysis, {
      category: 'analytics',
      priority: 8,
      critical: true,
      dependencies: ['opportunity-detection-engine']
    });

    // Advanced AI Components
    this.registerComponent('ai-coaching-engine', AICoachingEngine, {
      category: 'ai',
      priority: 9,
      critical: true,
      dependencies: ['post-meeting-analysis']
    });

    this.registerComponent('knowledge-base-service', KnowledgeBaseService, {
      category: 'knowledge',
      priority: 10,
      critical: true,
      dependencies: ['ai-coaching-engine']
    });

    this.registerComponent('intelligence-synthesizer', IntelligenceSynthesizer, {
      category: 'ai',
      priority: 11,
      critical: true,
      dependencies: ['knowledge-base-service']
    });

    this.registerComponent('unified-intelligence-hub', UnifiedIntelligenceHub, {
      category: 'intelligence',
      priority: 12,
      critical: true,
      dependencies: ['intelligence-synthesizer']
    });

    // Enterprise Components
    this.registerComponent('enterprise-security-framework', EnterpriseSecurityFramework, {
      category: 'security',
      priority: 13,
      critical: true,
      dependencies: []
    });

    this.registerComponent('multi-tenant-architecture', MultiTenantArchitecture, {
      category: 'enterprise',
      priority: 14,
      critical: true,
      dependencies: ['enterprise-security-framework']
    });

    // Performance and Monitoring Components
    this.registerComponent('performance-optimization-engine', PerformanceOptimizationEngine, {
      category: 'performance',
      priority: 15,
      critical: true,
      dependencies: ['multi-tenant-architecture']
    });

    this.registerComponent('real-time-monitoring-dashboard', RealTimeMonitoringDashboard, {
      category: 'monitoring',
      priority: 16,
      critical: true,
      dependencies: ['performance-optimization-engine']
    });

    // Testing Framework
    this.registerComponent('integration-testing-framework', IntegrationTestingFramework, {
      category: 'testing',
      priority: 17,
      critical: false,
      dependencies: []
    });

    console.log(`Registered ${this.components.size} system components`);
  }

  /**
   * Register individual component
   */
  registerComponent(name, ComponentClass, config) {
    try {
      const component = {
        name,
        class: ComponentClass,
        instance: null,
        config,
        status: 'registered',
        lastHealthCheck: null,
        metrics: {
          startTime: null,
          requests: 0,
          errors: 0,
          averageResponseTime: 0
        }
      };

      this.components.set(name, component);
      this.componentStatus.set(name, 'registered');
      this.componentDependencies.set(name, config.dependencies || []);

      console.log(`Registered component: ${name}`);

    } catch (error) {
      console.error(`Error registering component ${name}:`, error);
      throw error;
    }
  }

  /**
   * Define component dependencies
   */
  defineComponentDependencies() {
    console.log('Defining component dependencies...');
    
    // Dependencies are already defined during registration
    // This method can be used for additional dependency validation
    
    for (const [componentName, dependencies] of this.componentDependencies) {
      for (const dependency of dependencies) {
        if (!this.components.has(dependency)) {
          throw new Error(`Component ${componentName} depends on ${dependency}, but ${dependency} is not registered`);
        }
      }
    }

    console.log('Component dependencies validated');
  }

  /**
   * Create startup sequence based on dependencies
   */
  createStartupSequence() {
    console.log('Creating startup sequence...');
    
    const sequence = [];
    const visited = new Set();
    const visiting = new Set();

    const visit = (componentName) => {
      if (visiting.has(componentName)) {
        throw new Error(`Circular dependency detected involving ${componentName}`);
      }
      
      if (visited.has(componentName)) {
        return;
      }

      visiting.add(componentName);
      
      const dependencies = this.componentDependencies.get(componentName) || [];
      for (const dependency of dependencies) {
        visit(dependency);
      }
      
      visiting.delete(componentName);
      visited.add(componentName);
      sequence.push(componentName);
    };

    // Visit all components to create topological order
    for (const componentName of this.components.keys()) {
      visit(componentName);
    }

    this.startupSequence = sequence;
    this.shutdownSequence = [...sequence].reverse();

    console.log(`Startup sequence created: ${sequence.join(' -> ')}`);
  }

  /**
   * Create shutdown sequence (reverse of startup)
   */
  createShutdownSequence() {
    this.shutdownSequence = [...this.startupSequence].reverse();
    console.log(`Shutdown sequence created: ${this.shutdownSequence.join(' -> ')}`);
  }

  /**
   * Start entire system
   */
  async startSystem() {
    try {
      console.log('Starting MeetingMind System...');
      this.systemState = 'starting';
      this.systemMetrics.startTime = new Date();

      const startTime = Date.now();

      // Start components in dependency order
      for (const componentName of this.startupSequence) {
        await this.startComponent(componentName);
      }

      // Start system monitoring
      await this.startSystemMonitoring();

      // Perform system health check
      await this.performSystemHealthCheck();

      // Run integration tests if enabled
      if (process.env.RUN_INTEGRATION_TESTS === 'true') {
        await this.runIntegrationTests();
      }

      const startupTime = Date.now() - startTime;
      this.systemState = 'running';

      console.log(`MeetingMind System started successfully in ${startupTime}ms`);
      this.emit('system_started', {
        startupTime,
        componentsStarted: this.startupSequence.length,
        timestamp: new Date()
      });

      return {
        success: true,
        startupTime,
        componentsStarted: this.startupSequence.length,
        systemState: this.systemState
      };

    } catch (error) {
      console.error('Error starting system:', error);
      this.systemState = 'error';
      
      // Attempt graceful shutdown of started components
      await this.stopSystem();
      
      throw error;
    }
  }

  /**
   * Start individual component
   */
  async startComponent(componentName) {
    try {
      const component = this.components.get(componentName);
      if (!component) {
        throw new Error(`Component ${componentName} not found`);
      }

      console.log(`Starting component: ${componentName}`);
      
      // Check dependencies are started
      for (const dependency of component.config.dependencies) {
        const depStatus = this.componentStatus.get(dependency);
        if (depStatus !== 'running') {
          throw new Error(`Dependency ${dependency} is not running (status: ${depStatus})`);
        }
      }

      // Create component instance
      component.instance = new component.class();
      component.metrics.startTime = new Date();

      // Start component with timeout
      const startPromise = this.startComponentWithTimeout(component);
      await startPromise;

      this.componentStatus.set(componentName, 'running');
      component.status = 'running';

      console.log(`Component ${componentName} started successfully`);

    } catch (error) {
      console.error(`Error starting component ${componentName}:`, error);
      this.componentStatus.set(componentName, 'error');
      throw error;
    }
  }

  /**
   * Start component with timeout
   */
  async startComponentWithTimeout(component) {
    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Component ${component.name} startup timeout`));
      }, this.systemConfig.startupTimeout);

      try {
        // Check if component has start method
        if (typeof component.instance.start === 'function') {
          await component.instance.start();
        } else if (typeof component.instance.initialize === 'function') {
          await component.instance.initialize();
        } else if (typeof component.instance.startOptimization === 'function') {
          await component.instance.startOptimization();
        } else if (typeof component.instance.startMonitoring === 'function') {
          await component.instance.startMonitoring();
        }

        clearTimeout(timeout);
        resolve();

      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  /**
   * Stop entire system
   */
  async stopSystem() {
    try {
      console.log('Stopping MeetingMind System...');
      this.systemState = 'stopping';

      // Stop system monitoring
      this.stopSystemMonitoring();

      // Stop components in reverse order
      for (const componentName of this.shutdownSequence) {
        await this.stopComponent(componentName);
      }

      this.systemState = 'stopped';
      console.log('MeetingMind System stopped successfully');

      this.emit('system_stopped', { timestamp: new Date() });

      return {
        success: true,
        systemState: this.systemState
      };

    } catch (error) {
      console.error('Error stopping system:', error);
      this.systemState = 'error';
      throw error;
    }
  }

  /**
   * Stop individual component
   */
  async stopComponent(componentName) {
    try {
      const component = this.components.get(componentName);
      if (!component || !component.instance) {
        return;
      }

      console.log(`Stopping component: ${componentName}`);

      // Stop component with timeout
      const stopPromise = this.stopComponentWithTimeout(component);
      await stopPromise;

      component.instance = null;
      this.componentStatus.set(componentName, 'stopped');
      component.status = 'stopped';

      console.log(`Component ${componentName} stopped successfully`);

    } catch (error) {
      console.error(`Error stopping component ${componentName}:`, error);
      this.componentStatus.set(componentName, 'error');
    }
  }

  /**
   * Stop component with timeout
   */
  async stopComponentWithTimeout(component) {
    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        console.warn(`Component ${component.name} shutdown timeout, forcing stop`);
        resolve(); // Don't reject, just warn and continue
      }, this.systemConfig.shutdownTimeout);

      try {
        // Check if component has stop method
        if (typeof component.instance.stop === 'function') {
          await component.instance.stop();
        } else if (typeof component.instance.shutdown === 'function') {
          await component.instance.shutdown();
        }

        clearTimeout(timeout);
        resolve();

      } catch (error) {
        clearTimeout(timeout);
        console.warn(`Error stopping component ${component.name}:`, error);
        resolve(); // Don't reject, just warn and continue
      }
    });
  }

  /**
   * Start system monitoring
   */
  async startSystemMonitoring() {
    console.log('Starting system monitoring...');

    // Health check interval
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.performSystemHealthCheck();
      } catch (error) {
        console.error('Error during health check:', error);
      }
    }, this.systemConfig.healthCheckInterval);

    // Metrics collection interval
    this.metricsCollectionInterval = setInterval(async () => {
      try {
        await this.collectSystemMetrics();
      } catch (error) {
        console.error('Error collecting metrics:', error);
      }
    }, this.systemConfig.metricsInterval);

    console.log('System monitoring started');
  }

  /**
   * Stop system monitoring
   */
  stopSystemMonitoring() {
    console.log('Stopping system monitoring...');

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    if (this.metricsCollectionInterval) {
      clearInterval(this.metricsCollectionInterval);
      this.metricsCollectionInterval = null;
    }

    console.log('System monitoring stopped');
  }

  /**
   * Perform system health check
   */
  async performSystemHealthCheck() {
    try {
      const healthResults = new Map();
      let overallHealth = 100;
      let unhealthyComponents = 0;

      for (const [componentName, component] of this.components) {
        try {
          const health = await this.checkComponentHealth(component);
          healthResults.set(componentName, health);
          
          if (!health.healthy) {
            unhealthyComponents++;
            overallHealth -= (100 / this.components.size);
          }

          component.lastHealthCheck = new Date();

        } catch (error) {
          healthResults.set(componentName, {
            healthy: false,
            error: error.message,
            timestamp: new Date()
          });
          unhealthyComponents++;
          overallHealth -= (100 / this.components.size);
        }
      }

      this.systemMetrics.systemHealth = Math.max(0, overallHealth);
      this.systemMetrics.uptime = Date.now() - this.systemMetrics.startTime?.getTime() || 0;

      // Emit health check results
      this.emit('health_check_completed', {
        overallHealth: this.systemMetrics.systemHealth,
        unhealthyComponents,
        totalComponents: this.components.size,
        results: Object.fromEntries(healthResults),
        timestamp: new Date()
      });

      return {
        overallHealth: this.systemMetrics.systemHealth,
        unhealthyComponents,
        totalComponents: this.components.size,
        results: healthResults
      };

    } catch (error) {
      console.error('Error performing system health check:', error);
      return {
        overallHealth: 0,
        error: error.message
      };
    }
  }

  /**
   * Check individual component health
   */
  async checkComponentHealth(component) {
    try {
      if (!component.instance) {
        return {
          healthy: false,
          reason: 'Component instance not available',
          timestamp: new Date()
        };
      }

      // Check if component has health check method
      if (typeof component.instance.healthCheck === 'function') {
        const health = await component.instance.healthCheck();
        return {
          healthy: health.healthy !== false,
          ...health,
          timestamp: new Date()
        };
      }

      // Default health check - component is healthy if it's running
      return {
        healthy: component.status === 'running',
        status: component.status,
        timestamp: new Date()
      };

    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  /**
   * Collect system metrics
   */
  async collectSystemMetrics() {
    try {
      // Update uptime
      this.systemMetrics.uptime = Date.now() - (this.systemMetrics.startTime?.getTime() || Date.now());

      // Collect component metrics
      for (const [componentName, component] of this.components) {
        if (component.instance && typeof component.instance.getMetrics === 'function') {
          try {
            const metrics = await component.instance.getMetrics();
            this.componentMetrics.set(componentName, {
              ...metrics,
              timestamp: new Date()
            });
          } catch (error) {
            console.warn(`Error collecting metrics for ${componentName}:`, error);
          }
        }
      }

      // Calculate system-wide metrics
      await this.calculateSystemMetrics();

      // Emit metrics update
      this.emit('metrics_updated', {
        systemMetrics: this.systemMetrics,
        componentMetrics: Object.fromEntries(this.componentMetrics),
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error collecting system metrics:', error);
    }
  }

  /**
   * Calculate system-wide metrics
   */
  async calculateSystemMetrics() {
    try {
      let totalRequests = 0;
      let totalErrors = 0;
      let totalResponseTime = 0;
      let responseTimeCount = 0;

      for (const [componentName, metrics] of this.componentMetrics) {
        if (metrics.requests) totalRequests += metrics.requests;
        if (metrics.errors) totalErrors += metrics.errors;
        if (metrics.averageResponseTime) {
          totalResponseTime += metrics.averageResponseTime;
          responseTimeCount++;
        }
      }

      this.systemMetrics.totalRequests = totalRequests;
      this.systemMetrics.totalErrors = totalErrors;
      this.systemMetrics.averageResponseTime = responseTimeCount > 0 ? 
        totalResponseTime / responseTimeCount : 0;

      // Get system resource metrics (mock implementation)
      this.systemMetrics.memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024; // MB
      this.systemMetrics.cpuUsage = Math.random() * 50 + 20; // Mock CPU usage

    } catch (error) {
      console.error('Error calculating system metrics:', error);
    }
  }

  /**
   * Run integration tests
   */
  async runIntegrationTests() {
    try {
      console.log('Running integration tests...');

      const testingFramework = this.components.get('integration-testing-framework');
      if (!testingFramework?.instance) {
        console.warn('Integration testing framework not available');
        return;
      }

      const testResults = await testingFramework.instance.runComprehensiveTests();
      
      this.emit('integration_tests_completed', {
        testResults,
        timestamp: new Date()
      });

      console.log(`Integration tests completed: ${testResults.success ? 'PASSED' : 'FAILED'}`);

      return testResults;

    } catch (error) {
      console.error('Error running integration tests:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get system status
   */
  getSystemStatus() {
    const componentStatuses = {};
    for (const [name, status] of this.componentStatus) {
      componentStatuses[name] = status;
    }

    return {
      systemState: this.systemState,
      systemHealth: this.systemMetrics.systemHealth,
      uptime: this.systemMetrics.uptime,
      totalComponents: this.components.size,
      runningComponents: Array.from(this.componentStatus.values()).filter(s => s === 'running').length,
      componentStatuses,
      systemMetrics: this.systemMetrics,
      timestamp: new Date()
    };
  }

  /**
   * Get component details
   */
  getComponentDetails(componentName) {
    const component = this.components.get(componentName);
    if (!component) {
      return null;
    }

    return {
      name: componentName,
      status: component.status,
      config: component.config,
      metrics: component.metrics,
      lastHealthCheck: component.lastHealthCheck,
      dependencies: this.componentDependencies.get(componentName) || []
    };
  }

  /**
   * Restart component
   */
  async restartComponent(componentName) {
    try {
      console.log(`Restarting component: ${componentName}`);

      await this.stopComponent(componentName);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      await this.startComponent(componentName);

      console.log(`Component ${componentName} restarted successfully`);

      this.emit('component_restarted', {
        componentName,
        timestamp: new Date()
      });

      return {
        success: true,
        componentName,
        status: this.componentStatus.get(componentName)
      };

    } catch (error) {
      console.error(`Error restarting component ${componentName}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    this.on('system_started', (data) => {
      console.log(`System started successfully in ${data.startupTime}ms`);
    });

    this.on('system_stopped', (data) => {
      console.log('System stopped successfully');
    });

    this.on('health_check_completed', (data) => {
      if (data.unhealthyComponents > 0) {
        console.warn(`Health check: ${data.unhealthyComponents}/${data.totalComponents} components unhealthy`);
      }
    });

    this.on('component_restarted', (data) => {
      console.log(`Component ${data.componentName} restarted`);
    });

    // Handle process signals for graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('Received SIGTERM, initiating graceful shutdown...');
      await this.stopSystem();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('Received SIGINT, initiating graceful shutdown...');
      await this.stopSystem();
      process.exit(0);
    });

    process.on('uncaughtException', async (error) => {
      console.error('Uncaught exception:', error);
      await this.stopSystem();
      process.exit(1);
    });

    process.on('unhandledRejection', async (reason, promise) => {
      console.error('Unhandled rejection at:', promise, 'reason:', reason);
      await this.stopSystem();
      process.exit(1);
    });
  }
}

module.exports = {
  SystemIntegrationOrchestrator
};
