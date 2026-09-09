import mongoose from 'mongoose';
import {
  displayPriority,
  formatDateOnly,
  normalizePriority,
  readString,
} from '../utils/resource-utils.js';

const projectTaskSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: '' },
    status: { type: String, trim: true, default: 'pending' },
    assignee: { type: String, trim: true, default: '' },
  },
  { _id: true, versionKey: false },
);

const projectChatSchema = new mongoose.Schema(
  {
    sender: { type: String, trim: true, default: '' },
    avatar: { type: String, trim: true, default: '' },
    content: { type: String, trim: true, default: '' },
    time: { type: String, trim: true, default: '' },
    isSelf: { type: Boolean, default: false },
    tickStatus: { type: String, trim: true, default: '' },
  },
  { _id: true, versionKey: false },
);

const projectSchema = new mongoose.Schema(
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
    client: {
      type: String,
      trim: true,
      default: '',
    },
    teamLead: {
      type: String,
      trim: true,
      default: '',
    },
    teamMembers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    selectedMemberNames: [
      {
        type: String,
        trim: true,
      },
    ],
    tasks: [projectTaskSchema],
    chat: [projectChatSchema],
    assignDate: {
      type: Date,
      default: null,
    },
    deadline: {
      type: Date,
      default: null,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    activeMembers: {
      type: Number,
      default: 0,
    },
    members: [
      {
        type: String,
        trim: true,
        default: '',
      },
    ],
    operationalHours: {
      type: Number,
      default: 0,
    },
    accuracy: {
      type: Number,
      default: 0,
    },
    goalCompleted: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

projectSchema.pre('save', function normaliseProjectFields(next) {
  this.title = readString(this.title);
  this.priority = normalizePriority(this.priority);
  next();
});

projectSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    ret.priority = displayPriority(ret.priority);
    ret.assignDate = formatDateOnly(ret.assignDate);
    ret.deadline = formatDateOnly(ret.deadline);
    ret.tasks = (ret.tasks ?? []).map((task) => ({
      ...task,
      id: task._id?.toString?.() ?? task.id ?? null,
    }));
    ret.chat = (ret.chat ?? []).map((message) => ({
      ...message,
      id: message._id?.toString?.() ?? message.id ?? null,
    }));
    ret.teamMembers = (ret.teamMembers ?? []).map((member) => (typeof member === 'object' ? member._id?.toString?.() ?? member.toString?.() : member.toString?.() ?? member));
    ret.selectedMemberNames = ret.selectedMemberNames ?? [];

    delete ret._id;
    return ret;
  },
});

export default mongoose.models.Project ?? mongoose.model('Project', projectSchema);