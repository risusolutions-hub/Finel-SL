const axios = require('axios');

(async () => {
  try {
    const response = await axios.post('http://localhost:4000/complaints', {
      problem: 'Test Problem',
      isNewCustomer: true,
      customerData: {
        companyName: 'Test Company'
      },
      isNewMachine: true,
      machineData: {
        model: 'Test Model',
        serialNumber: '12345'
      }
    });

    console.log('Complaint created successfully:', response.data);
  } catch (error) {
    console.error('Error creating complaint:', error.response ? error.response.data : error.message);
  }
})();