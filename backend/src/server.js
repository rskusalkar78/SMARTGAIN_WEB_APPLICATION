import createApp from './app.js';
import database from './config/database.js';
import { config, validateConfig } from './config/index.js';
import logger from './utils/logger.js';
import { handleUnhandledRejection, handleUncaughtException } from './middleware/errorHandler.js';
import fs from 'fs';
import path from 'path';

/**
 * Start the SmartGain backend server
 */
async function startServer() {
  try {
    // Validate configuration
    validateConfig();
    logger.info('Configuration validated successfully');

    // Ensure logs directory exists
    const logsDir = config.paths.logs;
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
      logger.info('Created logs directory');
    }

    // Connect to database
    await database.connect();
    logger.info('Database connection established');

    // Create Express app
    const app = createApp();

    // Start server
    const server = app.listen(config.server.port, () => {
      logger.info(`SmartGain backend server started`, {
        port: config.server.port,
        environment: config.server.env,
        apiVersion: config.server.apiVersion,
        nodeVersion: process.version
      });
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
        try {
          await database.disconnect();
          logger.info('Database connection closed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown:', error);
          process.exit(1);
        }
      });
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return server;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle unhandled rejections and exceptions
handleUnhandledRejection();
handleUncaughtException();

// Start server if this file is run directly
// Note: In ES modules, we need to check if this is the main module
const isMainModule = import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` || 
                     import.meta.url.endsWith('/server.js');

if (isMainModule) {
  startServer();
}

export default startServer;