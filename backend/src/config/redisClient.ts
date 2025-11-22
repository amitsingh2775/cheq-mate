
import { createClient } from 'redis';

const REDIS_URL = 'rediss://default:AWD5AAIncDJjYTRhODc3Y2NkY2I0NzgwYWVlMDI2OTM0MzdjNDVhZXAyMjQ4MjU@cheerful-mayfly-24825.upstash.io:6379'
const client = createClient({ url: REDIS_URL });

client.on('error', (err) => {

});

(async () => {
  try {
    await client.connect();
    
  } catch (err) {
   
  }
})();

export default client;
