import Leave from '../models/leave.model.js';
import { HttpError } from '../utils/http-error.js';
import {
  calcInclusiveDays,
  normalizeLeaveStatus,
  readString,
  resolveTeamMembersForLead,
  resolveUserReference,
} from '../utils/resource-utils.js';

async function scopeLeaveQuery(user) {
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

function readLeaveBody(body = {}) {
  return {
    leaveType: readString(body.leaveType),
    startDate: body.startDate ? new Date(body.startDate) : null,
    endDate: body.endDate ? new Date(body.endDate) : null,
    reason: readString(body.reason),
    status: normalizeLeaveStatus(body.status),
  };
}

export async function listLeaves(req, res, next) {
  try {
    const query = await scopeLeaveQuery(req.user);
    const leaves = await Leave.find(query).populate('user', 'name email department avatarUrl').populate('reviewedBy', 'name email').sort({ createdAt: -1 });

    res.json({
      leaves: leaves.map((leave) => leave.toJSON()),
      count: leaves.length,
    });
  } catch (error) {
    next(error);
  }
}

export async function getLeaveById(req, res, next) {
  try {
    const leave = await Leave.findById(req.params.leaveId).populate('user', 'name email department avatarUrl').populate('reviewedBy', 'name email');

    if (!leave) {
      throw new HttpError(404, 'Leave request not found');
    }

    res.json({ leave: leave.toJSON() });
  } catch (error) {
    next(error);
  }
}

export async function createLeave(req, res, next) {
  try {
    const body = readLeaveBody(req.body ?? {});

    if (!body.leaveType || !body.startDate) {
      throw new HttpError(400, 'Leave type and start date are required');
    }

    const employee = req.user.role === 'admin' || req.user.role === 'teamlead'
      ? await resolveUserReference(req.body?.user ?? req.body?.employee ?? req.body?.userId, { allowMissing: true }) ?? req.user
      : req.user;

    if (req.user.role === 'employee' && (req.body?.user || req.body?.employee || req.body?.userId)) {
      throw new HttpError(403, 'Employees can only create leave requests for themselves');
    }

    const start = body.startDate;
    const end = body.endDate ?? body.startDate;

    const leave = await Leave.create({
      user: employee._id,
      employee: employee.name,
      leaveType: body.leaveType,
      startDate: start,
      endDate: end,
      days: calcInclusiveDays(start, end),
      reason: body.reason,
      status: body.status,
    });

    const populatedLeave = await Leave.findById(leave._id).populate('user', 'name email department avatarUrl').populate('reviewedBy', 'name email');

    res.status(201).json({
      message: 'Leave request submitted successfully',
      leave: populatedLeave.toJSON(),
    });
  } catch (error) {
    next(error);
  }
}

export async function updateLeave(req, res, next) {
  try {
    if (!['admin', 'teamlead'].includes(req.user.role)) {
      throw new HttpError(403, 'You do not have permission to update leave requests');
    }

    const leave = await Leave.findById(req.params.leaveId).populate('user', 'name email department avatarUrl').populate('reviewedBy', 'name email');

    if (!leave) {
      throw new HttpError(404, 'Leave request not found');
    }

    const body = readLeaveBody(req.body ?? {});

    if (body.leaveType) leave.leaveType = body.leaveType;
    if (body.startDate) leave.startDate = body.startDate;
    if (body.endDate) leave.endDate = body.endDate;
    if (body.reason !== undefined) leave.reason = body.reason;
    if (body.status !== undefined) leave.status = body.status;
    if (req.body?.user || req.body?.employee || req.body?.userId) {
      const employee = await resolveUserReference(req.body.user ?? req.body.employee ?? req.body.userId);
      leave.user = employee._id;
      leave.employee = employee.name;
    }

    leave.days = calcInclusiveDays(leave.startDate, leave.endDate ?? leave.startDate);

    await leave.save();

    const populatedLeave = await Leave.findById(leave._id).populate('user', 'name email department avatarUrl').populate('reviewedBy', 'name email');

    res.json({
      message: 'Leave request updated successfully',
      leave: populatedLeave.toJSON(),
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteLeave(req, res, next) {
  try {
    if (!['admin', 'teamlead'].includes(req.user.role)) {
      throw new HttpError(403, 'You do not have permission to delete leave requests');
    }

    const leave = await Leave.findById(req.params.leaveId);

    if (!leave) {
      throw new HttpError(404, 'Leave request not found');
    }

    await leave.deleteOne();
    res.json({ message: 'Leave request deleted successfully' });
  } catch (error) {
    next(error);
  }
}

async function approveOrRejectLeave(req, res, next, nextStatus) {
  try {
    if (!['admin', 'teamlead'].includes(req.user.role)) {
      throw new HttpError(403, 'You do not have permission to review leave requests');
    }

    const leave = await Leave.findById(req.params.leaveId).populate('user', 'name email department avatarUrl').populate('reviewedBy', 'name email');

    if (!leave) {
      throw new HttpError(404, 'Leave request not found');
    }

    leave.status = nextStatus;
    leave.reviewedBy = req.user._id;
    leave.reviewedAt = new Date();
    await leave.save();

    const populatedLeave = await Leave.findById(leave._id).populate('user', 'name email department avatarUrl').populate('reviewedBy', 'name email');

    res.json({
      message: `Leave request ${nextStatus} successfully`,
      leave: populatedLeave.toJSON(),
    });
  } catch (error) {
    next(error);
  }
}

export function approveLeave(req, res, next) {
  return approveOrRejectLeave(req, res, next, 'approved');
}

export function rejectLeave(req, res, next) {
  return approveOrRejectLeave(req, res, next, 'rejected');
}