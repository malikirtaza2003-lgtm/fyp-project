import mongoose from 'mongoose';
import User from '../models/user.model.js';
import { HttpError } from './http-error.js';

export function readString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function readDateString(value) {
  const text = readString(value);
  return text ? text.slice(0, 10) : '';
}

export function parseDate(value) {
  const text = readString(value);

  if (!text) {
    return null;
  }

  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function normalizeRole(value) {
  const role = readString(value).toLowerCase();

  if (!role) {
    return '';
  }

  if (role === 'teamlead' || role === 'team lead' || role === 'team-lead') {
    return 'teamlead';
  }

  if (role === 'admin' || role === 'administrator') {
    return 'admin';
  }

  return ['admin', 'teamlead', 'employee'].includes(role) ? role : 'employee';
}

export function normalizeUserStatus(value) {
  const status = readString(value).toLowerCase();
  return status === 'inactive' ? 'inactive' : 'active';
}

export function displayUserStatus(value) {
  return normalizeUserStatus(value) === 'inactive' ? 'Inactive' : 'Active';
}

export function normalizeTaskStatus(value) {
  const status = readString(value).toLowerCase();

  if (['active', 'in-progress', 'in progress'].includes(status)) {
    return 'in-progress';
  }

  if (['completed', 'done'].includes(status)) {
    return 'completed';
  }

  return 'pending';
}

export function displayTaskStatus(value) {
  const status = normalizeTaskStatus(value);

  if (status === 'in-progress') {
    return 'Active';
  }

  if (status === 'completed') {
    return 'Completed';
  }

  return 'Pending';
}

export function normalizePriority(value) {
  const priority = readString(value).toLowerCase();

  if (priority === 'high') return 'high';
  if (priority === 'low') return 'low';
  return 'medium';
}

export function displayPriority(value) {
  const priority = normalizePriority(value);

  if (priority === 'high') return 'High';
  if (priority === 'low') return 'Low';
  return 'Medium';
}

export function normalizeLeaveStatus(value) {
  const status = readString(value).toLowerCase();

  if (['approved', 'rejected', 'pending'].includes(status)) {
    return status;
  }

  return 'pending';
}

export function displayLeaveStatus(value) {
  const status = normalizeLeaveStatus(value);
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function normalizeAttendanceStatus(value) {
  const status = readString(value).toLowerCase();

  if (['present', 'absent', 'leave', 'late', 'checked-in', 'on-break', 'checked-out'].includes(status)) {
    return status;
  }

  return 'present';
}

export function displayAttendanceStatus(value) {
  const status = normalizeAttendanceStatus(value);

  if (status === 'checked-in') return 'Checked In';
  if (status === 'on-break') return 'On Break';
  if (status === 'checked-out') return 'Checked Out';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function initialsFromName(name) {
  return readString(name)
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function formatDateOnly(value) {
  if (!value) {
    return '';
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().slice(0, 10);
}

export function calcInclusiveDays(startDate, endDate) {
  const start = parseDate(startDate);
  const end = parseDate(endDate);

  if (!start || !end) {
    return 1;
  }

  const diff = Math.max(end.getTime() - start.getTime(), 0);
  return Math.max(Math.ceil(diff / 86400000) + 1, 1);
}

export async function resolveUserReference(value, { allowMissing = false } = {}) {
  if (value === undefined || value === null || value === '') {
    if (allowMissing) {
      return null;
    }

    throw new HttpError(400, 'User reference is required');
  }

  if (typeof value === 'object' && value._id) {
    const existing = await User.findById(value._id);
    if (existing) {
      return existing;
    }
  }

  const identifier = readString(value);

  if (!identifier) {
    if (allowMissing) {
      return null;
    }

    throw new HttpError(400, 'User reference is required');
  }

  const queryConditions = [
    { email: identifier.toLowerCase() },
    { name: identifier },
    { employeeId: identifier },
  ];

  if (mongoose.Types.ObjectId.isValid(identifier)) {
    queryConditions.unshift({ _id: identifier });
  }

  const user = await User.findOne({
    $or: queryConditions,
  });

  if (!user) {
    if (allowMissing) {
      return null;
    }

    throw new HttpError(404, `User not found: ${identifier}`);
  }

  return user;
}

export async function resolveTeamMembersForLead(leadUser) {
  if (!leadUser?.department) {
    return [];
  }

  return User.find({
    department: leadUser.department,
    role: 'employee',
  }).sort({ name: 1 });
}

export function serializeUser(user) {
  if (!user) {
    return null;
  }

  const ret = typeof user.toJSON === 'function' ? user.toJSON() : { ...user };

  return {
    ...ret,
    role: ret.role,
    status: displayUserStatus(ret.status),
    joiningDate: formatDateOnly(ret.joiningDate),
    teamLeadId: ret.teamLeadId ? ret.teamLeadId.toString?.() ?? ret.teamLeadId : null,
  };
}