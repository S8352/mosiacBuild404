# Project Conventions: Job Copilot Development

## File Naming Conventions

### JavaScript Files
- **Services**: `camelCase.js` (e.g., `cvParsingService.js`)
- **Components**: `PascalCase.js` (e.g., `JobCard.js`)
- **Utilities**: `camelCase.js` (e.g., `dateUtils.js`)
- **Constants**: `UPPER_SNAKE_CASE.js` (e.g., `API_ENDPOINTS.js`)

### Directory Structure
```
backend/
├── services/          # Business logic services
├── middleware/        # Express middleware
├── utils/            # Utility functions
├── sql/              # Database scripts
└── tests/            # Backend tests

extension/
├── popup/            # Extension popup interface
├── content/          # Content scripts
├── background/       # Service worker
└── assets/           # Icons and resources
```

## Code Organization Conventions

### Import Order
```javascript
// 1. Node.js built-in modules
const path = require('path');
const fs = require('fs');

// 2. Third-party packages
const express = require('express');
const cors = require('cors');

// 3. Local modules
const { CVParsingService } = require('../services/cvParsingService');
const { logger } = require('../utils/logger');
```

### Export Patterns
```javascript
// Named exports for multiple items
class ServiceName {
  // Implementation
}

const utilityFunction = () => {
  // Implementation
};

module.exports = {
  ServiceName,
  utilityFunction
};

// Default export for single items
class MainService {
  // Implementation
}

module.exports = MainService;
```

## Database Conventions

### Table Naming
- Use `snake_case` for table names
- Use `snake_case` for column names
- Prefix with `job_copilot_` for project-specific tables

### Column Conventions
```sql
-- Standard columns for all tables
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()

-- Soft delete pattern
deleted_at TIMESTAMP WITH TIME ZONE NULL
```

### Index Naming
```sql
-- Primary key: table_name_pkey
-- Foreign key: table_name_foreign_key_name_idx
-- Unique constraint: table_name_column_name_unique
-- Regular index: table_name_column_name_idx
```

## API Conventions

### Endpoint Naming
- Use RESTful conventions
- Use `kebab-case` for URL paths
- Use HTTP methods appropriately

```javascript
// RESTful endpoint examples
GET    /api/users/:id
POST   /api/users
PUT    /api/users/:id
DELETE /api/users/:id

// Resource-specific endpoints
POST   /api/cv/parse
POST   /api/documents/generate
GET    /api/applications/track
```

### Response Format
```javascript
// Success response
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation completed successfully"
}

// Error response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      // Validation details
    }
  }
}
```

## Error Handling Conventions

### Error Types
```javascript
// Custom error classes
class ValidationError extends Error {
  constructor(message, details) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

class ServiceError extends Error {
  constructor(message, service) {
    super(message);
    this.name = 'ServiceError';
    this.service = service;
  }
}
```

### Error Logging
```javascript
// Structured error logging
logger.error('Failed to parse CV', {
  error: error.message,
  stack: error.stack,
  userId: req.user?.id,
  cvId: req.body.cvId,
  timestamp: new Date().toISOString()
});
```

## Testing Conventions

### Test File Naming
- Test files: `*.test.js` or `*.spec.js`
- Test directories: `__tests__/` or `tests/`

### Test Structure
```javascript
describe('ServiceName', () => {
  let service;
  let mockDependencies;

  beforeEach(() => {
    mockDependencies = {
      // Mock dependencies
    };
    service = new ServiceName(mockDependencies);
  });

  afterEach(() => {
    // Cleanup
  });

  describe('methodName', () => {
    it('should handle success case', async () => {
      // Arrange
      const input = { /* test data */ };
      
      // Act
      const result = await service.methodName(input);
      
      // Assert
      expect(result).toBeDefined();
    });

    it('should handle error case', async () => {
      // Arrange
      const invalidInput = { /* invalid data */ };
      
      // Act & Assert
      await expect(service.methodName(invalidInput))
        .rejects.toThrow('Expected error message');
    });
  });
});
```

## Documentation Conventions

### JSDoc Comments
```javascript
/**
 * Parses CV data and extracts structured information
 * @param {Object} cvData - Raw CV data
 * @param {string} cvData.content - CV text content
 * @param {string} cvData.format - CV format (pdf, docx, txt)
 * @returns {Promise<Object>} Parsed CV information
 * @throws {ValidationError} When CV data is invalid
 * @throws {ServiceError} When parsing fails
 */
async function parseCV(cvData) {
  // Implementation
}
```

### README Sections
1. Project Overview
2. Installation & Setup
3. Usage Guide
4. API Documentation
5. Development Guide
6. Testing
7. Deployment
8. Contributing

## Git Conventions

### Branch Naming
- Feature branches: `feature/description`
- Bug fixes: `fix/description`
- Hotfixes: `hotfix/description`
- Releases: `release/version`

### Commit Messages
```
type(scope): description

feat(cv): add PDF parsing support
fix(api): resolve authentication issue
docs(readme): update installation instructions
test(services): add CV parsing tests
```

### Pull Request Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project conventions
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] No console errors
```

