import mongoose from 'mongoose';

async function check() {
  await mongoose.connect('mongodb://malikirtaza2003_db_user:irtaza12@ac-5n48jfp-shard-00-00.fkfughv.mongodb.net:27017,ac-5n48jfp-shard-00-01.fkfughv.mongodb.net:27017,ac-5n48jfp-shard-00-02.fkfughv.mongodb.net:27017/saas_web_app?ssl=true&replicaSet=atlas-nhlc60-shard-0&authSource=admin&appName=Cluster0');
  
  const user = await mongoose.connection.db.collection('users').findOne({name: /abdullah/i});
  if (!user) {
    console.log('User not found');
    process.exit(0);
  }

  const projects = await mongoose.connection.db.collection('projects').find({
    $or: [
      { selectedMemberNames: user.name },
      { teamMembers: user._id }
    ]
  }).toArray();

  console.log('User Found:', user.name);
  console.log('User ID:', user._id);
  console.log('Projects Count:', projects.length);
  if (projects.length > 0) {
    console.log('Project Titles:', projects.map(p => p.title));
  }
  
  process.exit(0);
}

check();
