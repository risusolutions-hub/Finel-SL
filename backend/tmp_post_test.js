const http = require('http');
const data = JSON.stringify({
  customerId: '',
  customerData: { companyName: 'Acme Corp', serviceNo: '01' },
  machineData: { model: 'M1', serialNumber: 'S12345-TEST-3' },
  problem: 'Test create flow',
  priority: 'high',
  issueCategories: ['cat']
});

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/complaints',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('BODY:', body);
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error('problem with request:', e.message);
  process.exit(1);
});

req.write(data);
req.end();
