import { MongoClient } from 'mongodb';
import fs from 'fs/promises';
import path from 'path';

const localUri = 'mongodb://127.0.0.1:27017/saas_web_app';

async function exportData() {
    console.log('Exporting data from local database...');
    const client = new MongoClient(localUri);
    try {
        await client.connect();
        const db = client.db();
        const collections = await db.listCollections().toArray();
        const dump = {};

        for (const colInfo of collections) {
            const colName = colInfo.name;
            const docs = await db.collection(colName).find({}).toArray();
            dump[colName] = docs;
        }

        const dataDir = path.join(process.cwd(), 'data');
        try {
            await fs.mkdir(dataDir, { recursive: true });
        } catch (e) {}

        const outputPath = path.join(dataDir, 'db_dump.json');
        await fs.writeFile(outputPath, JSON.stringify(dump, null, 2));
        
        console.log(`Successfully exported data to ${outputPath}`);
    } catch (err) {
        console.error('Export error:', err);
    } finally {
        await client.close();
    }
}

exportData();
