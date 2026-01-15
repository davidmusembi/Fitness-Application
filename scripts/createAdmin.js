const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const readline = require('readline');

// Load environment variables from .env file
require('dotenv').config();

// Mongoose connectDB function
// This is a simplified version of the one in src/lib/db/mongodb.ts
// for use in a standalone script.
async function connectDB() {
  if (!process.env.MONGODB_URI) {
    throw new Error('Please add your MONGODB_URI to .env or .env.local');
  }
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ MongoDB connected successfully');
}

// User Schema (simplified for script, directly matching structure)
const UserSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  username: { type: String, required: true, unique: true, lowercase: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Admin', 'Staff', 'Customer'], default: 'Customer' },
  fitnessGoal: { type: String }, // Optional
  avatar: { type: String }, // Optional
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

// Hash password function (from src/utils/auth.ts)
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createAdminUser() {
  try {
    await connectDB();

    console.log('--- Create Admin User ---');

    const fullName = await question('Enter admin full name: ');
    const username = await question('Enter admin username: ');
    const email = await question('Enter admin email: ');
    const password = await question('Enter admin password: ');

    if (!fullName || !username || !email || !password) {
      console.error('All fields are required.');
      rl.close();
      return;
    }

    const hashedPassword = await hashPassword(password);

    const adminUser = new User({
      fullName,
      username,
      email,
      password: hashedPassword,
      role: 'Admin',
      fitnessGoal: 'General Fitness', // Default, can be customized
      avatar: 'https://www.gravatar.com/avatar/?d=mp', // Default avatar
    });

    await adminUser.save();
    console.log('Admin user created successfully!');
    console.log('Email:', adminUser.email);
    console.log('Role:', adminUser.role);

  } catch (error) {
    console.error('Error creating admin user:', error.message);
  } finally {
    rl.close();
    mongoose.connection.close();
  }
}

createAdminUser();
