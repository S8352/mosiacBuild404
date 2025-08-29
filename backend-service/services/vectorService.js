// Job Copilot Backend - Vector Service for Question-Answer Learning
const { Pool } = require('pg');
const OpenAI = require('openai');
const logger = require('../utils/logger');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

class VectorService {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    this.initializeDatabase();
  }

  async initializeDatabase() {
    try {
      // Create extension for vector operations
      await this.pool.query('CREATE EXTENSION IF NOT EXISTS vector');
      
      // Create table for question-answer pairs with vector embeddings
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS question_answers (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR(255),
          question_text TEXT NOT NULL,
          question_embedding vector(1536),
          answer_text TEXT NOT NULL,
          canonical_field_name VARCHAR(255),
          usage_count INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create index for vector similarity search
      await this.pool.query(`
        CREATE INDEX IF NOT EXISTS question_answers_embedding_idx 
        ON question_answers USING ivfflat (question_embedding vector_cosine_ops)
        WITH (lists = 100)
      `);

      logger.info('Vector database initialized successfully');
      this.isInitialized = true;
    } catch (error) {
      logger.error('Failed to initialize vector database', { error: error.message });
      this.isInitialized = false;
      console.log('⚠️  Vector service will run in limited mode - database not available');
    }
  }

  async storeQuestionAnswer(question, answer, userId = 'anonymous') {
    try {
      if (!this.isInitialized) {
        throw new Error('Vector service not available - database connection required');
      }

      // Generate embedding for the question
      const embedding = await this.generateEmbedding(question);
      
      // Check if similar question already exists
      const existingQuestion = await this.findSimilarQuestion(question, userId, 0.9);
      
      if (existingQuestion.found && existingQuestion.similarity > 0.9) {
        // Update existing question-answer pair
        const updateResult = await this.pool.query(`
          UPDATE question_answers 
          SET answer_text = $1, usage_count = usage_count + 1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
          RETURNING id
        `, [answer, existingQuestion.id]);
        
        logger.info('Updated existing question-answer pair', { 
          id: existingQuestion.id,
          similarity: existingQuestion.similarity 
        });
        
        return { id: updateResult.rows[0].id, updated: true };
      } else {
        // Insert new question-answer pair
        const insertResult = await this.pool.query(`
          INSERT INTO question_answers (user_id, question_text, question_embedding, answer_text, canonical_field_name)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id
        `, [
          userId,
          question.toLowerCase().trim(),
          JSON.stringify(embedding),
          answer,
          this.extractCanonicalFieldName(question)
        ]);
        
        logger.info('Stored new question-answer pair', { 
          id: insertResult.rows[0].id,
          question: question.substring(0, 50) + '...'
        });
        
        return { id: insertResult.rows[0].id, updated: false };
      }
    } catch (error) {
      logger.error('Failed to store question-answer pair', { error: error.message });
      throw error;
    }
  }

  async findSimilarQuestion(question, userId = 'anonymous', threshold = 0.7) {
    try {
      if (!this.isInitialized) {
        throw new Error('Vector service not available - database connection required');
      }

      // Generate embedding for the input question
      const questionEmbedding = await this.generateEmbedding(question);
      
      // Search for similar questions using cosine similarity
      const result = await this.pool.query(`
        SELECT 
          id,
          question_text,
          answer_text,
          canonical_field_name,
          usage_count,
          1 - (question_embedding <=> $1::vector) as similarity
        FROM question_answers
        WHERE (user_id = $2 OR user_id = 'anonymous')
          AND 1 - (question_embedding <=> $1::vector) > $3
        ORDER BY similarity DESC
        LIMIT 1
      `, [JSON.stringify(questionEmbedding), userId, threshold]);

      if (result.rows.length > 0) {
        const match = result.rows[0];
        
        // Increment usage count
        await this.pool.query(`
          UPDATE question_answers 
          SET usage_count = usage_count + 1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `, [match.id]);

        logger.info('Found similar question', { 
          id: match.id,
          similarity: match.similarity,
          usageCount: match.usage_count + 1
        });

        return {
          found: true,
          id: match.id,
          question: match.question_text,
          answer: match.answer_text,
          canonicalFieldName: match.canonical_field_name,
          similarity: parseFloat(match.similarity),
          usageCount: match.usage_count + 1
        };
      }

      return { found: false };
    } catch (error) {
      logger.error('Failed to find similar question', { error: error.message });
      throw error;
    }
  }

  async generateEmbedding(text) {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text.toLowerCase().trim()
      });

      return response.data[0].embedding;
    } catch (error) {
      logger.error('Failed to generate embedding', { error: error.message });
      throw error;
    }
  }

  extractCanonicalFieldName(question) {
    const questionLower = question.toLowerCase();
    
    // Common field mappings
    const fieldMappings = {
      'salary': ['salary', 'compensation', 'pay', 'wage', 'income'],
      'experience': ['experience', 'years', 'background'],
      'availability': ['availability', 'start date', 'notice period', 'when can you start'],
      'location': ['location', 'relocate', 'remote', 'work from'],
      'education': ['education', 'degree', 'university', 'college', 'school'],
      'visa': ['visa', 'work authorization', 'eligible to work', 'sponsorship'],
      'references': ['references', 'referees', 'contact'],
      'portfolio': ['portfolio', 'website', 'github', 'linkedin'],
      'motivation': ['why', 'interested', 'motivation', 'reason'],
      'skills': ['skills', 'proficient', 'familiar with', 'knowledge']
    };

    for (const [canonical, keywords] of Object.entries(fieldMappings)) {
      if (keywords.some(keyword => questionLower.includes(keyword))) {
        return canonical;
      }
    }

    return 'other';
  }

  async getQuestionStats(userId = 'anonymous') {
    try {
      const result = await this.pool.query(`
        SELECT 
          COUNT(*) as total_questions,
          SUM(usage_count) as total_usage,
          AVG(usage_count) as avg_usage,
          canonical_field_name,
          COUNT(*) as field_count
        FROM question_answers
        WHERE user_id = $1 OR user_id = 'anonymous'
        GROUP BY canonical_field_name
        ORDER BY field_count DESC
      `, [userId]);

      return {
        totalQuestions: parseInt(result.rows[0]?.total_questions || 0),
        totalUsage: parseInt(result.rows[0]?.total_usage || 0),
        averageUsage: parseFloat(result.rows[0]?.avg_usage || 0),
        fieldBreakdown: result.rows.map(row => ({
          field: row.canonical_field_name,
          count: parseInt(row.field_count)
        }))
      };
    } catch (error) {
      logger.error('Failed to get question stats', { error: error.message });
      throw error;
    }
  }

  async cleanupOldQuestions(daysOld = 90) {
    try {
      const result = await this.pool.query(`
        DELETE FROM question_answers
        WHERE created_at < NOW() - INTERVAL '${daysOld} days'
          AND usage_count < 2
        RETURNING COUNT(*)
      `);

      logger.info('Cleaned up old questions', { 
        deletedCount: result.rowCount,
        daysOld 
      });

      return result.rowCount;
    } catch (error) {
      logger.error('Failed to cleanup old questions', { error: error.message });
      throw error;
    }
  }

  async close() {
    await this.pool.end();
  }
}

module.exports = new VectorService();
