import mongoose from 'mongoose';

const MONGODB_URI = "mongodb://127.0.0.1:27017/saas_web_app";

async function check() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("Collections:", collections.map(c => c.name));
    
    // Check users
    const users = await mongoose.connection.db.collection('users').countDocuments();
    console.log("Total Users:", users);
    
    // Check tasks
    const tasks = await mongoose.connection.db.collection('tasks').countDocuments();
    console.log("Total Tasks:", tasks);

    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

check();
