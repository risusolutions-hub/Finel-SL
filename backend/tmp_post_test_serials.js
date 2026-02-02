const http = require('http');

function post(data){
  return new Promise((resolve, reject)=>{
    const d = JSON.stringify(data);
    const options = { hostname: 'localhost', port: 4000, path: '/api/complaints', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(d) } };
    const req = http.request(options, (res) => {
      let body=''; res.on('data', c=> body+=c); res.on('end', ()=> resolve({ status: res.statusCode, body }));
    });
    req.on('error', (e) => reject(e));
    req.write(d); req.end();
  });
}

(async ()=>{
  try{
    const r1 = await post({ customerId: '', customerData: { companyName: 'DupTest A', serviceNo: 'X1' }, machineData: { model: 'M-dup', serialNumber: 'SN-ASSERT-1' }, problem: 'dup 1', priority: 'high', issueCategories: ['cat'] });
    console.log('first', r1.status, r1.body);
    const r2 = await post({ customerId: '', customerData: { companyName: 'DupTest B', serviceNo: 'X2' }, machineData: { model: 'M-dup', serialNumber: 'SN-ASSERT-1' }, problem: 'dup 2', priority: 'high', issueCategories: ['cat'] });
    console.log('second', r2.status, r2.body);
  }catch(e){ console.error('err', e); process.exit(1); }
  process.exit(0);
})();