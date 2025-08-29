/**
 * Context Engineer Service
 * Handles dynamic context assembly and prioritization
 */

const { MemoryManager } = require('./memoryManager');

class ContextEngineer {
  constructor(config = {}) {
    this.memoryManager = config.memoryManager || new MemoryManager(config);
    this.logger = config.logger || console;
    this.maxContextTokens = config.maxContextTokens || 128000;
    this.tokenBudget = {
      systemPrompt: 0.15,
      coreMemory: 0.25,
      recentContext: 0.35,
      retrievedMemory: 0.20,
      toolDefinitions: 0.05
    };
  }

  /**
   * Assemble optimal context for current task
   */
  async assembleContext(currentTask, options = {}) {
    try {
      const {
        includeCoreMemory = true,
        includeSessionContext = true,
        includeRelevantMemory = true,
        maxTokens = this.maxContextTokens
      } = options;

      const context = {
        systemPrompt: this.getSystemPrompt(),
        coreMemory: [],
        sessionContext: {},
        relevantMemory: [],
        toolDefinitions: this.getToolDefinitions(),
        metadata: {
          assembledAt: new Date().toISOString(),
          task: currentTask,
          tokenBudget: maxTokens
        }
      };

      // Add core memory (always included)
      if (includeCoreMemory) {
        context.coreMemory = await this.getCoreMemory();
      }

      // Add session context
      if (includeSessionContext) {
        context.sessionContext = await this.memoryManager.getSessionContext();
      }

      // Add relevant memory based on current task
      if (includeRelevantMemory) {
        context.relevantMemory = await this.getRelevantMemory(currentTask);
      }

      // Optimize context for token budget
      const optimizedContext = this.optimizeContextForTokens(context, maxTokens);

      this.logger.info('Context assembled successfully', {
        task: currentTask,
        totalTokens: this.estimateTokens(optimizedContext),
        memoryBlocks: optimizedContext.relevantMemory.length
      });

      return optimizedContext;
    } catch (error) {
      this.logger.error('Failed to assemble context:', error);
      throw error;
    }
  }

  /**
   * Get system prompt
   */
  getSystemPrompt() {
    return `You are an AI coding assistant working on the Job Copilot project. 
    
Key Project Context:
- Chrome Extension (Manifest V3) for job application automation
- Privacy-first approach with local storage preference
- OpenAI GPT-4 integration for CV generation and parsing
- PostgreSQL with pgvector for semantic search
- Service-based architecture with clear separation of concerns

Development Guidelines:
- Follow established coding standards and project conventions
- Prioritize privacy and security in all implementations
- Maintain high test coverage (90%+)
- Use ES6+ JavaScript with async/await patterns
- Implement proper error handling and logging

Memory System:
- Use the memory scaffolding system for context-aware development
- Store important decisions and patterns for future reference
- Retrieve relevant memory before making recommendations
- Update memory with new learnings and architectural decisions`;
  }

  /**
   * Get core memory (always in context)
   */
  async getCoreMemory() {
    try {
      const coreMemories = await this.memoryManager.search('', {
        type: 'core',
        limit: 10
      });

      return coreMemories.map(memory => ({
        id: memory.id,
        type: memory.type,
        content: memory.content,
        relevanceScore: memory.metadata.relevanceScore
      }));
    } catch (error) {
      this.logger.error('Failed to get core memory:', error);
      return [];
    }
  }

  /**
   * Get relevant memory for current task
   */
  async getRelevantMemory(task, options = {}) {
    try {
      const {
        limit = 10,
        minRelevanceScore = 0.3,
        includeTypes = ['persistent', 'session']
      } = options;

      const relevantMemories = [];

      for (const type of includeTypes) {
        const memories = await this.memoryManager.search(task, {
          type,
          limit: Math.ceil(limit / includeTypes.length),
          minRelevanceScore
        });

        relevantMemories.push(...memories);
      }

      // Sort by relevance score
      relevantMemories.sort((a, b) => b.metadata.relevanceScore - a.metadata.relevanceScore);

      return relevantMemories.slice(0, limit).map(memory => ({
        id: memory.id,
        type: memory.type,
        content: memory.content,
        relevanceScore: memory.metadata.relevanceScore,
        tags: memory.metadata.tags
      }));
    } catch (error) {
      this.logger.error('Failed to get relevant memory:', error);
      return [];
    }
  }

  /**
   * Get tool definitions
   */
  getToolDefinitions() {
    return {
      memoryOperations: {
        store: 'Store important information in memory bank',
        retrieve: 'Retrieve memory by ID or search query',
        update: 'Update existing memory block',
        delete: 'Delete memory block',
        search: 'Search memories by relevance'
      },
      contextOperations: {
        assemble: 'Assemble optimal context for current task',
        optimize: 'Optimize context for token budget',
        prioritize: 'Prioritize context elements by relevance'
      }
    };
  }

  /**
   * Optimize context for token budget
   */
  optimizeContextForTokens(context, maxTokens) {
    const optimized = { ...context };
    const currentTokens = this.estimateTokens(context);

    if (currentTokens <= maxTokens) {
      return optimized;
    }

    // Calculate token budgets for each section
    const budgets = {
      systemPrompt: Math.floor(maxTokens * this.tokenBudget.systemPrompt),
      coreMemory: Math.floor(maxTokens * this.tokenBudget.coreMemory),
      recentContext: Math.floor(maxTokens * this.tokenBudget.recentContext),
      retrievedMemory: Math.floor(maxTokens * this.tokenBudget.retrievedMemory),
      toolDefinitions: Math.floor(maxTokens * this.tokenBudget.toolDefinitions)
    };

    // Optimize each section
    optimized.coreMemory = this.compressMemorySection(
      context.coreMemory,
      budgets.coreMemory
    );

    optimized.relevantMemory = this.compressMemorySection(
      context.relevantMemory,
      budgets.retrievedMemory
    );

    optimized.sessionContext = this.compressSessionContext(
      context.sessionContext,
      budgets.recentContext
    );

    return optimized;
  }

  /**
   * Compress memory section to fit token budget
   */
  compressMemorySection(memories, tokenBudget) {
    if (memories.length === 0) return [];

    const compressed = [];
    let currentTokens = 0;

    // Sort by relevance score
    const sorted = [...memories].sort((a, b) => b.relevanceScore - a.relevanceScore);

    for (const memory of sorted) {
      const memoryTokens = this.estimateTokens(memory.content);
      
      if (currentTokens + memoryTokens <= tokenBudget) {
        compressed.push(memory);
        currentTokens += memoryTokens;
      } else {
        // Try to add a summary if there's space
        const summary = this.createSummary(memory.content, tokenBudget - currentTokens);
        if (summary) {
          compressed.push({
            ...memory,
            content: summary,
            isCompressed: true
          });
        }
        break;
      }
    }

    return compressed;
  }

  /**
   * Compress session context to fit token budget
   */
  compressSessionContext(sessionContext, tokenBudget) {
    const compressed = {};
    let currentTokens = 0;

    for (const [key, content] of Object.entries(sessionContext)) {
      const contentTokens = this.estimateTokens(content);
      
      if (currentTokens + contentTokens <= tokenBudget) {
        compressed[key] = content;
        currentTokens += contentTokens;
      } else {
        // Add summary if there's space
        const summary = this.createSummary(content, tokenBudget - currentTokens);
        if (summary) {
          compressed[key] = summary;
        }
        break;
      }
    }

    return compressed;
  }

  /**
   * Create summary of content within token limit
   */
  createSummary(content, maxTokens) {
    if (this.estimateTokens(content) <= maxTokens) {
      return content;
    }

    // Simple summarization: take first few sentences
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    let summary = '';
    let currentTokens = 0;

    for (const sentence of sentences) {
      const sentenceTokens = this.estimateTokens(sentence);
      if (currentTokens + sentenceTokens <= maxTokens) {
        summary += sentence + '. ';
        currentTokens += sentenceTokens;
      } else {
        break;
      }
    }

    return summary.trim() || content.substring(0, maxTokens * 4); // Rough character estimate
  }

  /**
   * Estimate token count for content
   */
  estimateTokens(content) {
    if (typeof content === 'string') {
      // Rough estimation: 1 token ≈ 4 characters
      return Math.ceil(content.length / 4);
    } else if (typeof content === 'object') {
      return this.estimateTokens(JSON.stringify(content));
    }
    return 0;
  }

  /**
   * Prioritize context elements by relevance
   */
  prioritizeContext(context, currentTask) {
    const prioritized = {
      high: [],
      medium: [],
      low: []
    };

    // Prioritize core memory as high
    prioritized.high.push(...context.coreMemory);

    // Prioritize relevant memory by relevance score
    for (const memory of context.relevantMemory) {
      if (memory.relevanceScore >= 0.7) {
        prioritized.high.push(memory);
      } else if (memory.relevanceScore >= 0.4) {
        prioritized.medium.push(memory);
      } else {
        prioritized.low.push(memory);
      }
    }

    // Prioritize session context as medium
    for (const [key, content] of Object.entries(context.sessionContext)) {
      prioritized.medium.push({
        id: key,
        type: 'session',
        content,
        relevanceScore: 0.5
      });
    }

    return prioritized;
  }

  /**
   * Update context with new information
   */
  async updateContext(task, newInformation, type = 'session') {
    try {
      const memoryBlock = new (require('./memoryManager').MemoryBlock)(
        type,
        newInformation,
        {
          tags: ['context', task],
          relevanceScore: 0.8
        }
      );

      await this.memoryManager.store(memoryBlock);

      this.logger.info('Context updated with new information', {
        task,
        type,
        memoryId: memoryBlock.id
      });

      return memoryBlock;
    } catch (error) {
      this.logger.error('Failed to update context:', error);
      throw error;
    }
  }

  /**
   * Get context statistics
   */
  async getContextStats() {
    try {
      const stats = {
        totalMemories: 0,
        byType: {},
        averageRelevanceScore: 0,
        totalTokens: 0
      };

      const allMemories = await this.memoryManager.search('', { limit: 1000 });
      
      stats.totalMemories = allMemories.length;
      
      for (const memory of allMemories) {
        // Count by type
        stats.byType[memory.type] = (stats.byType[memory.type] || 0) + 1;
        
        // Calculate average relevance score
        stats.averageRelevanceScore += memory.metadata.relevanceScore || 0;
        
        // Estimate total tokens
        stats.totalTokens += this.estimateTokens(memory.content);
      }

      if (stats.totalMemories > 0) {
        stats.averageRelevanceScore /= stats.totalMemories;
      }

      return stats;
    } catch (error) {
      this.logger.error('Failed to get context stats:', error);
      throw error;
    }
  }
}

module.exports = {
  ContextEngineer
};

