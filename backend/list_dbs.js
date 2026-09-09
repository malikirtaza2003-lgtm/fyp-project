import mongoose from 'mongoose';

const MONGODB_URI = "mongodb://127.0.0.1:27017/";

async function checkAllDBs() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB Server");
    const admin = mongoose.connection.useDb('admin');
    const dbs = await admin.db.admin().listDatabases();
    console.log("Available Databases:");
    dbs.databases.forEach(db => {
      console.log(`- ${db.name}`);
    });
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

checkAllDBs();
