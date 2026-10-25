import request from 'supertest';
import { createApp } from '../app';

// Build a fresh Express app for each test suite (no real DB connection needed)
const app = createApp();

describe('GET /health', () => {
  it('returns 200 with required fields', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('ChainDrive API');
    expect(res.body.version).toBeDefined();
    expect(res.body.timestamp).toBeDefined();
    expect(res.body.database).toBeDefined();
  });
});

describe('404 handler', () => {
  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/api/nonexistent-route');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/not found/i);
  });

  it('returns 404 for unknown non-api routes', async () => {
    const res = await request(app).get('/totally-unknown');
    expect(res.status).toBe(404);
  });
});

describe('CORS headers', () => {
  it('allows the configured frontend origin', async () => {
    const res = await request(app)
      .get('/health')
      .set('Origin', 'http://localhost:3000');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
  });

  it('handles preflight OPTIONS correctly', async () => {
    const res = await request(app)
      .options('/api/auth/login')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'POST');
    expect([200, 204]).toContain(res.status);
  });
});

describe('Security headers (helmet)', () => {
  it('sets X-Content-Type-Options', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('sets X-Frame-Options', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-frame-options']).toBeDefined();
  });
});

describe('JSON body parsing', () => {
  it('parses valid JSON body', async () => {
    // Use a non-existent POST route; the body should be parsed before 404 fires
    const res = await request(app)
      .post('/api/test-body-parsing')
      .send({ test: 'value' })
      .set('Content-Type', 'application/json');
    // 404, but the body parser must not throw
    expect(res.status).toBe(404);
  });
});
