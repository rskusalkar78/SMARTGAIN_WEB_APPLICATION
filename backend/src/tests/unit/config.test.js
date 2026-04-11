import { describe, it, expect } from 'vitest';
import { config, validateConfig } from '../../config/index.js';

describe('Configuration', () => {
  it('should have all required configuration properties', () => {
    expect(config).toBeDefined();
    expect(config.server).toBeDefined();
    expect(config.database).toBeDefined();
    expect(config.auth).toBeDefined();
    expect(config.security).toBeDefined();
    expect(config.logging).toBeDefined();
    expect(config.paths).toBeDefined();
  });

  it('should have valid server configuration', () => {
    expect(config.server.port).toBeTypeOf('number');
    expect(config.server.env).toBeTypeOf('string');
    expect(config.server.apiVersion).toBeTypeOf('string');
  });

  it('should have valid database configuration', () => {
    expect(config.database.uri).toBeTypeOf('string');
    expect(config.database.name).toBeTypeOf('string');
  });

  it('should have valid authentication configuration', () => {
    expect(config.auth.jwtSecret).toBeTypeOf('string');
    expect(config.auth.jwtExpiresIn).toBeTypeOf('string');
    expect(config.auth.bcryptSaltRounds).toBeTypeOf('number');
    expect(config.auth.bcryptSaltRounds).toBeGreaterThanOrEqual(10);
  });

  it('should validate configuration successfully in development', () => {
    expect(() => validateConfig()).not.toThrow();
  });
});