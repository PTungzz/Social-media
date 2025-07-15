import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    seen: { type: Boolean, default: false }
});

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);
export default ChatMessage;
