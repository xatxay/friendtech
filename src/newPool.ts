import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.POSTGRESURL,
});

export default pool;
