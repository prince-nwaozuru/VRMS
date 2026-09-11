const oracledb = require('oracledb');
require('dotenv').config();

oracledb.autoCommit = false;
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

let pool;

async function initializePool() {
  try {
    pool = await oracledb.createPool({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING,
      poolMin: 2,
      poolMax: 10,
      poolIncrement: 1,
    });
    console.log('✅ Oracle DB connection pool created');
  } catch (err) {
    console.error('❌ Failed to create Oracle DB pool:', err.message);
    throw err;
  }
}

async function getConnection() {
  if (!pool) throw new Error('DB pool not initialized');
  return await pool.getConnection();
}

async function execute(sql, binds = [], options = {}) {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(sql, binds, { autoCommit: true, ...options });
    return result;
  } finally {
    if (conn) await conn.close();
  }
}

async function closePool() {
  if (pool) {
    await pool.close(10);
    console.log('DB pool closed');
  }
}

module.exports = { initializePool, getConnection, execute, closePool };
