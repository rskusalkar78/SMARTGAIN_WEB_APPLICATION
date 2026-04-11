import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Application configuration
 */
export const config = {
  // Server configuration
  server: {
    port: parseInt(process.env.PORT, 10) || 3001,
    env: process.env.NODE_ENV || 'development',
    apiVersion: process.env.API_VERSION || 'v1'
  },

  // Database configuration
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/smartgain',
    name: process.env.DB_NAME || 'smartgain'
  },

  // Authentication configuration
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'fallback-secret-key',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12
  },

  // Security configuration
  security: {
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000, // 15 minutes
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173'
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/smartgain.log'
  },

  // Application paths
  paths: {
    root: path.resolve(__dirname, '../..'),
    src: path.resolve(__dirname, '..'),
    logs: path.resolve(__dirname, '../../logs')
  }
};

/**
 * Validate required environment variables
 */
export function validateConfig() {
  const required = [
    'JWT_SECRET',
    'MONGODB_URI'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0 && config.server.env === 'production') {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return true;
}