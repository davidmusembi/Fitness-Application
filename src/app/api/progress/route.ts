import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/db/mongodb';
import Progress from '@/models/Progress';
import { z } from 'zod';

// GET - Get user's progress for all media or specific media
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get('contentId');

    const query: any = { userId: session.user.id };

    if (contentId) {
      query.contentId = contentId;
    }

    const progress = await Progress.find(query)
      .populate('contentId', 'title type category')
      .sort({ updatedAt: -1 });

    return NextResponse.json({ success: true, data: progress });
  } catch (error: any) {
    console.error('Progress fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch progress' },
      { status: 500 }
    );
  }
}

// POST - Update or create progress
const progressSchema = z.object({
  contentId: z.string(),
  progress: z.number().min(0).max(100),
  lastWatchedPosition: z.number().optional(),
  status: z.enum(['not-started', 'in-progress', 'completed']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = progressSchema.parse(body);

    await connectDB();

    // Find existing progress or create new
    let progressRecord = await Progress.findOne({
      userId: session.user.id,
      contentId: validatedData.contentId,
    });

    if (progressRecord) {
      // Update existing
      progressRecord.progress = validatedData.progress;
      if (validatedData.lastWatchedPosition !== undefined) {
        progressRecord.lastWatchedPosition = validatedData.lastWatchedPosition;
      }

      // Auto-determine status based on progress
      if (validatedData.progress >= 90) {
        progressRecord.status = 'completed';
        progressRecord.completedAt = new Date();
      } else if (validatedData.progress > 0) {
        progressRecord.status = 'in-progress';
      }

      await progressRecord.save();
    } else {
      // Create new progress record
      const status =
        validatedData.progress >= 90
          ? 'completed'
          : validatedData.progress > 0
          ? 'in-progress'
          : 'not-started';

      progressRecord = await Progress.create({
        userId: session.user.id,
        contentId: validatedData.contentId,
        progress: validatedData.progress,
        lastWatchedPosition: validatedData.lastWatchedPosition || 0,
        status,
        completedAt: status === 'completed' ? new Date() : undefined,
        streak: 0,
      });
    }

    return NextResponse.json({
      success: true,
      data: progressRecord,
      message: 'Progress updated successfully',
    });
  } catch (error: any) {
    console.error('Progress update error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update progress' },
      { status: 500 }
    );
  }
}
