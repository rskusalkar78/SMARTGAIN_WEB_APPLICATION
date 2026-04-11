import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import createApp from '../../app.js';

describe('Authentication API Integration', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should return validation error for missing fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details).toBeInstanceOf(Array);
    });

    it('should return validation error for invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'TestPass123',
        profile: {
          name: 'Test User',
          age: 25,
          gender: 'male',
          height: 175,
          currentWeight: 70,
          targetWeight: 80,
          activityLevel: 'moderate',
          fitnessLevel: 'beginner'
        },
        goals: {
          weeklyWeightGain: 0.5,
          goalIntensity: 'moderate'
        }
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return validation error for weak password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'weak',
        profile: {
          name: 'Test User',
          age: 25,
          gender: 'male',
          height: 175,
          currentWeight: 70,
          targetWeight: 80,
          activityLevel: 'moderate',
          fitnessLevel: 'beginner'
        },
        goals: {
          weeklyWeightGain: 0.5,
          goalIntensity: 'moderate'
        }
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should return validation error for missing credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({})
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return validation error for invalid email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'invalid-email',
          password: 'TestPass123'
        })
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/auth/profile', () => {
    it('should return 401 for missing token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .expect(401);

      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });

    it('should return 401 for invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });
  });

  describe('PUT /api/v1/auth/profile', () => {
    it('should return 401 for missing token', async () => {
      const response = await request(app)
        .put('/api/v1/auth/profile')
        .send({ 'profile.name': 'Updated Name' })
        .expect(401);

      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });

    it('should return validation error for empty update', async () => {
      const response = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .send({})
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/auth/verify', () => {
    it('should return 401 for missing token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/verify')
        .expect(401);

      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should return 401 for missing token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .expect(401);

      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });
  });
});