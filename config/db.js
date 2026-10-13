import mysql from 'mysql2/promise';

export function createDatabasePool(env = process.env) {
  return mysql.createPool({
    host: env.DB_HOST ?? '127.0.0.1',
    port: Number(env.DB_PORT ?? 3308),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME ?? 'tu_squad_up',
    waitForConnections: true,
    connectionLimit: 10,
    timezone: 'Z',
  });
}

const db = createDatabasePool();

export default db;
