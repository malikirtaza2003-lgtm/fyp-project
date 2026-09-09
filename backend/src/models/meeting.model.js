import mongoose from 'mongoose';

const meetingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: String,
      required: true,
      trim: true,
    },
    time: {
      type: String,
      required: true,
      trim: true,
    },
    duration: {
      type: String,
      default: '30 min',
      trim: true,
    },
    participantList: [
      {
        type: String,
        trim: true,
      },
    ],
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    recording: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['upcoming', 'past'],
      default: 'upcoming',
    },
    participantIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    summary: {
      type: String,
      default: '',
    },
    transcript: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      enum: ['audio', 'video'],
      default: 'video',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

meetingSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    ret.hostId = ret.host?._id?.toString?.() ?? ret.host?.toString?.() ?? null;
    if (ret.host && typeof ret.host === 'object') {
      ret.host = ret.host.name ?? 'Host';
    }
    ret.participants = ret.participantList?.length ?? 0;
    delete ret._id;
    return ret;
  },
});

export default mongoose.models.Meeting ?? mongoose.model('Meeting', meetingSchema);
