// Job Copilot Backend - Authentication Middleware
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'job-copilot-secret-key';

class AuthMiddleware {
  // Generate JWT token for anonymous users
  generateAnonymousToken() {
    const payload = {
      userId: `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'anonymous',
      createdAt: new Date().toISOString()
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
  }

  // Verify JWT token
  verifyToken(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        // For MVP, allow requests without auth but generate anonymous token
        req.user = {
          userId: `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'anonymous'
        };
        return next();
      }

      const token = authHeader.split(' ')[1]; // Bearer <token>
      
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      
      logger.info('Token verified successfully', { 
        userId: decoded.userId,
        type: decoded.type 
      });
      
      next();
    } catch (error) {
      logger.error('Token verification failed', { error: error.message });
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
      } else if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token' });
      }
      
      return res.status(401).json({ error: 'Authentication failed' });
    }
  }

  // Optional auth - allows both authenticated and anonymous users
  optionalAuth(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        req.user = {
          userId: `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'anonymous'
        };
        return next();
      }

      const token = authHeader.split(' ')[1];
      
      if (token) {
        try {
          const decoded = jwt.verify(token, JWT_SECRET);
          req.user = decoded;
        } catch (error) {
          // If token is invalid, treat as anonymous
          req.user = {
            userId: `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'anonymous'
          };
        }
      }
      
      next();
    } catch (error) {
      logger.error('Optional auth middleware error', { error: error.message });
      req.user = {
        userId: `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'anonymous'
      };
      next();
    }
  }

  // Rate limiting by user
  createUserRateLimit() {
    const { RateLimiterRedis } = require('rate-limiter-flexible');
    
    return new RateLimiterRedis({
      storeClient: require('redis').createClient({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379
      }),
      keyPrefix: 'job_copilot_rl',
      points: 50, // Number of requests
      duration: 3600, // Per hour
    });
  }
}

module.exports = new AuthMiddleware();
