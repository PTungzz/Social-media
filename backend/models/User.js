import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, trim: true, unique: true },
    email: { type: String, required: true, trim: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
export default User;
