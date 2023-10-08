import fs from 'fs';
import path from 'path';
import pool from './newPool';

async function createDb(fileName: string): Promise<void> {
  try {
    const dbSetupScript = fs.readFileSync(path.resolve(__dirname, fileName), 'utf-8');
    await pool.query(dbSetupScript);
    console.log('Created database successfully');
  } catch (err) {
    console.error('Error craeting database:', err);
  }
}

export default createDb;
