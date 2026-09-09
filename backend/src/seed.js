/**
 * Database Seed Script
 * Populates MongoDB with initial users, tasks, projects, attendance and leave data.
 * Run: node src/seed.js
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/user.model.js';
import Task from './models/task.model.js';
import Project from './models/project.model.js';
import Department from './models/department.model.js';
import Attendance from './models/attendance.model.js';
import Leave from './models/leave.model.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/saas_web_app';

async function seed() {
  if (process.env.ALLOW_SEED !== 'true') {
    console.error('❌ SEED DENIED: Data clearing is disabled for safety. Set ALLOW_SEED=true in .env to run.');
    process.exit(1);
  }
  console.log('🌱 Connecting to MongoDB…');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to', MONGODB_URI);

  // ── 1. Clear existing data ──────────────────────────────────
  await Promise.all([
    User.deleteMany({}),
    Task.deleteMany({}),
    Project.deleteMany({}),
    Attendance.deleteMany({}),
    Leave.deleteMany({}),
    Department.deleteMany({}),
  ]);
  console.log('🗑️  Cleared existing data');

  // ── 2. Create Users ─────────────────────────────────────────
  const usersData = [
    // Admin
    {
      name: 'James Wilson',
      email: 'admin@syncflow.com',
      password: 'Admin123!',
      role: 'admin',
      jobTitle: 'CEO / Admin',
      department: 'Management',
      status: 'active',
      employeeId: 'EMP-001',
    },
    // Team Leads
    {
      name: 'Sarah Chen',
      email: 'sarah@syncflow.com',
      password: 'TeamLead123!',
      role: 'teamlead',
      jobTitle: 'Engineering Lead',
      department: 'Engineering',
      status: 'active',
      employeeId: 'EMP-002',
    },
    {
      name: 'Jane Smith',
      email: 'jane@syncflow.com',
      password: 'TeamLead123!',
      role: 'teamlead',
      jobTitle: 'Design Lead',
      department: 'Design',
      status: 'active',
      employeeId: 'EMP-003',
    },
    // Employees
    {
      name: 'John Doe',
      email: 'john@syncflow.com',
      password: 'Employee123!',
      role: 'employee',
      jobTitle: 'Senior Developer',
      department: 'Engineering',
      status: 'active',
      employeeId: 'EMP-004',
    },
    {
      name: 'Mike Johnson',
      email: 'mike@syncflow.com',
      password: 'Employee123!',
      role: 'employee',
      jobTitle: 'Backend Developer',
      department: 'Engineering',
      status: 'active',
      employeeId: 'EMP-005',
    },
    {
      name: 'Sarah Wilson',
      email: 'sarahw@syncflow.com',
      password: 'Employee123!',
      role: 'employee',
      jobTitle: 'Marketing Manager',
      department: 'Marketing',
      status: 'active',
      employeeId: 'EMP-006',
    },
    {
      name: 'Tom Brown',
      email: 'tom@syncflow.com',
      password: 'Employee123!',
      role: 'employee',
      jobTitle: 'Full Stack Developer',
      department: 'Engineering',
      status: 'active',
      employeeId: 'EMP-007',
    },
    {
      name: 'Lisa Anderson',
      email: 'lisa@syncflow.com',
      password: 'Employee123!',
      role: 'employee',
      jobTitle: 'Content Strategist',
      department: 'Marketing',
      status: 'inactive',
      employeeId: 'EMP-008',
    },
    {
      name: 'Priya Patel',
      email: 'priya@syncflow.com',
      password: 'Employee123!',
      role: 'employee',
      jobTitle: 'QA Engineer',
      department: 'Engineering',
      status: 'active',
      employeeId: 'EMP-009',
    },
    {
      name: 'David Kim',
      email: 'david@syncflow.com',
      password: 'Employee123!',
      role: 'employee',
      jobTitle: 'UI Designer',
      department: 'Design',
      status: 'active',
      employeeId: 'EMP-010',
    },
    {
      name: 'Alex Johnson',
      email: 'alex@syncflow.com',
      password: 'Employee123!',
      role: 'employee',
      jobTitle: 'Frontend Developer',
      department: 'Engineering',
      status: 'active',
      employeeId: 'EMP-011',
    },
    {
      name: 'Emma Torres',
      email: 'emma@syncflow.com',
      password: 'Employee123!',
      role: 'employee',
      jobTitle: 'Product Manager',
      department: 'Management',
      status: 'active',
      employeeId: 'EMP-012',
    },
  ];

  const users = await User.create(usersData);
  console.log(`👥 Created ${users.length} users`);

  // Build lookup by name
  const userByName = {};
  users.forEach((u) => { userByName[u.name] = u; });

  // ── 3. Create Tasks ─────────────────────────────────────────
  const admin = userByName['James Wilson'];
  const lead1 = userByName['Sarah Chen'];

  const tasksData = [
    {
      title: 'Update API Documentation',
      description: 'Complete and update all API endpoint documentation for external developers.',
      priority: 'high',
      project: 'Backend Overhaul',
      assignedTo: userByName['John Doe']._id,
      department: 'Engineering',
      assignedBy: admin._id,
      deadline: new Date('2026-05-05'),
      status: 'in-progress',
    },
    {
      title: 'Design Homepage',
      description: 'Create high-fidelity mockups for the new homepage layout and components.',
      priority: 'medium',
      project: 'Website Redesign',
      assignedTo: userByName['David Kim']._id,
      department: 'Design',
      assignedBy: admin._id,
      deadline: new Date('2026-05-07'),
      status: 'pending',
    },
    {
      title: 'Fix Login Bug',
      description: 'Resolve authentication session timeout issue reported by QA team.',
      priority: 'high',
      project: 'Bug Fixes',
      assignedTo: userByName['Mike Johnson']._id,
      department: 'Engineering',
      assignedBy: lead1._id,
      deadline: new Date('2026-04-30'),
      status: 'in-progress',
    },
    {
      title: 'Write Unit Tests',
      description: 'Add comprehensive unit test coverage for payment module.',
      priority: 'low',
      project: 'Testing Sprint',
      assignedTo: userByName['Priya Patel']._id,
      department: 'Engineering',
      assignedBy: admin._id,
      deadline: new Date('2026-04-28'),
      status: 'completed',
    },
    {
      title: 'Database Migration',
      description: 'Migrate legacy MySQL tables to PostgreSQL with data integrity checks.',
      priority: 'high',
      project: 'Infrastructure',
      assignedTo: userByName['Tom Brown']._id,
      department: 'Engineering',
      assignedBy: lead1._id,
      deadline: new Date('2026-05-10'),
      status: 'pending',
    },
    {
      title: 'Social Media Content Plan',
      description: 'Draft Q2 social media content calendar for all platforms.',
      priority: 'medium',
      project: 'Marketing Campaign Q2',
      assignedTo: userByName['Lisa Anderson']._id,
      department: 'Marketing',
      assignedBy: admin._id,
      deadline: new Date('2026-05-12'),
      status: 'in-progress',
    },
  ];

  const tasks = await Task.create(tasksData);
  console.log(`✅ Created ${tasks.length} tasks`);

  // ── 4. Create Departments ──────────────────────────────────
  const departmentsData = [
    {
      name: 'Engineering',
      lead: userByName['Sarah Chen']._id,
      members: [
        userByName['John Doe']._id,
        userByName['Mike Johnson']._id,
        userByName['Tom Brown']._id,
        userByName['Priya Patel']._id,
        userByName['Alex Johnson']._id,
      ],
    },
    {
      name: 'Design',
      lead: userByName['Jane Smith']._id,
      members: [
        userByName['David Kim']._id,
      ],
    },
    {
      name: 'Marketing',
      lead: userByName['Sarah Wilson']._id,
      members: [
        userByName['Lisa Anderson']._id,
      ],
    },
    {
      name: 'Management',
      lead: userByName['James Wilson']._id,
      members: [
        userByName['Emma Torres']._id,
      ],
    },
  ];

  const departments = await Department.create(departmentsData);
  console.log(`🏢 Created ${departments.length} departments`);

  // ── 5. Create Projects ──────────────────────────────────────
  const projectsData = [
    {
      title: 'Website Redesign',
      description: 'Complete overhaul of company website with modern UI/UX and improved performance.',
      client: 'Acme Corp',
      teamLead: 'Jane Smith',
      priority: 'high',
      assignDate: new Date('2026-02-01'),
      deadline: new Date('2026-05-15'),
      selectedMemberNames: ['Jane Smith', 'John Doe', 'David Kim'],
      members: ['JS', 'JD', 'DK', 'MW', 'SB', 'TL'],
      activeMembers: 6,
      operationalHours: 312,
      accuracy: 92,
      goalCompleted: 75,
      tasks: [
        { title: 'Wireframes & Prototyping', status: 'done', assignee: 'JS' },
        { title: 'Homepage Redesign', status: 'done', assignee: 'MW' },
        { title: 'Mobile Responsiveness', status: 'done', assignee: 'SB' },
        { title: 'API Integration', status: 'in-progress', assignee: 'JD' },
        { title: 'Performance Optimisation', status: 'in-progress', assignee: 'TL' },
        { title: 'UAT & Bug Fixes', status: 'pending', assignee: 'DK' },
      ],
    },
    {
      title: 'Mobile App Development',
      description: 'Native iOS and Android app for customer engagement and loyalty programme.',
      client: 'BrightEdge Inc.',
      teamLead: 'John Doe',
      priority: 'high',
      assignDate: new Date('2026-01-10'),
      deadline: new Date('2026-06-30'),
      selectedMemberNames: ['John Doe', 'Mike Johnson', 'Alex Johnson'],
      members: ['JD', 'MS', 'PK', 'RL', 'NK', 'VT', 'HP', 'DS'],
      activeMembers: 8,
      operationalHours: 520,
      accuracy: 88,
      goalCompleted: 67,
      tasks: [
        { title: 'UI/UX Design System', status: 'done', assignee: 'MS' },
        { title: 'Auth Module', status: 'done', assignee: 'JD' },
        { title: 'Push Notifications', status: 'done', assignee: 'PK' },
        { title: 'Payment Gateway', status: 'in-progress', assignee: 'RL' },
        { title: 'Offline Mode', status: 'pending', assignee: 'NK' },
        { title: 'App Store Submission', status: 'pending', assignee: 'VT' },
      ],
    },
    {
      title: 'Backend API Upgrade',
      description: 'Migrate monolithic backend to microservices architecture for better scalability.',
      client: 'Internal',
      teamLead: 'Mike Johnson',
      priority: 'medium',
      assignDate: new Date('2026-01-20'),
      deadline: new Date('2026-04-20'),
      selectedMemberNames: ['Mike Johnson', 'Tom Brown'],
      members: ['MJ', 'TK', 'LM', 'BN'],
      activeMembers: 4,
      operationalHours: 210,
      accuracy: 95,
      goalCompleted: 67,
      tasks: [
        { title: 'Service Decomposition', status: 'done', assignee: 'MJ' },
        { title: 'Docker Containerisation', status: 'done', assignee: 'TK' },
        { title: 'CI/CD Pipeline', status: 'done', assignee: 'LM' },
        { title: 'Load Testing', status: 'in-progress', assignee: 'BN' },
        { title: 'Documentation', status: 'pending', assignee: 'MJ' },
      ],
    },
    {
      title: 'Marketing Campaign Q2',
      description: 'Q2 digital marketing campaign across all channels including social media and email.',
      client: 'RetailPro Ltd.',
      teamLead: 'Sarah Wilson',
      priority: 'medium',
      assignDate: new Date('2026-03-01'),
      deadline: new Date('2026-05-01'),
      selectedMemberNames: ['Sarah Wilson', 'Lisa Anderson'],
      members: ['SW', 'CM', 'DP', 'EF', 'GH'],
      activeMembers: 5,
      operationalHours: 168,
      accuracy: 80,
      goalCompleted: 33,
      tasks: [
        { title: 'Strategy Planning', status: 'done', assignee: 'SW' },
        { title: 'Content Creation', status: 'done', assignee: 'CM' },
        { title: 'Social Media Setup', status: 'in-progress', assignee: 'DP' },
        { title: 'Email Sequences', status: 'pending', assignee: 'EF' },
        { title: 'Analytics Dashboard', status: 'pending', assignee: 'GH' },
      ],
    },
  ];

  const projects = await Project.create(projectsData);
  console.log(`📁 Created ${projects.length} projects`);

  // ── 6. Create Leave Requests ────────────────────────────────
  const leavesData = [
    { user: userByName['John Doe']._id, employee: 'John Doe', leaveType: 'Casual', startDate: new Date('2026-04-10'), endDate: new Date('2026-04-12'), days: 3, reason: 'Family function', status: 'pending' },
    { user: userByName['David Kim']._id, employee: 'David Kim', leaveType: 'Sick', startDate: new Date('2026-04-05'), endDate: new Date('2026-04-06'), days: 2, reason: 'Medical appointment', status: 'approved' },
    { user: userByName['Mike Johnson']._id, employee: 'Mike Johnson', leaveType: 'Short Leave', startDate: new Date('2026-04-08'), endDate: new Date('2026-04-08'), days: 0.5, reason: 'Personal work', status: 'approved' },
    { user: userByName['Sarah Wilson']._id, employee: 'Sarah Wilson', leaveType: 'Casual', startDate: new Date('2026-04-15'), endDate: new Date('2026-04-20'), days: 6, reason: 'Vacation', status: 'pending' },
    { user: userByName['Tom Brown']._id, employee: 'Tom Brown', leaveType: 'Sick', startDate: new Date('2026-04-22'), endDate: new Date('2026-04-23'), days: 2, reason: 'Fever and rest', status: 'rejected' },
    { user: userByName['Lisa Anderson']._id, employee: 'Lisa Anderson', leaveType: 'Other', startDate: new Date('2026-04-28'), endDate: new Date('2026-04-29'), days: 2, reason: 'Personal emergency', status: 'pending' },
  ];

  const leaves = await Leave.create(leavesData);
  console.log(`🏖️  Created ${leaves.length} leave requests`);

  // ── 7. Create Attendance Records ────────────────────────────
  const dates = [
    '2026-04-20', '2026-04-21', '2026-04-22', '2026-04-23', '2026-04-24', 
    '2026-04-25', '2026-04-26', '2026-04-27', '2026-04-28', '2026-04-29'
  ];
  
  const attendanceData = [];
  
  dates.forEach(dateStr => {
    const d = new Date(dateStr);
    users.filter(u => u.role === 'employee').forEach(u => {
      // Randomize presence
      const rand = Math.random();
      if (rand > 0.1) { // 90% presence
        attendanceData.push({
          user: u._id,
          employee: u.name,
          department: u.department,
          date: d,
          checkIn: rand > 0.8 ? '09:45 AM' : '09:00 AM',
          checkOut: '06:00 PM',
          workingHours: rand > 0.8 ? '8.2h' : '9h',
          status: rand > 0.8 ? 'late' : 'present'
        });
      } else if (rand > 0.05) { // 5% absent
        attendanceData.push({
          user: u._id,
          employee: u.name,
          department: u.department,
          date: d,
          checkIn: '—',
          checkOut: '—',
          workingHours: '0h',
          status: 'absent'
        });
      }
      // rest are leaves (implicitly skipped or can add leave record)
    });
  });

  const attendance = await Attendance.create(attendanceData);
  console.log(`📋 Created ${attendance.length} attendance records`);

  // ── Done ────────────────────────────────────────────────────
  console.log('\n🎉 Database seeded successfully!\n');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  Login Credentials:                              ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log('║  Admin:     admin@syncflow.com / Admin123!       ║');
  console.log('║  Team Lead: sarah@syncflow.com / TeamLead123!    ║');
  console.log('║  Employee:  john@syncflow.com  / Employee123!    ║');
  console.log('╚══════════════════════════════════════════════════╝');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
