import { beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';

// Test database configuration
const TEST_DB_URI = 'mongodb://localhost:27017/smartgain_test';

// Only connect to database for integration tests
const shouldConnectToDb = process.env.VITEST_DB_TESTS === 'true';

beforeAll(async () => {
  if (shouldConnectToDb) {
    // Connect to test database only for integration tests
    if (mongoose.connection.readyState === 0) {
      try {
        await mongoose.connect(TEST_DB_URI);
      } catch (error) {
        console.warn('MongoDB not available for tests, skipping database tests');
      }
    }
  }
});

beforeEach(async () => {
  if (shouldConnectToDb && mongoose.connection.readyState === 1) {
    // Clean up database before each test
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }
});

afterAll(async () => {
  if (shouldConnectToDb && mongoose.connection.readyState === 1) {
    // Close database connection after all tests
    await mongoose.connection.close();
  }
});