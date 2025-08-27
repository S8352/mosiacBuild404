# Project: Job Copilot Browser Assistant

## Purpose
A smart, privacy-first browser extension that streamlines job applications with AI-powered CV tailoring and intelligent autofill capabilities. The system learns from user interactions to improve future applications.

## Architecture Decisions
- **Frontend**: Chrome Extension (Manifest V3) with content scripts for job site interaction
- **Backend**: Node.js/Express microservices with OpenAI GPT-4 integration
- **Database**: PostgreSQL with pgvector extension for semantic question matching
- **Storage**: Local IndexedDB for privacy, optional cloud sync
- **Deployment**: Docker containers with AWS Fargate ready

## Development Standards
- **Code Style**: ES6+ JavaScript, modular architecture
- **Testing**: Jest with 90%+ test coverage requirements
- **Documentation**: Comprehensive README and inline comments
- **Privacy**: Local-first data storage, minimal data collection

## Team Preferences
- **Communication**: GitHub Issues and Discussions
- **Review Process**: Pull request reviews with test requirements
- **Release Cycle**: Feature-based releases with Chrome Web Store deployment

## Current Development Focus
- LinkedIn Easy Apply integration (MVP complete)
- CV parsing and ATS optimization
- Learning loop for question-answer matching
- Application tracking dashboard

## Key Technical Constraints
- Chrome Extension Manifest V3 compliance
- OpenAI API rate limits and costs
- Privacy-first data handling
- Cross-platform job site compatibility

