import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import createApp from '../../app.js';

describe('Server Integration', () => {
  let app;

  beforeAll(async () => {
    app = createApp();
  });

  it('should respond to health check', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'healthy');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('version');
    expect(response.body).toHaveProperty('environment');
  });

  it('should return 404 for unknown routes', async () => {
    const response = await request(app)
      .get('/unknown-route')
      .expect(404);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toHaveProperty('code', 'NOT_FOUND_ERROR');
  });

  it('should have security headers', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.headers).toHaveProperty('x-content-type-options');
    expect(response.headers).toHaveProperty('x-frame-options');
  });
});