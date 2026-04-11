// SmartGain Frontend - API Client Tests
import { describe, it, expect, beforeEach } from 'vitest';
import { setAccessToken, getAccessToken } from '../client';

describe('API Client', () => {
  beforeEach(() => {
    setAccessToken(null);
  });

  describe('Token Management', () => {
    it('should store and retrieve access token', () => {
      const token = 'test-token-123';
      setAccessToken(token);
      expect(getAccessToken()).toBe(token);
    });

    it('should clear access token when set to null', () => {
      setAccessToken('test-token');
      setAccessToken(null);
      expect(getAccessToken()).toBeNull();
    });
  });
});
