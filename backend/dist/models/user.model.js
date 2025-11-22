import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
const userSchema = new Schema({
    uid: {
        type: String,
        required: true,
        unique: true,
        default: () => uuidv4()
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    profilePhotoUrl: {
        type: String
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    otp: {
        type: String
    },
    otpExpires: {
        type: Date
    },
}, { timestamps: true } // Adds createdAt and updatedAt
);
export default mongoose.model('User', userSchema);
