import { Message } from '@server/chatroom/initalChatLoad';
import pool from './newPool';

interface InsertParams {
  tableName: string;
  columns: string[];
  values: (string | number)[];
  conflictColumn: string;
  updateColumn: string;
  message: Message;
}

interface UpdateParams {
  tableName: string;
  setColumn: string;
  setValue: string;
  whereColumn: string;
  whereValue: string;
}

async function insertDatabase(params: InsertParams): Promise<void> {
  const columnNames = params.columns.join(', ');
  const placeholders = params.values.map((_, idx) => `$${idx + 1}`).join(', ');
  try {
    await pool.query(
      `INSERT INTO ${params.tableName} (${columnNames}) VALUES (${placeholders}) ON CONFLICT (${params.conflictColumn}) DO UPDATE SET ${params.updateColumn} = $${params.columns.length}`,
      params.values,
    );
    params.message.channel.send('You are set! :)');
  } catch (err) {
    console.error('Database insert/update failed: ', err);
    params.message.channel.send("There's an error :(");
  }
}

async function updateDatabase(params: UpdateParams): Promise<void> {
  try {
    const query = `UPDATE ${params.tableName} SET ${params.setColumn} = $1 WHERE ${params.whereColumn} = $2`;
    await pool.query(query, [params.setValue, params.whereValue]);
    console.log('Database updated successfully');
  } catch (err) {
    console.error('Failed updating database: ', err);
  }
}

export { insertDatabase, updateDatabase, InsertParams, UpdateParams };
