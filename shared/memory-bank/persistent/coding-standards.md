# Coding Standards: Job Copilot Project

## JavaScript Standards

### ES6+ Features
- Use `const` and `let` instead of `var`
- Prefer arrow functions for callbacks
- Use template literals for string interpolation
- Implement async/await for asynchronous operations
- Use destructuring for object and array assignment

### Code Organization
```javascript
// Service-based architecture pattern
class ServiceName {
  constructor(dependencies) {
    this.dependencies = dependencies;
  }

  async methodName(params) {
    try {
      // Implementation
      return result;
    } catch (error) {
      // Error handling
      throw error;
    }
  }
}

// Export pattern
module.exports = ServiceName;
```

### Error Handling
- Always use try-catch blocks for async operations
- Log errors with context information
- Return meaningful error messages to users
- Implement proper error boundaries in React components

## Chrome Extension Standards

### Manifest V3 Compliance
- Use service workers instead of background pages
- Implement proper content script isolation
- Follow CSP (Content Security Policy) requirements
- Use declarative permissions when possible

### Content Script Patterns
```javascript
// Content script injection pattern
(function() {
  'use strict';
  
  // Check if already injected
  if (window.jobCopilotInjected) return;
  window.jobCopilotInjected = true;
  
  // Main functionality
  function init() {
    // Implementation
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
```

## Backend Standards

### Express.js Patterns
```javascript
// Route organization
const express = require('express');
const router = express.Router();

// Middleware pattern
const authMiddleware = require('../middleware/auth');

// Route definition
router.post('/endpoint', authMiddleware, async (req, res) => {
  try {
    const result = await service.method(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
```

### Database Patterns
```javascript
// PostgreSQL with pgvector
const { Pool } = require('pg');

class DatabaseService {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }

  async query(text, params) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }
}
```

## Testing Standards

### Jest Configuration
```javascript
// Test file pattern
describe('ServiceName', () => {
  let service;
  
  beforeEach(() => {
    service = new ServiceName(mockDependencies);
  });
  
  describe('methodName', () => {
    it('should handle success case', async () => {
      const result = await service.methodName(testParams);
      expect(result).toBeDefined();
    });
    
    it('should handle error case', async () => {
      await expect(service.methodName(invalidParams))
        .rejects.toThrow('Expected error message');
    });
  });
});
```

### Test Coverage Requirements
- Minimum 90% code coverage
- Test all error paths
- Mock external dependencies
- Test integration points

## Documentation Standards

### Inline Comments
```javascript
/**
 * Generates a tailored CV based on job requirements
 * @param {Object} jobData - Job posting data
 * @param {Object} userProfile - User profile information
 * @returns {Promise<Object>} Generated CV and cover letter
 */
async function generateTailoredDocuments(jobData, userProfile) {
  // Implementation with clear comments
}
```

### README Updates
- Update README for all new features
- Include usage examples
- Document API changes
- Maintain installation instructions

## Security Standards

### Data Protection
- Never log sensitive user data
- Use HTTPS for all API communications
- Implement proper input validation
- Sanitize user inputs

### Privacy Compliance
- Local-first data storage
- Minimal data collection
- Clear privacy policy
- User consent for data usage

