const mongoose = require('mongoose');

const duration = process.argv[2] || 10;

console.log(`Starting DB I/O stress for ${duration}s`);

async function stressDB() {
  try {
    await mongoose.connect('mongodb://localhost:27017/capstonedb');
    console.log('Connected to MongoDB');

    const start = Date.now();

    while (Date.now() - start < duration * 1000) {
      // Simulate I/O by creating and deleting documents
      const testDoc = new mongoose.model('StressTest', new mongoose.Schema({ data: String }))({ data: 'stress data ' + Date.now() });
      await testDoc.save();
      await mongoose.model('StressTest').deleteOne({ _id: testDoc._id });
    }

    console.log('DB I/O stress completed');
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error during DB stress:', error);
  }
}

stressDB();