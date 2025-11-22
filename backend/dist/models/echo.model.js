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
    goLiveAt: { type: Date, default: Date.now },
    cloudPublicId: { type: String },
    uploadStatus: {
        type: String,
        enum: ['pending', 'done', 'failed'],
        default: 'pending'
    },
}, { timestamps: true });
echoSchema.index({ isPublic: 1, goLiveAt: -1 });
export default mongoose.model('Echo', echoSchema);
