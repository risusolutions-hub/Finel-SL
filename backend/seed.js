require('dotenv').config();
const { connectMongo, mongoose } = require('./src/config/mongo');
const { User } = require('./src/models_mongo');

async function seed(){
  try{
    console.log('Starting Mongo seed...');
    await connectMongo();

    // Dynamic models for Customer and Machine (no strict schema)
    const Customer = mongoose.models.Customer || mongoose.model('Customer', new mongoose.Schema({}, { strict: false }));
    const Machine = mongoose.models.Machine || mongoose.model('Machine', new mongoose.Schema({}, { strict: false }));
    const EngineerStatus = mongoose.models.EngineerStatus || mongoose.model('EngineerStatus', new mongoose.Schema({}, { strict: false }));

    // Users
    const existingUsers = await User.find().lean().exec();
    if(existingUsers.length === 0){
      console.log('Seeding users...');
      await User.deleteMany({});
      const users = [
        { name: 'Super Admin', email: 'superadmin@example.com', passwordHash: 'password', role: 'superadmin' },
        { name: 'Admin User', email: 'admin@example.com', passwordHash: 'password', role: 'admin' },
        { name: 'Manager User', email: 'manager@example.com', passwordHash: 'password', role: 'manager' },
        { name: 'Engineer User', email: 'engineer@example.com', passwordHash: 'password', role: 'engineer' }
      ];

      for(const u of users){
        const user = new User({ name: u.name, email: u.email, passwordHash: u.passwordHash, role: u.role });
        await user.save();
        console.log('Created user:', u.email);
        if(u.role === 'engineer'){
          await EngineerStatus.create({ engineerId: user._id, status: 'free' });
        }
      }
    } else {
      console.log('Users already present, skipping users seed');
    }

    // Customers
    const existingCustomers = await Customer.find().lean().exec();
    if(existingCustomers.length === 0){
      console.log('Seeding customers...');
      await Customer.deleteMany({});
      const customers = [
        { name: 'John Doe', company: 'ABC Corp', city: 'New York', contact: '1234567890' },
        { name: 'Jane Smith', company: 'XYZ Ltd', city: 'Los Angeles', contact: '0987654321' }
      ];
      await Customer.insertMany(customers);
    } else {
      console.log('Customers already present, skipping');
    }

    // Machines
    const existingMachines = await Machine.find().lean().exec();
    if(existingMachines.length === 0){
      console.log('Seeding machines...');
      await Machine.deleteMany({});
      const machines = [
        { model: 'Laser 1000', serialNumber: 'SN001', installationDate: new Date('2023-01-01'), warrantyAmc: '1 year warranty', customerRef: null },
        { model: 'Laser 2000', serialNumber: 'SN002', installationDate: new Date('2023-02-01'), warrantyAmc: 'AMC till 2025', customerRef: null }
      ];
      await Machine.insertMany(machines);
    } else {
      console.log('Machines already present, skipping');
    }

    console.log('Mongo seed completed');
    process.exit(0);
  }catch(err){
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();