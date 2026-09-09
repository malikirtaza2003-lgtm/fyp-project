import mongoose from 'mongoose';
import { displayAttendanceStatus, formatDateOnly, normalizeAttendanceStatus } from '../utils/resource-utils.js';

const attendanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    employee: {
      type: String,
      trim: true,
      required: true,
    },
    department: {
      type: String,
      trim: true,
      default: '',
    },
    date: {
      type: Date,
      required: true,
    },
    checkIn: {
      type: String,
      trim: true,
      default: '—',
    },
    checkOut: {
      type: String,
      trim: true,
      default: '—',
    },
    workingHours: {
      type: String,
      trim: true,
      default: '0h',
    },
    breakTime: {
      type: String,
      trim: true,
      default: '0m',
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'leave', 'late', 'checked-in', 'on-break', 'checked-out'],
      default: 'present',
    },
    checkInAt: {
      type: Date,
      default: null,
    },
    breakStartedAt: {
      type: Date,
      default: null,
    },
    breakEndedAt: {
      type: Date,
      default: null,
    },
    checkOutAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

attendanceSchema.pre('save', function normaliseAttendanceFields(next) {
  this.status = normalizeAttendanceStatus(this.status);
  this.date = this.date instanceof Date ? this.date : new Date(this.date);
  next();
});

attendanceSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    ret.date = formatDateOnly(ret.date);
    ret.status = displayAttendanceStatus(ret.status);

    if (ret.user && typeof ret.user === 'object') {
      ret.userId = ret.user._id?.toString?.() ?? null;
      ret.user = ret.user.name ?? '';
    } else {
      ret.userId = ret.user?.toString?.() ?? ret.user ?? null;
    }

    delete ret._id;
    return ret;
  },
});

export default mongoose.models.Attendance ?? mongoose.model('Attendance', attendanceSchema);