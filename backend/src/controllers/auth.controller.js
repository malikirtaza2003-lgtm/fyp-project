import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { env } from '../config/env.js';
import { HttpError } from '../utils/http-error.js';
import { normalizeRole, readString, serializeUser } from '../utils/resource-utils.js';

function createToken(userId) {
  return jwt.sign({ sub: userId }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

export async function register(req, res, next) {
  try {
    const body = req.body ?? {};
    const name = readString(body.name);
    const email = readString(body.email).toLowerCase();
    const password = readString(body.password);
    const department = readString(body.department);
    const jobTitle = readString(body.jobTitle);
    const avatarUrl = readString(body.avatarUrl);
    const role = normalizeRole(body.role) || 'employee';

    if (!name || !email || !password) {
      throw new HttpError(400, 'Name, email, and password are required');
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw new HttpError(409, 'Email is already registered');
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      department,
      jobTitle,
      avatarUrl,
    });

    res.status(201).json({
      message: 'User registered successfully',
      token: createToken(user._id.toString()),
      user: serializeUser(user),
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const body = req.body ?? {};
    const email = readString(body.email).toLowerCase();
    const password = readString(body.password);

    if (!email || !password) {
      throw new HttpError(400, 'Email and password are required');
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      throw new HttpError(401, 'Invalid email or password');
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      throw new HttpError(401, 'Invalid email or password');
    }

    res.json({
      message: 'Login successful',
      token: createToken(user._id.toString()),
      user: serializeUser(user),
    });
  } catch (error) {
    next(error);
  }
}

export async function getMe(req, res) {
  res.json({
    user: serializeUser(req.user),
  });
}