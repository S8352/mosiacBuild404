# Job Copilot Backend - Python API

A high-performance Python backend for Job Copilot, built with FastAPI and powered by AI for CV parsing, document generation, and job analysis.

## 🚀 Features

### Core Functionality
- **CV Parsing**: AI-powered extraction of structured data from CV files (PDF, DOCX, DOC)
- **Document Generation**: Tailored CV and cover letter generation using GPT-4
- **Job Analysis**: Intelligent job fit analysis and requirement matching
- **NLP Processing**: Advanced text processing and entity extraction
- **Learning Loop**: Semantic question-answer matching for application forms

### Technical Features
- **FastAPI**: Modern, fast web framework with automatic API documentation
- **Async/Await**: High-performance asynchronous processing
- **AI Integration**: OpenAI GPT-4 for intelligent document generation
- **Database**: PostgreSQL with pgvector for semantic search
- **Caching**: Redis for performance optimization
- **Docker**: Containerized deployment
- **Structured Logging**: JSON logging with structured data

## 🏗️ Architecture

```
┌─────────────────┐    HTTP API    ┌─────────────────┐
│   Chrome        │◄──────────────►│   Python        │
│   Extension     │                │   Backend       │
│   (Frontend)    │                │   (FastAPI)     │
└─────────────────┘                └─────────────────┘
         │                                   │
         │ Local Storage                    │
         │ (Profile, Apps, Settings)        │
         │                                   │
         │                                   │ OpenAI API
         │                                   │ (GPT-4)
         │                                   │
         │                                   │ PostgreSQL
         │                                   │ (pgvector)
         │                                   │
         │                                   │ Redis
         │                                   │ (Caching)
```

## 📋 Prerequisites

- Python 3.11+
- PostgreSQL 15+ with pgvector extension
- Redis 7+
- OpenAI API key

## 🛠️ Installation & Setup

### 1. Clone and Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Environment Configuration
```bash
cp env.example .env
# Edit .env with your configuration
```

### 3. Database Setup
```bash
# Using Docker Compose (recommended)
docker-compose up -d postgres redis

# Or manually create database
psql -c "CREATE DATABASE job_copilot;"
psql job_copilot < sql/init.sql
```

### 4. Run Development Server
```bash
# Development mode with auto-reload
uvicorn main:app --reload --host 0.0.0.0 --port 3000

# Or using the main script
python main.py
```

### 5. Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up --build

# Or build standalone
docker build -t job-copilot-backend .
docker run -p 3000:3000 job-copilot-backend
```

## 📚 API Documentation

Once the server is running, visit:
- **Interactive API Docs**: http://localhost:3000/docs
- **ReDoc Documentation**: http://localhost:3000/redoc

### Key Endpoints

#### CV Parsing
- `POST /api/parse-cv` - Parse CV file data
- `POST /api/parse-cv-file` - Upload and parse CV file

#### Document Generation
- `POST /api/generate-documents` - Generate CV and cover letter
- `POST /api/generate-cv` - Generate tailored CV only
- `POST /api/generate-cover-letter` - Generate cover letter only

#### Job Analysis
- `POST /api/analyze-job-fit` - Analyze job-candidate fit
- `POST /api/analyze-job-requirements` - Analyze job requirements
- `POST /api/suggest-improvements` - Suggest profile improvements

#### Health Checks
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed system metrics
- `GET /health/ready` - Readiness probe
- `GET /health/live` - Liveness probe

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DEBUG` | Enable debug mode | `false` |
| `PORT` | Server port | `3000` |
| `SECRET_KEY` | Application secret key | Required |
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `OPENAI_API_KEY` | OpenAI API key | Required |
| `OPENAI_MODEL` | OpenAI model to use | `gpt-4` |
| `ALLOWED_ORIGINS` | CORS allowed origins | `chrome-extension://*` |

### AI Configuration

The backend uses OpenAI GPT-4 for:
- CV parsing and data extraction
- Document generation (CV, cover letters)
- Job fit analysis
- Requirement matching

Configure AI settings in `.env`:
```env
OPENAI_API_KEY=your-api-key
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=4000
OPENAI_TEMPERATURE=0.7
```

## 🧪 Testing

### Run Tests
```bash
# Install test dependencies
pip install pytest pytest-asyncio

# Run tests
pytest

# Run with coverage
pytest --cov=app tests/
```

### Test API Endpoints
```bash
# Test health endpoint
curl http://localhost:3000/health

# Test CV parsing (example)
curl -X POST http://localhost:3000/api/parse-cv \
  -H "Content-Type: application/json" \
  -d '{"file_data": "base64-encoded-data", "file_type": "pdf"}'
```

## 📊 Monitoring

### Logging
- Structured JSON logging
- Request/response logging
- Error tracking with stack traces
- Performance metrics

### Health Checks
- Database connectivity
- Redis connectivity
- OpenAI API status
- System resource usage

### Metrics
- Request latency
- Error rates
- AI processing times
- Database query performance

## 🔒 Security

### Authentication
- JWT token-based authentication
- API key validation
- Rate limiting per IP

### Data Protection
- Input validation with Pydantic
- SQL injection prevention
- XSS protection
- CORS configuration

### Privacy
- No persistent storage of sensitive data
- Encrypted API communications
- Secure file handling

## 🚀 Deployment

### Docker Compose (Recommended)
```bash
# Production deployment
docker-compose --profile production up -d

# Development deployment
docker-compose up -d
```

### AWS Fargate
1. Build Docker image
2. Push to ECR
3. Deploy using provided task definition
4. Configure RDS and ElastiCache

### Kubernetes
1. Apply Kubernetes manifests
2. Configure secrets and configmaps
3. Set up ingress and service mesh

## 🔧 Development

### Project Structure
```
backend/
├── app/
│   ├── api/
│   │   └── routes/          # API endpoints
│   ├── core/               # Core configuration
│   ├── models/             # Pydantic models
│   └── services/           # Business logic
├── sql/                    # Database migrations
├── tests/                  # Test files
├── main.py                 # Application entry point
├── requirements.txt        # Python dependencies
├── Dockerfile             # Docker configuration
└── README.md              # This file
```

### Adding New Features

1. **New API Endpoint**:
   - Add route in `app/api/routes/`
   - Create Pydantic models in `app/models/`
   - Add business logic in `app/services/`

2. **New Service**:
   - Create service class in `app/services/`
   - Add to dependency injection
   - Update tests

3. **Database Changes**:
   - Create migration in `sql/`
   - Update models if needed
   - Test with sample data

### Code Quality
- **Formatting**: Black for code formatting
- **Linting**: Flake8 for code quality
- **Type Checking**: MyPy for type safety
- **Testing**: Pytest for unit and integration tests

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes and add tests
4. Run linting and tests: `make test`
5. Commit changes: `git commit -m 'Add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Issues**: GitHub Issues for bug reports
- **Documentation**: Check API docs at `/docs`
- **Community**: Discussions tab for questions
- **Email**: support@jobcopilot.com (for production)

---

**Built with ❤️ using FastAPI and Python**
