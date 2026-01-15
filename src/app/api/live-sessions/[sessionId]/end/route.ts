import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/db/mongodb';
import LiveSession from '@/models/LiveSession';
import Notification from '@/models/Notification';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { sessionId } = await params;
    await connectDB();

    const liveSession = await LiveSession.findOne({
      sessionId: sessionId,
    });

    if (!liveSession) {
      return NextResponse.json(
        { success: false, error: 'Live session not found' },
        { status: 404 }
      );
    }

    // Only admin can end the session
    if (liveSession.adminId.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Only admin can end the session' },
        { status: 403 }
      );
    }

    const endedAt = new Date();
    let duration = 0;

    if (liveSession.startedAt) {
      duration = Math.floor((endedAt.getTime() - liveSession.startedAt.getTime()) / 1000);
    }

    liveSession.status = 'ended';
    liveSession.endedAt = endedAt;
    liveSession.duration = duration;

    await liveSession.save();

    // Create notifications for all invited customers
    try {
      const notificationPromises = liveSession.invitedCustomers.map((customerId) =>
        Notification.create({
          userId: customerId,
          type: 'system',
          title: 'Session Ended',
          message: `The live session "${liveSession.title}" has ended`,
          read: false,
        })
      );
      await Promise.all(notificationPromises);
    } catch (notifError) {
      console.error('Error creating notifications:', notifError);
    }

    return NextResponse.json({
      success: true,
      data: liveSession,
    });
  } catch (error: any) {
    console.error('End live session error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to end live session' },
      { status: 500 }
    );
  }
}
