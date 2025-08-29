/**
 * Memory Optimizer Service
 * Handles automated memory management and optimization
 */

const { MemoryManager, MemoryBlock } = require('./memoryManager');
const { MemoryAnalytics } = require('./memoryAnalytics');

class MemoryOptimizer {
  constructor(config = {}) {
    this.memoryManager = config.memoryManager || new MemoryManager(config);
    this.analytics = config.analytics || new MemoryAnalytics({
      memoryManager: this.memoryManager,
      ...config
    });
    this.logger = config.logger || console;
    this.config = {
      retentionDays: config.retentionDays || 90,
      compressionThreshold: config.compressionThreshold || 5,
      maxMemories: config.maxMemories || 1000,
      minRelevanceScore: config.minRelevanceScore || 0.1,
      ...config
    };
  }

  /**
   * Run comprehensive memory optimization
   */
  async optimize() {
    try {
      this.logger.info('Starting memory optimization...');

      const results = {
        cleanup: await this.cleanupStaleMemories(),
        compression: await this.compressMemoryBlocks(),
        archiving: await this.archiveOldMemories(),
        relevance: await this.optimizeRelevanceScores(),
        summary: {}
      };

      // Generate summary
      const stats = await this.memoryManager.search('', { limit: 1000 });
      results.summary = {
        totalMemories: stats.length,
        byType: this.groupByType(stats),
        averageRelevance: this.calculateAverageRelevance(stats),
        optimizationDate: new Date().toISOString()
      };

      this.logger.info('Memory optimization completed', results.summary);
      return results;
    } catch (error) {
      this.logger.error('Memory optimization failed:', error);
      throw error;
    }
  }

  /**
   * Clean up stale memories
   */
  async cleanupStaleMemories() {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

      const allMemories = await this.memoryManager.search('', { limit: 1000 });
      const staleMemories = allMemories.filter(memory => {
        const created = new Date(memory.metadata.created);
        return created < cutoffDate && 
               (memory.metadata.accessCount || 0) === 0 &&
               memory.type !== 'core';
      });

      let deletedCount = 0;
      for (const memory of staleMemories) {
        try {
          await this.memoryManager.delete(memory.id);
          deletedCount++;
        } catch (error) {
          this.logger.warn(`Failed to delete stale memory ${memory.id}:`, error.message);
        }
      }

      this.logger.info(`Cleaned up ${deletedCount} stale memories`);
      return { deletedCount, totalStale: staleMemories.length };
    } catch (error) {
      this.logger.error('Failed to cleanup stale memories:', error);
      throw error;
    }
  }

  /**
   * Compress similar memory blocks
   */
  async compressMemoryBlocks() {
    try {
      const allMemories = await this.memoryManager.search('', { limit: 1000 });
      const compressedGroups = [];

      // Group memories by type and tags
      const groups = this.groupSimilarMemories(allMemories);

      for (const [groupKey, memories] of Object.entries(groups)) {
        if (memories.length >= this.config.compressionThreshold) {
          const compressed = await this.compressGroup(memories, groupKey);
          if (compressed) {
            compressedGroups.push(compressed);
          }
        }
      }

      this.logger.info(`Compressed ${compressedGroups.length} memory groups`);
      return { compressedGroups: compressedGroups.length };
    } catch (error) {
      this.logger.error('Failed to compress memory blocks:', error);
      throw error;
    }
  }

  /**
   * Archive old memories
   */
  async archiveOldMemories() {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - (this.config.retentionDays * 2));

      const allMemories = await this.memoryManager.search('', { limit: 1000 });
      const oldMemories = allMemories.filter(memory => {
        const created = new Date(memory.metadata.created);
        return created < cutoffDate && 
               memory.type !== 'core' && 
               memory.type !== 'archival';
      });

      let archivedCount = 0;
      for (const memory of oldMemories) {
        try {
          await this.memoryManager.archive(memory.id);
          archivedCount++;
        } catch (error) {
          this.logger.warn(`Failed to archive memory ${memory.id}:`, error.message);
        }
      }

      this.logger.info(`Archived ${archivedCount} old memories`);
      return { archivedCount, totalOld: oldMemories.length };
    } catch (error) {
      this.logger.error('Failed to archive old memories:', error);
      throw error;
    }
  }

  /**
   * Optimize relevance scores
   */
  async optimizeRelevanceScores() {
    try {
      const allMemories = await this.memoryManager.search('', { limit: 1000 });
      let updatedCount = 0;

      for (const memory of allMemories) {
        const newScore = this.calculateOptimizedRelevanceScore(memory);
        
        if (Math.abs(newScore - memory.metadata.relevanceScore) > 0.1) {
          try {
            await this.memoryManager.update(memory.id, memory.content, {
              relevanceScore: newScore
            });
            updatedCount++;
          } catch (error) {
            this.logger.warn(`Failed to update relevance score for ${memory.id}:`, error.message);
          }
        }
      }

      this.logger.info(`Updated relevance scores for ${updatedCount} memories`);
      return { updatedCount };
    } catch (error) {
      this.logger.error('Failed to optimize relevance scores:', error);
      throw error;
    }
  }

  /**
   * Group similar memories
   */
  groupSimilarMemories(memories) {
    const groups = {};

    for (const memory of memories) {
      const key = this.generateGroupKey(memory);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(memory);
    }

    return groups;
  }

  /**
   * Generate group key for memory
   */
  generateGroupKey(memory) {
    const tags = memory.metadata.tags || [];
    const type = memory.type;
    const contentLength = memory.content.length;
    
    // Group by type and similar content length
    const lengthCategory = Math.floor(contentLength / 1000);
    return `${type}_${lengthCategory}_${tags.slice(0, 2).join('_')}`;
  }

  /**
   * Compress a group of memories
   */
  async compressGroup(memories, groupKey) {
    try {
      // Sort by relevance score and access count
      const sorted = memories.sort((a, b) => {
        const scoreA = (a.metadata.relevanceScore || 0) + (a.metadata.accessCount || 0) * 0.1;
        const scoreB = (b.metadata.relevanceScore || 0) + (b.metadata.accessCount || 0) * 0.1;
        return scoreB - scoreA;
      });

      // Keep the most relevant memory and create a summary
      const primaryMemory = sorted[0];
      const secondaryMemories = sorted.slice(1);

      // Create summary of secondary memories
      const summary = this.createMemorySummary(secondaryMemories);
      
      // Update primary memory with summary
      const updatedContent = `${primaryMemory.content}\n\n## Related Memories\n${summary}`;
      
      await this.memoryManager.update(primaryMemory.id, updatedContent, {
        tags: [...(primaryMemory.metadata.tags || []), 'compressed', groupKey],
        relevanceScore: Math.max(...memories.map(m => m.metadata.relevanceScore || 0))
      });

      // Delete secondary memories
      for (const memory of secondaryMemories) {
        try {
          await this.memoryManager.delete(memory.id);
        } catch (error) {
          this.logger.warn(`Failed to delete memory ${memory.id} during compression:`, error.message);
        }
      }

      return {
        groupKey,
        primaryMemoryId: primaryMemory.id,
        compressedCount: secondaryMemories.length
      };
    } catch (error) {
      this.logger.error(`Failed to compress group ${groupKey}:`, error);
      return null;
    }
  }

  /**
   * Create summary of memories
   */
  createMemorySummary(memories) {
    if (memories.length === 0) return '';

    const summaries = memories.map(memory => {
      const title = memory.metadata.tags?.[0] || 'Memory';
      const content = memory.content.length > 200 
        ? memory.content.substring(0, 200) + '...'
        : memory.content;
      
      return `### ${title}\n${content}`;
    });

    return summaries.join('\n\n');
  }

  /**
   * Calculate optimized relevance score
   */
  calculateOptimizedRelevanceScore(memory) {
    let score = memory.metadata.relevanceScore || 0;

    // Boost score based on access frequency
    const accessBoost = Math.min(0.2, (memory.metadata.accessCount || 0) * 0.02);
    score += accessBoost;

    // Boost score based on recency
    const ageDays = (new Date() - new Date(memory.metadata.created)) / (1000 * 60 * 60 * 24);
    const recencyBoost = Math.max(0, 0.1 - ageDays * 0.001);
    score += recencyBoost;

    // Boost score for core memories
    if (memory.type === 'core') {
      score += 0.1;
    }

    // Penalize very old memories
    if (ageDays > 365) {
      score -= 0.1;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Group memories by type
   */
  groupByType(memories) {
    const groups = {};
    
    for (const memory of memories) {
      const type = memory.type;
      groups[type] = (groups[type] || 0) + 1;
    }
    
    return groups;
  }

  /**
   * Calculate average relevance score
   */
  calculateAverageRelevance(memories) {
    if (memories.length === 0) return 0;
    
    const totalScore = memories.reduce((sum, memory) => 
      sum + (memory.metadata.relevanceScore || 0), 0
    );
    
    return totalScore / memories.length;
  }

  /**
   * Get optimization recommendations
   */
  async getOptimizationRecommendations() {
    try {
      const stats = await this.memoryManager.search('', { limit: 1000 });
      const recommendations = [];

      // Check memory count
      if (stats.length > this.config.maxMemories) {
        recommendations.push({
          type: 'capacity',
          priority: 'high',
          message: `Memory bank has ${stats.length} memories. Consider cleanup.`,
          action: 'run cleanup'
        });
      }

      // Check for low relevance memories
      const lowRelevanceCount = stats.filter(m => 
        (m.metadata.relevanceScore || 0) < this.config.minRelevanceScore
      ).length;

      if (lowRelevanceCount > stats.length * 0.3) {
        recommendations.push({
          type: 'quality',
          priority: 'medium',
          message: `${lowRelevanceCount} memories have low relevance scores.`,
          action: 'optimize relevance scores'
        });
      }

      // Check for compression opportunities
      const groups = this.groupSimilarMemories(stats);
      const compressibleGroups = Object.values(groups).filter(group => 
        group.length >= this.config.compressionThreshold
      ).length;

      if (compressibleGroups > 0) {
        recommendations.push({
          type: 'efficiency',
          priority: 'low',
          message: `${compressibleGroups} memory groups can be compressed.`,
          action: 'run compression'
        });
      }

      return recommendations;
    } catch (error) {
      this.logger.error('Failed to get optimization recommendations:', error);
      return [];
    }
  }

  /**
   * Schedule automatic optimization
   */
  scheduleOptimization(intervalHours = 24) {
    const intervalMs = intervalHours * 60 * 60 * 1000;
    
    setInterval(async () => {
      try {
        this.logger.info('Running scheduled memory optimization...');
        await this.optimize();
      } catch (error) {
        this.logger.error('Scheduled optimization failed:', error);
      }
    }, intervalMs);

    this.logger.info(`Scheduled memory optimization every ${intervalHours} hours`);
  }

  /**
   * Export optimization report
   */
  async exportOptimizationReport() {
    try {
      const optimizationResults = await this.optimize();
      const recommendations = await this.getOptimizationRecommendations();
      
      return {
        optimization: optimizationResults,
        recommendations,
        config: this.config,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to export optimization report:', error);
      throw error;
    }
  }
}

module.exports = {
  MemoryOptimizer
};

