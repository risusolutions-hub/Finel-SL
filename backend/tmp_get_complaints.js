const http = require('http');
http.get('http://localhost:4000/api/complaints', (res) => {
  let body='';
  res.on('data', c=> body+=c);
  res.on('end', ()=>{
    try{
      console.log('RAW BODY:', body);
      const parsed=JSON.parse(body);
      const list = parsed.complaints || [];
      console.log('IDS:', list.slice(-5).map(c=>({id:c.id||c._id, customerId:c.customerId, machineId:c.machineId})).join('\n'));
    }catch(e){ console.error('parse error', e); }
    process.exit(0);
  });
}).on('error', e=>{ console.error('err', e); process.exit(1); });