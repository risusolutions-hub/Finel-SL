require('dotenv').config();
(async ()=>{
  try{
    const { sequelize, User } = require('../src/models');
    await sequelize.authenticate();
    console.log('Connected to SQL at', process.env.DB_HOST+':'+process.env.DB_PORT);
    const count = await User.count();
    console.log('User count:', count);
    const users = await User.findAll({ limit: 10 });
    users.forEach(u=>console.log(u.get({ plain: true })));
    process.exit(0);
  }catch(err){
    console.error('SQL check failed:', err.message);
    if(err.original) console.error('Original:', err.original.message);
    process.exit(1);
  }
})();
