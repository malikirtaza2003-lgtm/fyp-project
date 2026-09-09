import Task from '../models/task.model.js';
import User from '../models/user.model.js';
import { HttpError } from '../utils/http-error.js';
import {
  normalizePriority,
  normalizeTaskStatus,
  readString,
  resolveTeamMembersForLead,
  resolveUserReference,
} from '../utils/resource-utils.js';

async function scopeTaskQuery(user) {
  if (user.role === 'admin') {
    return {};
  }

  if (user.role === 'teamlead') {
    const teamMembers = await resolveTeamMembersForLead(user);
    const teamMemberIds = teamMembers.map((member) => member._id);

    return {
      $or: [
        { assignedTo: { $in: teamMemberIds } },
        { assignedBy: user._id },
      ],
    };
  }

  return { assignedTo: user._id };
}

function readTaskBody(body = {}) {
  return {
    title: readString(body.title),
    description: readString(body.description),
    assignedTo: body.assignedTo ?? body.assignedToId ?? body.assignedToName,
    assignedBy: body.assignedBy ?? body.assignedById,
    status: normalizeTaskStatus(body.status),
    priority: normalizePriority(body.priority),
    deadline: body.deadline ? new Date(body.deadline) : null,
    project: readString(body.project),
    department: readString(body.department),
    progress: Number.isFinite(Number(body.progress)) ? Number(body.progress) : 0,
  };
}

async function ensureTeamAccess(actor, assignee) {
  if (actor.role === 'admin') {
    return;
  }

  if (actor.role === 'teamlead' && assignee.department !== actor.department) {
    throw new HttpError(403, 'You can only assign tasks within your department');
  }
}

export async function listTasks(req, res, next) {
  try {
    const query = await scopeTaskQuery(req.user);
    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email department avatarUrl')
      .populate('assignedBy', 'name email department avatarUrl')
      .sort({ createdAt: -1 });

    res.json({
      tasks: tasks.map((task) => task.toJSON()),
      count: tasks.length,
    });
  } catch (error) {
    next(error);
  }
}

export async function getTaskById(req, res, next) {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId)
      .populate('assignedTo', 'name email department avatarUrl')
      .populate('assignedBy', 'name email department avatarUrl');

    if (!task) {
      throw new HttpError(404, 'Task not found');
    }

    if (req.user.role === 'employee' && task.assignedTo?._id?.toString() !== req.user._id.toString()) {
      throw new HttpError(403, 'You do not have access to this resource');
    }

    if (req.user.role === 'teamlead' && task.assignedBy?._id?.toString() !== req.user._id.toString()) {
      const teamMembers = await resolveTeamMembersForLead(req.user);
      const teamMemberIds = new Set(teamMembers.map((member) => member._id.toString()));
      if (!teamMemberIds.has(task.assignedTo?._id?.toString?.() ?? '')) {
        throw new HttpError(403, 'You do not have access to this resource');
      }
    }

    res.json({ task: task.toJSON() });
  } catch (error) {
    next(error);
  }
}

export async function createTask(req, res, next) {
  try {
    const body = readTaskBody(req.body ?? {});

    if (!body.title) {
      throw new HttpError(400, 'title is required');
    }

    let assignedTo = req.user;
    let assignedBy = req.user;

    if (req.user.role !== 'employee') {
      assignedTo = await resolveUserReference(body.assignedTo);
      assignedBy = req.user.role === 'admin' && body.assignedBy ? await resolveUserReference(body.assignedBy) : req.user;

      await ensureTeamAccess(req.user, assignedTo);
    }

    const task = await Task.create({
      title: body.title,
      description: body.description,
      assignedTo: assignedTo._id,
      assignedBy: assignedBy._id,
      status: body.status,
      priority: body.priority,
      deadline: body.deadline,
      project: body.project,
      department: body.department || assignedTo.department || '',
      progress: body.progress,
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email department avatarUrl')
      .populate('assignedBy', 'name email department avatarUrl');

    res.status(201).json({
      message: 'Task created successfully',
      task: populatedTask.toJSON(),
    });
  } catch (error) {
    next(error);
  }
}

export async function updateTask(req, res, next) {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId)
      .populate('assignedTo', 'name email department avatarUrl')
      .populate('assignedBy', 'name email department avatarUrl');

    if (!task) {
      throw new HttpError(404, 'Task not found');
    }

    const body = req.body ?? {};

    if (req.user.role === 'employee') {
      if (task.assignedTo?._id?.toString() !== req.user._id.toString()) {
        throw new HttpError(403, 'You do not have permission to update this task');
      }

      if (body.status !== undefined) {
        task.status = normalizeTaskStatus(body.status);
      }

      if (body.progress !== undefined) {
        task.progress = Math.max(0, Math.min(100, Number(body.progress) || 0));
      }
    } else {
      const nextTitle = readString(body.title);
      if (nextTitle) {
        task.title = nextTitle;
      }

      if (body.description !== undefined) {
        task.description = readString(body.description);
      }

      if (body.status !== undefined) {
        task.status = normalizeTaskStatus(body.status);
      }

      if (body.priority !== undefined) {
        task.priority = normalizePriority(body.priority);
      }

      if (body.project !== undefined) {
        task.project = readString(body.project);
      }

      if (body.department !== undefined) {
        task.department = readString(body.department);
      }

      if (body.progress !== undefined) {
        task.progress = Math.max(0, Math.min(100, Number(body.progress) || 0));
      }

      if (body.assignedTo !== undefined || body.assignedToId !== undefined || body.assignedToName !== undefined) {
        const nextAssignedTo = await resolveUserReference(body.assignedTo ?? body.assignedToId ?? body.assignedToName);
        await ensureTeamAccess(req.user, nextAssignedTo);
        task.assignedTo = nextAssignedTo._id;
        task.department = task.department || nextAssignedTo.department || '';
      }

      if (body.assignedBy !== undefined || body.assignedById !== undefined) {
        const nextAssignedBy = await resolveUserReference(body.assignedBy ?? body.assignedById);
        task.assignedBy = nextAssignedBy._id;
      }

      if (body.deadline !== undefined) {
        task.deadline = body.deadline ? new Date(body.deadline) : null;
      }
    }

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email department avatarUrl')
      .populate('assignedBy', 'name email department avatarUrl');

    res.json({
      message: 'Task updated successfully',
      task: populatedTask.toJSON(),
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteTask(req, res, next) {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId)
      .populate('assignedTo', 'department')
      .populate('assignedBy', '_id');

    if (!task) {
      throw new HttpError(404, 'Task not found');
    }

    if (req.user.role === 'employee') {
      const isPersonalTask = task.assignedTo?._id?.toString?.() === req.user._id.toString() && task.assignedBy?._id?.toString?.() === req.user._id.toString();
      if (!isPersonalTask) {
        throw new HttpError(403, 'You do not have permission to delete this task');
      }
    }

    if (req.user.role === 'teamlead' && task.assignedTo?.department !== req.user.department) {
      throw new HttpError(403, 'You do not have permission to delete tasks outside your team');
    }

    await task.deleteOne();

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
}