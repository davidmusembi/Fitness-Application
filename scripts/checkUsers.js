const mongoose = require('mongoose');
require('dotenv').config();

async function checkUsers() {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('No MONGODB_URI found in .env');
      return;
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    
    console.log('--- Users in DB ---');
    users.forEach(u => {
      console.log(`Email: ${u.email}, Role: ${u.role}, ID: ${u._id}`);
    });
    console.log('-------------------');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkUsers();
