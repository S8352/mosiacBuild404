# Design Patterns: Job Copilot Architecture

## Service Layer Pattern

### Service Organization
```javascript
// Base service pattern
class BaseService {
  constructor(dependencies) {
    this.dependencies = dependencies;
    this.logger = dependencies.logger;
  }

  async execute(method, params) {
    try {
      this.logger.info(`Executing ${method}`, { params });
      const result = await this[method](params);
      this.logger.info(`Completed ${method}`, { result });
      return result;
    } catch (error) {
      this.logger.error(`Error in ${method}`, { error, params });
      throw error;
    }
  }
}

// Specific service implementation
class CVParsingService extends BaseService {
  async parseCV(cvData) {
    // Implementation
  }
}
```

## Repository Pattern

### Data Access Layer
```javascript
class QuestionAnswerRepository {
  constructor(database) {
    this.db = database;
  }

  async findByUserId(userId) {
    const query = 'SELECT * FROM question_answers WHERE user_id = $1';
    const result = await this.db.query(query, [userId]);
    return result.rows;
  }

  async store(questionAnswer) {
    const query = `
      INSERT INTO question_answers (user_id, question, answer, embedding)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await this.db.query(query, [
      questionAnswer.userId,
      questionAnswer.question,
      questionAnswer.answer,
      questionAnswer.embedding
    ]);
    return result.rows[0];
  }
}
```

## Factory Pattern

### Service Factory
```javascript
class ServiceFactory {
  constructor(config) {
    this.config = config;
  }

  createCVService() {
    return new CVParsingService({
      openai: this.config.openai,
      logger: this.config.logger
    });
  }

  createDocumentService() {
    return new DocumentService({
      openai: this.config.openai,
      logger: this.config.logger
    });
  }

  createVectorService() {
    return new VectorService({
      database: this.config.database,
      logger: this.config.logger
    });
  }
}
```

## Observer Pattern

### Event System
```javascript
class EventEmitter {
  constructor() {
    this.events = {};
  }

  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(data));
    }
  }
}

// Usage in services
class ApplicationTracker extends EventEmitter {
  async trackApplication(applicationData) {
    // Process application
    this.emit('applicationTracked', applicationData);
  }
}
```

## Strategy Pattern

### Document Generation Strategies
```javascript
class DocumentGenerationStrategy {
  generateCV(jobData, userProfile) {
    throw new Error('Method must be implemented');
  }
}

class ATSOptimizedStrategy extends DocumentGenerationStrategy {
  generateCV(jobData, userProfile) {
    // ATS-optimized CV generation
  }
}

class CreativeStrategy extends DocumentGenerationStrategy {
  generateCV(jobData, userProfile) {
    // Creative CV generation
  }
}

class DocumentService {
  constructor(strategy) {
    this.strategy = strategy;
  }

  setStrategy(strategy) {
    this.strategy = strategy;
  }

  generateCV(jobData, userProfile) {
    return this.strategy.generateCV(jobData, userProfile);
  }
}
```

## Middleware Pattern

### Express Middleware Chain
```javascript
// Authentication middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Validation middleware
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    next();
  };
};

// Rate limiting middleware
const rateLimit = (windowMs, maxRequests) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!requests.has(key)) {
      requests.set(key, []);
    }
    
    const userRequests = requests.get(key);
    const recentRequests = userRequests.filter(time => time > windowStart);
    
    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }
    
    recentRequests.push(now);
    requests.set(key, recentRequests);
    next();
  };
};
```

## Adapter Pattern

### External API Adapters
```javascript
class LinkedInAdapter {
  constructor() {
    this.baseUrl = 'https://api.linkedin.com';
  }

  async getJobDetails(jobId) {
    // LinkedIn API integration
  }
}

class IndeedAdapter {
  constructor() {
    this.baseUrl = 'https://api.indeed.com';
  }

  async getJobDetails(jobId) {
    // Indeed API integration
  }
}

class JobSiteAdapter {
  constructor(adapter) {
    this.adapter = adapter;
  }

  async getJobDetails(jobId) {
    return this.adapter.getJobDetails(jobId);
  }
}
```

## Command Pattern

### Undo/Redo System
```javascript
class Command {
  execute() {
    throw new Error('Method must be implemented');
  }

  undo() {
    throw new Error('Method must be implemented');
  }
}

class StoreQuestionAnswerCommand extends Command {
  constructor(repository, questionAnswer) {
    super();
    this.repository = repository;
    this.questionAnswer = questionAnswer;
    this.previousState = null;
  }

  async execute() {
    this.previousState = await this.repository.findByQuestion(this.questionAnswer.question);
    return this.repository.store(this.questionAnswer);
  }

  async undo() {
    if (this.previousState) {
      return this.repository.update(this.previousState);
    }
  }
}

class CommandManager {
  constructor() {
    this.commands = [];
    this.currentIndex = -1;
  }

  execute(command) {
    const result = command.execute();
    this.commands.splice(this.currentIndex + 1);
    this.commands.push(command);
    this.currentIndex++;
    return result;
  }

  undo() {
    if (this.currentIndex >= 0) {
      const command = this.commands[this.currentIndex];
      command.undo();
      this.currentIndex--;
    }
  }

  redo() {
    if (this.currentIndex < this.commands.length - 1) {
      this.currentIndex++;
      const command = this.commands[this.currentIndex];
      command.execute();
    }
  }
}
```

