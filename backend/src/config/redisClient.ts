
import { createClient } from 'redis';

const REDIS_URL = 'rediss://default:AWD5AAIncDJjYTRhODc3Y2NkY2I0NzgwYWVlMDI2OTM0MzdjNDVhZXAyMjQ4MjU@cheerful-mayfly-24825.upstash.io:6379'
const client = createClient({ url: REDIS_URL });

client.on('error', (err) => {
  console.error('Redis Client Error', err);
});

(async () => {
  try {
    await client.connect();
    console.log('Redis connected successfully');
  } catch (err) {
    console.error('Redis connection failed', err);
  }
})();

export default client;
