import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    responseLimit: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { path: filePath } = req.query;

    if (!filePath) {
      return res.status(400).json({ error: 'Invalid path' });
    }

    // Construct the file path
    const fileName = Array.isArray(filePath) ? filePath.join('/') : filePath;
    // Decode URL-encoded characters in filename
    const decodedFileName = decodeURIComponent(fileName);
    const videoPath = path.join(process.cwd(), 'public', 'uploads', decodedFileName);

    console.log('Streaming video:', {
      fileName,
      decodedFileName,
      videoPath,
      exists: fs.existsSync(videoPath)
    });

    // Check if file exists
    if (!fs.existsSync(videoPath)) {
      console.error('Video file not found:', videoPath);
      return res.status(404).json({ error: 'Video not found' });
    }

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    // Get file extension to determine content type
    const ext = path.extname(videoPath).toLowerCase();
    const contentType =
      ext === '.mp4' ? 'video/mp4' :
      ext === '.webm' ? 'video/webm' :
      ext === '.ogg' ? 'video/ogg' :
      ext === '.mov' ? 'video/quicktime' :
      'video/mp4'; // default

    // Set CORS headers to allow cross-origin requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range');

    if (range) {
      // Parse Range header
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const file = fs.createReadStream(videoPath, { start, end });

      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=0',
      };

      res.writeHead(206, head);
      file.pipe(res);
    } else {
      // No range request, send entire file
      const head = {
        'Content-Length': fileSize,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=0',
      };

      res.writeHead(200, head);
      fs.createReadStream(videoPath).pipe(res);
    }
  } catch (error: any) {
    console.error('Video streaming error:', error);
    res.status(500).json({ error: 'Failed to stream video' });
  }
}
