// Job Copilot Backend - Main Server
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const documentService = require('./services/documentService');
const cvParsingService = require('./services/cvParsingService');
const vectorService = require('./services/vectorService');
const authMiddleware = require('./middleware/auth');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['chrome-extension://*'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// CV Parsing endpoints
app.post('/api/parse-cv', async (req, res) => {
  try {
    const { fileData, fileType } = req.body;
    
    if (!fileData || !fileType) {
      return res.status(400).json({ 
        error: 'Missing required fields: fileData and fileType' 
      });
    }

    const parsedData = await cvParsingService.parseCV(fileData, fileType);
    
    logger.info('CV parsed successfully', { 
      extractedFields: Object.keys(parsedData).length 
    });
    
    res.json({ 
      success: true, 
      data: parsedData 
    });
  } catch (error) {
    logger.error('CV parsing failed', { error: error.message });
    res.status(500).json({ 
      error: 'Failed to parse CV', 
      details: error.message 
    });
  }
});

// Document Generation endpoints
app.post('/api/generate-documents', async (req, res) => {
  try {
    const { profileData, jobData, documentTypes } = req.body;
    
    if (!profileData || !jobData || !documentTypes) {
      return res.status(400).json({ 
        error: 'Missing required fields: profileData, jobData, documentTypes' 
      });
    }

    const documents = await documentService.generateDocuments({
      profileData,
      jobData,
      documentTypes
    });
    
    logger.info('Documents generated successfully', { 
      types: documentTypes,
      jobTitle: jobData.title 
    });
    
    res.json({ 
      success: true, 
      documents 
    });
  } catch (error) {
    logger.error('Document generation failed', { error: error.message });
    res.status(500).json({ 
      error: 'Failed to generate documents', 
      details: error.message 
    });
  }
});

// Job Fit Analysis endpoint
app.post('/api/analyze-fit', async (req, res) => {
  try {
    const { profileData, jobData } = req.body;
    
    if (!profileData || !jobData) {
      return res.status(400).json({ 
        error: 'Missing required fields: profileData and jobData' 
      });
    }

    const fitAnalysis = await documentService.analyzeFit(profileData, jobData);
    
    res.json({ 
      success: true, 
      analysis: fitAnalysis 
    });
  } catch (error) {
    logger.error('Fit analysis failed', { error: error.message });
    res.status(500).json({ 
      error: 'Failed to analyze job fit', 
      details: error.message 
    });
  }
});

// Vector/Learning endpoints
app.post('/api/store-question-answer', async (req, res) => {
  try {
    const { question, answer, userId } = req.body;
    
    if (!question || !answer) {
      return res.status(400).json({ 
        error: 'Missing required fields: question and answer' 
      });
    }

    const result = await vectorService.storeQuestionAnswer(question, answer, userId);
    
    res.json({ 
      success: true, 
      id: result.id 
    });
  } catch (error) {
    logger.error('Failed to store question-answer', { error: error.message });
    res.status(500).json({ 
      error: 'Failed to store question-answer pair', 
      details: error.message 
    });
  }
});

app.post('/api/find-similar-question', async (req, res) => {
  try {
    const { question, userId } = req.body;
    
    if (!question) {
      return res.status(400).json({ 
        error: 'Missing required field: question' 
      });
    }

    const result = await vectorService.findSimilarQuestion(question, userId);
    
    res.json({ 
      success: true, 
      result 
    });
  } catch (error) {
    logger.error('Failed to find similar question', { error: error.message });
    res.status(500).json({ 
      error: 'Failed to find similar question', 
      details: error.message 
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('Unhandled error', { 
    error: error.message, 
    stack: error.stack,
    url: req.url,
    method: req.method
  });
  
  res.status(500).json({ 
    error: 'Internal server error',
    requestId: req.id
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Job Copilot Backend server running on port ${PORT}`);
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
