/**
 * Session Initialization Script
 * Handles memory system startup and context loading
 */

const { MemoryManager } = require('./memoryManager');
const { ContextEngineer } = require('./contextEngineer');
const fs = require('fs').promises;
const path = require('path');

class SessionInitializer {
  constructor(config = {}) {
    this.memoryManager = config.memoryManager || new MemoryManager(config);
    this.contextEngineer = config.contextEngineer || new ContextEngineer({
      memoryManager: this.memoryManager,
      ...config
    });
    this.logger = config.logger || console;
  }

  /**
   * Initialize session with current context
   */
  async initializeSession(sessionConfig = {}) {
    try {
      this.logger.info('Starting session initialization...');

      // Load project overview
      await this.loadProjectOverview();

      // Check active tasks
      await this.loadActiveTasks();

      // Review recent decisions
      await this.loadRecentDecisions();

      // Initialize context with user preferences
      await this.loadUserPreferences();

      // Update session context
      await this.updateSessionContext(sessionConfig);

      this.logger.info('Session initialization completed successfully');
      
      return {
        success: true,
        sessionId: this.generateSessionId(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Session initialization failed:', error);
      throw error;
    }
  }

  /**
   * Load project overview from core memory
   */
  async loadProjectOverview() {
    try {
      const projectOverview = await this.memoryManager.retrieve('00-project-overview');
      
      if (projectOverview) {
        this.logger.info('Project overview loaded', {
          project: 'Job Copilot Browser Assistant',
          architecture: 'Chrome Extension + Node.js Backend'
        });
      } else {
        this.logger.warn('Project overview not found in memory');
      }
    } catch (error) {
      this.logger.error('Failed to load project overview:', error);
    }
  }

  /**
   * Load active tasks from session memory
   */
  async loadActiveTasks() {
    try {
      const activeTasks = await this.memoryManager.retrieve('active-tasks');
      
      if (activeTasks) {
        this.logger.info('Active tasks loaded', {
          totalTasks: this.countTasks(activeTasks.content),
          currentFocus: this.getCurrentFocus(activeTasks.content)
        });
      } else {
        this.logger.warn('Active tasks not found in memory');
      }
    } catch (error) {
      this.logger.error('Failed to load active tasks:', error);
    }
  }

  /**
   * Load recent decisions from persistent memory
   */
  async loadRecentDecisions() {
    try {
      const recentDecisions = await this.memoryManager.search('decision', {
        type: 'persistent',
        limit: 5,
        minRelevanceScore: 0.5
      });

      this.logger.info('Recent decisions loaded', {
        count: recentDecisions.length,
        topics: recentDecisions.map(d => d.metadata.tags?.[0] || 'general')
      });
    } catch (error) {
      this.logger.error('Failed to load recent decisions:', error);
    }
  }

  /**
   * Load user preferences from core memory
   */
  async loadUserPreferences() {
    try {
      const userPreferences = await this.memoryManager.retrieve('02-user-preferences');
      
      if (userPreferences) {
        this.logger.info('User preferences loaded', {
          codeStyle: 'ES6+ JavaScript',
          architecture: 'Service-based',
          testing: 'High coverage (90%+)'
        });
      } else {
        this.logger.warn('User preferences not found in memory');
      }
    } catch (error) {
      this.logger.error('Failed to load user preferences:', error);
    }
  }

  /**
   * Update session context with current information
   */
  async updateSessionContext(sessionConfig) {
    try {
      const sessionContext = {
        sessionStart: new Date().toISOString(),
        developmentEnvironment: {
          os: process.platform,
          nodeVersion: process.version,
          workingDirectory: process.cwd()
        },
        currentFocus: sessionConfig.currentFocus || 'Memory Scaffolding Implementation',
        activeFeatures: sessionConfig.activeFeatures || ['memory-system', 'context-engineering'],
        pendingTasks: sessionConfig.pendingTasks || [],
        recentChanges: sessionConfig.recentChanges || []
      };

      await this.memoryManager.updateSessionContext('current-context', 
        this.formatSessionContext(sessionContext)
      );

      this.logger.info('Session context updated', {
        currentFocus: sessionContext.currentFocus,
        activeFeatures: sessionContext.activeFeatures.length
      });
    } catch (error) {
      this.logger.error('Failed to update session context:', error);
    }
  }

  /**
   * Format session context for storage
   */
  formatSessionContext(context) {
    return `# Current Session Context

## Session Start: ${context.sessionStart}
**Focus**: ${context.currentFocus}

## Development Environment
- **OS**: ${context.developmentEnvironment.os}
- **Node Version**: ${context.developmentEnvironment.nodeVersion}
- **Working Directory**: ${context.developmentEnvironment.workingDirectory}

## Active Development Tasks
${context.activeFeatures.map(feature => `- **${feature}**: In progress`).join('\n')}

## Pending Tasks
${context.pendingTasks.map(task => `- [ ] ${task}`).join('\n')}

## Recent Changes
${context.recentChanges.map(change => `- ${change}`).join('\n')}

## Context Priorities
- **High**: Memory system architecture and integration
- **Medium**: Performance optimization and testing
- **Low**: Documentation and deployment considerations

## Notes
- Memory system is being designed to integrate seamlessly with existing Job Copilot architecture
- Focus on privacy-first approach with local storage preference
- Prioritizing simplicity and maintainability over advanced features initially`;
  }

  /**
   * Count tasks in content
   */
  countTasks(content) {
    const taskMatches = content.match(/- \[ \]/g);
    return taskMatches ? taskMatches.length : 0;
  }

  /**
   * Get current focus from content
   */
  getCurrentFocus(content) {
    const focusMatch = content.match(/\*\*Focus\*\*: (.+)/);
    return focusMatch ? focusMatch[1] : 'Unknown';
  }

  /**
   * Generate session ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate memory system integrity
   */
  async validateMemorySystem() {
    try {
      this.logger.info('Validating memory system integrity...');

      const validationResults = {
        coreMemory: await this.validateCoreMemory(),
        persistentMemory: await this.validatePersistentMemory(),
        sessionMemory: await this.validateSessionMemory(),
        fileSystem: await this.validateFileSystem()
      };

      const allValid = Object.values(validationResults).every(result => result.valid);

      this.logger.info('Memory system validation completed', {
        valid: allValid,
        results: validationResults
      });

      return {
        valid: allValid,
        results: validationResults
      };
    } catch (error) {
      this.logger.error('Memory system validation failed:', error);
      throw error;
    }
  }

  /**
   * Validate core memory
   */
  async validateCoreMemory() {
    try {
      const coreFiles = ['00-project-overview', '01-architecture', '02-user-preferences'];
      const results = [];

      for (const file of coreFiles) {
        const memory = await this.memoryManager.retrieve(file);
        results.push({
          file,
          exists: !!memory,
          valid: !!memory && memory.content.length > 0
        });
      }

      return {
        valid: results.every(r => r.valid),
        results
      };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Validate persistent memory
   */
  async validatePersistentMemory() {
    try {
      const persistentMemories = await this.memoryManager.search('', {
        type: 'persistent',
        limit: 10
      });

      return {
        valid: persistentMemories.length > 0,
        count: persistentMemories.length,
        types: [...new Set(persistentMemories.map(m => m.metadata.tags?.[0] || 'unknown'))]
      };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Validate session memory
   */
  async validateSessionMemory() {
    try {
      const sessionContext = await this.memoryManager.getSessionContext();
      
      return {
        valid: Object.keys(sessionContext).length > 0,
        files: Object.keys(sessionContext),
        hasCurrentContext: 'current-context' in sessionContext,
        hasActiveTasks: 'active-tasks' in sessionContext
      };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Validate file system
   */
  async validateFileSystem() {
    try {
      const requiredDirs = ['core', 'persistent', 'session', 'external', 'utils'];
      const results = [];

      for (const dir of requiredDirs) {
        const dirPath = path.join(this.memoryManager.memoryBankRoot, dir);
        try {
          await fs.access(dirPath);
          results.push({ dir, exists: true });
        } catch (error) {
          results.push({ dir, exists: false });
        }
      }

      return {
        valid: results.every(r => r.exists),
        results
      };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Get session summary
   */
  async getSessionSummary() {
    try {
      const context = await this.contextEngineer.assembleContext('session-summary', {
        includeCoreMemory: true,
        includeSessionContext: true,
        includeRelevantMemory: false,
        maxTokens: 5000
      });

      const stats = await this.contextEngineer.getContextStats();

      return {
        context: {
          coreMemoryCount: context.coreMemory.length,
          sessionContextKeys: Object.keys(context.sessionContext),
          totalTokens: this.contextEngineer.estimateTokens(context)
        },
        stats: {
          totalMemories: stats.totalMemories,
          byType: stats.byType,
          averageRelevanceScore: stats.averageRelevanceScore
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to get session summary:', error);
      throw error;
    }
  }
}

module.exports = {
  SessionInitializer
};
