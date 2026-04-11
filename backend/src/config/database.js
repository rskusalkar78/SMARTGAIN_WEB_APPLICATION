import mongoose from 'mongoose';
import { config } from './index.js';
import logger from '../utils/logger.js';

/**
 * Database connection configuration and management
 */
class Database {
  constructor() {
    this.connection = null;
  }

  /**
   * Connect to MongoDB Atlas
   */
  async connect() {
    try {
      const options = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 2000, // Reduced timeout
        socketTimeoutMS: 5000, // Reduced timeout
        bufferMaxEntries: 0,
        bufferCommands: false,
      };

      this.connection = await mongoose.connect(config.database.uri, options);
      
      logger.info('MongoDB connected successfully', {
        host: this.connection.connection.host,
        port: this.connection.connection.port,
        database: this.connection.connection.name
      });

      // Handle connection events
      mongoose.connection.on('error', (error) => {
        logger.error('MongoDB connection error:', error);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected');
      });

      return this.connection;
    } catch (error) {
      logger.error('MongoDB connection failed:', error);
      
      // In development, allow server to start without database
      if (config.server.env === 'development') {
        logger.warn('Starting server without database connection in development mode');
        return null;
      }
      
      throw error;
    }
  }

  /**
   * Disconnect from MongoDB
   */
  async disconnect() {
    try {
      if (this.connection) {
        await mongoose.disconnect();
        logger.info('MongoDB disconnected successfully');
      }
    } catch (error) {
      logger.error('Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      connected: mongoose.connection.readyState === 1,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    };
  }
}

export default new Database();