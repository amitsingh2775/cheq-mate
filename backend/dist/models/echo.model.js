import mongoose, { Schema } from 'mongoose';
const echoSchema = new Schema({
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    audioUrl: {
        type: String,
        required: true
    },
    caption: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'live'],
        default: 'pending'
    },
    isPublic: {
        type: Boolean,
        default: true
    },
}, { timestamps: true });
export default mongoose.model('Echo', echoSchema);
