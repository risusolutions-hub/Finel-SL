require('dotenv').config();
const mysql = require('mysql2/promise');
(async ()=>{
  try{
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    });
    const [rows] = await conn.execute("SELECT id, passwordHash FROM users WHERE email = ? LIMIT 1", ['superadmin@example.com']);
    console.log(rows);
    await conn.end();
    process.exit(0);
  }catch(err){
    console.error('Failed:', err.message);
    process.exit(1);
  }
})();
