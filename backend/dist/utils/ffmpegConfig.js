import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);
console.log('ffmpeg path ->', ffmpegInstaller.path);
console.log('ffprobe path ->', ffprobeInstaller.path);
export default ffmpeg;
