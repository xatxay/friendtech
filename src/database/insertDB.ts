import { InsertParams, UpdateParams, SelectParams } from './interface';
import pool from './newPool';

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
    const update = `UPDATE ${params.tableName} SET ${params.setColumn} = $1 WHERE ${params.whereColumn} = $2`;
    await pool.query(update, [params.setValue, params.whereValue]);
    console.log('Database updated successfully');
  } catch (err) {
    console.error('Failed updating database: ', err);
  }
}

async function selectDatabase(params: SelectParams): Promise<string | void> {
  const columnNames = params.columns.join(', ');
  try {
    const select = `SELECT ${columnNames} FROM ${params.tableName} WHERE ${params.whereColumn} = $1`;
    return await pool.query(select, [params.whereValue]);
  } catch (err) {
    console.error('Failed selecting items from database: ', err);
  }
}

export { insertDatabase, updateDatabase, selectDatabase, InsertParams, UpdateParams, SelectParams };
