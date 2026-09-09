import Project from '../models/project.model.js';
import { HttpError } from '../utils/http-error.js';
import {
  displayPriority,
  normalizePriority,
  readString,
  resolveTeamMembersForLead,
  resolveUserReference,
} from '../utils/resource-utils.js';

function readProjectBody(body = {}) {
  const selectedMembers = Array.isArray(body.selectedMemberNames)
    ? body.selectedMemberNames.map((member) => readString(member)).filter(Boolean)
    : Array.isArray(body.teamMembers)
      ? body.teamMembers.map((member) => readString(member)).filter(Boolean)
      : [];

  const tasks = Array.isArray(body.tasks)
    ? body.tasks.map((task, index) => ({
      title: readString(task?.title),
      status: readString(task?.status) || 'pending',
      assignee: readString(task?.assignee),
      id: task?.id ?? index + 1,
    }))
    : [];

  const chat = Array.isArray(body.chat)
    ? body.chat.map((message, index) => ({
      sender: readString(message?.sender),
      avatar: readString(message?.avatar),
      content: readString(message?.content),
      time: readString(message?.time),
      isSelf: Boolean(message?.isSelf),
      tickStatus: readString(message?.tickStatus),
      id: message?.id ?? index + 1,
    }))
    : [];

  return {
    title: readString(body.title || body.name),
    description: readString(body.description),
    client: readString(body.client),
    teamLead: readString(body.teamLead),
    selectedMemberNames: selectedMembers,
    tasks,
    chat,
    assignDate: body.assignDate ? new Date(body.assignDate) : null,
    deadline: body.deadline ? new Date(body.deadline) : null,
    priority: normalizePriority(body.priority),
    activeMembers: Number.isFinite(Number(body.activeMembers)) ? Number(body.activeMembers) : selectedMembers.length,
    members: Array.isArray(body.members) ? body.members.map((item) => readString(item)).filter(Boolean) : selectedMembers.map((name) => name.split(' ').map((part) => part[0]).join('').toUpperCase()),
    operationalHours: Number.isFinite(Number(body.operationalHours)) ? Number(body.operationalHours) : 0,
    accuracy: Number.isFinite(Number(body.accuracy)) ? Number(body.accuracy) : 0,
    goalCompleted: Number.isFinite(Number(body.goalCompleted)) ? Number(body.goalCompleted) : 0,
  };
}

async function scopeProjectQuery(user) {
  if (user.role === 'admin') {
    return {};
  }

  if (user.role === 'teamlead') {
    const teamMembers = await resolveTeamMembersForLead(user);
    const teamMemberNames = new Set(teamMembers.map((member) => member.name));

    return {
      $or: [
        { selectedMemberNames: { $in: [...teamMemberNames] } },
        { teamLead: user.name },
      ],
    };
  }

  return {
    $or: [
      { selectedMemberNames: { $regex: new RegExp(`^${user.name}$`, 'i') } },
      { teamMembers: user._id },
    ],
  };
}

export async function listProjects(req, res, next) {
  try {
    const query = await scopeProjectQuery(req.user);
    const projects = await Project.find(query)
      .populate('teamMembers', 'name email department avatarUrl')
      .sort({ createdAt: -1 });

    res.json({
      projects: projects.map((project) => project.toJSON()),
      count: projects.length,
    });
  } catch (error) {
    next(error);
  }
}

export async function getProjectById(req, res, next) {
  try {
    const project = await Project.findById(req.params.projectId).populate('teamMembers', 'name email department avatarUrl');

    if (!project) {
      throw new HttpError(404, 'Project not found');
    }

    res.json({ project: project.toJSON() });
  } catch (error) {
    next(error);
  }
}

export async function createProject(req, res, next) {
  try {
    if (!['admin', 'teamlead'].includes(req.user.role)) {
      throw new HttpError(403, 'You do not have permission to create projects');
    }

    const body = readProjectBody(req.body ?? {});

    if (!body.title) {
      throw new HttpError(400, 'Project title is required');
    }

    const teamMembers = [];
    for (const identifier of body.selectedMemberNames) {
      const member = await resolveUserReference(identifier);
      teamMembers.push(member._id);
    }

    if (req.user.role === 'teamlead' && teamMembers.length > 0) {
      const teamSet = new Set((await resolveTeamMembersForLead(req.user)).map((member) => member._id.toString()));
      for (const memberId of teamMembers) {
        if (!teamSet.has(memberId.toString())) {
          throw new HttpError(403, 'You can only assign projects to your team members');
        }
      }
    }

    const project = await Project.create({
      ...body,
      teamMembers,
    });

    const populatedProject = await Project.findById(project._id).populate('teamMembers', 'name email department avatarUrl');

    res.status(201).json({
      message: 'Project created successfully',
      project: populatedProject.toJSON(),
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProject(req, res, next) {
  try {
    if (!['admin', 'teamlead'].includes(req.user.role)) {
      throw new HttpError(403, 'You do not have permission to update projects');
    }

    const project = await Project.findById(req.params.projectId).populate('teamMembers', 'name email department avatarUrl');

    if (!project) {
      throw new HttpError(404, 'Project not found');
    }

    const body = readProjectBody(req.body ?? {});

    if (body.title) project.title = body.title;
    if (body.description !== undefined) project.description = body.description;
    if (body.client !== undefined) project.client = body.client;
    if (body.teamLead !== undefined) project.teamLead = body.teamLead;
    if (body.assignDate !== undefined) project.assignDate = body.assignDate;
    if (body.deadline !== undefined) project.deadline = body.deadline;
    if (body.priority !== undefined) project.priority = body.priority;
    if (body.activeMembers !== undefined) project.activeMembers = body.activeMembers;
    if (body.members !== undefined) project.members = body.members;
    if (body.operationalHours !== undefined) project.operationalHours = body.operationalHours;
    if (body.accuracy !== undefined) project.accuracy = body.accuracy;
    if (body.goalCompleted !== undefined) project.goalCompleted = body.goalCompleted;
    if (body.tasks !== undefined) project.tasks = body.tasks;
    if (body.chat !== undefined) project.chat = body.chat;

    if (body.selectedMemberNames.length > 0) {
      const teamMembers = [];
      for (const identifier of body.selectedMemberNames) {
        const member = await resolveUserReference(identifier);
        teamMembers.push(member._id);
      }

      if (req.user.role === 'teamlead') {
        const teamSet = new Set((await resolveTeamMembersForLead(req.user)).map((member) => member._id.toString()));
        for (const memberId of teamMembers) {
          if (!teamSet.has(memberId.toString())) {
            throw new HttpError(403, 'You can only assign projects to your team members');
          }
        }
      }

      project.teamMembers = teamMembers;
      project.selectedMemberNames = body.selectedMemberNames;
      project.members = body.members.length ? body.members : body.selectedMemberNames.map((name) => name.split(' ').map((part) => part[0]).join('').toUpperCase());
      project.activeMembers = body.activeMembers || body.selectedMemberNames.length;
    }

    await project.save();

    const populatedProject = await Project.findById(project._id).populate('teamMembers', 'name email department avatarUrl');

    res.json({
      message: 'Project updated successfully',
      project: populatedProject.toJSON(),
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteProject(req, res, next) {
  try {
    if (!['admin', 'teamlead'].includes(req.user.role)) {
      throw new HttpError(403, 'You do not have permission to delete projects');
    }

    const project = await Project.findById(req.params.projectId).populate('teamMembers', 'department');

    if (!project) {
      throw new HttpError(404, 'Project not found');
    }

    if (req.user.role === 'teamlead') {
      const teamSet = new Set((await resolveTeamMembersForLead(req.user)).map((member) => member.department));
      const projectDepartment = project.teamMembers?.[0]?.department ?? req.user.department;
      if (!teamSet.has(projectDepartment)) {
        throw new HttpError(403, 'You do not have permission to delete this project');
      }
    }

    await project.deleteOne();

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    next(error);
  }
}