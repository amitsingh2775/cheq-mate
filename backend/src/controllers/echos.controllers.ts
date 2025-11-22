// src/controllers/echos.controllers.ts
import { Response } from 'express';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import Echo, { IEcho } from '../models/echo.model.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { io } from '../server.js';
import cloudinary from '../config/cloudnairyConfig.js';
import { compressAudio } from '../utils/compressAudio.js';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'audio');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

export const createEcho = async (req: AuthenticatedRequest, res: Response) => {
  const { isPublic, caption, goLiveLater } = req.body;
  const audioFile = req.file;
  const userId = req.user!.id;

  if (!audioFile) {
    return res.status(400).json({ error: 'Audio file is required.' });
  }

  let localFilePath: string | undefined;
  let compressedPath: string | undefined;

  try {
    const ext = path.extname(audioFile.originalname) || '.m4a';
    const filename = `${uuidv4()}${ext}`;
    localFilePath = path.join(UPLOAD_DIR, filename);
    await fs.promises.writeFile(localFilePath, audioFile.buffer);

    //  Compress the audio
    compressedPath = path.join(UPLOAD_DIR, `compressed-${filename}.mp3`);
    await compressAudio(localFilePath, compressedPath);

    //  Upload to Cloudinary
    const cloudinaryRes = await cloudinary.uploader.upload(compressedPath, {
      resource_type: 'video', // for audio files Cloudinary uses 'video' type
      folder: 'echos/audio',
    });

    const now = new Date();
    const goLiveAt =
      goLiveLater === 'true' ? new Date(now.getTime() + 24 * 60 * 60 * 1000) : now;
    const status = goLiveLater === 'true' ? 'pending' : 'live';

    const newEcho = new Echo({
      creator: userId,
      audioUrl: cloudinaryRes.secure_url, //  store cloudinary link
      caption: caption || null,
      isPublic: isPublic === 'true' || isPublic === true,
      status,
      goLiveAt,
      cloudPublicId: cloudinaryRes.public_id,
      uploadStatus: 'done',
    });

    const savedEcho = await newEcho.save();
    const populatedEcho = await savedEcho.populate({
      path: 'creator',
      select: 'username uid profilePhotoUrl',
    });

    //  Broadcast live echos
    if (populatedEcho.status === 'live' && populatedEcho.isPublic) {
      io.emit('new_echo_live', populatedEcho);
    
    }

    //  Cleanup local files
    if (localFilePath && fs.existsSync(localFilePath)) {
      await fs.promises.unlink(localFilePath);
    }
    if (compressedPath && fs.existsSync(compressedPath)) {
      await fs.promises.unlink(compressedPath);
    }

    return res.status(201).json(populatedEcho);
  } catch (error: any) {
   
    // Cleanup if failed
    if (localFilePath && fs.existsSync(localFilePath)) await fs.promises.unlink(localFilePath);
    if (compressedPath && fs.existsSync(compressedPath)) await fs.promises.unlink(compressedPath);
    return res.status(500).json({ error: 'Server error creating echo.' });
  }
};

export const getFeed = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const now = new Date();

    // pagination params (optional)
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(100, parseInt(String(req.query.limit || '20'), 10));
    const skip = (page - 1) * limit;

    const echos = await Echo.find({
      isPublic: true,
      goLiveAt: { $lte: now },
    })
      .populate({
        path: 'creator',
        select: 'username uid profilePhotoUrl',
      })
      .sort({ goLiveAt: -1, createdAt: -1 }) // newest goLive first, fallback to createdAt
      .skip(skip)
      .limit(limit)
      .exec();

    return res.json({ page, limit, results: echos });
  } catch (error: any) {
   
    
    return res.status(500).json({ error: 'Server error fetching feed.' });
  }
};

export const getPendingEchos = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Unauthorized: User not found.' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const echos = await Echo.find({
      creator: req.user.id,
      status: 'pending',
    })
      .populate({
        path: 'creator',
        select: 'username uid profilePhotoUrl',
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const total = await Echo.countDocuments({
      creator: req.user.id,
      status: 'pending',
    }).exec();

    return res.status(200).json({
      results: echos,
      page,
      limit,
      total,
    });
  } catch (error) {
   
    return res.status(500).json({ error: 'Server error while fetching pending echos.' });
  }
};

export const triggerGoLive = async (req: AuthenticatedRequest, res: Response) => {
  const { echoId } = req.params;
  const userId = req.user!.id;

  try {
    // Find pending echo by owner
    const echoDoc = await Echo.findOne({
      _id: echoId,
      creator: userId,
      status: 'pending',
    }).exec();

    const echo = echoDoc as IEcho | null;

    if (!echo) {
      return res.status(404).json({ error: 'Pending echo not found for this user.' });
    }

    // Ensure goLiveAt exists
    if (!echo.goLiveAt) {
      return res.status(400).json({ error: 'Echo has no scheduled goLiveAt date.' });
    }

    // If it's not time yet, inform how much remaining
    if (echo.goLiveAt.getTime() > Date.now()) {
      const timeDiff = echo.goLiveAt.getTime() - Date.now();
      const hours = Math.floor(timeDiff / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      return res.status(400).json({ error: `It's not time yet. ${hours}h ${minutes}m remaining.` });
    }

    // Update status -> live
    echo.status = 'live';
    const updatedEcho = await echo.save();

    // Populate for broadcast
    const populatedEcho = await updatedEcho.populate<{ creator: { username: string; uid: string; profilePhotoUrl?: string } }>(
      {
        path: 'creator',
        select: 'username uid profilePhotoUrl',
      }
    );

    // Broadcast public echos
    if (populatedEcho.isPublic) {
      const echoObj = populatedEcho.toObject ? populatedEcho.toObject() : populatedEcho;
      io.emit('new_echo_live', echoObj);
    ;
    } 

    return res.status(200).json({ message: 'Echo is now live.', echo: populatedEcho });
  } catch (error: any) {
   
    return res.status(500).json({ error: 'Server error triggering echo live status.' });
  }
};

export const deleteEcho = async (req: AuthenticatedRequest, res: Response) => {
  const { echoId } = req.params;
  const userId = req.user!.id;

  try {
    // Fetch the echo (do not use .lean() here — we want to read fields)
    const echo = await Echo.findById(echoId).exec();

    if (!echo) {
      return res.status(404).json({ error: 'Echo not found' });
    }

    // Only owner can delete
    if (String(echo.creator) !== String(userId)) {
      return res.status(403).json({ error: 'Not authorized to delete this echo' });
    }

    // Remove audio file from disk if it exists and is a local path
    try {
      if (echo.audioUrl && typeof echo.audioUrl === 'string' && echo.audioUrl.startsWith('/uploads/audio/')) {
        const filename = path.basename(echo.audioUrl);
        const filePath = path.join(UPLOAD_DIR, filename);
        if (fs.existsSync(filePath)) {
          await fs.promises.unlink(filePath);
         
        }
      }
    } catch (fileErr) {
    
    }

    // Delete DB record using model-level API (works regardless of doc methods)
    await Echo.deleteOne({ _id: echoId }).exec();

    // notify clients to remove from feed
    const payload = { _id: echoId };
    io.emit('remove_echo', payload);
   

    return res.status(200).json({ message: 'Echo deleted' });
  } catch (err: any) {

    return res.status(500).json({ error: 'Server error deleting echo.' });
  }
};

export const updateEchoCaption = async (req: AuthenticatedRequest, res: Response) => {
  const { echoId } = req.params;
  const { caption } = req.body;
  const userId = req.user!.id;

  try {
    const echo = await Echo.findById(echoId).exec();
    if (!echo) return res.status(404).json({ error: 'Echo not found' });

    if (String(echo.creator) !== String(userId)) {
      return res.status(403).json({ error: 'Not authorized to edit this echo' });
    }

    echo.caption = caption ?? echo.caption;
    const updated = await echo.save();

    const populated = await updated.populate({
      path: 'creator',
      select: 'username uid profilePhotoUrl',
    });

    // Emit update to clients
    const echoObj = populated.toObject ? populated.toObject() : populated;
    io.emit('update_echo', echoObj);
   

    return res.status(200).json({ message: 'Caption updated', echo: populated });
  } catch (err: any) {
    
    return res.status(500).json({ error: 'Server error updating caption.' });
  }
};

export const getMyEchos = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const total = await Echo.countDocuments({ creator: userId }).exec();

    const myEchos = await Echo.find({ creator: userId })
      .populate({
        path: 'creator',
        select: 'username uid profilePhotoUrl',
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    return res.status(200).json({
      results: myEchos,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
  
    return res.status(500).json({ error: 'Server error fetching your echos.' });
  }
};
