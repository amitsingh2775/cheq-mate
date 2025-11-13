
import path from 'path';
import fs from 'fs';
import ffmpeg from './ffmpegConfig.js';

export const compressAudio = (inputPath: string, outputPath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(inputPath)) return reject(new Error('Input not found'));
    const outDir = path.dirname(outputPath);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    ffmpeg(inputPath)
      .noVideo()
      .audioCodec('libmp3lame')
      .audioBitrate('64k')
      .audioChannels(1)
      .audioFrequency(44100)
      .format('mp3')
      .on('end', () => resolve(outputPath))
      .on('error', (err: any) => reject(err))
      .save(outputPath);
  });
};
