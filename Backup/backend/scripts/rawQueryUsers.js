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
    console.log('Connected to MySQL');
    const [rows] = await conn.execute('SELECT id, name, email, role FROM users LIMIT 10');
    console.log('Rows:', rows.length);
    console.log(rows);
    await conn.end();
    process.exit(0);
  }catch(err){
    console.error('MySQL raw query failed:', err.message);
    process.exit(1);
  }
})();
