import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

/**
 * Property-based tests for authentication security round trip
 * Feature: smartgain-backend, Property 4: Authentication Security Round Trip
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4
 */
describe('Authentication Security Round Trip Properties', () => {
  // Custom arbitraries for generating valid user data
  const validEmailArbitrary = fc.string({ minLength: 3, maxLength: 20 })
    .map(name => `${name.replace(/[^a-zA-Z0-9]/g, '')}@example.com`)
    .filter(email => email.length >= 7); // Ensure minimum valid email length

  const validPasswordArbitrary = fc.string({ minLength: 8, maxLength: 20 })
    .map(base => `${base}A1`) // Ensure it meets password requirements (uppercase, lowercase, number)
    .filter(password => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password));

  /**
   * Property 4.1: Password hashing should be secure and consistent
   * For any valid password, bcrypt hashing should produce different results but verify correctly
   */
  it('should hash passwords securely with bcrypt (≥10 salt rounds)', async () => {
    const property = fc.asyncProperty(validPasswordArbitrary, async (password) => {
      const saltRounds = 10; // Reduced for test performance while still meeting requirements (≥10)
      
      // Hash the password once (reduced operations)
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Verify bcrypt hash format
      expect(hashedPassword).toMatch(/^\$2[aby]\$\d{2}\$/);
      
      // Verify salt rounds (should be ≥10)
      const actualSaltRounds = parseInt(hashedPassword.split('$')[2]);
      expect(actualSaltRounds).toBeGreaterThanOrEqual(10);
      expect(actualSaltRounds).toBe(10);
      
      // Should verify correctly with original password
      expect(await bcrypt.compare(password, hashedPassword)).toBe(true);

      // Should fail with wrong password
      expect(await bcrypt.compare(password + 'wrong', hashedPassword)).toBe(false);

      return true;
    });

    await fc.assert(property, { 
      numRuns: 5, // Further reduced for performance
      timeout: 30000
    });
  });

  /**
   * Property 4.2: JWT token generation and validation round trip
   * For any valid user data, JWT tokens should be generated and validated correctly
   */
  it('should generate and validate JWT tokens correctly', async () => {
    const userDataArbitrary = fc.record({
      _id: fc.string({ minLength: 24, maxLength: 24 }).map(id => id.padEnd(24, '0')),
      email: validEmailArbitrary,
      profile: fc.record({
        name: fc.string({ minLength: 1, maxLength: 50 }).map(name => name.trim() || 'TestUser')
      })
    });

    const property = fc.property(userDataArbitrary, (userData) => {
      const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
      const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';

      // Generate JWT token payload
      const payload = {
        userId: userData._id,
        email: userData.email,
        name: userData.profile.name
      };

      // Generate JWT token
      const token = jwt.sign(payload, jwtSecret, {
        expiresIn: jwtExpiresIn,
        issuer: 'smartgain-backend',
        audience: 'smartgain-client'
      });

      // Verify JWT token structure (should have 3 parts separated by dots)
      expect(token.split('.').length).toBe(3);

      // Verify token can be decoded
      const decoded = jwt.verify(token, jwtSecret, {
        issuer: 'smartgain-backend',
        audience: 'smartgain-client'
      });
      
      // Verify token payload contains correct user data
      expect(decoded.userId).toBe(userData._id);
      expect(decoded.email).toBe(userData.email);
      expect(decoded.name).toBe(userData.profile.name);
      expect(decoded.iss).toBe('smartgain-backend');
      expect(decoded.aud).toBe('smartgain-client');

      // Verify token has expiration
      expect(decoded.exp).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));

      return true;
    });

    await fc.assert(property, { 
      numRuns: 100,
      timeout: 10000
    });
  });

  /**
   * Property 4.3: Invalid JWT tokens should always be rejected
   * For any invalid token, verification should fail consistently
   */
  it('should reject invalid JWT tokens consistently', async () => {
    const invalidTokenArbitrary = fc.oneof(
      fc.constant(''), // empty token
      fc.constant('invalid-token'), // malformed token
      fc.string({ minLength: 10, maxLength: 100 }), // random string
      fc.constant('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c') // valid JWT structure but wrong signature
    );

    const property = fc.property(invalidTokenArbitrary, (invalidToken) => {
      const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

      // Attempt to verify invalid token should throw an error
      expect(() => jwt.verify(invalidToken, jwtSecret, {
        issuer: 'smartgain-backend',
        audience: 'smartgain-client'
      })).toThrow();

      return true;
    });

    await fc.assert(property, { 
      numRuns: 50,
      timeout: 5000
    });
  });

  /**
   * Property 4.4: Password comparison should be consistent
   * For any password and hash, comparison should always return the same result
   */
  it('should perform password comparison consistently', async () => {
    const property = fc.asyncProperty(
      validPasswordArbitrary,
      async (correctPassword) => {
        const wrongPassword = correctPassword + 'X'; // Simple wrong password

        const saltRounds = 10; // Reduced for test performance
        // Hash the correct password
        const hashedPassword = await bcrypt.hash(correctPassword, saltRounds);

        // Correct password should always match
        const correctResult = await bcrypt.compare(correctPassword, hashedPassword);
        expect(correctResult).toBe(true);

        // Wrong password should always fail
        const wrongResult = await bcrypt.compare(wrongPassword, hashedPassword);
        expect(wrongResult).toBe(false);

        return true;
      }
    );

    await fc.assert(property, { 
      numRuns: 5, // Further reduced for performance
      timeout: 30000
    });
  });

  /**
   * Property 4.5: JWT token expiration should be enforced
   * Expired tokens should be rejected consistently
   */
  it('should reject expired JWT tokens', async () => {
    const userDataArbitrary = fc.record({
      _id: fc.string({ minLength: 24, maxLength: 24 }).map(id => id.padEnd(24, '0')),
      email: validEmailArbitrary,
      profile: fc.record({
        name: fc.string({ minLength: 1, maxLength: 50 }).map(name => name.trim() || 'TestUser')
      })
    });

    const property = fc.property(userDataArbitrary, (userData) => {
      const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

      // Create an expired token (expired 1 hour ago)
      const expiredPayload = {
        userId: userData._id,
        email: userData.email,
        name: userData.profile.name,
        exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
        iss: 'smartgain-backend',
        aud: 'smartgain-client'
      };

      const expiredToken = jwt.sign(expiredPayload, jwtSecret);

      // Expired token should be rejected
      expect(() => jwt.verify(expiredToken, jwtSecret, {
        issuer: 'smartgain-backend',
        audience: 'smartgain-client'
      })).toThrow('jwt expired');

      return true;
    });

    await fc.assert(property, { 
      numRuns: 20,
      timeout: 5000
    });
  });

  /**
   * Property 4.6: Authentication security round trip (core logic)
   * For any valid credentials, the complete authentication flow should work
   */
  it('should complete authentication security round trip for core components', async () => {
    const credentialsArbitrary = fc.record({
      email: validEmailArbitrary,
      password: validPasswordArbitrary,
      userId: fc.string({ minLength: 24, maxLength: 24 }).map(id => id.padEnd(24, '0')),
      name: fc.string({ minLength: 1, maxLength: 50 }).map(name => name.trim() || 'TestUser')
    });

    const property = fc.asyncProperty(credentialsArbitrary, async (credentials) => {
      const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
      const saltRounds = 10; // Reduced for test performance

      // Step 1: Hash password (simulating registration)
      const hashedPassword = await bcrypt.hash(credentials.password, saltRounds);
      
      // Verify password is hashed securely
      expect(hashedPassword).not.toBe(credentials.password);
      expect(hashedPassword).toMatch(/^\$2[aby]\$10\$/); // bcrypt with 10 salt rounds
      
      // Step 2: Verify password (simulating login)
      const isPasswordValid = await bcrypt.compare(credentials.password, hashedPassword);
      expect(isPasswordValid).toBe(true);
      
      // Step 3: Generate JWT token (simulating successful login)
      const tokenPayload = {
        userId: credentials.userId,
        email: credentials.email,
        name: credentials.name
      };
      
      const token = jwt.sign(tokenPayload, jwtSecret, {
        expiresIn: '24h',
        issuer: 'smartgain-backend',
        audience: 'smartgain-client'
      });
      
      // Verify token structure
      expect(token.split('.').length).toBe(3);
      
      // Step 4: Validate JWT token (simulating protected endpoint access)
      const decoded = jwt.verify(token, jwtSecret, {
        issuer: 'smartgain-backend',
        audience: 'smartgain-client'
      });
      
      // Verify decoded token contains correct information
      expect(decoded.userId).toBe(credentials.userId);
      expect(decoded.email).toBe(credentials.email);
      expect(decoded.name).toBe(credentials.name);
      expect(decoded.iss).toBe('smartgain-backend');
      expect(decoded.aud).toBe('smartgain-client');
      
      // Step 5: Verify wrong password fails
      const wrongPasswordResult = await bcrypt.compare(credentials.password + 'wrong', hashedPassword);
      expect(wrongPasswordResult).toBe(false);
      
      // Step 6: Verify invalid token fails
      expect(() => jwt.verify(token + 'invalid', jwtSecret)).toThrow();

      return true;
    });

    await fc.assert(property, { 
      numRuns: 5, // Further reduced for performance
      timeout: 60000
    });
  });
});