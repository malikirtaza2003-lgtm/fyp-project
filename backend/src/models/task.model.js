import mongoose from 'mongoose';
import {
  displayPriority,
  displayTaskStatus,
  formatDateOnly,
  normalizePriority,
  normalizeTaskStatus,
} from '../utils/resource-utils.js';

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed'],
      default: 'pending',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    deadline: {
      type: Date,
      default: null,
    },
    project: {
      type: String,
      trim: true,
      default: '',
    },
    department: {
      type: String,
      trim: true,
      default: '',
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

taskSchema.pre('save', function normaliseTaskFields(next) {
  this.status = normalizeTaskStatus(this.status);
  this.priority = normalizePriority(this.priority);
  next();
});

taskSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    ret.status = displayTaskStatus(ret.status);
    ret.priority = displayPriority(ret.priority);
    ret.deadline = formatDateOnly(ret.deadline);

    if (ret.assignedTo && typeof ret.assignedTo === 'object') {
      ret.assignedToId = ret.assignedTo._id?.toString?.() ?? null;
      ret.assignedTo = ret.assignedTo.name ?? '';
    } else {
      ret.assignedToId = ret.assignedTo?.toString?.() ?? ret.assignedTo ?? null;
    }

    if (ret.assignedBy && typeof ret.assignedBy === 'object') {
      ret.assignedById = ret.assignedBy._id?.toString?.() ?? null;
      ret.assignedBy = ret.assignedBy.name ?? '';
    } else {
      ret.assignedById = ret.assignedBy?.toString?.() ?? ret.assignedBy ?? null;
    }

    delete ret._id;
    return ret;
  },
});

export default mongoose.models.Task ?? mongoose.model('Task', taskSchema);