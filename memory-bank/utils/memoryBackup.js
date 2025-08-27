/**
 * Memory Backup Service
 * Handles backup and recovery of memory data
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { createReadStream, createWriteStream } = require('fs');
const { pipeline } = require('stream/promises');

class MemoryBackup {
  constructor(config = {}) {
    this.memoryBankRoot = config.memoryBankRoot || './memory-bank';
    this.backupDir = config.backupDir || './memory-backups';
    this.logger = config.logger || console;
    this.config = {
      maxBackups: config.maxBackups || 10,
      compressionEnabled: config.compressionEnabled !== false,
      encryptionEnabled: config.encryptionEnabled || false,
      encryptionKey: config.encryptionKey,
      ...config
    };
  }

  /**
   * Create a backup of the memory bank
   */
  async createBackup(options = {}) {
    try {
      const {
        includeArchival = true,
        includeAnalytics = true,
        description = '',
        tags = []
      } = options;

      this.logger.info('Starting memory backup...');

      // Create backup directory
      await this.ensureBackupDirectory();

      // Generate backup metadata
      const backupId = this.generateBackupId();
      const timestamp = new Date().toISOString();
      const backupPath = path.join(this.backupDir, `${backupId}.json`);

      // Collect memory data
      const memoryData = await this.collectMemoryData(includeArchival);
      
      // Collect analytics data if requested
      let analyticsData = null;
      if (includeAnalytics) {
        analyticsData = await this.collectAnalyticsData();
      }

      // Create backup object
      const backup = {
        id: backupId,
        timestamp,
        description,
        tags,
        metadata: {
          version: '1.0.0',
          memoryCount: memoryData.length,
          totalSize: JSON.stringify(memoryData).length,
          includeArchival,
          includeAnalytics: !!analyticsData
        },
        memory: memoryData,
        analytics: analyticsData
      };

      // Write backup file
      const backupContent = JSON.stringify(backup, null, 2);
      await fs.writeFile(backupPath, backupContent, 'utf8');

      // Create backup manifest
      await this.updateBackupManifest(backup);

      this.logger.info(`Backup created: ${backupId}`, {
        memoryCount: memoryData.length,
        size: backupContent.length,
        path: backupPath
      });

      return {
        id: backupId,
        path: backupPath,
        size: backupContent.length,
        memoryCount: memoryData.length
      };
    } catch (error) {
      this.logger.error('Failed to create backup:', error);
      throw error;
    }
  }

  /**
   * Restore memory from backup
   */
  async restoreBackup(backupId, options = {}) {
    try {
      const {
        validateOnly = false,
        overwriteExisting = false
      } = options;

      this.logger.info(`Starting backup restoration: ${backupId}`);

      // Find backup file
      const backupPath = await this.findBackupFile(backupId);
      if (!backupPath) {
        throw new Error(`Backup not found: ${backupId}`);
      }

      // Read and parse backup
      const backupContent = await fs.readFile(backupPath, 'utf8');
      const backup = JSON.parse(backupContent);

      // Validate backup
      const validation = this.validateBackup(backup);
      if (!validation.valid) {
        throw new Error(`Invalid backup: ${validation.errors.join(', ')}`);
      }

      if (validateOnly) {
        this.logger.info('Backup validation completed successfully');
        return { valid: true, backup };
      }

      // Check for existing memories if not overwriting
      if (!overwriteExisting) {
        const existingCount = await this.countExistingMemories();
        if (existingCount > 0) {
          throw new Error(`Cannot restore: ${existingCount} existing memories found. Use overwriteExisting=true to force restore.`);
        }
      }

      // Restore memories
      const restoreResults = await this.restoreMemories(backup.memory, overwriteExisting);

      // Restore analytics if present
      let analyticsRestored = false;
      if (backup.analytics) {
        analyticsRestored = await this.restoreAnalytics(backup.analytics);
      }

      this.logger.info('Backup restoration completed', {
        memoriesRestored: restoreResults.restored,
        memoriesSkipped: restoreResults.skipped,
        analyticsRestored
      });

      return {
        backupId,
        memoriesRestored: restoreResults.restored,
        memoriesSkipped: restoreResults.skipped,
        analyticsRestored,
        timestamp: new Date().toISOString()
      };
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
      const manifestPath = path.join(this.backupDir, 'manifest.json');
      
      try {
        const manifestContent = await fs.readFile(manifestPath, 'utf8');
        const manifest = JSON.parse(manifestContent);
        return manifest.backups || [];
      } catch (error) {
        // Manifest doesn't exist, scan directory
        return await this.scanBackupDirectory();
      }
    } catch (error) {
      this.logger.error('Failed to list backups:', error);
      return [];
    }
  }

  /**
   * Delete a backup
   */
  async deleteBackup(backupId) {
    try {
      const backupPath = await this.findBackupFile(backupId);
      if (!backupPath) {
        throw new Error(`Backup not found: ${backupId}`);
      }

      await fs.unlink(backupPath);
      await this.updateBackupManifest(null, backupId);

      this.logger.info(`Backup deleted: ${backupId}`);
      return { success: true, backupId };
    } catch (error) {
      this.logger.error('Failed to delete backup:', error);
      throw error;
    }
  }

  /**
   * Ensure backup directory exists
   */
  async ensureBackupDirectory() {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
    } catch (error) {
      this.logger.error('Failed to create backup directory:', error);
      throw error;
    }
  }

  /**
   * Generate unique backup ID
   */
  generateBackupId() {
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex');
    return `backup_${timestamp}_${random}`;
  }

  /**
   * Collect memory data for backup
   */
  async collectMemoryData(includeArchival = true) {
    const memoryData = [];
    const directories = ['core', 'persistent', 'session'];
    
    if (includeArchival) {
      directories.push('archival');
    }

    for (const dir of directories) {
      const dirPath = path.join(this.memoryBankRoot, dir);
      
      try {
        const files = await this.getFilesRecursively(dirPath);
        
        for (const file of files) {
          if (file.endsWith('.json')) {
            try {
              const content = await fs.readFile(file, 'utf8');
              const memory = JSON.parse(content);
              memoryData.push(memory);
            } catch (error) {
              this.logger.warn(`Failed to read memory file: ${file}`, error.message);
            }
          }
        }
      } catch (error) {
        // Directory doesn't exist, skip
        this.logger.debug(`Directory not found: ${dirPath}`);
      }
    }

    return memoryData;
  }

  /**
   * Collect analytics data for backup
   */
  async collectAnalyticsData() {
    try {
      const analyticsPath = path.join(this.memoryBankRoot, 'utils', 'analytics.json');
      const content = await fs.readFile(analyticsPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      this.logger.debug('Analytics data not found, skipping');
      return null;
    }
  }

  /**
   * Update backup manifest
   */
  async updateBackupManifest(backup, deletedBackupId = null) {
    try {
      const manifestPath = path.join(this.backupDir, 'manifest.json');
      let manifest = { backups: [], lastUpdated: new Date().toISOString() };

      try {
        const manifestContent = await fs.readFile(manifestPath, 'utf8');
        manifest = JSON.parse(manifestContent);
      } catch (error) {
        // Manifest doesn't exist, use default
      }

      if (backup) {
        // Add new backup
        manifest.backups.unshift({
          id: backup.id,
          timestamp: backup.timestamp,
          description: backup.description,
          tags: backup.tags,
          metadata: backup.metadata
        });
      }

      if (deletedBackupId) {
        // Remove deleted backup
        manifest.backups = manifest.backups.filter(b => b.id !== deletedBackupId);
      }

      // Keep only the most recent backups
      manifest.backups = manifest.backups.slice(0, this.config.maxBackups);
      manifest.lastUpdated = new Date().toISOString();

      await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
    } catch (error) {
      this.logger.error('Failed to update backup manifest:', error);
    }
  }

  /**
   * Find backup file by ID
   */
  async findBackupFile(backupId) {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFile = files.find(file => file.startsWith(backupId) && file.endsWith('.json'));
      
      if (backupFile) {
        return path.join(this.backupDir, backupFile);
      }
      
      return null;
    } catch (error) {
      this.logger.error('Failed to find backup file:', error);
      return null;
    }
  }

  /**
   * Validate backup data
   */
  validateBackup(backup) {
    const errors = [];

    if (!backup.id || !backup.timestamp) {
      errors.push('Missing required backup metadata');
    }

    if (!Array.isArray(backup.memory)) {
      errors.push('Invalid memory data format');
    }

    if (backup.memory.length > 0) {
      const firstMemory = backup.memory[0];
      if (!firstMemory.id || !firstMemory.type || !firstMemory.content) {
        errors.push('Invalid memory object structure');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Count existing memories
   */
  async countExistingMemories() {
    try {
      const memoryData = await this.collectMemoryData(false);
      return memoryData.length;
    } catch (error) {
      this.logger.error('Failed to count existing memories:', error);
      return 0;
    }
  }

  /**
   * Restore memories from backup
   */
  async restoreMemories(memories, overwriteExisting = false) {
    const results = { restored: 0, skipped: 0 };

    for (const memory of memories) {
      try {
        // Check if memory already exists
        const existingPath = path.join(
          this.memoryBankRoot, 
          memory.type, 
          `${memory.id}.json`
        );

        try {
          await fs.access(existingPath);
          if (!overwriteExisting) {
            results.skipped++;
            continue;
          }
        } catch (error) {
          // File doesn't exist, proceed with restore
        }

        // Ensure directory exists
        const dirPath = path.join(this.memoryBankRoot, memory.type);
        await fs.mkdir(dirPath, { recursive: true });

        // Write memory file
        await fs.writeFile(existingPath, JSON.stringify(memory, null, 2), 'utf8');
        results.restored++;
      } catch (error) {
        this.logger.warn(`Failed to restore memory ${memory.id}:`, error.message);
        results.skipped++;
      }
    }

    return results;
  }

  /**
   * Restore analytics data
   */
  async restoreAnalytics(analytics) {
    try {
      const analyticsPath = path.join(this.memoryBankRoot, 'utils', 'analytics.json');
      await fs.writeFile(analyticsPath, JSON.stringify(analytics, null, 2), 'utf8');
      return true;
    } catch (error) {
      this.logger.error('Failed to restore analytics:', error);
      return false;
    }
  }

  /**
   * Scan backup directory for files
   */
  async scanBackupDirectory() {
    try {
      const files = await fs.readdir(this.backupDir);
      const backups = [];

      for (const file of files) {
        if (file.endsWith('.json') && file !== 'manifest.json') {
          try {
            const filePath = path.join(this.backupDir, file);
            const content = await fs.readFile(filePath, 'utf8');
            const backup = JSON.parse(content);
            
            backups.push({
              id: backup.id,
              timestamp: backup.timestamp,
              description: backup.description || '',
              tags: backup.tags || [],
              metadata: backup.metadata
            });
          } catch (error) {
            this.logger.warn(`Failed to read backup file: ${file}`, error.message);
          }
        }
      }

      return backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      this.logger.error('Failed to scan backup directory:', error);
      return [];
    }
  }

  /**
   * Get files recursively from directory
   */
  async getFilesRecursively(dirPath) {
    const files = [];
    
    try {
      const items = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(dirPath, item.name);
        
        if (item.isDirectory()) {
          const subFiles = await this.getFilesRecursively(fullPath);
          files.push(...subFiles);
        } else if (item.isFile()) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Directory doesn't exist, return empty array
    }
    
    return files;
  }

  /**
   * Export backup summary
   */
  async exportBackupSummary() {
    try {
      const backups = await this.listBackups();
      const totalSize = backups.reduce((sum, backup) => sum + (backup.metadata?.totalSize || 0), 0);
      
      return {
        totalBackups: backups.length,
        totalSize,
        oldestBackup: backups.length > 0 ? backups[backups.length - 1].timestamp : null,
        newestBackup: backups.length > 0 ? backups[0].timestamp : null,
        backups: backups.map(b => ({
          id: b.id,
          timestamp: b.timestamp,
          description: b.description,
          memoryCount: b.metadata?.memoryCount || 0
        }))
      };
    } catch (error) {
      this.logger.error('Failed to export backup summary:', error);
      throw error;
    }
  }
}

module.exports = {
  MemoryBackup
};

