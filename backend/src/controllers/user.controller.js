import User from '../models/user.model.js';
import { HttpError } from '../utils/http-error.js';
import { normalizeRole, readString, resolveTeamMembersForLead, serializeUser } from '../utils/resource-utils.js';

const VALID_ROLES = new Set(['admin', 'teamlead', 'employee']);
const VALID_STATUSES = new Set(['active', 'inactive']);

function hasOwn(body, key) {
  return Object.prototype.hasOwnProperty.call(body, key);
}

function assignStringField(user, body, key, { required = false, lowerCase = false } = {}) {
  if (!hasOwn(body, key)) {
    return;
  }

  const value = readString(body[key]);

  if (required && !value) {
    throw new HttpError(400, `${key} is required`);
  }

  user[key] = lowerCase ? value.toLowerCase() : value;
}

async function ensureUniqueEmail(email, userId) {
  if (!email) {
    return;
  }

  const existingUser = await User.findOne({
    email,
    _id: { $ne: userId },
  });

  if (existingUser) {
    throw new HttpError(409, 'This email address is already in use. Please use a different email address.');
  }
}

function validateEnumField(value, fieldName, allowedValues) {
  if (value !== undefined && value !== null && value !== '' && !allowedValues.has(value)) {
    throw new HttpError(400, `Invalid ${fieldName}`);
  }
}

async function saveAndRespond(user, res, statusCode = 200, message = 'Success') {
  await user.save();

  res.status(statusCode).json({
    message,
    user: serializeUser(user),
  });
}

export async function listUsers(req, res, next) {
  try {
    const users = await User.find().sort({ createdAt: -1 });

    res.json({
      users: users.map((user) => serializeUser(user)),
      count: users.length,
    });
  } catch (error) {
    next(error);
  }
}

export async function getUserById(req, res, next) {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      throw new HttpError(404, 'User not found');
    }

    res.json({
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
}

export async function createUser(req, res, next) {
  try {
    const body = req.body ?? {};
    const user = new User();

    assignStringField(user, body, 'name', { required: true });
    assignStringField(user, body, 'email', { required: true, lowerCase: true });
    assignStringField(user, body, 'password', { required: true });
    assignStringField(user, body, 'department');
    assignStringField(user, body, 'jobTitle');
    assignStringField(user, body, 'avatarUrl');
    assignStringField(user, body, 'phone');
    assignStringField(user, body, 'employeeId');
    assignStringField(user, body, 'cnic');
    assignStringField(user, body, 'contact');
    assignStringField(user, body, 'workingHours');
    assignStringField(user, body, 'profilePicture');
    assignStringField(user, body, 'address');
    assignStringField(user, body, 'emergencyContact');

    if (hasOwn(body, 'joiningDate')) {
      const joiningDate = readString(body.joiningDate);
      if (joiningDate) {
        user.joiningDate = new Date(joiningDate);
      }
    }

    if (hasOwn(body, 'teamLeadId')) {
      user.teamLeadId = readString(body.teamLeadId) || null;
    }

    if (hasOwn(body, 'role')) {
      const role = normalizeRole(body.role);
      validateEnumField(role, 'role', VALID_ROLES);
      user.role = role || user.role;
    }

    if (hasOwn(body, 'status')) {
      const status = readString(body.status);
      validateEnumField(status, 'status', VALID_STATUSES);
      user.status = status || user.status;
    }

    await ensureUniqueEmail(user.email, user._id);
    await saveAndRespond(user, res, 201, 'User created successfully');
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req, res, next) {
  try {
    const { userId } = req.params;
    const body = req.body ?? {};
    const user = await User.findById(userId);

    if (!user) {
      throw new HttpError(404, 'User not found');
    }

    assignStringField(user, body, 'name');
    assignStringField(user, body, 'email', { lowerCase: true });
    assignStringField(user, body, 'password');
    assignStringField(user, body, 'department');
    assignStringField(user, body, 'jobTitle');
    assignStringField(user, body, 'avatarUrl');
    assignStringField(user, body, 'phone');
    assignStringField(user, body, 'employeeId');
    assignStringField(user, body, 'cnic');
    assignStringField(user, body, 'contact');
    assignStringField(user, body, 'workingHours');
    assignStringField(user, body, 'profilePicture');
    assignStringField(user, body, 'address');
    assignStringField(user, body, 'emergencyContact');

    if (hasOwn(body, 'joiningDate')) {
      const joiningDate = readString(body.joiningDate);
      user.joiningDate = joiningDate ? new Date(joiningDate) : null;
    }

    if (hasOwn(body, 'teamLeadId')) {
      user.teamLeadId = readString(body.teamLeadId) || null;
    }

    if (hasOwn(body, 'role')) {
      const role = normalizeRole(body.role);
      validateEnumField(role, 'role', VALID_ROLES);
      if (role) {
        user.role = role;
      }
    }

    if (hasOwn(body, 'status')) {
      const status = readString(body.status);
      validateEnumField(status, 'status', VALID_STATUSES);
      if (status) {
        user.status = status;
      }
    }

    if (hasOwn(body, 'email')) {
      await ensureUniqueEmail(user.email, user._id);
    }

    await saveAndRespond(user, res, 200, 'User updated successfully');
  } catch (error) {
    next(error);
  }
}

export async function updateMe(req, res, next) {
  try {
    const body = req.body ?? {};
    const user = req.user;

    assignStringField(user, body, 'name');
    assignStringField(user, body, 'email', { lowerCase: true });
    assignStringField(user, body, 'password');
    assignStringField(user, body, 'department');
    assignStringField(user, body, 'jobTitle');
    assignStringField(user, body, 'avatarUrl');
    assignStringField(user, body, 'phone');
    assignStringField(user, body, 'employeeId');
    assignStringField(user, body, 'cnic');
    assignStringField(user, body, 'contact');
    assignStringField(user, body, 'workingHours');
    assignStringField(user, body, 'profilePicture');
    assignStringField(user, body, 'address');
    assignStringField(user, body, 'emergencyContact');

    if (hasOwn(body, 'joiningDate')) {
      const joiningDate = readString(body.joiningDate);
      user.joiningDate = joiningDate ? new Date(joiningDate) : null;
    }

    if (hasOwn(body, 'teamLeadId')) {
      user.teamLeadId = readString(body.teamLeadId) || null;
    }

    if (hasOwn(body, 'email')) {
      await ensureUniqueEmail(user.email, user._id);
    }

    await saveAndRespond(user, res, 200, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
}

export async function deleteUser(req, res, next) {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      throw new HttpError(404, 'User not found');
    }

    await user.deleteOne();

    res.json({
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}