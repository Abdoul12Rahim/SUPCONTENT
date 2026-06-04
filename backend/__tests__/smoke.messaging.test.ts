import request from 'supertest';
import app from '../src/app';

describe('Messaging smoke', () => {
  it('GET /api/messages/conversations/with/:userId requires auth', async () => {
    const res = await request(app).get('/api/messages/conversations/with/000000000000000000000000');
    expect([401,403,404]).toContain(res.status);
  });
});
