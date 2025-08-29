# Architecture: Job Copilot System Design

## System Overview
The Job Copilot system consists of a Chrome extension frontend and Node.js backend microservices, designed for privacy-first job application automation.

## Frontend Architecture (Chrome Extension)

### Components
- **manifest.json**: Extension configuration and permissions
- **popup.html/js**: User interface for profile management
- **content.js**: LinkedIn page interaction and job scraping
- **background.js**: Service worker for API communication
- **content.css**: Styling for injected UI elements

### Data Flow
1. Content script detects LinkedIn Easy Apply jobs
2. Scrapes job details and requirements
3. Sends data to backend for analysis
4. Receives tailored CV and cover letter
5. Auto-fills application forms
6. Stores learning data for future use

### Storage Strategy
- **IndexedDB**: Local storage for user profiles and preferences
- **Chrome Storage**: Extension settings and configuration
- **Memory**: Session-based caching for performance

## Backend Architecture (Node.js/Express)

### Services
- **cvParsingService.js**: AI-powered CV extraction and analysis
- **documentService.js**: Tailored document generation
- **vectorService.js**: Semantic search for question matching

### Database Schema
```sql
-- Users table for profile management
CREATE TABLE users (
    id UUID PRIMARY KEY,
    profile_data JSONB,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Question-answer pairs for learning loop
CREATE TABLE question_answers (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    question TEXT,
    answer TEXT,
    embedding VECTOR(1536),
    created_at TIMESTAMP
);

-- Applications tracking
CREATE TABLE applications (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    job_title TEXT,
    company TEXT,
    status TEXT,
    applied_at TIMESTAMP
);
```

### API Endpoints
- `POST /api/parse-cv`: Extract structured data from CV files
- `POST /api/generate-documents`: Create tailored CV/cover letter
- `POST /api/analyze-fit`: Calculate job fit score
- `POST /api/store-question-answer`: Learning loop storage
- `POST /api/find-similar-question`: Semantic question matching

## Integration Points

### OpenAI Integration
- GPT-4 for CV parsing and document generation
- Embedding models for semantic search
- Rate limiting and cost optimization

### External APIs
- LinkedIn job data (scraped via content script)
- Future: Indeed, Glassdoor APIs
- Email integration for status updates

## Security & Privacy

### Data Protection
- Local-first storage strategy
- HTTPS for all API communications
- JWT authentication for backend access
- Minimal data collection principles

### Compliance
- Chrome Web Store privacy requirements
- GDPR compliance for EU users
- Transparent data usage disclosure

## Performance Considerations

### Optimization Strategies
- Caching frequently accessed data
- Lazy loading of extension components
- Efficient vector search with pgvector
- Background processing for heavy operations

### Monitoring
- API response time tracking
- Error rate monitoring
- User engagement metrics
- Memory usage optimization

