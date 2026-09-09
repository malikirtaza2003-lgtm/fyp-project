import mongoose from 'mongoose';
import { displayLeaveStatus, formatDateOnly, normalizeLeaveStatus } from '../utils/resource-utils.js';

const leaveSchema = new mongoose.Schema(
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
    leaveType: {
      type: String,
      trim: true,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      default: null,
    },
    days: {
      type: Number,
      default: 1,
    },
    reason: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

leaveSchema.pre('save', function normaliseLeaveFields(next) {
  this.status = normalizeLeaveStatus(this.status);
  next();
});

leaveSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    ret.startDate = formatDateOnly(ret.startDate);
    ret.endDate = formatDateOnly(ret.endDate);
    ret.status = displayLeaveStatus(ret.status);

    if (ret.user && typeof ret.user === 'object') {
      ret.userId = ret.user._id?.toString?.() ?? null;
      ret.user = ret.user.name ?? '';
    } else {
      ret.userId = ret.user?.toString?.() ?? ret.user ?? null;
    }

    if (ret.reviewedBy && typeof ret.reviewedBy === 'object') {
      ret.reviewedById = ret.reviewedBy._id?.toString?.() ?? null;
      ret.reviewedBy = ret.reviewedBy.name ?? '';
    } else {
      ret.reviewedById = ret.reviewedBy?.toString?.() ?? ret.reviewedBy ?? null;
    }

    delete ret._id;
    return ret;
  },
});

export default mongoose.models.Leave ?? mongoose.model('Leave', leaveSchema);