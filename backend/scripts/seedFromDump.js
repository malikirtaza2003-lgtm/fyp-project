import fs from 'fs/promises';
import path from 'path';
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI;

async function seed() {
    console.log('Starting GitHub Actions database seed...');
    if (!uri) {
        console.error('MONGODB_URI is not set');
        process.exit(1);
    }
    
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('saas_web_app');
        
        const dumpPath = path.join(process.cwd(), 'data', 'db_dump.json');
        const fileContent = await fs.readFile(dumpPath, 'utf8');
        const dump = JSON.parse(fileContent);

        for (const [colName, docs] of Object.entries(dump)) {
            if (docs.length > 0) {
                console.log(`Seeding ${docs.length} documents into ${colName}...`);
                const collection = db.collection(colName);
                await collection.deleteMany({});
                
                // Fix ObjectIds
                const docsToInsert = docs.map(doc => {
                    if (doc._id && typeof doc._id === 'string' && doc._id.length === 24) {
                        doc._id = new ObjectId(doc._id);
                    }
                    if (doc.employeeId && typeof doc.employeeId === 'string' && doc.employeeId.length === 24) {
                        doc.employeeId = new ObjectId(doc.employeeId);
                    }
                    if (doc.projectId && typeof doc.projectId === 'string' && doc.projectId.length === 24) {
                        doc.projectId = new ObjectId(doc.projectId);
                    }
                    return doc;
                });
                
                await collection.insertMany(docsToInsert);
            }
        }
        console.log('Seeding completed successfully!');
    } catch (err) {
        console.error('Seeding error:', err);
        process.exit(1);
    } finally {
        await client.close();
    }
}

seed();
