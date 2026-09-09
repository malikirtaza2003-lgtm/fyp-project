import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetRoles: {
      type: [String],
      enum: ['admin', 'teamlead', 'employee'],
      default: ['teamlead', 'employee'],
    },
    viewedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    priority: {
      type: String,
      enum: ['High', 'Medium', 'Low'],
      default: 'Medium',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

announcementSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

const Announcement = mongoose.models.Announcement ?? mongoose.model('Announcement', announcementSchema);

export default Announcement;
