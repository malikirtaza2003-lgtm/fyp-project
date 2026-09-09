import mongoose from 'mongoose';
import userSchema from '../schemas/user.schema.js';

const User = mongoose.models.User ?? mongoose.model('User', userSchema);

export default User;