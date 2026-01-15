import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import formidable from 'formidable';
import { mkdir } from 'fs/promises';
import path from 'path';
import fs from 'fs';

// CRITICAL: Disable body parsing to handle large files
export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    console.log('Upload API (Pages) called');

    // Check authentication
    const session = await getServerSession(req, res, authOptions);

    if (!session || (session.user.role !== 'Admin' && session.user.role !== 'Staff')) {
      console.log('Unauthorized access attempt');
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    console.log('User authorized:', session.user.role);

    // Create uploads directory
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });
    console.log('Uploads directory ready:', uploadsDir);

    // Configure formidable
    const form = formidable({
      uploadDir: uploadsDir,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024 * 1024, // 10GB - virtually unlimited for most use cases
      filename: (name, ext, part) => {
        // Generate unique filename
        const timestamp = Date.now();
        const originalName = part.originalFilename || 'file';
        const sanitized = originalName.replace(/\s/g, '-');
        return `${timestamp}-${sanitized}`;
      },
    });

    // Parse the form
    form.parse(req, (err, fields, files) => {
      if (err) {
        console.error('Formidable parse error:', err);
        return res.status(500).json({
          success: false,
          error: 'Failed to parse upload',
        });
      }

      // Get the uploaded file
      const file = Array.isArray(files.file) ? files.file[0] : files.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          error: 'No file provided',
        });
      }

      console.log('File uploaded:', file.originalFilename, 'Size:', file.size);

      // Get the relative URL
      const filename = path.basename(file.filepath);
      const fileUrl = `/uploads/${filename}`;

      console.log('Upload successful:', fileUrl);

      return res.status(200).json({
        success: true,
        url: fileUrl,
      });
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload file',
    });
  }
}
