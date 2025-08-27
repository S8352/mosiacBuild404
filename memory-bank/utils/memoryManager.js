/**
 * Memory Manager Service
 * Handles CRUD operations for the memory scaffolding system
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class MemoryBlock {
  constructor(type, content, metadata = {}) {
    this.id = metadata.id || crypto.randomUUID();
    this.type = type; // 'core', 'persistent', 'session', 'archival'
    this.content = content;
    this.metadata = {
      created: metadata.created || new Date().toISOString(),
      updated: metadata.updated || new Date().toISOString(),
      relevanceScore: metadata.relevanceScore || 1.0,
      tags: metadata.tags || [],
      accessCount: metadata.accessCount || 0,
      ...metadata
    };
  }

  update(content, metadata = {}) {
    this.content = content;
    this.metadata.updated = new Date().toISOString();
    this.metadata.accessCount = (this.metadata.accessCount || 0) + 1;
    Object.assign(this.metadata, metadata);
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      content: this.content,
      metadata: this.metadata
    };
  }

  static fromJSON(data) {
    return new MemoryBlock(data.type, data.content, {
      id: data.id,
      ...data.metadata
    });
  }
}

class MemoryManager {
  constructor(config = {}) {
    this.memoryBankRoot = config.memoryBankRoot || './memory-bank';
    this.logger = config.logger || console;
    this.memoryCache = new Map();
    this.initializeMemoryBank();
  }

  /**
   * Initialize the memory bank directory structure
   */
  async initializeMemoryBank() {
    try {
      const directories = [
        'core',
        'persistent', 
        'session',
        'external/api-docs',
        'external/reference-materials',
        'utils'
      ];

      for (const dir of directories) {
        const dirPath = path.join(this.memoryBankRoot, dir);
        await fs.mkdir(dirPath, { recursive: true });
      }

      this.logger.info('Memory bank initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize memory bank:', error);
      // Don't throw error, just log it
    }
  }

  /**
   * Store a memory block
   */
  async store(memoryBlock) {
    try {
      // Ensure directory exists
      await this.initializeMemoryBank();
      
      const filePath = this.getFilePath(memoryBlock);
      const content = JSON.stringify(memoryBlock.toJSON(), null, 2);
      
      await fs.writeFile(filePath, content, 'utf8');
      this.memoryCache.set(memoryBlock.id, memoryBlock);
      
      this.logger.info(`Memory stored: ${memoryBlock.id} (${memoryBlock.type})`);
      return memoryBlock;
    } catch (error) {
      this.logger.error('Failed to store memory:', error);
      throw error;
    }
  }

  /**
   * Retrieve a memory block by ID
   */
  async retrieve(id) {
    try {
      // Check cache first
      if (this.memoryCache.has(id)) {
        const cached = this.memoryCache.get(id);
        cached.metadata.accessCount = (cached.metadata.accessCount || 0) + 1;
        return cached;
      }

      // Search in all directories
      const directories = ['core', 'persistent', 'session', 'external'];
      
      for (const dir of directories) {
        const dirPath = path.join(this.memoryBankRoot, dir);
        const files = await this.getFilesRecursively(dirPath);
        
        for (const file of files) {
          if (file.endsWith('.md') || file.endsWith('.json')) {
            const content = await fs.readFile(file, 'utf8');
            const memoryBlock = this.parseMemoryFile(content, file);
            
            if (memoryBlock && memoryBlock.id === id) {
              memoryBlock.metadata.accessCount = (memoryBlock.metadata.accessCount || 0) + 1;
              this.memoryCache.set(id, memoryBlock);
              return memoryBlock;
            }
          }
        }
      }

      return null;
    } catch (error) {
      this.logger.error('Failed to retrieve memory:', error);
      throw error;
    }
  }

  /**
   * Search memories by query
   */
  async search(query, options = {}) {
    try {
      const {
        type = null,
        limit = 10,
        minRelevanceScore = 0.1
      } = options;

      const results = [];
      const directories = type ? [type] : ['core', 'persistent', 'session', 'external'];
      
      for (const dir of directories) {
        const dirPath = path.join(this.memoryBankRoot, dir);
        const files = await this.getFilesRecursively(dirPath);
        
        for (const file of files) {
          if (file.endsWith('.md') || file.endsWith('.json')) {
            try {
              const content = await fs.readFile(file, 'utf8');
              const memoryBlock = this.parseMemoryFile(content, file);
              
              if (memoryBlock) {
                const relevanceScore = this.calculateRelevanceScore(memoryBlock, query);
                
                if (relevanceScore >= minRelevanceScore) {
                  results.push({
                    memoryBlock,
                    relevanceScore
                  });
                }
              }
            } catch (error) {
              // Skip files that can't be read (e.g., deleted files)
              this.logger.debug(`Skipping file ${file}: ${error.message}`);
            }
          }
        }
      }

      // Sort by relevance score and limit results
      results.sort((a, b) => b.relevanceScore - a.relevanceScore);
      return results.slice(0, limit).map(r => r.memoryBlock);
    } catch (error) {
      this.logger.error('Failed to search memories:', error);
      throw error;
    }
  }

  /**
   * Update an existing memory block
   */
  async update(id, content, metadata = {}) {
    try {
      const existing = await this.retrieve(id);
      if (!existing) {
        throw new Error(`Memory block not found: ${id}`);
      }

      existing.update(content, metadata);
      await this.store(existing);
      
      this.logger.info(`Memory updated: ${id}`);
      return existing;
    } catch (error) {
      this.logger.error('Failed to update memory:', error);
      throw error;
    }
  }

  /**
   * Delete a memory block
   */
  async delete(id) {
    try {
      const memoryBlock = await this.retrieve(id);
      if (!memoryBlock) {
        throw new Error(`Memory block not found: ${id}`);
      }

      const filePath = this.getFilePath(memoryBlock);
      await fs.unlink(filePath);
      this.memoryCache.delete(id);
      
      this.logger.info(`Memory deleted: ${id}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to delete memory:', error);
      throw error;
    }
  }

  /**
   * Get current session context
   */
  async getSessionContext() {
    try {
      const sessionDir = path.join(this.memoryBankRoot, 'session');
      const files = await fs.readdir(sessionDir);
      const context = {};

      for (const file of files) {
        if (file.endsWith('.md')) {
          const filePath = path.join(sessionDir, file);
          const content = await fs.readFile(filePath, 'utf8');
          const key = file.replace('.md', '');
          context[key] = content;
        }
      }

      return context;
    } catch (error) {
      this.logger.error('Failed to get session context:', error);
      throw error;
    }
  }

  /**
   * Update session context
   */
  async updateSessionContext(key, content) {
    try {
      const filePath = path.join(this.memoryBankRoot, 'session', `${key}.md`);
      await fs.writeFile(filePath, content, 'utf8');
      
      this.logger.info(`Session context updated: ${key}`);
    } catch (error) {
      this.logger.error('Failed to update session context:', error);
      throw error;
    }
  }

  /**
   * Calculate relevance score for search
   */
  calculateRelevanceScore(memoryBlock, query) {
    let score = 0;
    
    // Text similarity (simple keyword matching)
    const queryLower = query.toLowerCase();
    const contentLower = memoryBlock.content.toLowerCase();
    
    const queryWords = queryLower.split(/\s+/);
    const contentWords = contentLower.split(/\s+/);
    
    const matchingWords = queryWords.filter(word => 
      contentWords.some(contentWord => contentWord.includes(word))
    );
    
    score += (matchingWords.length / queryWords.length) * 0.4;
    
    // Recency factor
    const ageDays = (new Date() - new Date(memoryBlock.metadata.created)) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 0.3 - ageDays * 0.01);
    
    // Access frequency
    score += Math.min(0.2, (memoryBlock.metadata.accessCount || 0) * 0.02);
    
    // Type priority
    const typePriority = {
      'core': 0.1,
      'session': 0.05,
      'persistent': 0.02,
      'archival': 0.01
    };
    
    score += typePriority[memoryBlock.type] || 0;
    
    return Math.min(1.0, score);
  }

  /**
   * Get file path for memory block
   */
  getFilePath(memoryBlock) {
    const fileName = `${memoryBlock.id}.json`;
    return path.join(this.memoryBankRoot, memoryBlock.type, fileName);
  }

  /**
   * Parse memory file content
   */
  parseMemoryFile(content, filePath) {
    try {
      // Try to parse as JSON first
      if (filePath.endsWith('.json')) {
        return MemoryBlock.fromJSON(JSON.parse(content));
      }
      
      // Parse markdown files
      if (filePath.endsWith('.md')) {
        const fileName = path.basename(filePath, '.md');
        const type = this.getTypeFromPath(filePath);
        
        return new MemoryBlock(type, content, {
          id: fileName,
          tags: [type, 'markdown']
        });
      }
      
      return null;
    } catch (error) {
      this.logger.warn(`Failed to parse memory file: ${filePath}`, error);
      return null;
    }
  }

  /**
   * Get type from file path
   */
  getTypeFromPath(filePath) {
    const relativePath = path.relative(this.memoryBankRoot, filePath);
    const parts = relativePath.split(path.sep);
    return parts[0];
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
      // Directory might not exist, ignore
    }
    
    return files;
  }

  /**
   * Optimize memory storage
   */
  async optimize() {
    try {
      // Clean up cache
      this.memoryCache.clear();
      
      // Archive old memories
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90); // 90 days
      
      const memories = await this.search('', { limit: 1000 });
      
      for (const memory of memories) {
        const created = new Date(memory.metadata.created);
        if (created < cutoffDate && memory.metadata.accessCount === 0) {
          await this.archive(memory.id);
        }
      }
      
      this.logger.info('Memory optimization completed');
    } catch (error) {
      this.logger.error('Failed to optimize memory:', error);
      throw error;
    }
  }

  /**
   * Archive a memory block
   */
  async archive(id) {
    try {
      const memoryBlock = await this.retrieve(id);
      if (!memoryBlock) {
        throw new Error(`Memory block not found: ${id}`);
      }

      memoryBlock.type = 'archival';
      await this.store(memoryBlock);
      
      this.logger.info(`Memory archived: ${id}`);
      return memoryBlock;
    } catch (error) {
      this.logger.error('Failed to archive memory:', error);
      throw error;
    }
  }
}

module.exports = {
  MemoryManager,
  MemoryBlock
};
