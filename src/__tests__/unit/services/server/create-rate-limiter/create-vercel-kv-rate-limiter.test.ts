import { createVercelKVRateLimiter } from '@/services/server/create-rate-limiter/create-vercel-kv-rate-limiter';
import { v4 as uuid } from 'uuid';

describe('createVercelKVRateLimiter', () => {
  it(`returns a RateLimiter whose .limit method returns an object with a 
  success property of true until the limit is hit.`, async () => {
    const ip = '1.2.3.4';
    const route = '/' + uuid();

    const rateLimiter = createVercelKVRateLimiter({
      route,
      allowedRequests: 5,
      duration: 1,
      durationUnit: 'm',
    });

    for (let i = 0; i < 5; i++) {
      const { success } = await rateLimiter.limit(ip);
      expect(success).toBe(true);
    }

    const { success } = await rateLimiter.limit(ip);
    expect(success).toBe(false);
  });
});
