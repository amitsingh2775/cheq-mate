import { Response } from 'express';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import Echo, { IEcho } from '../models/echo.model.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { io } from '../server.js';

// Ensure the upload directory exists
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'audio');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  console.log(`Created upload directory: ${UPLOAD_DIR}`);
}

export const createEcho = async (req: AuthenticatedRequest, res: Response) => {
  const { isPublic, caption } = req.body;
  const audioFile = req.file;
  const userId = req.user!.id;

  if (!audioFile) {
    return res.status(400).json({ error: 'Audio file is required.' });
  }

  let filePath: string | undefined;

  try {
    const fileExtension = path.extname(audioFile.originalname) || '.m4a';
    const uniqueFilename = `${uuidv4()}${fileExtension}`;
    filePath = path.join(UPLOAD_DIR, uniqueFilename);
    const fileRelativePath = `/uploads/audio/${uniqueFilename}`;

    // Save file locally
    await fs.promises.writeFile(filePath, audioFile.buffer);
    console.log(`Audio file saved locally to: ${filePath}`);

    // Immediate go-live
    const goLiveAt = new Date();

    // Create DB document with immediate live status
    const newEcho = new Echo({
      creator: userId,
      audioUrl: fileRelativePath,
      caption: caption || null,
      isPublic: (isPublic === 'true' || isPublic === true),
      status: 'live',
      goLiveAt,
    });

    const savedEcho = await newEcho.save();

    // Populate creator fields
    const populatedEcho = await savedEcho.populate({
      path: 'creator',
      select: 'username uid profilePhotoUrl'
    });

    // Broadcast via Socket.IO for public echos
    if (populatedEcho.isPublic) {
      const echoObj = populatedEcho.toObject ? populatedEcho.toObject() : populatedEcho;
      io.emit('new_echo_live', echoObj);
      console.log(`Broadcasted new live echo: ${echoObj._id}`);
    } else {
      console.log(`Private echo created (not broadcast): ${populatedEcho._id}`);
    }

    return res.status(201).json(populatedEcho);
  } catch (error: any) {
    console.error('Create Echo Error:', error);

    // Cleanup file if something failed after saving
    if (filePath && fs.existsSync(filePath)) {
      try {
        await fs.promises.unlink(filePath);
        console.log(`Cleaned up failed upload file: ${filePath}`);
      } catch (cleanupError) {
        console.error(`Error cleaning up file ${filePath}:`, cleanupError);
      }
    }

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
      goLiveAt: { $lte: now }
    })
      .populate({
        path: 'creator',
        select: 'username uid profilePhotoUrl'
      })
      .sort({ goLiveAt: -1, createdAt: -1 }) // newest goLive first, fallback to createdAt
      .skip(skip)
      .limit(limit);

    return res.json({ page, limit, results: echos });
  } catch (error: any) {
    console.error('Get Feed Error:', error);
    return res.status(500).json({ error: 'Server error fetching feed.' });
  }
};

export const getPendingEchos = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const now = new Date();
    const echos = await Echo.find({
      creator: req.user!.id,
      isPublic:false,
      goLiveAt: { $gt: now }
    })
      .populate({
        path: 'creator',
        select: 'username uid profilePhotoUrl'
      })
      .sort({ createdAt: -1 }); 

    return res.json(echos);
  } catch (error: any) {
    console.error('Get Pending Echos Error:', error);
    return res.status(500).json({ error: 'Server error fetching pending echos.' });
  }
};

export const triggerGoLive = async (req: AuthenticatedRequest, res: Response) => {
  const { echoId } = req.params;
  const userId = req.user!.id;

  try {
    // Find pending echo by owner
    const echo: IEcho | null = await Echo.findOne({
      _id: echoId,
      creator: userId,
      status: 'pending'
    });

    if (!echo) {
      return res.status(404).json({ error: 'Pending echo not found for this user.' });
    }

    // If it's not time yet, inform how much remaining
    if (echo.goLiveAt > new Date()) {
      const timeDiff = echo.goLiveAt.getTime() - new Date().getTime();
      const hours = Math.floor(timeDiff / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      return res.status(400).json({ error: `It's not time yet. ${hours}h ${minutes}m remaining.` });
    }

    // Update status -> live
    echo.status = 'live';
    const updatedEcho = await echo.save();

    // Populate for broadcast
    const populatedEcho = await updatedEcho.populate<{ creator: { username: string, uid: string, profilePhotoUrl?: string } }>( {
      path: 'creator',
      select: 'username uid profilePhotoUrl'
    });

    // Broadcast public echos
    if (populatedEcho.isPublic) {
      const echoObj = populatedEcho.toObject ? populatedEcho.toObject() : populatedEcho;
      io.emit('new_echo_live', echoObj);
      console.log(`Broadcasted live echo: ${echoObj._1d}`);
    } else {
      console.log(`Private echo went live (no public broadcast): ${populatedEcho._id}`);
    }

    return res.status(200).json({ message: 'Echo is now live.', echo: populatedEcho });
  } catch (error: any) {
    console.error('Trigger Go Live Error:', error);
    return res.status(500).json({ error: 'Server error triggering echo live status.' });
  }
};

export const deleteEcho = async (req: AuthenticatedRequest, res: Response) => {
  const { echoId } = req.params;
  const userId = req.user!.id;

  try {
    // Fetch the echo (do not use .lean() here — we want to read fields)
    const echo = await Echo.findById(echoId);

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
          console.log(`Deleted audio file: ${filePath}`);
        }
      }
    } catch (fileErr) {
      console.error('Error deleting audio file:', fileErr);
      // proceed with DB deletion anyway
    }

    // Delete DB record using model-level API (works regardless of doc methods)
    await Echo.deleteOne({ _id: echoId });

    // notify clients to remove from feed
    const payload = { _id: echoId };
    io.emit('remove_echo', payload);
    console.log(`Echo deleted and remove_echo emitted: ${echoId}`);

    return res.status(200).json({ message: 'Echo deleted' });
  } catch (err: any) {
    console.error('Delete Echo Error:', err);
    return res.status(500).json({ error: 'Server error deleting echo.' });
  }
};

export const updateEchoCaption = async (req: AuthenticatedRequest, res: Response) => {
  const { echoId } = req.params;
  const { caption } = req.body;
  const userId = req.user!.id;

  try {
    const echo = await Echo.findById(echoId);
    if (!echo) return res.status(404).json({ error: 'Echo not found' });

    if (String(echo.creator) !== String(userId)) {
      return res.status(403).json({ error: 'Not authorized to edit this echo' });
    }

    echo.caption = caption ?? echo.caption;
    const updated = await echo.save();

    const populated = await updated.populate({
      path: 'creator',
      select: 'username uid profilePhotoUrl'
    });

    // Emit update to clients
    const echoObj = populated.toObject ? populated.toObject() : populated;
    io.emit('update_echo', echoObj);
    console.log(`Echo caption updated and update_echo emitted: ${echoObj._id}`);

    return res.status(200).json({ message: 'Caption updated', echo: populated });
  } catch (err: any) {
    console.error('Update Caption Error:', err);
    return res.status(500).json({ error: 'Server error updating caption.' });
  }
};

export const getMyEchos = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const myEchos = await Echo.find({ creator: userId })
      .populate({
        path: "creator",
        select: "username uid profilePhotoUrl",
      })
      .sort({ createdAt: -1 }); // latest first

    return res.status(200).json({ results: myEchos });
  } catch (error: any) {
    console.error("Get My Echos Error:", error);
    return res.status(500).json({ error: "Server error fetching your echos." });
  }
};

