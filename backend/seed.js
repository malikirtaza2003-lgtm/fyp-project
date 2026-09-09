import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env from current dir
const envPath = join(__dirname, '.env');
dotenv.config({ path: envPath });

import User from './src/models/user.model.js';

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const demoUsers = [
      {
        name: 'Admin User',
        email: 'admin@demo.com',
        password: 'password123',
        role: 'admin',
        department: 'Management',
        employeeId: 'ADM-001'
      },
      {
        name: 'Team Lead',
        email: 'lead@demo.com',
        password: 'password123',
        role: 'teamlead',
        department: 'Engineering',
        employeeId: 'TL-001'
      },
      {
        name: 'Employee User',
        email: 'emp@demo.com',
        password: 'password123',
        role: 'employee',
        department: 'Engineering',
        employeeId: 'EMP-001'
      }
    ];

    for (const u of demoUsers) {
      const exists = await User.findOne({ email: u.email });
      if (!exists) {
        await User.create(u);
        console.log(`Created ${u.email}`);
      } else {
        console.log(`${u.email} already exists`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
