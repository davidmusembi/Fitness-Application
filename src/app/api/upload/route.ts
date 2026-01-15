import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// IMPORTANT: Use Node.js runtime for file system access
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Lazy-load FFmpeg only at runtime to avoid build issues
let ffmpegInstance: any = null;
let ffmpegConfigured = false;

const getFFmpeg = async () => {
  if (!ffmpegInstance) {
    const ffmpeg = await import('fluent-ffmpeg');
    ffmpegInstance = ffmpeg.default;

    // Try to set FFmpeg paths from npm package
    if (!ffmpegConfigured) {
      try {
        const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
        const ffprobePath = require('@ffprobe-installer/ffprobe').path;
        ffmpegInstance.setFfmpegPath(ffmpegPath);
        ffmpegInstance.setFfprobePath(ffprobePath);
        console.log('✅ FFmpeg binaries loaded from npm package');
        ffmpegConfigured = true;
      } catch (error) {
        console.warn('⚠️ Could not load FFmpeg from npm package, assuming system installation');
        ffmpegConfigured = true;
      }
    }
  }
  return ffmpegInstance;
};

// Promisify ffprobe
const ffprobePromise = async (filePath: string): Promise<any> => {
    const ffmpeg = await getFFmpeg();
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err: any, data: any) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
};

export async function POST(request: NextRequest) {
  try {
    console.log('Upload API called');
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'Admin' && session.user.role !== 'Staff')) {
      console.log('Unauthorized access attempt');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('User authorized:', session.user.role);

    // Create uploads directory
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });
    console.log('Uploads directory ready:', uploadsDir);

    // Use formData() - it should work for reasonable file sizes
    let formData;
    try {
      formData = await request.formData();
      console.log('FormData parsed successfully');
    } catch (error: any) {
      console.error('FormData parsing error:', error);
      return NextResponse.json(
        { success: false, error: 'File too large or invalid format. Please use files under 10MB or try a different format.' },
        { status: 400 }
      );
    }

    const file = formData.get('file') as File;

    if (!file) {
      console.log('No file in formData');
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log('File received:', file.name, 'Size:', file.size, 'bytes');

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/\s/g, '-');
    const uniqueFilename = `${timestamp}-${sanitizedFilename}`;
    const filePath = path.join(uploadsDir, uniqueFilename);

    console.log('Writing file to:', filePath);

    // Write file
    await writeFile(filePath, buffer);

    console.log('File written successfully');

    let duration = 0;
    let thumbnailUrl = '';

    if (file.type.startsWith('video/')) {
        try {
            const metadata = await ffprobePromise(filePath);
            duration = metadata.format.duration || 0;
            console.log('Video duration:', duration);

            // Generate thumbnail from video at 1 second mark
            const thumbnailFilename = `thumb-${timestamp}-${sanitizedFilename.replace(/\.[^.]+$/, '.jpg')}`;
            const thumbnailPath = path.join(uploadsDir, thumbnailFilename);

            const ffmpeg = await getFFmpeg();
            await new Promise<void>((resolve, reject) => {
                ffmpeg(filePath)
                    .screenshots({
                        timestamps: ['2'], // Take screenshot at 2 seconds to avoid black frames
                        filename: thumbnailFilename,
                        folder: uploadsDir,
                        size: '640x360' // Standard video thumbnail size
                    })
                    .on('end', () => {
                        console.log('Thumbnail generated:', thumbnailFilename);
                        resolve();
                    })
                    .on('error', (err: any) => {
                        console.error('Thumbnail generation error:', err);
                        reject(err);
                    });
            });

            thumbnailUrl = `/uploads/${thumbnailFilename}`;
        } catch (error) {
            console.error('Failed to process video:', error);
            // Don't fail the upload, just log the error
        }
    }


    const fileUrl = `/uploads/${uniqueFilename}`;

    console.log('Upload successful:', fileUrl);

    return NextResponse.json({
      success: true,
      url: fileUrl,
      duration: duration,
      thumbnailUrl: thumbnailUrl,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to upload file' },
      { status: 500 }
    );
  }
}
