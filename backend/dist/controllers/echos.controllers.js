import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import Echo from '../models/echo.model.js';
import { io } from '../server.js';
// Ensure the upload directory exists
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'audio');
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    console.log(`Created upload directory: ${UPLOAD_DIR}`);
}
export const createEcho = async (req, res) => {
    const { isPublic, caption } = req.body;
    const audioFile = req.file;
    const userId = req.user.id;
    if (!audioFile) {
        return res.status(400).json({ error: 'Audio file is required.' });
    }
    let filePath;
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
            // Convert to plain object to avoid mongoose circular doc issues
            const echoObj = populatedEcho.toObject ? populatedEcho.toObject() : populatedEcho;
            io.emit('new_echo_live', echoObj);
            console.log(`Broadcasted new live echo: ${echoObj._id}`);
        }
        else {
            console.log(`Private echo created (not broadcast): ${populatedEcho._id}`);
        }
        return res.status(201).json(populatedEcho);
    }
    catch (error) {
        console.error('Create Echo Error:', error);
        // Cleanup file if something failed after saving
        if (filePath && fs.existsSync(filePath)) {
            try {
                await fs.promises.unlink(filePath);
                console.log(`Cleaned up failed upload file: ${filePath}`);
            }
            catch (cleanupError) {
                console.error(`Error cleaning up file ${filePath}:`, cleanupError);
            }
        }
        return res.status(500).json({ error: 'Server error creating echo.' });
    }
};
export const getFeed = async (req, res) => {
    try {
        const now = new Date();
        const echos = await Echo.find({
            isPublic: true,
            goLiveAt: { $lte: now }
        })
            .populate({
            path: 'creator',
            select: 'username uid profilePhotoUrl'
        })
            .sort({ goLiveAt: -1 }) // newest goLive first
            .limit(50);
        return res.json(echos);
    }
    catch (error) {
        console.error('Get Feed Error:', error);
        return res.status(500).json({ error: 'Server error fetching feed.' });
    }
};
export const getPendingEchos = async (req, res) => {
    try {
        const now = new Date();
        const echos = await Echo.find({
            creator: req.user.id,
            goLiveAt: { $gt: now }
        })
            .populate({
            path: 'creator',
            select: 'username uid profilePhotoUrl'
        })
            .sort({ createdAt: -1 }); // latest created first
        return res.json(echos);
    }
    catch (error) {
        console.error('Get Pending Echos Error:', error);
        return res.status(500).json({ error: 'Server error fetching pending echos.' });
    }
};
export const triggerGoLive = async (req, res) => {
    const { echoId } = req.params;
    const userId = req.user.id;
    try {
        // Find pending echo by owner
        const echo = await Echo.findOne({
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
        const populatedEcho = await updatedEcho.populate({
            path: 'creator',
            select: 'username uid profilePhotoUrl'
        });
        // Broadcast public echos
        if (populatedEcho.isPublic) {
            const echoObj = populatedEcho.toObject ? populatedEcho.toObject() : populatedEcho;
            io.emit('new_echo_live', echoObj);
            console.log(`Broadcasted live echo: ${echoObj._id}`);
        }
        else {
            console.log(`Private echo went live (no public broadcast): ${populatedEcho._id}`);
        }
        return res.status(200).json({ message: 'Echo is now live.', echo: populatedEcho });
    }
    catch (error) {
        console.error('Trigger Go Live Error:', error);
        return res.status(500).json({ error: 'Server error triggering echo live status.' });
    }
};
