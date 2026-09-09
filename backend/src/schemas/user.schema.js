import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: ['admin', 'teamlead', 'employee'],
      default: 'employee',
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    department: {
      type: String,
      trim: true,
      default: '',
    },
    jobTitle: {
      type: String,
      trim: true,
      default: '',
    },
    avatarUrl: {
      type: String,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    employeeId: {
      type: String,
      trim: true,
      default: '',
    },
    cnic: {
      type: String,
      trim: true,
      default: '',
    },
    contact: {
      type: String,
      trim: true,
      default: '',
    },
    joiningDate: {
      type: Date,
      default: null,
    },
    workingHours: {
      type: String,
      trim: true,
      default: '0h',
    },
    profilePicture: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    emergencyContact: {
      type: String,
      trim: true,
      default: '',
    },
    teamLeadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    lastNotificationCheck: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

userSchema.pre('save', function hashPassword(next) {
  if (!this.isModified('password')) {
    next();
    return;
  }

  bcrypt
    .genSalt(12)
    .then((salt) => bcrypt.hash(this.password, salt))
    .then((hashedPassword) => {
      this.password = hashedPassword;
      next();
    })
    .catch(next);
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.password;
    if (ret.teamLeadId && typeof ret.teamLeadId === 'object' && ret.teamLeadId._id) {
      ret.teamLeadId = ret.teamLeadId._id.toString();
    }
    return ret;
  },
});

export default userSchema;