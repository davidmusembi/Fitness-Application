import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/db/mongodb';
import Progress from '@/models/Progress';
import Content from '@/models/Content';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== 'Customer') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Fetch all progress records for this user
    const progressRecords = await Progress.find({
      userId: session.user.id
    }).sort({ updatedAt: -1 }).limit(50);

    // Get content details for each progress record
    const historyWithDetails = await Promise.all(
      progressRecords.map(async (record) => {
        const content = await Content.findById(record.contentId);
        if (!content) return null;

        return {
          _id: record._id,
          mediaId: record.contentId,
          mediaTitle: content.title,
          mediaType: content.type,
          progress: record.progress || 0,
          lastPosition: record.lastWatchedPosition || 0,
          status: record.status || 'not-started',
          updatedAt: record.updatedAt
        };
      })
    );

    // Filter out null entries (deleted content)
    const history = historyWithDetails.filter(item => item !== null);

    return NextResponse.json({
      success: true,
      data: history
    });
  } catch (error: any) {
    console.error('Error fetching watch history:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch watch history' },
      { status: 500 }
    );
  }
}
