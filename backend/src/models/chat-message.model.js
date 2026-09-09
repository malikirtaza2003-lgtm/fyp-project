import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema(
  {
    chatId: {
      type: String,
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ['text', 'image', 'file', 'voice', 'call_video', 'call_audio'],
      default: 'text',
    },
    fileUrl: {
      type: String,
      default: '',
    },
    duration: {
      type: Number, // for voice/calls
      default: 0,
    },
    isSelf: {
      type: Boolean,
      default: false,
    },
    replyTo: {
      sender: String,
      content: String,
    },
    reactions: [
      {
        emoji: String,
        count: Number,
        users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

chatMessageSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    ret.senderId = ret.sender.toString();
    ret.time = new Date(ret.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    delete ret._id;
    return ret;
  },
});

export default mongoose.models.ChatMessage ?? mongoose.model('ChatMessage', chatMessageSchema);
