process.env.NODE_ENV = 'development';

const request = require('supertest');
const { app, server } = require('../server');
const AppState = require('../models/AppState');

afterAll((done) => {
  // close server if running
  try {
    server.close(() => done());
  } catch (e) {
    done();
  }
});

describe('Basic API sanity', () => {
  test('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });

  test('GET /api/image/hanuman-full redirects', async () => {
    const res = await request(app).get('/api/image/hanuman-full');
    expect(res.statusCode).toBe(302);
  });

  test('POST /api/data persists centralized snapshot', async () => {
    await AppState.deleteMany({ key: 'main' });

    const payload = {
      currentYear: 'year2024_25',
      appTitleGu: 'શુભ વ્યાપાર',
      appDescriptionGu: 'ચોપડા પૂજન ડિજિટલ ખાતાવહી',
      members: [],
      masterRows: [],
      recentLogs: [],
    };
    const res = await request(app).post('/api/data').send(payload).set('Accept', 'application/json');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);

    const snapshot = await AppState.findOne({ key: 'main' }).lean();
    expect(snapshot).toBeTruthy();
    expect(snapshot).toHaveProperty('appTitleGu', 'શુભ વ્યાપાર');
  });

  test('POST /api/logout returns success', async () => {
    const res = await request(app).post('/api/logout');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });
});
