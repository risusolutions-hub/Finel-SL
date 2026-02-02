const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  company: { type: String },
  city: { type: String },
  contact: { type: String },
  serviceNo: { type: String, index: true },
  companyName: { type: String },
  contactPerson: { type: String },
  phones: { type: [String] },
  phone: { type: String },
  address: { type: String },
  email: { type: String }
}, { timestamps: true });

const Customer = mongoose.model('Customer', CustomerSchema);

(async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/sparkel';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    const testCustomer = {
      name: 'Test Customer',
      company: 'Test Company',
      city: 'Test City',
      contact: '9999999999',
      serviceNo: '01',
      companyName: 'Test Company',
      contactPerson: 'Test Person',
      phones: ['9999999999'],
      phone: '9999999999',
      address: 'Test Address',
      email: 'test@example.com'
    };
    const existing = await Customer.findOne({ serviceNo: '01' });
    if (!existing) {
      await Customer.create(testCustomer);
      console.log('Test customer with serviceNo "01" created.');
    } else {
      console.log('Test customer with serviceNo "01" already exists.');
    }
  } catch (error) {
    console.error('Error creating test customer:', error);
  } finally {
    mongoose.connection.close();
  }
})();
