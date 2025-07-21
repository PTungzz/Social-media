import mongoose from 'mongoose';

const FriendSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    friend: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Tạo index để tăng tốc độ query
FriendSchema.index({ user: 1, friend: 1 }, { unique: true });
FriendSchema.index({ user: 1 });
FriendSchema.index({ friend: 1 });

const Friend = mongoose.model('Friend', FriendSchema);

export default Friend;
