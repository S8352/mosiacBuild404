/**
 * Memory System Orchestrator
 * Coordinates all memory services and provides unified interface
 */

const { MemoryManager, MemoryBlock } = require('./memoryManager');
const { ContextEngineer } = require('./contextEngineer');
const { SessionInitializer } = require('./sessionInit');
const { MemoryAnalytics } = require('./memoryAnalytics');
const { MemoryOptimizer } = require('./memoryOptimizer');
const { MemoryBackup } = require('./memoryBackup');

class MemorySystem {
  constructor(config = {}) {
    this.config = {
      memoryBankRoot: './memory-bank',
      maxContextTokens: 128000,
      autoOptimize: true,
      autoBackup: true,
      optimizationInterval: 24, // hours
      backupInterval: 168, // hours (1 week)
      ...config
    };

    // Initialize all services
    this.memoryManager = new MemoryManager({
      memoryBankRoot: this.config.memoryBankRoot,
      logger: config.logger
    });

    this.contextEngineer = new ContextEngineer({
      memoryManager: this.memoryManager,
      maxContextTokens: this.config.maxContextTokens,
      logger: config.logger
    });

    this.sessionInitializer = new SessionInitializer({
      memoryManager: this.memoryManager,
      contextEngineer: this.contextEngineer,
      logger: config.logger
    });

    this.analytics = new MemoryAnalytics({
      memoryManager: this.memoryManager,
      contextEngineer: this.contextEngineer,
      logger: config.logger
    });

    this.optimizer = new MemoryOptimizer({
      memoryManager: this.memoryManager,
      analytics: this.analytics,
      logger: config.logger
    });

    this.backup = new MemoryBackup({
      memoryBankRoot: this.config.memoryBankRoot,
      logger: config.logger
    });

    this.logger = config.logger || console;
    this.isInitialized = false;
  }

  /**
   * Initialize the memory system
   */
  async initialize(sessionConfig = {}) {
    try {
      this.logger.info('Initializing Memory System...');

      // Initialize session
      const sessionResult = await this.sessionInitializer.initializeSession(sessionConfig);
      
      // Validate system integrity
      const validation = await this.sessionInitializer.validateMemorySystem();
      
      if (!validation.valid) {
        this.logger.warn('Memory system validation issues detected:', validation.results);
      }

      // Start background services if enabled
      if (this.config.autoOptimize) {
        this.optimizer.scheduleOptimization(this.config.optimizationInterval);
      }

      this.isInitialized = true;
      this.logger.info('Memory System initialized successfully', {
        sessionId: sessionResult.sessionId,
        validation: validation.valid
      });

      return {
        success: true,
        sessionId: sessionResult.sessionId,
        validation,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to initialize Memory System:', error);
      throw error;
    }
  }

  /**
   * Store a memory
   */
  async storeMemory(content, type = 'session', metadata = {}) {
    try {
      this.ensureInitialized();

      const memoryBlock = new MemoryBlock(type, content, metadata);
      const stored = await this.memoryManager.store(memoryBlock);
      
      // Track operation
      this.analytics.trackMemoryOperation('store', {
        memoryId: stored.id,
        type,
        contentLength: content.length
      });

      return stored;
    } catch (error) {
      this.logger.error('Failed to store memory:', error);
      throw error;
    }
  }

  /**
   * Retrieve a memory by ID
   */
  async retrieveMemory(id) {
    try {
      this.ensureInitialized();

      const memory = await this.memoryManager.retrieve(id);
      
      if (memory) {
        this.analytics.trackMemoryOperation('retrieve', {
          memoryId: id,
          type: memory.type
        });
      }

      return memory;
    } catch (error) {
      this.logger.error('Failed to retrieve memory:', error);
      throw error;
    }
  }

  /**
   * Search memories
   */
  async searchMemories(query, options = {}) {
    try {
      this.ensureInitialized();

      const startTime = Date.now();
      const results = await this.memoryManager.search(query, options);
      const duration = Date.now() - startTime;

      // Track search performance
      this.analytics.trackSearchPerformance(query, {
        duration,
        resultCount: results.length,
        options
      });

      return results;
    } catch (error) {
      this.logger.error('Failed to search memories:', error);
      throw error;
    }
  }

  /**
   * Update a memory
   */
  async updateMemory(id, content, metadata = {}) {
    try {
      this.ensureInitialized();

      const updated = await this.memoryManager.update(id, content, metadata);
      
      this.analytics.trackMemoryOperation('update', {
        memoryId: id,
        contentLength: content.length
      });

      return updated;
    } catch (error) {
      this.logger.error('Failed to update memory:', error);
      throw error;
    }
  }

  /**
   * Delete a memory
   */
  async deleteMemory(id) {
    try {
      this.ensureInitialized();

      const deleted = await this.memoryManager.delete(id);
      
      if (deleted) {
        this.analytics.trackMemoryOperation('delete', {
          memoryId: id
        });
      }

      return deleted;
    } catch (error) {
      this.logger.error('Failed to delete memory:', error);
      throw error;
    }
  }

  /**
   * Assemble context for current task
   */
  async assembleContext(task, options = {}) {
    try {
      this.ensureInitialized();

      const startTime = Date.now();
      const context = await this.contextEngineer.assembleContext(task, options);
      const duration = Date.now() - startTime;

      // Track context assembly performance
      this.analytics.trackContextAssemblyPerformance(task, {
        duration,
        options
      });

      return context;
    } catch (error) {
      this.logger.error('Failed to assemble context:', error);
      throw error;
    }
  }

  /**
   * Update session context
   */
  async updateSessionContext(key, content) {
    try {
      this.ensureInitialized();

      await this.sessionInitializer.updateSessionContext({
        [key]: content
      });

      this.analytics.trackMemoryOperation('updateSession', {
        key,
        contentLength: content.length
      });
    } catch (error) {
      this.logger.error('Failed to update session context:', error);
      throw error;
    }
  }

  /**
   * Get analytics report
   */
  async getAnalyticsReport() {
    try {
      this.ensureInitialized();

      return await this.analytics.getAnalyticsReport();
    } catch (error) {
      this.logger.error('Failed to get analytics report:', error);
      throw error;
    }
  }

  /**
   * Run memory optimization
   */
  async optimize() {
    try {
      this.ensureInitialized();

      this.logger.info('Running memory optimization...');
      const results = await this.optimizer.optimize();
      
      this.analytics.trackMemoryOperation('optimize', {
        results: results.summary
      });

      return results;
    } catch (error) {
      this.logger.error('Failed to optimize memory:', error);
      throw error;
    }
  }

  /**
   * Create backup
   */
  async createBackup(options = {}) {
    try {
      this.ensureInitialized();

      this.logger.info('Creating memory backup...');
      const backup = await this.backup.createBackup(options);
      
      this.analytics.trackMemoryOperation('backup', {
        backupId: backup.id,
        memoryCount: backup.memoryCount
      });

      return backup;
    } catch (error) {
      this.logger.error('Failed to create backup:', error);
      throw error;
    }
  }

  /**
   * Restore from backup
   */
  async restoreBackup(backupId, options = {}) {
    try {
      this.ensureInitialized();

      this.logger.info(`Restoring from backup: ${backupId}`);
      const results = await this.backup.restoreBackup(backupId, options);
      
      this.analytics.trackMemoryOperation('restore', {
        backupId,
        memoriesRestored: results.memoriesRestored
      });

      return results;
    } catch (error) {
      this.logger.error('Failed to restore backup:', error);
      throw error;
    }
  }

  /**
   * List available backups
   */
  async listBackups() {
    try {
      this.ensureInitialized();

      return await this.backup.listBackups();
    } catch (error) {
      this.logger.error('Failed to list backups:', error);
      throw error;
    }
  }

  /**
   * Get system status
   */
  async getSystemStatus() {
    try {
      this.ensureInitialized();

      const [analytics, sessionSummary, backupSummary] = await Promise.all([
        this.analytics.getAnalyticsReport(),
        this.sessionInitializer.getSessionSummary(),
        this.backup.exportBackupSummary()
      ]);

      return {
        initialized: this.isInitialized,
        timestamp: new Date().toISOString(),
        analytics: {
          performance: analytics.performance,
          memory: analytics.memory,
          operations: analytics.operations
        },
        session: sessionSummary,
        backup: backupSummary,
        config: this.config
      };
    } catch (error) {
      this.logger.error('Failed to get system status:', error);
      throw error;
    }
  }

  /**
   * Get optimization recommendations
   */
  async getOptimizationRecommendations() {
    try {
      this.ensureInitialized();

      const [analyticsRecommendations, optimizerRecommendations] = await Promise.all([
        this.analytics.generateRecommendations(),
        this.optimizer.getOptimizationRecommendations()
      ]);

      return {
        analytics: analyticsRecommendations,
        optimization: optimizerRecommendations,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to get optimization recommendations:', error);
      throw error;
    }
  }

  /**
   * Export system data
   */
  async exportSystemData() {
    try {
      this.ensureInitialized();

      const [analytics, sessionSummary, backupSummary] = await Promise.all([
        this.analytics.exportAnalytics(),
        this.sessionInitializer.getSessionSummary(),
        this.backup.exportBackupSummary()
      ]);

      return {
        analytics,
        session: sessionSummary,
        backup: backupSummary,
        config: this.config,
        exportDate: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to export system data:', error);
      throw error;
    }
  }

  /**
   * Shutdown the memory system
   */
  async shutdown() {
    try {
      this.logger.info('Shutting down Memory System...');

      // Create final backup if auto-backup is enabled
      if (this.config.autoBackup) {
        try {
          await this.createBackup({
            description: 'Auto-backup before shutdown',
            tags: ['auto', 'shutdown']
          });
        } catch (error) {
          this.logger.warn('Failed to create shutdown backup:', error.message);
        }
      }

      // Clear analytics data
      this.analytics.clearAnalytics();

      this.isInitialized = false;
      this.logger.info('Memory System shutdown completed');
    } catch (error) {
      this.logger.error('Failed to shutdown Memory System:', error);
      throw error;
    }
  }

  /**
   * Ensure system is initialized
   */
  ensureInitialized() {
    if (!this.isInitialized) {
      throw new Error('Memory System not initialized. Call initialize() first.');
    }
  }

  /**
   * Get service instances (for advanced usage)
   */
  getServices() {
    return {
      memoryManager: this.memoryManager,
      contextEngineer: this.contextEngineer,
      sessionInitializer: this.sessionInitializer,
      analytics: this.analytics,
      optimizer: this.optimizer,
      backup: this.backup
    };
  }
}

module.exports = {
  MemorySystem
};

