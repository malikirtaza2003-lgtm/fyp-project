import { Router } from 'express';
import authRoutes from './auth.routes.js';
import attendanceRoutes from './attendance.routes.js';
import departmentRoutes from './department.routes.js';
import healthRoutes from './health.routes.js';
import leaveRoutes from './leave.routes.js';
import meetingRoutes from './meeting.routes.js';
import projectRoutes from './projects.routes.js';
import settingsRoutes from './settings.routes.js';
import taskRoutes from './tasks.routes.js';
import userRoutes from './user.routes.js';
import announcementRoutes from './announcement.routes.js';
import notificationRoutes from './notification.routes.js';
import chatRoutes from './chat.routes.js';

const router = Router();

import fs from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';

router.get('/', (_req, res) => {
  res.json({
    message: 'API is ready',
  });
});

router.get('/seed', async (req, res) => {
    try {
        const dumpPath = path.join(process.cwd(), 'data', 'db_dump.json');
        const fileContent = await fs.readFile(dumpPath, 'utf8');
        const dump = JSON.parse(fileContent);
        const db = mongoose.connection.db;

        const results = {};
        for (const [colName, docs] of Object.entries(dump)) {
            if (docs.length > 0) {
                const collection = db.collection(colName);
                await collection.deleteMany({});
                
                // Convert string _id back to ObjectId where necessary
                const docsToInsert = docs.map(doc => {
                    if (doc._id && typeof doc._id === 'string' && doc._id.length === 24) {
                        doc._id = new mongoose.Types.ObjectId(doc._id);
                    }
                    return doc;
                });
                
                await collection.insertMany(docsToInsert);
                results[colName] = docs.length;
            }
        }
        res.json({ message: 'Seeding completed', results });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/tasks', taskRoutes);
router.use('/projects', projectRoutes);
router.use('/settings', settingsRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/leaves', leaveRoutes);
router.use('/departments', departmentRoutes);
router.use('/meetings', meetingRoutes);
router.use('/announcements', announcementRoutes);
router.use('/notifications', notificationRoutes);
router.use('/chat', chatRoutes);

export default router;