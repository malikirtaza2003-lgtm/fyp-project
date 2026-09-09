import Attendance from '../models/attendance.model.js';
import { HttpError } from '../utils/http-error.js';
import {
  calcInclusiveDays,
  displayAttendanceStatus,
  formatDateOnly,
  normalizeAttendanceStatus,
  readString,
  resolveTeamMembersForLead,
  resolveUserReference,
} from '../utils/resource-utils.js';

function todayKey(date = new Date()) {
  return formatDateOnly(date);
}

function timeLabel(date = new Date()) {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

async function scopeAttendanceQuery(user) {
  if (user.role === 'admin') {
    return {};
  }

  if (user.role === 'teamlead') {
    const teamMembers = await resolveTeamMembersForLead(user);
    const teamMemberIds = teamMembers.map((member) => member._id);
    return { user: { $in: [user._id, ...teamMemberIds] } };
  }

  return { user: user._id };
}

async function getOrCreateTodayRecord(user) {
  const date = todayKey();
  let record = await Attendance.findOne({ user: user._id, date: new Date(date) }).populate('user', 'name email department avatarUrl');

  if (!record) {
    record = await Attendance.create({
      user: user._id,
      employee: user.name,
      department: user.department,
      date: new Date(date),
      checkIn: '—',
      checkOut: '—',
      workingHours: '0h',
      breakTime: '0m',
      status: 'present',
    });
    record = await Attendance.findById(record._id).populate('user', 'name email department avatarUrl');
  }

  return record;
}

function calculateBreakTime(record) {
  const currentBreakMs = record.breakStartedAt ? Math.max(Date.now() - new Date(record.breakStartedAt).getTime(), 0) : 0;
  const storedBreakMs = Number(record.breakTime?.replace(/[^0-9.]/g, '')) * 60000 || 0;
  return Math.round((storedBreakMs + currentBreakMs) / 60000);
}

export async function listAttendance(req, res, next) {
  try {
    const query = await scopeAttendanceQuery(req.user);
    if (req.query.date) {
      query.date = new Date(readString(req.query.date));
    }

    const records = await Attendance.find(query).populate('user', 'name email department avatarUrl').sort({ date: -1, createdAt: -1 });

    res.json({
      attendance: records.map((record) => record.toJSON()),
      count: records.length,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAttendanceById(req, res, next) {
  try {
    const record = await Attendance.findById(req.params.attendanceId).populate('user', 'name email department avatarUrl');

    if (!record) {
      throw new HttpError(404, 'Attendance record not found');
    }

    res.json({ attendance: record.toJSON() });
  } catch (error) {
    next(error);
  }
}

export async function createOrUpdateAttendance(req, res, next) {
  try {
    if (!['admin', 'teamlead'].includes(req.user.role)) {
      throw new HttpError(403, 'You do not have permission to create attendance records');
    }

    const body = req.body ?? {};
    const employee = await resolveUserReference(body.user ?? body.employee ?? body.employeeId ?? body.userId);
    const date = body.date ? new Date(body.date) : new Date();

    let record = await Attendance.findOne({ user: employee._id, date }).populate('user', 'name email department avatarUrl');

    if (!record) {
      record = new Attendance({
        user: employee._id,
        employee: employee.name,
        department: employee.department,
        date,
      });
    }

    if (body.checkIn !== undefined) record.checkIn = readString(body.checkIn) || '—';
    if (body.checkOut !== undefined) record.checkOut = readString(body.checkOut) || '—';
    if (body.workingHours !== undefined) record.workingHours = readString(body.workingHours) || '0h';
    if (body.breakTime !== undefined) record.breakTime = readString(body.breakTime) || '0m';
    if (body.status !== undefined) record.status = normalizeAttendanceStatus(body.status);

    record.user = employee._id;
    record.employee = employee.name;
    record.department = employee.department;
    record.date = date;

    await record.save();

    const populatedRecord = await Attendance.findById(record._id).populate('user', 'name email department avatarUrl');

    res.status(record.isNew ? 201 : 200).json({
      message: 'Attendance saved successfully',
      attendance: populatedRecord.toJSON(),
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAttendance(req, res, next) {
  try {
    const record = await Attendance.findById(req.params.attendanceId).populate('user', 'name email department avatarUrl');

    if (!record) {
      throw new HttpError(404, 'Attendance record not found');
    }

    if (!['admin', 'teamlead'].includes(req.user.role)) {
      throw new HttpError(403, 'You do not have permission to update attendance records');
    }

    const body = req.body ?? {};
    if (body.checkIn !== undefined) record.checkIn = readString(body.checkIn) || '—';
    if (body.checkOut !== undefined) record.checkOut = readString(body.checkOut) || '—';
    if (body.workingHours !== undefined) record.workingHours = readString(body.workingHours) || '0h';
    if (body.breakTime !== undefined) record.breakTime = readString(body.breakTime) || '0m';
    if (body.status !== undefined) record.status = normalizeAttendanceStatus(body.status);
    if (body.date !== undefined) record.date = new Date(body.date);
    if (body.user !== undefined || body.employee !== undefined) {
      const employee = await resolveUserReference(body.user ?? body.employee);
      record.user = employee._id;
      record.employee = employee.name;
      record.department = employee.department;
    }

    await record.save();

    const populatedRecord = await Attendance.findById(record._id).populate('user', 'name email department avatarUrl');

    res.json({
      message: 'Attendance updated successfully',
      attendance: populatedRecord.toJSON(),
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteAttendance(req, res, next) {
  try {
    if (!['admin', 'teamlead'].includes(req.user.role)) {
      throw new HttpError(403, 'You do not have permission to delete attendance records');
    }

    const record = await Attendance.findById(req.params.attendanceId);

    if (!record) {
      throw new HttpError(404, 'Attendance record not found');
    }

    await record.deleteOne();
    res.json({ message: 'Attendance record deleted successfully' });
  } catch (error) {
    next(error);
  }
}

export async function checkIn(req, res, next) {
  try {
    const record = await getOrCreateTodayRecord(req.user);
    const now = new Date();

    record.checkIn = timeLabel(now);
    record.checkInAt = now;
    record.breakStartedAt = null;
    record.breakEndedAt = null;
    record.checkOutAt = null;
    record.status = 'checked-in';

    if (!record.workingHours || record.workingHours === '0h') {
      record.workingHours = '0h';
    }

    await record.save();

    const populatedRecord = await Attendance.findById(record._id).populate('user', 'name email department avatarUrl');
    res.json({ message: 'Checked in successfully', attendance: populatedRecord.toJSON() });
  } catch (error) {
    next(error);
  }
}

export async function startBreak(req, res, next) {
  try {
    const record = await getOrCreateTodayRecord(req.user);

    if (record.status !== 'checked-in') {
      throw new HttpError(400, 'You need to check in first');
    }

    record.status = 'on-break';
    record.breakStartedAt = new Date();
    await record.save();

    const populatedRecord = await Attendance.findById(record._id).populate('user', 'name email department avatarUrl');
    res.json({ message: 'Break started', attendance: populatedRecord.toJSON() });
  } catch (error) {
    next(error);
  }
}

export async function resumeFromBreak(req, res, next) {
  try {
    const record = await getOrCreateTodayRecord(req.user);

    if (record.status !== 'on-break') {
      throw new HttpError(400, 'No active break session found');
    }

    const now = new Date();
    const currentBreakMinutes = record.breakStartedAt ? Math.max(Math.round((now.getTime() - new Date(record.breakStartedAt).getTime()) / 60000), 0) : 0;
    const storedBreak = Number.parseInt(record.breakTime, 10) || 0;

    record.breakTime = `${storedBreak + currentBreakMinutes}m`;
    record.breakStartedAt = null;
    record.breakEndedAt = now;
    record.status = 'checked-in';
    await record.save();

    const populatedRecord = await Attendance.findById(record._id).populate('user', 'name email department avatarUrl');
    res.json({ message: 'Resumed working', attendance: populatedRecord.toJSON() });
  } catch (error) {
    next(error);
  }
}

export async function checkOut(req, res, next) {
  try {
    const record = await getOrCreateTodayRecord(req.user);
    const now = new Date();
    const checkInAt = record.checkInAt ? new Date(record.checkInAt) : now;
    const breakMinutes = calculateBreakTime(record);
    const workedMinutes = Math.max(Math.round((now.getTime() - checkInAt.getTime()) / 60000) - breakMinutes, 0);

    record.checkOut = timeLabel(now);
    record.checkOutAt = now;
    record.status = 'checked-out';
    record.workingHours = `${(workedMinutes / 60).toFixed(1)}h`;
    record.breakTime = `${breakMinutes}m`;

    await record.save();

    const populatedRecord = await Attendance.findById(record._id).populate('user', 'name email department avatarUrl');
    res.json({ message: 'Checked out successfully', attendance: populatedRecord.toJSON() });
  } catch (error) {
    next(error);
  }
}