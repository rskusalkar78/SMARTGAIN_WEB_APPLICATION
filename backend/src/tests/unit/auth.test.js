import { describe, it, expect } from 'vitest';
import authService from '../../services/auth/authService.js';

describe('Authentication Service - Unit Tests', () => {
  describe('JWT Token Operations', () => {
    it('should generate and verify valid JWT token', () => {
      const user = {
        _id: '507f1f77bcf86cd799439011',
        email: 'token@example.com',
        profile: { name: 'Token User' }
      };

      const token = authService.generateToken(user);
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);

      const decoded = authService.verifyToken(token);
      expect(decoded.userId).toBe(user._id);
      expect(decoded.email).toBe(user.email);
      expect(decoded.name).toBe(user.profile.name);
    });

    it('should reject invalid token', () => {
      expect(() => authService.verifyToken('invalid-token'))
        .toThrow('Invalid token');
    });

    it('should reject empty token', () => {
      expect(() => authService.verifyToken(''))
        .toThrow('Invalid token');
    });
  });

  describe('Password Utilities', () => {
    it('should hash password correctly', async () => {
      const password = 'TestPassword123';
      const hashedPassword = await authService.hashPassword(password);
      
      expect(typeof hashedPassword).toBe('string');
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(0);
    });

    it('should compare passwords correctly', async () => {
      const password = 'TestPassword123';
      const hashedPassword = await authService.hashPassword(password);
      
      const isMatch = await authService.comparePasswords(password, hashedPassword);
      expect(isMatch).toBe(true);
      
      const isNotMatch = await authService.comparePasswords('WrongPassword', hashedPassword);
      expect(isNotMatch).toBe(false);
    });
  });
});