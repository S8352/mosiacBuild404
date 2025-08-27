/**
 * Memory Analytics Service
 * Monitors memory system performance and provides insights
 */

const { MemoryManager } = require('./memoryManager');
const { ContextEngineer } = require('./contextEngineer');

class MemoryAnalytics {
  constructor(config = {}) {
    this.memoryManager = config.memoryManager || new MemoryManager(config);
    this.contextEngineer = config.contextEngineer || new ContextEngineer({
      memoryManager: this.memoryManager,
      ...config
    });
    this.logger = config.logger || console;
    this.metrics = {
      retrievalTimes: [],
      searchQueries: [],
      contextAssemblies: [],
      memoryOperations: []
    };
  }

  /**
   * Track memory retrieval performance
   */
  async trackRetrievalPerformance() {
    try {
      const startTime = Date.now();
      const memories = await this.memoryManager.search('', { limit: 100 });
      const endTime = Date.now();
      
      this.metrics.retrievalTimes.push({
        timestamp: new Date().toISOString(),
        duration: endTime - startTime,
        count: memories.length
      });

      // Keep only last 100 measurements
      if (this.metrics.retrievalTimes.length > 100) {
        this.metrics.retrievalTimes = this.metrics.retrievalTimes.slice(-100);
      }

      return {
        avgRetrievalTime: this.calculateAverageRetrievalTime(),
        totalRetrievals: this.metrics.retrievalTimes.length,
        recentPerformance: this.getRecentPerformance()
      };
    } catch (error) {
      this.logger.error('Failed to track retrieval performance:', error);
      throw error;
    }
  }

  /**
   * Track search query performance
   */
  async trackSearchPerformance(query, options = {}) {
    try {
      const startTime = Date.now();
      const results = await this.memoryManager.search(query, options);
      const endTime = Date.now();

      this.metrics.searchQueries.push({
        timestamp: new Date().toISOString(),
        query,
        duration: endTime - startTime,
        resultCount: results.length,
        options
      });

      return {
        query,
        duration: endTime - startTime,
        resultCount: results.length,
        avgSearchTime: this.calculateAverageSearchTime()
      };
    } catch (error) {
      this.logger.warn('Failed to track search performance:', error.message);
      // Return default values instead of throwing
      return {
        query,
        duration: 0,
        resultCount: 0,
        avgSearchTime: this.calculateAverageSearchTime()
      };
    }
  }

  /**
   * Track context assembly performance
   */
  async trackContextAssemblyPerformance(task, options = {}) {
    try {
      const startTime = Date.now();
      const context = await this.contextEngineer.assembleContext(task, options);
      const endTime = Date.now();

      this.metrics.contextAssemblies.push({
        timestamp: new Date().toISOString(),
        task,
        duration: endTime - startTime,
        tokenCount: this.contextEngineer.estimateTokens(context),
        memoryBlocks: context.relevantMemory.length
      });

      return {
        task,
        duration: endTime - startTime,
        tokenCount: this.contextEngineer.estimateTokens(context),
        avgAssemblyTime: this.calculateAverageAssemblyTime()
      };
    } catch (error) {
      this.logger.error('Failed to track context assembly performance:', error);
      throw error;
    }
  }

  /**
   * Track memory operations
   */
  trackMemoryOperation(operation, details = {}) {
    this.metrics.memoryOperations.push({
      timestamp: new Date().toISOString(),
      operation,
      details
    });

    // Keep only last 1000 operations
    if (this.metrics.memoryOperations.length > 1000) {
      this.metrics.memoryOperations = this.metrics.memoryOperations.slice(-1000);
    }
  }

  /**
   * Get comprehensive analytics report
   */
  async getAnalyticsReport() {
    try {
      const stats = await this.contextEngineer.getContextStats();
      
      return {
        performance: {
          retrieval: await this.trackRetrievalPerformance(),
          search: this.getSearchAnalytics(),
          contextAssembly: this.getContextAssemblyAnalytics()
        },
        memory: {
          totalMemories: stats.totalMemories,
          byType: stats.byType,
          averageRelevanceScore: stats.averageRelevanceScore,
          totalTokens: stats.totalTokens
        },
        operations: this.getOperationAnalytics(),
        recommendations: await this.generateRecommendations()
      };
    } catch (error) {
      this.logger.error('Failed to generate analytics report:', error);
      throw error;
    }
  }

  /**
   * Calculate average retrieval time
   */
  calculateAverageRetrievalTime() {
    if (this.metrics.retrievalTimes.length === 0) return 0;
    
    const totalTime = this.metrics.retrievalTimes.reduce((sum, metric) => 
      sum + metric.duration, 0
    );
    
    return totalTime / this.metrics.retrievalTimes.length;
  }

  /**
   * Calculate average search time
   */
  calculateAverageSearchTime() {
    if (this.metrics.searchQueries.length === 0) return 0;
    
    const totalTime = this.metrics.searchQueries.reduce((sum, metric) => 
      sum + metric.duration, 0
    );
    
    return totalTime / this.metrics.searchQueries.length;
  }

  /**
   * Calculate average assembly time
   */
  calculateAverageAssemblyTime() {
    if (this.metrics.contextAssemblies.length === 0) return 0;
    
    const totalTime = this.metrics.contextAssemblies.reduce((sum, metric) => 
      sum + metric.duration, 0
    );
    
    return totalTime / this.metrics.contextAssemblies.length;
  }

  /**
   * Get recent performance metrics
   */
  getRecentPerformance() {
    const recent = this.metrics.retrievalTimes.slice(-10);
    if (recent.length === 0) return {};

    const avgTime = recent.reduce((sum, metric) => sum + metric.duration, 0) / recent.length;
    const avgCount = recent.reduce((sum, metric) => sum + metric.count, 0) / recent.length;

    return {
      avgTime,
      avgCount,
      trend: this.calculateTrend(recent.map(m => m.duration))
    };
  }

  /**
   * Get search analytics
   */
  getSearchAnalytics() {
    if (this.metrics.searchQueries.length === 0) {
      return { avgTime: 0, totalQueries: 0, popularQueries: [] };
    }

    const avgTime = this.calculateAverageSearchTime();
    const totalQueries = this.metrics.searchQueries.length;
    
    // Find popular queries
    const queryCounts = {};
    this.metrics.searchQueries.forEach(metric => {
      queryCounts[metric.query] = (queryCounts[metric.query] || 0) + 1;
    });

    const popularQueries = Object.entries(queryCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }));

    return {
      avgTime,
      totalQueries,
      popularQueries
    };
  }

  /**
   * Get context assembly analytics
   */
  getContextAssemblyAnalytics() {
    if (this.metrics.contextAssemblies.length === 0) {
      return { avgTime: 0, totalAssemblies: 0, avgTokens: 0 };
    }

    const avgTime = this.calculateAverageAssemblyTime();
    const totalAssemblies = this.metrics.contextAssemblies.length;
    const avgTokens = this.metrics.contextAssemblies.reduce((sum, metric) => 
      sum + metric.tokenCount, 0
    ) / totalAssemblies;

    return {
      avgTime,
      totalAssemblies,
      avgTokens
    };
  }

  /**
   * Get operation analytics
   */
  getOperationAnalytics() {
    if (this.metrics.memoryOperations.length === 0) {
      return { totalOperations: 0, byType: {} };
    }

    const operationCounts = {};
    this.metrics.memoryOperations.forEach(metric => {
      operationCounts[metric.operation] = (operationCounts[metric.operation] || 0) + 1;
    });

    return {
      totalOperations: this.metrics.memoryOperations.length,
      byType: operationCounts
    };
  }

  /**
   * Calculate trend from time series data
   */
  calculateTrend(data) {
    if (data.length < 2) return 'stable';
    
    const recent = data.slice(-5);
    const older = data.slice(-10, -5);
    
    if (recent.length === 0 || older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;
    
    const change = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    if (change > 10) return 'improving';
    if (change < -10) return 'degrading';
    return 'stable';
  }

  /**
   * Generate optimization recommendations
   */
  async generateRecommendations() {
    const recommendations = [];
    
    try {
      const stats = await this.contextEngineer.getContextStats();
      const avgRetrievalTime = this.calculateAverageRetrievalTime();
      const avgSearchTime = this.calculateAverageSearchTime();
      const avgAssemblyTime = this.calculateAverageAssemblyTime();

      // Performance recommendations
      if (avgRetrievalTime > 100) {
        recommendations.push({
          type: 'performance',
          priority: 'high',
          message: 'Memory retrieval is slow. Consider implementing caching.',
          metric: `Avg retrieval time: ${avgRetrievalTime.toFixed(2)}ms`
        });
      }

      if (avgSearchTime > 50) {
        recommendations.push({
          type: 'performance',
          priority: 'medium',
          message: 'Search performance could be improved. Consider indexing.',
          metric: `Avg search time: ${avgSearchTime.toFixed(2)}ms`
        });
      }

      if (avgAssemblyTime > 200) {
        recommendations.push({
          type: 'performance',
          priority: 'medium',
          message: 'Context assembly is slow. Consider optimizing token budget.',
          metric: `Avg assembly time: ${avgAssemblyTime.toFixed(2)}ms`
        });
      }

      // Memory management recommendations
      if (stats.totalMemories > 1000) {
        recommendations.push({
          type: 'management',
          priority: 'medium',
          message: 'Large memory bank detected. Consider archiving old memories.',
          metric: `Total memories: ${stats.totalMemories}`
        });
      }

      if (stats.averageRelevanceScore < 0.5) {
        recommendations.push({
          type: 'quality',
          priority: 'high',
          message: 'Low average relevance score. Review memory organization.',
          metric: `Avg relevance: ${stats.averageRelevanceScore.toFixed(2)}`
        });
      }

      // Usage pattern recommendations
      const searchAnalytics = this.getSearchAnalytics();
      if (searchAnalytics.totalQueries > 0) {
        const mostPopular = searchAnalytics.popularQueries[0];
        if (mostPopular && mostPopular.count > 10) {
          recommendations.push({
            type: 'usage',
            priority: 'low',
            message: `Frequent search for "${mostPopular.query}". Consider creating a shortcut.`,
            metric: `Search count: ${mostPopular.count}`
          });
        }
      }

    } catch (error) {
      this.logger.error('Failed to generate recommendations:', error);
    }

    return recommendations;
  }

  /**
   * Export analytics data
   */
  exportAnalytics() {
    return {
      metrics: this.metrics,
      summary: {
        totalRetrievals: this.metrics.retrievalTimes.length,
        totalSearches: this.metrics.searchQueries.length,
        totalAssemblies: this.metrics.contextAssemblies.length,
        totalOperations: this.metrics.memoryOperations.length
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Clear analytics data
   */
  clearAnalytics() {
    this.metrics = {
      retrievalTimes: [],
      searchQueries: [],
      contextAssemblies: [],
      memoryOperations: []
    };
    
    this.logger.info('Analytics data cleared');
  }
}

module.exports = {
  MemoryAnalytics
};
