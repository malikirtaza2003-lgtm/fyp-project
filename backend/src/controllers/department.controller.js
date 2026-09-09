import Department from '../models/department.model.js';
import User from '../models/user.model.js';
import { HttpError } from '../utils/http-error.js';
import { readString, resolveUserReference, resolveTeamMembersForLead, serializeUser } from '../utils/resource-utils.js';

import Project from '../models/project.model.js';
import Task from '../models/task.model.js';

async function serializeDepartment(departmentDoc) {
  const raw = typeof departmentDoc.toJSON === 'function' ? departmentDoc.toJSON() : departmentDoc;
  const lead = raw.lead && typeof raw.lead === 'object' ? serializeUser(raw.lead) : null;
  const members = Array.isArray(raw.members)
    ? raw.members
        .map((member) => (member && typeof member === 'object' ? serializeUser(member) : null))
        .filter(Boolean)
    : [];

  // Calculate stats from Tasks and Projects
  const [tasks, projects] = await Promise.all([
    Task.find({ department: raw.name }),
    Project.find({ $or: [{ teamLead: lead?.name }, { selectedMemberNames: raw.name }] })
  ]);

  const completedTasks = tasks.filter(t => t.status === 'completed' || t.status === 'done').length;
  const pendingTasks = tasks.length - completedTasks;
  const assignedProjects = projects.length;

  return {
    ...raw,
    lead,
    members,
    memberCount: members.length,
    assignedProjects,
    completedTasks,
    pendingTasks,
    activeProjects: projects.filter(p => p.goalCompleted < 100).length
  };
}

async function scopeDepartmentsForUser(user) {
  let docs = await Department.find()
    .populate('lead', 'name email role department avatarUrl status')
    .populate('members', 'name email role department avatarUrl status')
    .sort({ name: 1 });

  // Auto-seed if empty (only for admin/teamlead first view)
  if (docs.length === 0 && (user.role === 'admin' || user.role === 'teamlead')) {
    const leads = await User.find({ role: { $in: ['admin', 'teamlead'] } });
    const leadMap = {};
    leads.forEach(l => leadMap[l.name] = l._id);

    const defaultDepts = [
      { name: 'Engineering', lead: leadMap['Sarah Chen'] || leads[0]?._id },
      { name: 'Design', lead: leadMap['Jane Smith'] || leads[1]?._id || leads[0]?._id },
      { name: 'Marketing', lead: leadMap['Sarah Wilson'] || leads[2]?._id || leads[0]?._id },
      { name: 'Management', lead: leadMap['James Wilson'] || leads[0]?._id },
    ];

    await Department.create(defaultDepts);
    docs = await Department.find()
      .populate('lead', 'name email role department avatarUrl status')
      .populate('members', 'name email role department avatarUrl status')
      .sort({ name: 1 });
  }

  if (user.role === 'admin') {
    return docs;
  }

  if (user.role === 'teamlead') {
    const filtered = docs.filter(d => d.name === user.department);
    if (filtered.length > 0) return filtered;

    const fallbackMembers = await resolveTeamMembersForLead(user);
    return [
      {
        id: `virtual-${user.department || user._id.toString()}`,
        name: user.department || 'Unassigned',
        lead: user,
        members: fallbackMembers,
        toJSON() {
          return {
            id: this.id,
            name: this.name,
            lead: this.lead,
            members: this.members,
          };
        },
      },
    ];
  }

  return docs.filter(d => d.name === user.department);
}

export async function listDepartments(req, res, next) {
  try {
    const departments = await scopeDepartmentsForUser(req.user);
    const serialized = await Promise.all(departments.map(serializeDepartment));
    res.json({
      departments: serialized,
      count: departments.length,
    });
  } catch (error) {
    next(error);
  }
}

export async function createDepartment(req, res, next) {
  try {
    const body = req.body ?? {};
    const name = readString(body.name);

    if (!name) {
      throw new HttpError(400, 'Department name is required');
    }

    const existing = await Department.findOne({ name });
    if (existing) {
      throw new HttpError(409, 'Department already exists');
    }

    const lead = body.lead ? await resolveUserReference(body.lead, { allowMissing: true }) : null;
    const memberRefs = Array.isArray(body.members) ? body.members : [];
    const members = [];
    for (const ref of memberRefs) {
      const member = await resolveUserReference(ref, { allowMissing: true });
      if (member) {
        members.push(member._id);
      }
    }

    if (lead && !members.some((memberId) => memberId.toString() === lead._id.toString())) {
      members.push(lead._id);
    }

    const department = await Department.create({
      name,
      lead: lead?._id ?? null,
      members,
    });

    if (members.length > 0) {
      await User.updateMany(
        { _id: { $in: members } },
        { $set: { department: name } },
      );
    }

    if (lead) {
      await User.findByIdAndUpdate(lead._id, {
        $set: { role: lead.role === 'admin' ? 'admin' : 'teamlead', department: name },
      });
    }

    const populated = await Department.findById(department._id)
      .populate('lead', 'name email role department avatarUrl status')
      .populate('members', 'name email role department avatarUrl status');

    const serialized = await serializeDepartment(populated);

    res.status(201).json({
      message: 'Department created successfully',
      department: serialized,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateDepartment(req, res, next) {
  try {
    const { departmentId } = req.params;
    const body = req.body ?? {};
    const department = await Department.findById(departmentId);

    if (!department) {
      throw new HttpError(404, 'Department not found');
    }

    const nextName = readString(body.name);
    if (nextName && nextName !== department.name) {
      const conflict = await Department.findOne({ name: nextName, _id: { $ne: department._id } });
      if (conflict) {
        throw new HttpError(409, 'Department already exists');
      }
      await User.updateMany({ department: department.name }, { $set: { department: nextName } });
      department.name = nextName;
    }

    if (body.lead !== undefined) {
      const nextLead = await resolveUserReference(body.lead, { allowMissing: true });
      department.lead = nextLead?._id ?? null;
      if (nextLead) {
        await User.findByIdAndUpdate(nextLead._id, {
          $set: { role: nextLead.role === 'admin' ? 'admin' : 'teamlead', department: department.name },
        });
      }
    }

    if (Array.isArray(body.members)) {
      const nextMembers = [];
      for (const ref of body.members) {
        const member = await resolveUserReference(ref, { allowMissing: true });
        if (member) {
          nextMembers.push(member._id);
        }
      }
      department.members = nextMembers;
      if (nextMembers.length > 0) {
        await User.updateMany({ _id: { $in: nextMembers } }, { $set: { department: department.name } });
      }
    }

    await department.save();

    const populated = await Department.findById(department._id)
      .populate('lead', 'name email role department avatarUrl status')
      .populate('members', 'name email role department avatarUrl status');

    const serialized = await serializeDepartment(populated);

    res.json({
      message: 'Department updated successfully',
      department: serialized,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteDepartment(req, res, next) {
  try {
    const { departmentId } = req.params;
    const department = await Department.findById(departmentId);

    if (!department) {
      throw new HttpError(404, 'Department not found');
    }

    await department.deleteOne();
    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    next(error);
  }
}
