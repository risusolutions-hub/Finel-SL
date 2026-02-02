require('dotenv').config();
const { ApiLog, sequelize } = require('../src/models');

(async function(){
  try{
    await sequelize.authenticate();
    console.log('DB connected');

    const logs = await ApiLog.findAll({ where: { statusCode: 401 }, order: [['createdAt','DESC']], limit: 20 });
    if(logs.length === 0){
      console.log('No recent 401 ApiLog entries found');
    } else {
      logs.forEach(l => {
        console.log('---');
        console.log(`${l.createdAt.toISOString()} ${l.method} ${l.endpoint} status=${l.statusCode} userId=${l.userId}`);
        console.log('request:', l.requestBody);
        console.log('errorMessage:', l.errorMessage);
      });
    }
    process.exit(0);
  }catch(err){
    console.error('Failed to query ApiLog:', err.message);
    process.exit(1);
  }
})();
