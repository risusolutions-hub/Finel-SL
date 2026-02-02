const http = require('http');
// The password here must match the original plain text password used in the seed (which is 'password')
const data = JSON.stringify({ identifier: 'superadmin@example.com', password: 'password' });

const options = {
  hostname: 'localhost',
  port: process.env.PORT ? Number(process.env.PORT) : 4000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('Body:', body);
  });
});

req.on('error', (e) => console.error('Request error', e));
req.write(data);
req.end();
