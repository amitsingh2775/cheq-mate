import mongoose, { Document, Schema } from 'mongoose';

export interface IEcho extends Document {
  creator: mongoose.Schema.Types.ObjectId;
  audioUrl: string;
  caption?: string;
  goLiveAt?: Date;
  status: 'pending' | 'live';
  cloudPublicId?: string;
  isPublic: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const echoSchema: Schema = new Schema(
  {
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
    goLiveAt: { type: Date, default: Date.now } , 
    cloudPublicId: { type: String },         
    uploadStatus: {                     
      type: String,
      enum: ['pending', 'done', 'failed'],
      default: 'pending'
    },
  },

  { timestamps: true }
);
echoSchema.index({ isPublic: 1, goLiveAt: -1 });

export default mongoose.model<IEcho>('Echo', echoSchema);