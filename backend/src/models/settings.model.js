import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

settingsSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

export default mongoose.models.Settings ?? mongoose.model('Settings', settingsSchema);
