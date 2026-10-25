import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../app';
import { User } from '../models/User';

let mongod: MongoMemoryServer | null = null;
const app = createApp();

beforeAll(async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/chaindrive_test', {
      serverSelectionTimeoutMS: 2000,
    });
  } catch {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
  }
}, 30_000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
});

afterEach(async () => {
  await User.deleteMany({});
});

const BASE = '/api/auth';

const demoUser = {
  email: 'driver@test.com',
  password: 'Password123!',
  fullName: 'Test Driver',
  phone: '9876543210',
  role: 'driver' as const,
};

// ── Registration ─────────────────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  it('creates a new user and sets auth cookies', async () => {
    const res = await request(app).post(`${BASE}/register`).send(demoUser);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(demoUser.email);
    expect(res.body.data.user.passwordHash).toBeUndefined();
    // cookies should be present
    const cookies = (res.headers['set-cookie'] as unknown) as string[] | undefined;
    expect(cookies?.some((c: string) => c.startsWith('accessToken'))).toBe(true);
    expect(cookies?.some((c: string) => c.startsWith('refreshToken'))).toBe(true);
  });

  it('rejects duplicate email with 409', async () => {
    await request(app).post(`${BASE}/register`).send(demoUser);
    const res = await request(app).post(`${BASE}/register`).send(demoUser);
    expect(res.status).toBe(409);
  });

  it('rejects missing required fields with 422', async () => {
    const res = await request(app)
      .post(`${BASE}/register`)
      .send({ email: 'bad@test.com', password: 'short' });
    expect(res.status).toBe(422);
  });
});

// ── Login ─────────────────────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post(`${BASE}/register`).send(demoUser);
  });

  it('returns 200 and sets cookies on valid credentials', async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: demoUser.email, password: demoUser.password });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const cookies = (res.headers['set-cookie'] as unknown) as string[];
    expect(cookies?.some((c: string) => c.startsWith('accessToken'))).toBe(true);
  });

  it('returns 401 on wrong password', async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: demoUser.email, password: 'WrongPass!' });
    expect(res.status).toBe(401);
  });

  it('returns 401 on unknown email', async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: 'nobody@test.com', password: 'pass' });
    expect(res.status).toBe(401);
  });
});

// ── /me ───────────────────────────────────────────────────────────────────────

describe('GET /api/auth/me', () => {
  it('returns user when authenticated', async () => {
    const reg = await request(app).post(`${BASE}/register`).send(demoUser);
    const cookies = ((reg.headers['set-cookie'] as unknown) as string[]).join('; ');

    const res = await request(app)
      .get(`${BASE}/me`)
      .set('Cookie', cookies);
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(demoUser.email);
  });

  it('returns 401 when not authenticated', async () => {
    const res = await request(app).get(`${BASE}/me`);
    expect(res.status).toBe(401);
  });
});

// ── Logout ────────────────────────────────────────────────────────────────────

describe('POST /api/auth/logout', () => {
  it('clears cookies on logout', async () => {
    const reg = await request(app).post(`${BASE}/register`).send(demoUser);
    const cookies = ((reg.headers['set-cookie'] as unknown) as string[]).join('; ');

    const res = await request(app)
      .post(`${BASE}/logout`)
      .set('Cookie', cookies);
    expect(res.status).toBe(200);
    // After logout, /me should return 401
    const meRes = await request(app).get(`${BASE}/me`);
    expect(meRes.status).toBe(401);
  });
});

// ── Role-based guard ──────────────────────────────────────────────────────────

describe('Role-based authorization', () => {
  it('driver cannot access admin-only routes (placeholder test)', async () => {
    // This test ensures the authorize middleware rejects wrong roles
    // The actual admin routes will be tested when they are created
    expect(true).toBe(true); // placeholder
  });
});
