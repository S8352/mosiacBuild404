# Job Copilot Browser Assistant MVP

A smart, privacy-first browser extension that streamlines job applications with AI-powered CV tailoring and intelligent autofill capabilities.

## 🚀 Features

### Core Functionality
- **Smart Job Detection**: Automatically detects LinkedIn Easy Apply job postings
- **CV Parsing & Profile Management**: Upload and parse CVs with AI extraction
- **Tailored Document Generation**: Creates ATS-optimized CVs and cover letters
- **Intelligent Autofill**: Auto-fills application forms with learning capabilities
- **Job Fit Analysis**: Provides High/Medium/Low fit scores with explanations
- **Application Tracking**: Centralized dashboard for tracking applications

### Key Differentiators
- **Learning Loop**: Remembers answers to new questions for future applications
- **ATS Optimization**: Follows strict formatting rules for applicant tracking systems
- **Privacy-First**: Local storage with optional cloud sync
- **Cross-Platform**: Works on any job site (MVP focuses on LinkedIn)

## 🏗️ Architecture

### Frontend (Chrome Extension)
- **Manifest V3** compliance
- **Content Script** for LinkedIn job scraping
- **Popup Interface** for profile management and controls
- **Background Service Worker** for API communication
- **Local Storage** using IndexedDB for privacy

### Backend (Microservices)
- **Node.js/Express** API server
- **OpenAI GPT-4** for CV generation and parsing
- **PostgreSQL + pgvector** for semantic question matching
- **Redis** for caching and rate limiting
- **AWS Fargate** deployment ready

## 📋 Installation & Setup

### Prerequisites
- Node.js 18+
- PostgreSQL with pgvector extension
- Redis (optional, for caching)
- OpenAI API key

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mosaicBuild404
   ```

2. **Set up backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm run dev
   ```

3. **Set up database**
   ```bash
   # Using Docker Compose (recommended)
   docker-compose up -d postgres redis
   
   # Or manually create database and run migrations
   psql -c "CREATE DATABASE job_copilot;"
   psql job_copilot < backend/sql/init.sql
   ```

4. **Load Chrome Extension**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the project root directory
   - The extension should appear in your browser toolbar

### Environment Variables

Create `backend/.env` file:
```env
NODE_ENV=development
PORT=3000
OPENAI_API_KEY=your_openai_api_key_here
DATABASE_URL=postgresql://username:password@localhost:5432/job_copilot
JWT_SECRET=your_jwt_secret_here
```

## 🧪 Testing

### Run QA Tests
```bash
cd tests
npm install jsdom
node test-runner.js
```

### Test Coverage
- Job scraping functionality (90%+ success rate)
- CV parsing accuracy (80%+ field extraction)
- Autofill success rate (90%+ form completion)
- Learning loop question matching
- ATS optimization compliance

## 📖 Usage Guide

### 1. Profile Setup
- Click the extension icon
- Upload your CV or enter details manually
- Complete your profile for 100% score

### 2. Job Application
- Navigate to a LinkedIn Easy Apply job
- Extension automatically detects and scrapes job details
- Click "Generate Tailored CV & Cover Letter"
- Use "Auto-fill Application" for form completion

### 3. Learning Loop
- When encountering new questions, answer them once
- Extension remembers and auto-fills similar questions in future
- Builds personalized question-answer database

### 4. Application Tracking
- View all applications in the "Tracker" tab
- Monitor application status and dates
- Access direct links to company pages

## 🔧 Development

### Project Structure
```
├── manifest.json          # Chrome extension manifest
├── popup.html/js          # Extension popup interface
├── content.js/css         # LinkedIn page interaction
├── background.js          # Service worker
├── backend/               # Node.js API server
│   ├── services/          # Core business logic
│   ├── middleware/        # Authentication & validation
│   └── utils/             # Logging and utilities
├── tests/                 # QA test fixtures
└── docker-compose.yml     # Development environment
```

### API Endpoints
- `POST /api/parse-cv` - Parse uploaded CV files
- `POST /api/generate-documents` - Generate tailored CV/cover letter
- `POST /api/analyze-fit` - Calculate job fit score
- `POST /api/store-question-answer` - Learning loop storage
- `POST /api/find-similar-question` - Semantic question matching

### Adding New Job Sites
1. Update `manifest.json` host permissions
2. Add site-specific selectors in `content.js`
3. Test with new fixtures in `tests/fixtures/`

## 🚀 Deployment

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up --build

# Production deployment
docker-compose --profile production up -d
```

### AWS Fargate Deployment
1. Build Docker image: `docker build -t job-copilot-backend ./backend`
2. Push to ECR: `aws ecr get-login-password | docker login --username AWS --password-stdin <ecr-uri>`
3. Deploy to Fargate using provided task definition
4. Configure RDS PostgreSQL and ElastiCache Redis

### Chrome Web Store
1. Zip extension files (exclude backend/ and tests/)
2. Upload to Chrome Developer Dashboard
3. Complete store listing with screenshots
4. Submit for review

## 📊 Monitoring & Analytics

### Metrics Tracked
- CV parsing success rates
- Document generation latency
- Autofill completion rates
- Question-answer learning accuracy
- User engagement metrics

### Logging
- Structured JSON logging with Winston
- Error tracking with detailed stack traces
- Performance monitoring for API endpoints
- User privacy compliance logging

## 🔒 Privacy & Security

### Data Handling
- **Local-First**: Profile data stored in browser IndexedDB
- **Minimal Collection**: Only necessary data for functionality
- **Encryption**: All API communications use HTTPS
- **Anonymization**: Backend uses anonymous user IDs
- **Retention**: Automatic cleanup of old question-answer pairs

### Compliance
- Chrome Web Store privacy policy requirements
- GDPR compliance for EU users
- Transparent data usage disclosure
- User consent for cloud sync features

## 🛣️ Roadmap

### Phase 1 (MVP - Current)
- ✅ LinkedIn Easy Apply support
- ✅ Basic CV generation
- ✅ Profile management
- ✅ Application tracking

### Phase 2 (Expansion)
- [ ] Indeed, Glassdoor support
- [ ] Advanced ATS testing
- [ ] Email integration for status updates
- [ ] Chrome sync for profiles

### Phase 3 (Premium Features)
- [ ] Multiple CV templates
- [ ] Interview preparation
- [ ] Salary negotiation insights
- [ ] Team collaboration features

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

### Development Guidelines
- Follow ESLint configuration
- Add tests for new features
- Update documentation
- Maintain privacy-first principles

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Issues**: GitHub Issues for bug reports
- **Documentation**: Check README and inline comments
- **Community**: Discussions tab for questions
- **Email**: support@jobcopilot.com (for production)

## 🙏 Acknowledgments

- OpenAI for GPT-4 API
- pgvector for semantic search capabilities
- Chrome Extensions team for Manifest V3
- LinkedIn for job data structure insights

---

**Built with ❤️ for job seekers everywhere**
