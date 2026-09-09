import Settings from '../models/settings.model.js';

const DEFAULT_SETTINGS = {
  operations: {
    workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    workStart: '09:00',
    workEnd: '17:00',
    expectedHours: '8',
  },
  holidays: [
    { id: 1, name: "New Year's Day", date: 'Jan 01, 2026', type: 'National' },
    { id: 2, name: 'Good Friday', date: 'Apr 03, 2026', type: 'National' },
    { id: 3, name: 'Independence Day', date: 'Jul 04, 2026', type: 'National' },
    { id: 4, name: 'Thanksgiving Day', date: 'Nov 26, 2026', type: 'National' },
    { id: 5, name: 'Christmas Day', date: 'Dec 25, 2026', type: 'National' },
    { id: 6, name: 'Company Anniversary', date: 'Mar 15, 2026', type: 'Company' },
  ],
  permissions: {
    Admin: { read: true, write: true, delete: true, manage: true },
    'Team Lead': { read: true, write: true, delete: false, manage: false },
    Employee: { read: true, write: false, delete: false, manage: false },
  },
  priorities: [
    { id: 1, label: 'High', color: 'bg-red-500', enabled: true },
    { id: 2, label: 'Medium', color: 'bg-amber-500', enabled: true },
    { id: 3, label: 'Low', color: 'bg-green-500', enabled: true },
  ],
  statuses: [
    { id: 1, label: 'To Do', color: 'bg-gray-400', enabled: true },
    { id: 2, label: 'In Progress', color: 'bg-[#162E93]', enabled: true },
    { id: 3, label: 'In Review', color: 'bg-amber-500', enabled: true },
    { id: 4, label: 'Done', color: 'bg-green-500', enabled: true },
  ],
  tags: ['Frontend', 'Backend', 'Design', 'Urgent', 'QA', 'Bug', 'Feature'],
  notifications: {
    emailEnabled: true,
    pushEnabled: true,
    taskAssigned: true,
    taskCompleted: true,
    leaveApproval: true,
    meetingReminder: true,
    newEmployee: false,
    weeklyReport: true,
  },
  company: {
    name: 'SyncFlow Corp',
    timezone: 'UTC-5 (Eastern Time)',
    dateFormat: 'MM/DD/YYYY',
  },
  security: {
    twoFA: true,
    sessionTimeout: true,
    ipAllowlist: false,
    auditLogging: true,
    passwordPolicy: true,
  },
  auditLogs: [
    { id: 1, user: 'Admin', action: 'Updated system settings', time: 'Today, 10:32 AM', icon: 'Settings', color: 'text-[#162E93] bg-[#162E93]/10' },
    { id: 2, user: 'Sarah Chen', action: 'Approved leave request for Alice', time: 'Today, 09:15 AM', icon: 'CheckCircle2', color: 'text-green-600 bg-green-100' },
    { id: 3, user: 'Admin', action: 'Added new employee: Emma Torres', time: 'Today, 08:50 AM', icon: 'UserPlus', color: 'text-[#088395] bg-[#088395]/10' },
    { id: 4, user: 'James Liu', action: 'Created project: SyncFlow v3', time: 'Yesterday, 04:20 PM', icon: 'FileEdit', color: 'text-purple-600 bg-purple-100' },
    { id: 5, user: 'Carlos Rivera', action: 'Updated department configuration', time: 'Yesterday, 02:45 PM', icon: 'Building2', color: 'text-amber-600 bg-amber-100' },
    { id: 6, user: 'Bob Martinez', action: 'Logged in from new device', time: 'Yesterday, 11:10 AM', icon: 'LogIn', color: 'text-sky-600 bg-sky-100' },
    { id: 7, user: 'Admin', action: 'Changed password policy settings', time: 'Apr 27, 03:00 PM', icon: 'Lock', color: 'text-red-500 bg-red-100' },
    { id: 8, user: 'Mia Patel', action: 'Assigned task to Carol Davis', time: 'Apr 27, 01:30 PM', icon: 'UserCheck', color: 'text-indigo-600 bg-indigo-100' },
    { id: 9, user: 'Dan Foster', action: 'Submitted attendance correction', time: 'Apr 26, 05:00 PM', icon: 'Edit2', color: 'text-orange-500 bg-orange-100' },
    { id: 10, user: 'Admin', action: 'Disabled user: Dan Foster', time: 'Apr 26, 02:00 PM', icon: 'AlertTriangle', color: 'text-red-500 bg-red-100' },
  ],
  calendarEvents: [
    {
      id: 1,
      eventName: 'Eid ul-Fitr',
      eventType: 'Holiday',
      startDate: '2026-04-28',
      endDate: '2026-04-30',
      description: 'Eid ul-Fitr - 3-day public holiday',
    },
    {
      id: 2,
      eventName: 'Labour Day',
      eventType: 'Holiday',
      startDate: '2026-05-01',
      endDate: '2026-05-01',
      description: 'International Labour Day',
    },
    {
      id: 3,
      eventName: 'Team Retreat',
      eventType: 'Special Event',
      startDate: '2026-04-20',
      endDate: '2026-04-21',
      description: 'Annual company team retreat',
    },
  ],
  jobTitles: [
    'Senior Developer',
    'Backend Developer',
    'Frontend Developer',
    'UI/UX Designer',
    'Product Designer',
    'Sales Manager',
    'Marketing Lead',
    'HR Manager',
    'Team Lead',
    'Admin',
  ],
  leaveTypes: ['Casual', 'Sick', 'Short Leave', 'Other', 'Annual Leave', 'Emergency Leave'],
};

function mergeDefaults(defaults, current) {
  if (Array.isArray(defaults)) {
    return Array.isArray(current) ? current : defaults;
  }

  if (defaults && typeof defaults === 'object') {
    const next = {};
    const currentValue = current && typeof current === 'object' ? current : {};
    const keys = new Set([...Object.keys(defaults), ...Object.keys(currentValue)]);
    keys.forEach((key) => {
      if (!Object.prototype.hasOwnProperty.call(defaults, key)) {
        return;
      }
      next[key] = mergeDefaults(defaults[key], currentValue[key]);
    });
    return next;
  }

  return current !== undefined ? current : defaults;
}

async function getOrCreateSettings() {
  let doc = await Settings.findOne({ key: 'global' });

  if (!doc) {
    doc = await Settings.create({ key: 'global', data: DEFAULT_SETTINGS });
  }

  const merged = mergeDefaults(DEFAULT_SETTINGS, doc.data ?? {});
  if (JSON.stringify(merged) !== JSON.stringify(doc.data ?? {})) {
    doc.data = merged;
    await doc.save();
  }

  return merged;
}

export async function getSettings(_req, res, next) {
  try {
    const settings = await getOrCreateSettings();
    res.json({ settings });
  } catch (error) {
    next(error);
  }
}

export async function updateSettings(req, res, next) {
  try {
    const incoming = req.body?.settings ?? req.body ?? {};
    const nextSettings = mergeDefaults(DEFAULT_SETTINGS, incoming);

    const doc = await Settings.findOneAndUpdate(
      { key: 'global' },
      { data: nextSettings },
      { new: true, upsert: true },
    );

    const merged = mergeDefaults(DEFAULT_SETTINGS, doc.data ?? {});

    res.json({
      message: 'Settings updated successfully',
      settings: merged,
    });
  } catch (error) {
    next(error);
  }
}

export { DEFAULT_SETTINGS };
