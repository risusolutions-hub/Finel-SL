const http = require('http');

function post(data, cb){
  const d = JSON.stringify(data);
  const options = {
    hostname: 'localhost',
    port: 4000,
    path: '/api/complaints',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(d)
    }
  };
  const req = http.request(options, (res) => {
    console.log('STATUS:', res.statusCode);
    let body = '';
    res.on('data', c => body += c);
    res.on('end', () => cb(null, { status: res.statusCode, body }));
  });
  req.on('error', (e) => cb(e));
  req.write(d);
  req.end();
}

const payload = { customerId: '', customerData: { companyName: 'Acme Dupe', serviceNo: '01' }, machineData: { model: 'M1', serialNumber: 'SN-DUPE-1' }, problem: 'Test dupe', priority: 'high', issueCategories: ['cat'] };

post(payload, (err, res) => {
  if(err) return console.error('first error', err);
  console.log('first response', res.body);
  // Post again with same serial
  post({ customerId: '', customerData: { companyName: 'Acme Dupe 2', serviceNo: '02' }, machineData: { model: 'M1', serialNumber: 'SN-DUPE-1' }, problem: 'Test dupe 2', priority: 'medium', issueCategories: ['cat'] }, (err2, res2) => {
    if(err2) return console.error('second error', err2);
    console.log('second response', res2.body);
    process.exit(0);
  });
});